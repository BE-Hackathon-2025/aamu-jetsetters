import { useState, useEffect } from 'react';
import { adminApi, type SensorDataPoint } from '../services/adminApi';

interface UseSensorDataReturn {
  sensorData: SensorDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSensorData(hours: number = 24, pollInterval: number = 60000): UseSensorDataReturn {
  const [sensorData, setSensorData] = useState<SensorDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await adminApi.getSensorData(hours);
      setSensorData(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sensor data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval, hours]);

  return {
    sensorData,
    loading,
    error,
    refetch: fetchData,
  };
}

