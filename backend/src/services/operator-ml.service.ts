import axios from 'axios';
import { AnomalyContext } from '../types/index.js';
import { operatorDataService } from './operator-data.service.js';

export class OperatorMLService {
  private mlServiceUrl: string;
  private lastPrediction: {
    anomalyScore: number;
    anomalyContext: AnomalyContext;
    timestamp: Date;
  } | null = null;
  private predictionCache: Map<string, {
    anomalyScore: number;
    anomalyContext: AnomalyContext;
    timestamp: Date;
  }> = new Map();

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  }

  public isConfigured(): boolean {
    return !!this.mlServiceUrl;
  }

  public async detectOperatorAnomaly(): Promise<{
    anomalyScore: number;
    anomalyContext: AnomalyContext;
    predictions: Record<string, unknown>;
  }> {
    try {
      const sequence = operatorDataService.getSequenceForModel();
      
      if (sequence.length < 24) {
        return this.getFallbackResult();
      }

      const currentState = operatorDataService.getCurrentState();

      const cacheKey = JSON.stringify(sequence[sequence.length - 1]);
      const cached = this.predictionCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp.getTime()) < 30000) {
        return {
          anomalyScore: cached.anomalyScore,
          anomalyContext: cached.anomalyContext,
          predictions: {},
        };
      }

      const response = await axios.post(
        `${this.mlServiceUrl}/predict`,
        { sequence },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      const anomalyScore = response.data.anomaly_score || 0;
      const severity = this.mapScoreToSeverity(anomalyScore);
      const anomalyType = this.determineAnomalyType(sequence, response.data.feature_importance);

      const result = {
        anomalyScore,
        anomalyContext: {
          isActive: anomalyScore > 0.5,
          severity,
          type: anomalyType,
          startTime: new Date(),
        },
        predictions: {
          feature_importance: response.data.feature_importance || [],
        },
      };

      currentState.anomalyScore = anomalyScore;
      currentState.anomalyContext = result.anomalyContext;

      this.lastPrediction = {
        ...result,
        timestamp: new Date(),
      };

      this.predictionCache.set(cacheKey, this.lastPrediction);
      if (this.predictionCache.size > 10) {
        const firstKey = this.predictionCache.keys().next().value;
        if (firstKey) {
          this.predictionCache.delete(firstKey);
        }
      }

      return result;
    } catch (error) {
      console.error('ML inference error:', error);
      return this.getFallbackResult();
    }
  }

  private determineAnomalyType(
    sequence: number[][],
    featureImportance?: number[]
  ): 'chemical' | 'network' | 'physical' | 'cyber' | undefined {
    if (!featureImportance || featureImportance.length === 0) {
      return this.inferAnomalyTypeFromSequence(sequence);
    }

    const featureNames = operatorDataService.getFeatureNames();
    const topFeatures = featureImportance
      .map((importance, idx) => ({ importance, name: featureNames[idx] }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);

    const hasSecurityFeatures = topFeatures.some((f) =>
      f.name.includes('security') ||
      f.name.includes('firewall') ||
      f.name.includes('remote_access') ||
      f.name.includes('failed_login')
    );

    const hasPumpFeatures = topFeatures.some((f) => f.name.startsWith('F_PU') || f.name.startsWith('S_PU'));
    const hasTankFeatures = topFeatures.some((f) => f.name.startsWith('L_T'));
    const hasPressureFeatures = topFeatures.some((f) => f.name.startsWith('P_J'));

    if (hasSecurityFeatures) {
      return 'cyber';
    }
    if (hasPumpFeatures || hasPressureFeatures) {
      return 'physical';
    }
    if (hasTankFeatures) {
      return 'physical';
    }

    return 'network';
  }

  private inferAnomalyTypeFromSequence(sequence: number[][]): 'chemical' | 'network' | 'physical' | 'cyber' | undefined {
    if (sequence.length === 0) return undefined;

    const lastPoint = sequence[sequence.length - 1];
    const featureNames = operatorDataService.getFeatureNames();

    const securityIndices = featureNames
      .map((name, idx) => ({ name, idx, value: lastPoint[idx] }))
      .filter((f) =>
        f.name.includes('security') ||
        f.name.includes('firewall') ||
        f.name.includes('remote_access') ||
        f.name.includes('failed_login')
      );

    if (securityIndices.some((f) => f.value > 0)) {
      return 'cyber';
    }

    const pumpIndices = featureNames
      .map((name, idx) => ({ name, idx, value: lastPoint[idx] }))
      .filter((f) => f.name.startsWith('F_PU') || f.name.startsWith('S_PU'));

    if (pumpIndices.some((f) => f.value === 0 && f.name.startsWith('S_PU'))) {
      return 'physical';
    }

    return 'network';
  }

  private mapScoreToSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 0.3) return 'low';
    if (score < 0.6) return 'medium';
    if (score < 0.8) return 'high';
    return 'critical';
  }

  private getFallbackResult(): {
    anomalyScore: number;
    anomalyContext: AnomalyContext;
    predictions: Record<string, unknown>;
  } {
    if (this.lastPrediction) {
      return {
        anomalyScore: this.lastPrediction.anomalyScore,
        anomalyContext: this.lastPrediction.anomalyContext,
        predictions: {},
      };
    }

    return {
      anomalyScore: 0.2 + Math.random() * 0.3,
      anomalyContext: {
        isActive: false,
        severity: 'low',
      },
      predictions: {},
    };
  }

  public getLastPrediction(): {
    anomalyScore: number;
    anomalyContext: AnomalyContext;
    timestamp: Date;
  } | null {
    return this.lastPrediction;
  }
}

export const operatorMLService = new OperatorMLService();

