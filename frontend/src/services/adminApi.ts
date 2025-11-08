const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

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

export interface AnomalyCurrent {
  anomalyScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  systemStatus: SystemStatus;
  anomalyContext: {
    isActive: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type?: 'chemical' | 'network' | 'physical' | 'cyber';
    startTime?: string;
  };
  predictedFailurePoint: string;
  confidence: number;
  lastUpdated: string;
}

export interface AnomalyHistoryPoint {
  date: string;
  value: number;
  timestamp: string;
  label?: string;
}

export interface SystemStatusData {
  systemStatus: SystemStatus;
  waterQualityIndex: WaterQualityIndex;
  pumpFlowRate: PumpFlowRate;
  tankT1Level: TankLevel;
  allTankLevels: Record<string, string>;
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

export const adminApi = {
  getAnomalyCurrent: async (): Promise<AnomalyCurrent> => {
    return fetchApi<AnomalyCurrent>('/api/admin/anomaly/current');
  },

  getAnomalyHistory: async (days: number = 7): Promise<AnomalyHistoryPoint[]> => {
    return fetchApi<AnomalyHistoryPoint[]>(`/api/admin/anomaly/history?days=${days}`);
  },

  getSystemStatus: async (): Promise<SystemStatusData> => {
    return fetchApi<SystemStatusData>('/api/admin/system/status');
  },

  getSystemMetrics: async (): Promise<{
    totalPumpFlow: number;
    activePumps: number;
    avgPumpFlow: number;
    pumpEfficiency: number;
    avgPressure: number;
    totalTankVolume: number;
    avgTankLevel: number;
  }> => {
    return fetchApi('/api/admin/system/metrics');
  },

  getNetworkHealth: async (): Promise<NetworkHealth> => {
    return fetchApi<NetworkHealth>('/api/admin/network/health');
  },

  getAlerts: async (): Promise<Alert[]> => {
    return fetchApi<Alert[]>('/api/admin/alerts');
  },

  getIncidents: async (): Promise<Incident[]> => {
    return fetchApi<Incident[]>('/api/admin/incidents');
  },

  getSensorData: async (hours: number = 24): Promise<SensorDataPoint[]> => {
    return fetchApi<SensorDataPoint[]>(`/api/admin/sensors/data?hours=${hours}`);
  },

  getSchematicStatus: async (): Promise<SchematicComponentStatus[]> => {
    return fetchApi<SchematicComponentStatus[]>('/api/admin/schematic/status');
  },

  getLogs: async (hours: number = 24, component?: string, severity?: string): Promise<LogEntry[]> => {
    const params = new URLSearchParams();
    params.append('hours', hours.toString());
    if (component) params.append('component', component);
    if (severity) params.append('severity', severity);
    return fetchApi<LogEntry[]>(`/api/admin/logs?${params.toString()}`);
  },
};

