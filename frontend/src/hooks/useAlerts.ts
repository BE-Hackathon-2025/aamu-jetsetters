import { useState, useEffect } from 'react';
import { adminApi, type Alert } from '../services/adminApi';

interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAlerts(pollInterval: number = 60000): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await adminApi.getAlerts();
      setAlerts(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchData,
  };
}

