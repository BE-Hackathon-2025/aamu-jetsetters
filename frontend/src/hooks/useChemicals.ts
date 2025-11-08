import { useState, useEffect } from 'react';
import { waterApi } from '../services/waterApi';
import type { Chemical } from '../services/waterApi';

interface UseChemicalsReturn {
  data: Chemical[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChemicals(pollInterval: number = 60000): UseChemicalsReturn {
  const [data, setData] = useState<Chemical[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await waterApi.getChemicals();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chemicals');
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

