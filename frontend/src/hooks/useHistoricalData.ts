import { useState, useEffect } from 'react';
import { waterApi } from '../services/waterApi';
import { formatDateShort } from '../utils/dataMapper';

interface TrendData {
  date: string;
  value: number;
}

interface UseHistoricalDataReturn {
  riskIndexTrend: TrendData[];
  chemicalTrends: Record<string, TrendData[]>;
  loading: boolean;
  error: string | null;
  refetch: (days: number) => void;
}

export function useHistoricalData(days: number = 7): UseHistoricalDataReturn {
  const [riskIndexTrend, setRiskIndexTrend] = useState<TrendData[]>([]);
  const [chemicalTrends, setChemicalTrends] = useState<Record<string, TrendData[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (daysToFetch: number) => {
    try {
      setError(null);
      setLoading(true);
      const history = await waterApi.getHistory(daysToFetch);
      
      const riskData: TrendData[] = history.map((point) => ({
        date: formatDateShort(point.timestamp),
        value: point.riskIndex,
      }));
      
      const chemicalData: Record<string, TrendData[]> = {};
      const chemicalParams = ['chlorine', 'pH', 'turbidity', 'temperature', 'lead'];
      
      chemicalParams.forEach((param) => {
        chemicalData[param] = history.map((point) => {
          const chem = point.chemicals.find((c) => c.parameter === param);
          return {
            date: formatDateShort(point.timestamp),
            value: chem ? chem.value : 0,
          };
        });
      });
      
      setRiskIndexTrend(riskData);
      setChemicalTrends(chemicalData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days]);

  return {
    riskIndexTrend,
    chemicalTrends,
    loading,
    error,
    refetch: fetchData,
  };
}

