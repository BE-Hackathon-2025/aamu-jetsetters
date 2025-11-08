import { AnomalyContext } from '../types/index.js';
import { waterDataService } from './water-data.service.js';

export class AnomalyCorrelationService {
  public async processAnomaly(mlAnomaly: AnomalyContext): Promise<void> {
    if (!mlAnomaly.isActive) {
      return;
    }

    const scenarioId = this.mapAnomalyToScenario(mlAnomaly);
    
    if (scenarioId) {
      waterDataService.triggerAttack(scenarioId);
    }
  }

  private mapAnomalyToScenario(anomaly: AnomalyContext): string | null {
    if (anomaly.type === 'chemical') {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        return 'chemical-attack';
      }
      return 'chlorine-attack';
    }

    if (anomaly.type === 'physical') {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        return 'filtration-attack';
      }
      return 'temperature-attack';
    }

    if (anomaly.type === 'cyber' || anomaly.type === 'network') {
      return 'chemical-attack';
    }

    return null;
  }
}

export const anomalyCorrelationService = new AnomalyCorrelationService();

