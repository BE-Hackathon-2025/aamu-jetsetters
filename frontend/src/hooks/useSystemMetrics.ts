import { useState, useEffect } from 'react';
import { adminApi, type SystemStatusData, type NetworkHealth } from '../services/adminApi';

interface UseSystemMetricsReturn {
  systemStatus: SystemStatusData | null;
  networkHealth: NetworkHealth | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSystemMetrics(pollInterval: number = 60000): UseSystemMetricsReturn {
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
  const [networkHealth, setNetworkHealth] = useState<NetworkHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [statusData, healthData] = await Promise.all([
        adminApi.getSystemStatus(),
        adminApi.getNetworkHealth(),
      ]);
      setSystemStatus(statusData);
      setNetworkHealth(healthData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system metrics');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval]);

  return {
    systemStatus,
    networkHealth,
    loading,
    error,
    refetch: fetchData,
  };
}

