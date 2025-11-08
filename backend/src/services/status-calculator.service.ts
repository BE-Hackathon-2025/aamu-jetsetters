import {
  WaterRiskIndex,
  OverallRiskLevel,
  ChemicalReading,
  HealthAdvisory,
  PublicStatusResponse,
} from '../types/index.js';
import { waterDataService } from './water-data.service.js';

export class StatusCalculatorService {
  public getPublicStatus(): PublicStatusResponse {
    const currentState = waterDataService.getCurrentState();
    const riskIndex = waterDataService.getWaterRiskIndex();

    return {
      overallRisk: riskIndex,
      chemicals: currentState.chemicals,
      healthAdvisory: this.generateHealthAdvisory(riskIndex, currentState.chemicals),
      lastUpdated: currentState.timestamp,
    };
  }

  private generateHealthAdvisory(
    riskIndex: WaterRiskIndex,
    chemicals: ChemicalReading[]
  ): HealthAdvisory {
    const criticalChemicals = chemicals.filter((c) => c.status === 'anomaly');

    let message = '';
    let instructions = '';

    switch (riskIndex.level) {
      case 'stable':
        message = 'Water quality in your area currently indicates normal risk. Continue to monitor updates for any changes.';
        instructions = 'SAFE FOR ALL USES. Continue consumption, bathing, and washing as normal.';
        break;

      case 'low':
        message = 'Water quality in your area currently indicates low risk. Continue to monitor updates for any changes.';
        instructions = 'SAFE FOR DRINKING. Elevated monitoring initiated. Minor, non-critical fluctuations detected.';
        break;

      case 'moderate':
        message = 'Some water quality parameters are outside optimal range. Increased monitoring is active.';
        instructions = 'SAFE FOR BATHING/WASHING ONLY. Limit non-essential consumption. Water treatment is less effective.';
        break;

      case 'high':
        message = 'Significant water quality deviations have been detected. Precautionary measures are recommended.';
        instructions = 'BOIL WATER ORDER IN EFFECT. DO NOT DRINK or use for cooking. Bathing/Washing OK, but monitor.';
        break;

      case 'critical':
        if (criticalChemicals.some((c) => c.parameter === 'pH' && c.value > 8.5)) {
          message = 'Critical water quality issues have been detected. The local utility is taking immediate action. Please seek guidance from local authorities and refrain from use until further notice.';
        } else if (criticalChemicals.some((c) => c.parameter === 'chlorine' && c.value > 2.5)) {
          message = 'Water quality parameters are outside safe operating limits. The utility is investigating and taking corrective measures. Do not use water until further notice.';
        } else if (criticalChemicals.some((c) => c.parameter === 'turbidity' && c.value > 2.0)) {
          message = 'Water filtration issues detected. Water may contain suspended particles. Do not use for consumption until the utility resolves the issue.';
        } else {
          message = 'SEVERE WARNING: Critical water quality issues have been detected. The local utility is investigating and taking immediate action.';
        }
        instructions = 'UNSAFE FOR ALL USES. DO NOT DRINK, COOK, OR BATHE. Seek guidance from local authorities.';
        break;
    }

    return {
      message,
      instructions,
      updatedAt: new Date(),
    };
  }

  public formatChemicalReading(reading: ChemicalReading): {
    parameter: string;
    displayName: string;
    value: string;
    status: string;
    note?: string;
  } {
    const displayNames: Record<string, string> = {
      chlorine: 'Chlorine Residual',
      pH: 'pH Level',
      turbidity: 'Turbidity',
      temperature: 'Water Temperature',
      lead: 'Lead Concentration',
    };

    return {
      parameter: reading.parameter,
      displayName: displayNames[reading.parameter] || reading.parameter,
      value: `${reading.value} ${reading.unit}`,
      status: reading.status.charAt(0).toUpperCase() + reading.status.slice(1),
      note: reading.note,
    };
  }

  public getRiskLevelColor(level: OverallRiskLevel): string {
    const colors: Record<OverallRiskLevel, string> = {
      stable: '#10b981',
      low: '#f59e0b',
      moderate: '#f97316',
      high: '#ef4444',
      critical: '#dc2626',
    };
    return colors[level];
  }

  public getStatusBadgeText(level: OverallRiskLevel): string {
    const badges: Record<OverallRiskLevel, string> = {
      stable: 'Normal Risk',
      low: 'Low Risk',
      moderate: 'Moderate Risk',
      high: 'High Alert',
      critical: 'SEVERE WARNING: DANGER',
    };
    return badges[level];
  }
}

export const statusCalculator = new StatusCalculatorService();

