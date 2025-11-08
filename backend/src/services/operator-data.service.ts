import { AnomalyContext } from '../types/index.js';

export interface OperatorDataPoint {
  timestamp: Date;
  features: Record<string, number>;
  anomalyScore?: number;
  anomalyContext?: AnomalyContext;
}

export class OperatorDataService {
  private dataHistory: OperatorDataPoint[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private currentState!: OperatorDataPoint;
  private featureNames: string[] = [];

  private readonly TANK_COUNT = 7;
  private readonly PUMP_COUNT = 11;
  private readonly JUNCTION_NAMES = [
    'J280', 'J269', 'J300', 'J256', 'J289', 'J415',
    'J302', 'J306', 'J307', 'J317', 'J14', 'J422'
  ];

  private tankLevels: number[] = [];
  private pumpFlows: number[] = [];
  private pumpStatuses: number[] = [];
  private junctionPressures: number[] = [];

  constructor() {
    this.initializeFeatureNames();
    this.initializeState();
    this.prePopulateHistory();
    this.startDataGeneration();
  }

  private initializeFeatureNames(): void {
    const features: string[] = [];

    for (let i = 1; i <= this.TANK_COUNT; i++) {
      features.push(`L_T${i}`);
    }

    for (let i = 1; i <= this.PUMP_COUNT; i++) {
      features.push(`F_PU${i}`);
      features.push(`S_PU${i}`);
    }

    this.JUNCTION_NAMES.forEach((name) => {
      features.push(`P_${name}`);
    });

    features.push(
      'remote_access_attempts',
      'failed_login_attempts',
      'network_anomalies',
      'firewall_alerts',
      'unusual_ip_detected',
      'off_hours_access',
      'privileged_account_access',
      'scada_config_changes',
      'network_traffic_mb',
      'port_scan_detected',
      'vpn_connections',
      'data_exfiltration_flag'
    );

    features.push('hour', 'day_of_week', 'is_weekend', 'is_night', 'is_business_hours');
    features.push('hour_sin', 'hour_cos', 'dow_sin', 'dow_cos');

    features.push(
      'total_tank_volume',
      'avg_tank_level',
      'tank_level_variance',
      'min_tank_level',
      'max_tank_level',
      'tank_level_range',
      'total_pump_flow',
      'active_pumps',
      'avg_pump_flow',
      'pump_efficiency',
      'avg_pressure',
      'pressure_variance',
      'min_pressure',
      'max_pressure',
      'flow_pressure_ratio',
      'tank_flow_ratio',
      'total_security_events',
      'critical_security_score',
      'auth_failure_rate',
      'security_pump_interaction',
      'config_change_during_anomaly',
      'system_health_score',
      'operational_efficiency'
    );

    const rollingWindows = [3, 6, 12, 24];
    const rollingMetrics = [
      'total_tank_volume',
      'total_pump_flow',
      'avg_pressure',
      'total_security_events',
      'network_traffic_mb'
    ];

    rollingMetrics.forEach((metric) => {
      rollingWindows.forEach((window) => {
        features.push(`${metric}_roll_mean_${window}h`);
        features.push(`${metric}_roll_std_${window}h`);
        features.push(`${metric}_rate_change_${window}h`);
      });
    });

    this.featureNames = features;
  }

  private initializeState(): void {
    this.tankLevels = Array.from({ length: this.TANK_COUNT }, () => 50 + Math.random() * 30);
    this.pumpFlows = Array.from({ length: this.PUMP_COUNT }, () => 0);
    this.pumpStatuses = Array.from({ length: this.PUMP_COUNT }, () => 0);
    this.junctionPressures = Array.from({ length: this.JUNCTION_NAMES.length }, () => 40 + Math.random() * 20);

    for (let i = 0; i < 5; i++) {
      this.pumpStatuses[i] = 1;
      this.pumpFlows[i] = 80 + Math.random() * 60;
    }

    this.currentState = this.generateDataPoint(new Date());
  }

  private generateDataPoint(timestamp: Date): OperatorDataPoint {
    this.updateTankLevels();
    this.updatePumpData();
    this.updateJunctionPressures();

    const features: Record<string, number> = {};

    for (let i = 0; i < this.TANK_COUNT; i++) {
      features[`L_T${i + 1}`] = this.roundToPrecision(this.tankLevels[i], 2);
    }

    for (let i = 0; i < this.PUMP_COUNT; i++) {
      features[`F_PU${i + 1}`] = this.roundToPrecision(this.pumpFlows[i], 2);
      features[`S_PU${i + 1}`] = this.pumpStatuses[i];
    }

    this.JUNCTION_NAMES.forEach((name, idx) => {
      features[`P_${name}`] = this.roundToPrecision(this.junctionPressures[idx], 2);
    });

    const itData = this.generateITData();
    Object.assign(features, itData);

    const timeFeatures = this.calculateTimeFeatures(timestamp);
    Object.assign(features, timeFeatures);

    const aggregatedFeatures = this.calculateAggregatedFeatures();
    Object.assign(features, aggregatedFeatures);

    const rollingFeatures = this.calculateRollingStatistics();
    Object.assign(features, rollingFeatures);

    return {
      timestamp,
      features,
    };
  }

  private updateTankLevels(): void {
    const activePumps = this.pumpStatuses.reduce((sum, status) => sum + status, 0);
    const baseChange = activePumps > 0 ? 0.5 : -0.3;

    for (let i = 0; i < this.TANK_COUNT; i++) {
      const drift = (60 - this.tankLevels[i]) * 0.01;
      const randomWalk = (Math.random() - 0.5) * 0.8;
      const change = baseChange + drift + randomWalk;
      
      this.tankLevels[i] = Math.max(10, Math.min(100, this.tankLevels[i] + change));
    }
  }

  private updatePumpData(): void {
    for (let i = 0; i < this.PUMP_COUNT; i++) {
      if (this.pumpStatuses[i] === 1) {
        const baseFlow = 100 + Math.random() * 50;
        const variation = (Math.random() - 0.5) * 10;
        this.pumpFlows[i] = Math.max(50, Math.min(200, baseFlow + variation));
      } else {
        if (Math.random() < 0.1) {
          this.pumpStatuses[i] = 1;
          this.pumpFlows[i] = 80 + Math.random() * 40;
        } else {
          this.pumpFlows[i] = 0;
        }
      }

      if (this.pumpStatuses[i] === 1 && Math.random() < 0.05) {
        this.pumpStatuses[i] = 0;
        this.pumpFlows[i] = 0;
      }
    }
  }

  private updateJunctionPressures(): void {
    const totalFlow = this.pumpFlows.reduce((sum, flow) => sum + flow, 0);
    const basePressure = 40 + (totalFlow / 10);

    for (let i = 0; i < this.junctionPressures.length; i++) {
      const variation = (Math.random() - 0.5) * 5;
      const newPressure = basePressure + variation;
      this.junctionPressures[i] = Math.max(20, Math.min(80, newPressure));
    }
  }

  private generateITData(): Record<string, number> {
    const baseSecurityEvents = Math.floor(Math.random() * 3);
    const baseNetworkTraffic = 500 + Math.random() * 200;

    return {
      remote_access_attempts: baseSecurityEvents + (Math.random() < 0.1 ? Math.floor(Math.random() * 5) : 0),
      failed_login_attempts: Math.floor(Math.random() * 2),
      network_anomalies: Math.random() < 0.05 ? 1 : 0,
      firewall_alerts: Math.random() < 0.08 ? Math.floor(Math.random() * 3) : 0,
      unusual_ip_detected: Math.random() < 0.03 ? 1 : 0,
      off_hours_access: Math.random() < 0.15 ? 1 : 0,
      privileged_account_access: Math.random() < 0.1 ? 1 : 0,
      scada_config_changes: Math.random() < 0.02 ? 1 : 0,
      network_traffic_mb: this.roundToPrecision(baseNetworkTraffic + (Math.random() - 0.5) * 100, 2),
      port_scan_detected: Math.random() < 0.02 ? 1 : 0,
      vpn_connections: Math.floor(5 + Math.random() * 10),
      data_exfiltration_flag: Math.random() < 0.01 ? 1 : 0,
    };
  }

  private calculateTimeFeatures(timestamp: Date): Record<string, number> {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;
    const isNight = hour >= 22 || hour < 6 ? 1 : 0;
    const isBusinessHours = hour >= 9 && hour < 17 ? 1 : 0;

    const hourRad = (hour * 2 * Math.PI) / 24;
    const dowRad = (dayOfWeek * 2 * Math.PI) / 7;

    return {
      hour,
      day_of_week: dayOfWeek,
      is_weekend: isWeekend,
      is_night: isNight,
      is_business_hours: isBusinessHours,
      hour_sin: this.roundToPrecision(Math.sin(hourRad), 4),
      hour_cos: this.roundToPrecision(Math.cos(hourRad), 4),
      dow_sin: this.roundToPrecision(Math.sin(dowRad), 4),
      dow_cos: this.roundToPrecision(Math.cos(dowRad), 4),
    };
  }

  private calculateAggregatedFeatures(): Record<string, number> {
    const totalTankVolume = this.tankLevels.reduce((sum, level) => sum + level, 0);
    const avgTankLevel = totalTankVolume / this.TANK_COUNT;
    const tankVariance = this.calculateVariance(this.tankLevels);
    const minTankLevel = Math.min(...this.tankLevels);
    const maxTankLevel = Math.max(...this.tankLevels);
    const tankLevelRange = maxTankLevel - minTankLevel;

    const totalPumpFlow = this.pumpFlows.reduce((sum, flow) => sum + flow, 0);
    const activePumps = this.pumpStatuses.reduce((sum, status) => sum + status, 0);
    const avgPumpFlow = activePumps > 0 ? totalPumpFlow / activePumps : 0;
    const pumpEfficiency = activePumps > 0 ? (totalPumpFlow / (activePumps * 150)) * 100 : 0;

    const avgPressure = this.junctionPressures.reduce((sum, p) => sum + p, 0) / this.junctionPressures.length;
    const pressureVariance = this.calculateVariance(this.junctionPressures);
    const minPressure = Math.min(...this.junctionPressures);
    const maxPressure = Math.max(...this.junctionPressures);

    const flowPressureRatio = avgPressure > 0 ? totalPumpFlow / avgPressure : 0;
    const tankFlowRatio = totalPumpFlow > 0 ? totalTankVolume / totalPumpFlow : 0;

    const itData = this.generateITData();
    const totalSecurityEvents = 
      itData.remote_access_attempts +
      itData.failed_login_attempts +
      itData.firewall_alerts +
      itData.network_anomalies;
    const criticalSecurityScore = totalSecurityEvents * 10 + (itData.unusual_ip_detected * 20);
    const authFailureRate = itData.failed_login_attempts / (itData.remote_access_attempts + 1);
    const securityPumpInteraction = itData.scada_config_changes * activePumps;
    const configChangeDuringAnomaly = itData.scada_config_changes * (this.currentState?.anomalyScore || 0);
    const systemHealthScore = 100 - (criticalSecurityScore / 10) - (this.currentState?.anomalyScore || 0) * 20;
    const operationalEfficiency = (pumpEfficiency + (avgTankLevel / 100) * 50) / 1.5;

    return {
      total_tank_volume: this.roundToPrecision(totalTankVolume, 2),
      avg_tank_level: this.roundToPrecision(avgTankLevel, 2),
      tank_level_variance: this.roundToPrecision(tankVariance, 2),
      min_tank_level: this.roundToPrecision(minTankLevel, 2),
      max_tank_level: this.roundToPrecision(maxTankLevel, 2),
      tank_level_range: this.roundToPrecision(tankLevelRange, 2),
      total_pump_flow: this.roundToPrecision(totalPumpFlow, 2),
      active_pumps: activePumps,
      avg_pump_flow: this.roundToPrecision(avgPumpFlow, 2),
      pump_efficiency: this.roundToPrecision(pumpEfficiency, 2),
      avg_pressure: this.roundToPrecision(avgPressure, 2),
      pressure_variance: this.roundToPrecision(pressureVariance, 2),
      min_pressure: this.roundToPrecision(minPressure, 2),
      max_pressure: this.roundToPrecision(maxPressure, 2),
      flow_pressure_ratio: this.roundToPrecision(flowPressureRatio, 4),
      tank_flow_ratio: this.roundToPrecision(tankFlowRatio, 4),
      total_security_events: totalSecurityEvents,
      critical_security_score: this.roundToPrecision(criticalSecurityScore, 2),
      auth_failure_rate: this.roundToPrecision(authFailureRate, 4),
      security_pump_interaction: securityPumpInteraction,
      config_change_during_anomaly: this.roundToPrecision(configChangeDuringAnomaly, 4),
      system_health_score: this.roundToPrecision(Math.max(0, Math.min(100, systemHealthScore)), 2),
      operational_efficiency: this.roundToPrecision(Math.max(0, Math.min(100, operationalEfficiency)), 2),
    };
  }

  private calculateRollingStatistics(): Record<string, number> {
    const windows = [3, 6, 12, 24];
    const metrics = [
      'total_tank_volume',
      'total_pump_flow',
      'avg_pressure',
      'total_security_events',
      'network_traffic_mb'
    ];

    const result: Record<string, number> = {};

    metrics.forEach((metric) => {
      windows.forEach((window) => {
        const values = this.getRollingValues(metric, window);
        if (values.length > 0) {
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          const variance = this.calculateVariance(values);
          const std = Math.sqrt(variance);
          const rateChange = values.length > 1 ? (values[values.length - 1] - values[0]) / values.length : 0;

          result[`${metric}_roll_mean_${window}h`] = this.roundToPrecision(mean, 4);
          result[`${metric}_roll_std_${window}h`] = this.roundToPrecision(std, 4);
          result[`${metric}_rate_change_${window}h`] = this.roundToPrecision(rateChange, 4);
        } else {
          result[`${metric}_roll_mean_${window}h`] = 0;
          result[`${metric}_roll_std_${window}h`] = 0;
          result[`${metric}_rate_change_${window}h`] = 0;
        }
      });
    });

    return result;
  }

  private getRollingValues(metric: string, windowHours: number): number[] {
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const relevantPoints = this.dataHistory.filter((point) => point.timestamp >= cutoff);

    return relevantPoints.map((point) => {
      const aggregated = this.calculateAggregatedFeaturesForPoint(point);
      return aggregated[metric] || point.features[metric] || 0;
    });
  }

  private calculateAggregatedFeaturesForPoint(point: OperatorDataPoint): Record<string, number> {
    const tankLevels: number[] = [];
    const pumpFlows: number[] = [];
    const pumpStatuses: number[] = [];
    const junctionPressures: number[] = [];

    for (let i = 1; i <= this.TANK_COUNT; i++) {
      tankLevels.push(point.features[`L_T${i}`] || 0);
    }

    for (let i = 1; i <= this.PUMP_COUNT; i++) {
      pumpFlows.push(point.features[`F_PU${i}`] || 0);
      pumpStatuses.push(point.features[`S_PU${i}`] || 0);
    }

    this.JUNCTION_NAMES.forEach((name) => {
      junctionPressures.push(point.features[`P_${name}`] || 0);
    });

    const totalTankVolume = tankLevels.reduce((sum, level) => sum + level, 0);
    const totalPumpFlow = pumpFlows.reduce((sum, flow) => sum + flow, 0);
    const avgPressure = junctionPressures.length > 0
      ? junctionPressures.reduce((sum, p) => sum + p, 0) / junctionPressures.length
      : 0;
    const totalSecurityEvents = 
      (point.features.remote_access_attempts || 0) +
      (point.features.failed_login_attempts || 0) +
      (point.features.firewall_alerts || 0) +
      (point.features.network_anomalies || 0);
    const networkTraffic = point.features.network_traffic_mb || 0;

    return {
      total_tank_volume: totalTankVolume,
      total_pump_flow: totalPumpFlow,
      avg_pressure: avgPressure,
      total_security_events: totalSecurityEvents,
      network_traffic_mb: networkTraffic,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private roundToPrecision(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private prePopulateHistory(): void {
    const now = new Date();
    const hoursToGenerate = 48;
    
    for (let i = hoursToGenerate; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const point = this.generateDataPoint(timestamp);
      this.dataHistory.push(point);
    }

    this.currentState = this.dataHistory[this.dataHistory.length - 1];
  }

  public startDataGeneration(intervalMs: number = 60000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      const newPoint = this.generateDataPoint(new Date());
      
      try {
        const { operatorMLService } = await import('./operator-ml.service.js');
        const prediction = await operatorMLService.detectOperatorAnomaly();
        newPoint.anomalyScore = prediction.anomalyScore;
        newPoint.anomalyContext = prediction.anomalyContext;
      } catch (error) {
        const baseScore = 0.2 + Math.random() * 0.5;
        const variation = (Math.sin(Date.now() / 100000) * 0.2) + (Math.random() - 0.5) * 0.15;
        newPoint.anomalyScore = Math.max(0, Math.min(1, baseScore + variation));
        newPoint.anomalyContext = {
          isActive: newPoint.anomalyScore > 0.5,
          severity: newPoint.anomalyScore > 0.8 ? 'critical' : newPoint.anomalyScore > 0.6 ? 'high' : newPoint.anomalyScore > 0.4 ? 'medium' : 'low',
          type: 'network',
          startTime: new Date(),
        };
      }
      
      this.currentState = newPoint;
      this.dataHistory.push({ ...this.currentState });
      
      if (this.dataHistory.length > 2000) {
        this.dataHistory.shift();
      }
    }, intervalMs);
  }

  public getCurrentState(): OperatorDataPoint {
    return { ...this.currentState };
  }

  public getLastNPoints(n: number): OperatorDataPoint[] {
    return this.dataHistory.slice(-n).map((point) => ({ ...point }));
  }

  public getSequenceForModel(): number[][] {
    const last24 = this.getLastNPoints(24);
    if (last24.length < 24) {
      return [];
    }

    return last24.map((point) => {
      return this.featureNames.map((name) => point.features[name] || 0);
    });
  }

  public getFeatureNames(): string[] {
    return [...this.featureNames];
  }

  public getHistory(hours: number = 24): OperatorDataPoint[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.dataHistory
      .filter((point) => point.timestamp >= cutoff)
      .map((point) => ({ ...point }));
  }

  public stopDataGeneration(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const operatorDataService = new OperatorDataService();

