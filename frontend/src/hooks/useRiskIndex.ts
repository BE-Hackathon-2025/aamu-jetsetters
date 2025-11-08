import { useState, useEffect } from 'react';
import { waterApi } from '../services/waterApi';
import type { RiskIndex } from '../services/waterApi';

interface UseRiskIndexReturn {
  data: RiskIndex | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRiskIndex(pollInterval: number = 60000): UseRiskIndexReturn {
  const [data, setData] = useState<RiskIndex | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await waterApi.getRiskIndex();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk index');
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

