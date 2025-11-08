const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/public${endpoint}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }
  
  return result.data as T;
}

export interface WaterStatus {
  overallRisk: {
    index: number;
    level: string;
    description: string;
    timestamp: string;
  };
  chemicals: Array<{
    parameter: string;
    displayName: string;
    value: string;
    status: string;
    note?: string;
  }>;
  healthAdvisory: {
    message: string;
    instructions: string;
    updatedAt: string;
  };
  lastUpdated: string;
}

export interface RiskIndex {
  index: number;
  level: string;
  description: string;
  timestamp: string;
  color: string;
  badgeText: string;
}

export interface Chemical {
  parameter: string;
  displayName: string;
  value: string;
  status: string;
  note?: string;
}

export interface HealthAdvisory {
  message: string;
  instructions: string;
  updatedAt: string;
}

export interface HistoryPoint {
  timestamp: string;
  riskIndex: number;
  chemicals: Array<{
    parameter: string;
    value: number;
    unit: string;
    status: string;
  }>;
}

export const waterApi = {
  getStatus: (): Promise<WaterStatus> => {
    return fetchApi<WaterStatus>('/status');
  },

  getRiskIndex: (): Promise<RiskIndex> => {
    return fetchApi<RiskIndex>('/risk-index');
  },

  getChemicals: (): Promise<Chemical[]> => {
    return fetchApi<Chemical[]>('/chemicals');
  },

  getHealthAdvisory: (): Promise<HealthAdvisory> => {
    return fetchApi<HealthAdvisory>('/health-advisory');
  },

  getHistory: (days: number = 7): Promise<HistoryPoint[]> => {
    return fetchApi<HistoryPoint[]>(`/history?days=${days}`);
  },
};

