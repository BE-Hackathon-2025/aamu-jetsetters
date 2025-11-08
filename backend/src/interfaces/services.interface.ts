import {
  TimeSeriesPoint,
  WaterRiskIndex,
  AttackScenario,
  AnomalyContext,
} from '../types/index.js';

export interface IWaterDataService {
  startDataGeneration(intervalMs: number): void;
  stopDataGeneration(): void;
  getCurrentState(): TimeSeriesPoint;
  getWaterRiskIndex(): WaterRiskIndex;
  triggerAttack(scenarioId: string): boolean;
  resetToBaseline(): void;
  getAttackScenarios(): AttackScenario[];
  getHistory(limit?: number): TimeSeriesPoint[];
}

export interface IOperatorMLService {
  isConfigured(): boolean;
  detectOperatorAnomaly(data: {
    otData?: Record<string, number>;
    itData?: Record<string, number>;
    timestamp: Date;
  }): Promise<{
    anomalyScore: number;
    anomalyContext: AnomalyContext;
    predictions: Record<string, unknown>;
  }>;
}

export interface IAnomalyCorrelationService {
  processAnomaly(mlAnomaly: AnomalyContext): Promise<void>;
  runAnomalyDetectionPipeline(data: {
    otData?: Record<string, number>;
    itData?: Record<string, number>;
    timestamp: Date;
  }): Promise<AnomalyContext>;
}

