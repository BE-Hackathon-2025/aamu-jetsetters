import { useState, useEffect } from 'react';
import { waterApi } from '../services/waterApi';
import type { WaterStatus } from '../services/waterApi';

interface UseWaterDataReturn {
  data: WaterStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWaterData(pollInterval: number = 60000): UseWaterDataReturn {
  const [data, setData] = useState<WaterStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await waterApi.getStatus();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch water status');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

