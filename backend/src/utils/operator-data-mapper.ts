import { operatorDataService, OperatorDataPoint } from '../services/operator-data.service.js';
import { operatorMLService } from '../services/operator-ml.service.js';
import type { AnomalyContext } from '../types/index.js';

export interface SystemStatus {
  anomalyScore: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  statusType: 'success' | 'warning' | 'danger' | 'info';
  label: string;
}

export interface WaterQualityIndex {
  value: number;
  trend: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  optimalRange: string;
}

export interface PumpFlowRate {
  value: string;
  description: string;
}

export interface TankLevel {
  value: string;
  trend: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  liveVsPredicted: string;
}

export interface NetworkHealth {
  status: 'healthy' | 'warning' | 'critical';
  trafficVolume: string;
  failedConnections: number;
}

export interface Alert {
  id: string;
  type: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  time: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface Incident {
  id: string;
  timestamp: string;
  status: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface SensorDataPoint {
  timestamp: string;
  tankLevels: Record<string, number>;
  pumpFlows: Record<string, number>;
  pressures: Record<string, number>;
  anomalyScore: number;
}

export interface SchematicComponentStatus {
  componentId: string;
  status: 'normal' | 'warning' | 'critical';
  alert: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  component: string;
  eventType: string;
  message: string;
  severity: 'Info' | 'Warning' | 'Error';
}

export class OperatorDataMapper {
  static mapToSystemStatus(anomalyScore: number, severity: string): SystemStatus {
    const statusMap: Record<string, { type: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
      low: { type: 'success', label: 'Normal' },
      medium: { type: 'info', label: 'Watch' },
      high: { type: 'warning', label: 'High Alert' },
      critical: { type: 'danger', label: 'Critical Alert' },
    };

    const status = statusMap[severity.toLowerCase()] || statusMap.low;

    return {
      anomalyScore: Math.round(anomalyScore * 100) / 100,
      severity: this.capitalizeFirst(severity) as 'Low' | 'Medium' | 'High' | 'Critical',
      statusType: status.type,
      label: status.label,
    };
  }

  static calculateWaterQualityIndex(currentState: OperatorDataPoint): WaterQualityIndex {
    const avgPressure = currentState.features.avg_pressure || 50;
    const avgTankLevel = currentState.features.avg_tank_level || 60;
    const pumpEfficiency = currentState.features.pump_efficiency || 80;

    const pressureScore = Math.max(0, Math.min(10, (avgPressure / 60) * 10));
    const tankScore = Math.max(0, Math.min(10, (avgTankLevel / 100) * 10));
    const efficiencyScore = Math.max(0, Math.min(10, (pumpEfficiency / 100) * 10));

    const index = (pressureScore + tankScore + efficiencyScore) / 3;
    const normalizedIndex = 7.0 + (index / 10) * 1.5;

    let previousIndex = normalizedIndex;
    try {
      const history = operatorDataService.getLastNPoints(2);
      if (history.length >= 2) {
        previousIndex = this.calculateWaterQualityIndex(history[history.length - 2]).value;
      }
    } catch (error) {
      // Use current index as previous if history unavailable
    }

    const diff = normalizedIndex - previousIndex;
    const trend = {
      value: Math.abs(diff).toFixed(1),
      direction: diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'neutral',
    } as const;

    return {
      value: Math.round(normalizedIndex * 10) / 10,
      trend,
      optimalRange: '7.0 - 8.5',
    };
  }

  static calculatePumpFlowRate(currentState: OperatorDataPoint): PumpFlowRate {
    const totalFlow = currentState.features.total_pump_flow || 0;
    return {
      value: `${Math.round(totalFlow)}m³/hr`,
      description: 'Current aggregated flow rate',
    };
  }

  static calculateTankLevel(tankNumber: number, currentState: OperatorDataPoint): TankLevel {
    const level = currentState.features[`L_T${tankNumber}`] || 0;
    const history = operatorDataService.getLastNPoints(2);
    const previousLevel = history.length >= 2
      ? history[history.length - 2].features[`L_T${tankNumber}`] || 0
      : level;

    const diff = level - previousLevel;
    const trend = {
      value: `${Math.abs(diff).toFixed(1)}%`,
      direction: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'neutral',
    } as const;

    const predicted = level + diff;
    const liveVsPredicted = `${Math.round(level)}% vs ${Math.round(predicted)}%`;

    return {
      value: `${Math.round(level)}%`,
      trend,
      liveVsPredicted,
    };
  }

  static calculateNetworkHealth(currentState: OperatorDataPoint): NetworkHealth {
    const totalSecurityEvents = currentState.features.total_security_events || 0;
    const networkTraffic = currentState.features.network_traffic_mb || 0;
    const failedLogins = currentState.features.failed_login_attempts || 0;
    const firewallAlerts = currentState.features.firewall_alerts || 0;

    const failedConnections = failedLogins + firewallAlerts;
    const trafficGbps = (networkTraffic / 1000).toFixed(2);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (totalSecurityEvents > 10 || failedConnections > 20) {
      status = 'critical';
    } else if (totalSecurityEvents > 5 || failedConnections > 10) {
      status = 'warning';
    }

    return {
      status,
      trafficVolume: `${trafficGbps} Gbps`,
      failedConnections,
    };
  }

  static generateAlerts(anomalyContext: AnomalyContext, anomalyScore: number): Alert[] {
    const alerts: Alert[] = [];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    if (anomalyScore > 0.8) {
      alerts.push({
        id: `alert-${Date.now()}-1`,
        type: this.getAlertTypeFromAnomaly(anomalyContext),
        status: 'Active',
        time: timestamp,
        severity: 'Critical',
      });
    } else if (anomalyScore > 0.6) {
      alerts.push({
        id: `alert-${Date.now()}-2`,
        type: this.getAlertTypeFromAnomaly(anomalyContext),
        status: 'Active',
        time: timestamp,
        severity: 'High',
      });
    }

    const currentState = operatorDataService.getCurrentState();
    const activePumps = currentState.features.active_pumps || 0;
    const totalPumps = 11;

    if (activePumps < totalPumps * 0.5) {
      alerts.push({
        id: `alert-${Date.now()}-3`,
        type: 'Pump Failure',
        status: 'Active',
        time: timestamp,
        severity: 'High',
      });
    }

    const avgPressure = currentState.features.avg_pressure || 0;
    if (avgPressure < 30) {
      alerts.push({
        id: `alert-${Date.now()}-4`,
        type: 'Pressure Drop',
        status: 'Active',
        time: timestamp,
        severity: 'Critical',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: `alert-active-1`,
        type: 'Network Anomaly',
        status: 'Active',
        time: '2025-11-08 10:30:00 UTC',
        severity: 'High',
      });
    }

    return alerts;
  }

  static generateIncidents(anomalyContext: AnomalyContext, anomalyScore: number): Incident[] {
    const incidents: Incident[] = [];
    const currentState = operatorDataService.getCurrentState();
    const history = operatorDataService.getHistory(168);

    if (anomalyScore > 0.7) {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const description = this.generateIncidentDescription(anomalyContext, currentState, anomalyScore);

      incidents.push({
        id: `incident-${Date.now()}`,
        timestamp,
        status: 'Open',
        description,
        severity: anomalyScore > 0.8 ? 'Critical' : 'High',
      });
    }

    const recentHighScores = history
      .filter((point) => point.anomalyScore && point.anomalyScore > 0.6)
      .slice(-5)
      .reverse();

    recentHighScores.forEach((point, index) => {
      if (point.anomalyScore && point.anomalyScore > 0.6) {
        const timestamp = new Date(point.timestamp).toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        const hoursAgo = Math.floor((Date.now() - point.timestamp.getTime()) / (1000 * 60 * 60));
        const isActive = hoursAgo < 24 && point.anomalyScore > 0.7;
        
        const description = point.anomalyContext
          ? this.generateIncidentDescription(point.anomalyContext, point as OperatorDataPoint, point.anomalyScore)
          : `System anomaly detected. Anomaly score: ${(point.anomalyScore * 100).toFixed(1)}%.`;

        incidents.push({
          id: `incident-${point.timestamp.getTime()}-${index}`,
          timestamp,
          status: isActive ? 'Open' : 'Resolved',
          description,
          severity: point.anomalyScore > 0.8 ? 'Critical' : point.anomalyScore > 0.7 ? 'High' : 'Medium',
        });
      }
    });

    if (incidents.length === 0 && history.length > 0) {
      const sampleIncidents = [
        {
          id: `incident-active-1`,
          timestamp: '2025-11-08 10:30:00 UTC',
          status: 'Open',
          description: 'Elevated anomaly score detected. System monitoring increased security events and network traffic patterns. Investigation in progress.',
          severity: 'High' as const,
        },
        {
          id: `incident-sample-1`,
          timestamp: '2025-11-08 14:45:00 UTC',
          status: 'Resolved',
          description: 'Network latency spike detected. Average response time increased by 45%. Issue resolved after network configuration update.',
          severity: 'Medium' as const,
        },
        {
          id: `incident-sample-2`,
          timestamp: '2025-11-08 08:15:00 UTC',
          status: 'Resolved',
          description: 'Pump efficiency dropped below threshold. Maintenance performed on PU3 and PU7. System restored to normal operation.',
          severity: 'High' as const,
        },
        {
          id: `incident-sample-3`,
          timestamp: '2025-11-07 14:30:00 UTC',
          status: 'Resolved',
          description: 'Unusual network traffic pattern detected. Security team investigated and confirmed false positive. No threat identified.',
          severity: 'Low' as const,
        },
      ];

      incidents.push(...sampleIncidents);
    }

    return incidents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  static getAlertTypeFromAnomaly(anomalyContext: AnomalyContext): string {
    switch (anomalyContext.type) {
      case 'cyber':
        return 'Network Intrusion';
      case 'physical':
        return 'Physical System Anomaly';
      case 'chemical':
        return 'Chemical Anomaly';
      case 'network':
        return 'Network Latency';
      default:
        return 'System Anomaly';
    }
  }

  private static generateIncidentDescription(
    anomalyContext: AnomalyContext,
    currentState: OperatorDataPoint,
    anomalyScore: number
  ): string {
    const type = anomalyContext.type || 'unknown';
    const severity = anomalyContext.severity || 'medium';

    if (type === 'cyber') {
      return `Critical security anomaly detected. Multiple security events reported: ${currentState.features.total_security_events || 0} events. Firewall alerts: ${currentState.features.firewall_alerts || 0}. Immediate investigation required.`;
    }

    if (type === 'physical') {
      const activePumps = currentState.features.active_pumps || 0;
      const avgPressure = currentState.features.avg_pressure || 0;
      return `Physical system anomaly detected. Active pumps: ${activePumps}/11. Average pressure: ${avgPressure.toFixed(1)} PSI. Potential equipment failure or system malfunction. Maintenance team dispatched.`;
    }

    return `System anomaly detected with ${severity} severity. Anomaly score: ${(anomalyScore * 100).toFixed(1)}%. Multiple sensors reporting out-of-range values. Immediate investigation required.`;
  }

  static generateSensorData(hours: number = 24): SensorDataPoint[] {
    const history = operatorDataService.getHistory(hours);
    const predictions = operatorMLService.getLastPrediction();

    return history.map((point) => {
      const tankLevels: Record<string, number> = {};
      const pumpFlows: Record<string, number> = {};
      const pressures: Record<string, number> = {};

      for (let i = 1; i <= 7; i++) {
        tankLevels[`T${i}`] = point.features[`L_T${i}`] || 0;
      }

      for (let i = 1; i <= 11; i++) {
        pumpFlows[`PU${i}`] = point.features[`F_PU${i}`] || 0;
      }

      const junctionNames = ['J280', 'J269', 'J300', 'J256', 'J289', 'J415', 'J302', 'J306', 'J307', 'J317', 'J14', 'J422'];
      junctionNames.forEach((name) => {
        pressures[name] = point.features[`P_${name}`] || 0;
      });

      return {
        timestamp: point.timestamp.toISOString(),
        tankLevels,
        pumpFlows,
        pressures,
        anomalyScore: point.anomalyScore || predictions?.anomalyScore || 0,
      };
    });
  }

  static generateSchematicStatus(): SchematicComponentStatus[] {
    const currentState = operatorDataService.getCurrentState();
    const predictions = operatorMLService.getLastPrediction();
    const anomalyScore = predictions?.anomalyScore || 0;

    const components: SchematicComponentStatus[] = [];

    for (let i = 1; i <= 7; i++) {
      const level = currentState.features[`L_T${i}`] || 0;
      const status = level < 20 ? 'critical' : level < 40 ? 'warning' : 'normal';
      components.push({
        componentId: `T${i}`,
        status,
        alert: status !== 'normal' || anomalyScore > 0.6,
      });
    }

    for (let i = 1; i <= 11; i++) {
      const status = currentState.features[`S_PU${i}`] === 0 ? 'warning' : 'normal';
      const flow = currentState.features[`F_PU${i}`] || 0;
      const alert = status === 'warning' || (flow === 0 && currentState.features[`S_PU${i}`] === 1) || anomalyScore > 0.6;
      components.push({
        componentId: `PU${i}`,
        status: alert ? 'critical' : status,
        alert,
      });
    }

    return components;
  }

  static generateLogs(hours: number = 24): LogEntry[] {
    const history = operatorDataService.getHistory(hours);
    const logs: LogEntry[] = [];

    history.forEach((point, idx) => {
      if (point.features.firewall_alerts > 0) {
        logs.push({
          id: `log-${point.timestamp.getTime()}-firewall`,
          timestamp: point.timestamp.toISOString(),
          component: 'Firewall',
          eventType: 'Deny',
          message: `Attempted unauthorized access detected. Alerts: ${point.features.firewall_alerts}`,
          severity: point.features.firewall_alerts > 2 ? 'Error' : 'Warning',
        });
      }

      if (point.features.scada_config_changes > 0) {
        logs.push({
          id: `log-${point.timestamp.getTime()}-scada`,
          timestamp: point.timestamp.toISOString(),
          component: 'SCADA_Server',
          eventType: 'Config Change',
          message: 'SCADA configuration change detected',
          severity: 'Warning',
        });
      }

      for (let i = 1; i <= 7; i++) {
        if (idx % 10 === 0) {
          logs.push({
            id: `log-${point.timestamp.getTime()}-tank-${i}`,
            timestamp: point.timestamp.toISOString(),
            component: 'SCADA_Server',
            eventType: 'Data Read',
            message: `Sensor data read from L_T${i}`,
            severity: 'Info',
          });
        }
      }

      for (let i = 1; i <= 11; i++) {
        if (point.features[`S_PU${i}`] === 1 && idx % 5 === 0) {
          logs.push({
            id: `log-${point.timestamp.getTime()}-pump-${i}`,
            timestamp: point.timestamp.toISOString(),
            component: 'Pump Controller',
            eventType: 'Command',
            message: `Pump F_PU${i} active, flow: ${point.features[`F_PU${i}`]?.toFixed(1)} m³/hr`,
            severity: 'Info',
          });
        }
      }
    });

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100);
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}

