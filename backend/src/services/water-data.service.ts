import {
  ChemicalReading,
  ChemicalParameter,
  ParameterStatus,
  OverallRiskLevel,
  WaterRiskIndex,
  TimeSeriesPoint,
  AttackScenario,
} from '../types/index.js';
import { operatorDataService } from './operator-data.service.js';
import { OperatorDataMapper } from '../utils/operator-data-mapper.js';

export class WaterDataService {
  private currentState: TimeSeriesPoint;
  private activeAttack: AttackScenario | null = null;
  private attackStartTime: Date | null = null;
  private dataHistory: TimeSeriesPoint[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  private readonly NORMAL_RANGES = {
    chlorine: { min: 0.2, max: 2.0, unit: 'mg/L', optimal: 0.8 },
    pH: { min: 7.0, max: 8.5, unit: '', optimal: 7.5 },
    turbidity: { min: 0.0, max: 1.0, unit: 'NTU', optimal: 0.3 },
    temperature: { min: 15, max: 25, unit: '°C', optimal: 20 },
    lead: { min: 0.0, max: 0.015, unit: 'mg/L', optimal: 0.005 },
  };

  private readonly ATTACK_SCENARIOS: AttackScenario[] = [
    {
      id: 'chemical-attack',
      name: 'Chemical Attack',
      type: 'chemical',
      duration: 30,
      effects: [
        { parameter: 'pH', targetValue: 12.5, progressionRate: 0.15 },
        { parameter: 'chlorine', targetValue: 3.8, progressionRate: 0.1 },
      ],
    },
    {
      id: 'chlorine-attack',
      name: 'Chlorine Attack',
      type: 'chemical',
      duration: 20,
      effects: [
        { parameter: 'chlorine', targetValue: 4.5, progressionRate: 0.2 },
        { parameter: 'pH', targetValue: 6.5, progressionRate: 0.08 },
      ],
    },
    {
      id: 'filtration-attack',
      name: 'Filtration Attack',
      type: 'physical',
      duration: 45,
      effects: [
        { parameter: 'turbidity', targetValue: 8.5, progressionRate: 0.18 },
        { parameter: 'lead', targetValue: 0.025, progressionRate: 0.0005 },
      ],
    },
    {
      id: 'temperature-attack',
      name: 'Temperature Attack',
      type: 'physical',
      duration: 25,
      effects: [
        { parameter: 'temperature', targetValue: 32, progressionRate: 0.4 },
        { parameter: 'chlorine', targetValue: 0.1, progressionRate: 0.05 },
      ],
    },
  ];

  constructor() {
    this.currentState = this.generateBaselineState();
    this.prePopulateHistory();
    this.startDataGeneration();
  }

  private prePopulateHistory(): void {
    const now = new Date();
    const daysToGenerate = 30;
    const pointsPerDay = 24;
    const totalPoints = daysToGenerate * pointsPerDay;
    
    const baseTimestamp = new Date(now.getTime() - (daysToGenerate * 24 * 60 * 60 * 1000));
    let tempState = this.generateBaselineState();
    tempState.timestamp = baseTimestamp;
    
    for (let i = 0; i < totalPoints; i++) {
      const hoursAgo = i;
      const timestamp = new Date(baseTimestamp.getTime() + (hoursAgo * 60 * 60 * 1000));
      
      const newChemicals: ChemicalReading[] = tempState.chemicals.map((chem) => {
        const range = this.NORMAL_RANGES[chem.parameter];
        const currentValue = chem.value;
        const drift = (range.optimal - currentValue) * 0.015;
        const randomWalk = (Math.random() - 0.5) * 0.15 * (range.max - range.min);
        const newValue = currentValue + drift + randomWalk;
        
        const clampedValue = Math.max(range.min * 0.85, Math.min(range.max * 1.15, newValue));
        
        return {
          ...chem,
          value: this.roundToPrecision(clampedValue, chem.parameter),
          status: this.determineParameterStatus(chem.parameter, clampedValue),
          timestamp: timestamp,
        };
      });

      const riskIndex = this.calculateRiskIndex(newChemicals);
      
      tempState = {
        timestamp: timestamp,
        chemicals: newChemicals,
        riskIndex,
        anomalyContext: {
          isActive: riskIndex > 60,
          severity: this.mapRiskLevelToSeverity(this.determineRiskLevel(riskIndex)),
        },
      };
      
      this.dataHistory.push({ ...tempState });
    }
    
    this.currentState = this.generateBaselineState();
  }

  private generateBaselineState(): TimeSeriesPoint {
    const chemicals: ChemicalReading[] = Object.keys(this.NORMAL_RANGES).map((key) => {
      const param = key as ChemicalParameter;
      const range = this.NORMAL_RANGES[param];
      
      let value: number;
      if (param === 'pH') {
        value = 8.2;
      } else if (param === 'chlorine') {
        value = 1.4;
      } else if (param === 'turbidity') {
        value = 0.75;
      } else if (param === 'temperature') {
        value = 20.5;
      } else {
        value = 0.012;
      }
      
      return {
        parameter: param,
        value: this.roundToPrecision(value, param),
        unit: range.unit,
        status: this.determineParameterStatus(param, value),
        timestamp: new Date(),
      };
    });

    const riskIndex = this.calculateRiskIndex(chemicals);
    
    return {
      timestamp: new Date(),
      chemicals,
      riskIndex,
      anomalyContext: { isActive: riskIndex > 60, severity: this.mapRiskLevelToSeverity(this.determineRiskLevel(riskIndex)) },
    };
  }

  private roundToPrecision(value: number, parameter: ChemicalParameter): number {
    const precisions: Record<ChemicalParameter, number> = {
      chlorine: 2,
      pH: 2,
      turbidity: 2,
      temperature: 1,
      lead: 3,
    };
    const precision = precisions[parameter] || 2;
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  private determineParameterStatus(parameter: ChemicalParameter, value: number): ParameterStatus {
    const range = this.NORMAL_RANGES[parameter];
    const deviation = Math.abs(value - range.optimal) / (range.max - range.min);
    
    if (deviation < 0.15) return 'normal';
    if (deviation < 0.35) return 'warning';
    return 'anomaly';
  }

  private calculateRiskIndex(chemicals: ChemicalReading[]): number {
    let totalRisk = 0;
    let maxRisk = 0;

    chemicals.forEach((chemical) => {
      const range = this.NORMAL_RANGES[chemical.parameter];
      const deviation = Math.abs(chemical.value - range.optimal) / (range.max - range.min);

      const weights: Record<ChemicalParameter, number> = {
        pH: 0.30,
        chlorine: 0.25,
        turbidity: 0.20,
        temperature: 0.15,
        lead: 0.10,
      };

      const weight = weights[chemical.parameter];
      const risk = Math.min(1, deviation * 2);
      totalRisk += risk * weight;
      maxRisk += weight;
    });

    let riskPercentage = (totalRisk / maxRisk) * 100;
    
    try {
      const currentState = operatorDataService.getCurrentState();
      const wqi = OperatorDataMapper.calculateWaterQualityIndex(currentState);
      
      const wqiNormalized = ((wqi.value - 7.0) / 1.5) * 100;
      const wqiRisk = Math.max(0, Math.min(100, 100 - wqiNormalized));
      
      riskPercentage = (riskPercentage * 0.7) + (wqiRisk * 0.3);
    } catch (error) {
    }

    return Math.min(100, Math.round(riskPercentage));
  }

  private determineRiskLevel(index: number): OverallRiskLevel {
    if (index < 20) return 'stable';
    if (index < 40) return 'low';
    if (index < 60) return 'moderate';
    if (index < 80) return 'high';
    return 'critical';
  }

  private generateNextPoint(): TimeSeriesPoint {
    const now = new Date();
    const previousPoint = this.currentState;
    
    if (this.activeAttack && this.attackStartTime) {
      const elapsedMinutes = (now.getTime() - this.attackStartTime.getTime()) / 60000;
      
      if (elapsedMinutes < this.activeAttack.duration) {
        return this.applyAttackEffects(previousPoint, elapsedMinutes);
      } else {
        this.activeAttack = null;
        this.attackStartTime = null;
        return this.beginRecovery(previousPoint);
      }
    }

    const newChemicals: ChemicalReading[] = previousPoint.chemicals.map((chem) => {
      const range = this.NORMAL_RANGES[chem.parameter];
      const currentValue = chem.value;
      const drift = (range.optimal - currentValue) * 0.015;
      const randomWalk = (Math.random() - 0.5) * 0.15 * (range.max - range.min);
      const newValue = currentValue + drift + randomWalk;
      
      const clampedValue = Math.max(range.min * 0.85, Math.min(range.max * 1.15, newValue));
      
      return {
        ...chem,
        value: this.roundToPrecision(clampedValue, chem.parameter),
        status: this.determineParameterStatus(chem.parameter, clampedValue),
        timestamp: now,
      };
    });

    const riskIndex = this.calculateRiskIndex(newChemicals);
    
    return {
      timestamp: now,
      chemicals: newChemicals,
      riskIndex,
      anomalyContext: {
        isActive: riskIndex > 60,
        severity: this.mapRiskLevelToSeverity(this.determineRiskLevel(riskIndex)),
      },
    };
  }

  private applyAttackEffects(previousPoint: TimeSeriesPoint, elapsedMinutes: number): TimeSeriesPoint {
    if (!this.activeAttack) return previousPoint;

    const newChemicals: ChemicalReading[] = previousPoint.chemicals.map((chem) => {
      const effect = this.activeAttack!.effects.find((e) => e.parameter === chem.parameter);
      if (!effect) return { ...chem, timestamp: new Date() };

      const progress = Math.min(elapsedMinutes / this.activeAttack!.duration, 1);
      const targetDiff = effect.targetValue - chem.value;
      const newValue = chem.value + targetDiff * progress * effect.progressionRate;
      const range = this.NORMAL_RANGES[chem.parameter];
      const clampedValue = Math.max(range.min * 0.5, Math.min(range.max * 2, newValue));

      return {
        ...chem,
        value: this.roundToPrecision(clampedValue, chem.parameter),
        status: this.determineParameterStatus(chem.parameter, clampedValue),
        timestamp: new Date(),
      };
    });

    const riskIndex = this.calculateRiskIndex(newChemicals);
    
    return {
      timestamp: new Date(),
      chemicals: newChemicals,
      riskIndex,
      anomalyContext: {
        isActive: true,
        severity: this.mapRiskLevelToSeverity(this.determineRiskLevel(riskIndex)),
        type: this.activeAttack.type,
        affectedParameters: this.activeAttack.effects.map((e) => e.parameter),
        startTime: this.attackStartTime || undefined,
      },
    };
  }

  private beginRecovery(previousPoint: TimeSeriesPoint): TimeSeriesPoint {
    const newChemicals: ChemicalReading[] = previousPoint.chemicals.map((chem) => {
      const range = this.NORMAL_RANGES[chem.parameter];
      const recoveryRate = 0.02;
      const newValue = chem.value + (range.optimal - chem.value) * recoveryRate;
      const clampedValue = Math.max(range.min, Math.min(range.max, newValue));

      return {
        ...chem,
        value: this.roundToPrecision(clampedValue, chem.parameter),
        status: this.determineParameterStatus(chem.parameter, clampedValue),
        timestamp: new Date(),
      };
    });

    const riskIndex = this.calculateRiskIndex(newChemicals);
    
    return {
      timestamp: new Date(),
      chemicals: newChemicals,
      riskIndex,
      anomalyContext: {
        isActive: riskIndex > 60,
        severity: this.mapRiskLevelToSeverity(this.determineRiskLevel(riskIndex)),
      },
    };
  }

  private mapRiskLevelToSeverity(level: OverallRiskLevel): 'low' | 'medium' | 'high' | 'critical' {
    const mapping: Record<OverallRiskLevel, 'low' | 'medium' | 'high' | 'critical'> = {
      stable: 'low',
      low: 'low',
      moderate: 'medium',
      high: 'high',
      critical: 'critical',
    };
    return mapping[level];
  }

  public startDataGeneration(intervalMs: number = 60000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.currentState = this.generateNextPoint();
      this.dataHistory.push({ ...this.currentState });
      
      if (this.dataHistory.length > 1000) {
        this.dataHistory.shift();
      }
    }, intervalMs);
  }

  public stopDataGeneration(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public getCurrentState(): TimeSeriesPoint {
    return { ...this.currentState };
  }

  public getWaterRiskIndex(): WaterRiskIndex {
    const level = this.determineRiskLevel(this.currentState.riskIndex);
    const descriptions: Record<OverallRiskLevel, string> = {
      stable: 'Water quality is within normal operating parameters. Safe for all uses.',
      low: 'Minor fluctuations detected. Continue monitoring. Safe for consumption.',
      moderate: 'Some parameters outside optimal range. Increased monitoring active.',
      high: 'Significant deviations detected. Precautionary measures recommended.',
      critical: 'SEVERE WARNING: Critical water quality issues detected. DO NOT USE.',
    };

    return {
      index: this.currentState.riskIndex,
      level,
      timestamp: this.currentState.timestamp,
      description: descriptions[level],
    };
  }

  public triggerAttack(scenarioId: string): boolean {
    const scenario = this.ATTACK_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return false;

    this.activeAttack = scenario;
    this.attackStartTime = new Date();
    return true;
  }

  public resetToBaseline(): void {
    this.activeAttack = null;
    this.attackStartTime = null;
    this.currentState = this.generateBaselineState();
  }

  public getAttackScenarios(): AttackScenario[] {
    return [...this.ATTACK_SCENARIOS];
  }

  public getHistory(limit: number = 100): TimeSeriesPoint[] {
    return this.dataHistory.slice(-limit);
  }

  public forceCriticalState(): void {
    const now = new Date();
    const criticalChemicals: ChemicalReading[] = [
      {
        parameter: 'pH',
        value: 9.0,
        unit: '',
        timestamp: now,
      },
      {
        parameter: 'chlorine',
        value: 1.3,
        unit: 'mg/L',
        timestamp: now,
      },
      {
        parameter: 'turbidity',
        value: 1.8,
        unit: 'NTU',
        timestamp: now,
      },
      {
        parameter: 'temperature',
        value: 23.5,
        unit: '°C',
        timestamp: now,
      },
      {
        parameter: 'lead',
        value: 0.020,
        unit: 'mg/L',
        timestamp: now,
      },
    ].map((chem): ChemicalReading => {
      const param = chem.parameter as ChemicalParameter;
      const range = this.NORMAL_RANGES[param];
      const roundedValue = this.roundToPrecision(chem.value, param);
      return {
        parameter: param,
        value: roundedValue,
        unit: range.unit,
        status: this.determineParameterStatus(param, roundedValue),
        timestamp: now,
      };
    });

    let riskIndex = this.calculateRiskIndex(criticalChemicals);
    riskIndex = Math.min(90, Math.max(85, riskIndex));
    
    this.currentState = {
      timestamp: now,
      chemicals: criticalChemicals,
      riskIndex,
      anomalyContext: {
        isActive: true,
        severity: 'critical',
        type: 'chemical',
        affectedParameters: criticalChemicals.filter((c) => c.status === 'anomaly').map((c) => c.parameter),
        startTime: now,
      },
    };

    this.dataHistory.push({ ...this.currentState });
    if (this.dataHistory.length > 1000) {
      this.dataHistory.shift();
    }
  }

  public forceStableState(): void {
    const now = new Date();
    const stableChemicals: ChemicalReading[] = [
      {
        parameter: 'pH',
        value: 7.5,
        unit: 'pH units',
        status: 'normal',
        timestamp: now,
      },
      {
        parameter: 'chlorine',
        value: 1.0,
        unit: 'mg/L',
        status: 'normal',
        timestamp: now,
      },
      {
        parameter: 'turbidity',
        value: 0.3,
        unit: 'NTU',
        status: 'normal',
        timestamp: now,
      },
      {
        parameter: 'temperature',
        value: 20,
        unit: '°C',
        status: 'normal',
        timestamp: now,
      },
      {
        parameter: 'lead',
        value: 0.005,
        unit: 'mg/L',
        status: 'normal',
        timestamp: now,
      },
    ];

    const riskIndex = this.calculateRiskIndex(stableChemicals);
    
    this.currentState = {
      timestamp: now,
      chemicals: stableChemicals,
      riskIndex,
      anomalyContext: {
        isActive: false,
        severity: 'low',
      },
    };

    this.dataHistory.push({ ...this.currentState });
    if (this.dataHistory.length > 1000) {
      this.dataHistory.shift();
    }
  }
}

export const waterDataService = new WaterDataService();

