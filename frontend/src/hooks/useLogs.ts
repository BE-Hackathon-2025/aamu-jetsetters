import { useState, useEffect } from 'react';
import { adminApi, type LogEntry } from '../services/adminApi';

interface UseLogsReturn {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLogs(hours: number = 24, component?: string, severity?: string, pollInterval: number = 60000): UseLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await adminApi.getLogs(hours, component, severity);
      setLogs(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval, hours, component, severity]);

  return {
    logs,
    loading,
    error,
    refetch: fetchData,
  };
}

