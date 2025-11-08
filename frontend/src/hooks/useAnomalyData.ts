import { useState, useEffect } from 'react';
import { adminApi, type AnomalyCurrent, type AnomalyHistoryPoint } from '../services/adminApi';

interface UseAnomalyDataReturn {
  current: AnomalyCurrent | null;
  history: AnomalyHistoryPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAnomalyData(pollInterval: number = 60000, days: number = 7): UseAnomalyDataReturn {
  const [current, setCurrent] = useState<AnomalyCurrent | null>(null);
  const [history, setHistory] = useState<AnomalyHistoryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [currentData, historyData] = await Promise.all([
        adminApi.getAnomalyCurrent(),
        adminApi.getAnomalyHistory(days),
      ]);
      setCurrent(currentData);
      setHistory(historyData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch anomaly data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval, days]);

  return {
    current,
    history,
    loading,
    error,
    refetch: fetchData,
  };
}

