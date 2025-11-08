import './LogDataPanel.css';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'ALERT' | 'INFO' | 'WARNING' | 'SUCCESS';
  message: string;
}

interface LogDataPanelProps {
  logs?: LogEntry[];
}

function LogDataPanel({ logs: initialLogs }: LogDataPanelProps) {
  const defaultLogs: LogEntry[] = [
    {
      id: '1',
      timestamp: '2014-07-26 10:15:28',
      level: 'CRITICAL',
      message: 'Pressure anomaly detected in DMA 3. Sensor P_J14.',
    },
    {
      id: '2',
      timestamp: '2014-07-26 10:15:29',
      level: 'ALERT',
      message: 'Automated valve closure initiated at V7.',
    },
    {
      id: '3',
      timestamp: '2014-07-26 10:15:30',
      level: 'INFO',
      message: "Pump PU1 status changed to 'Reduced Flow'.",
    },
    {
      id: '4',
      timestamp: '2014-07-26 10:15:32',
      level: 'WARNING',
      message: 'Network connectivity instability with SCADA-02.',
    },
    {
      id: '5',
      timestamp: '2024-07-26 10:15:35',
      level: 'INFO',
      message: 'Data reconciliation for Tank T1 completed successfully.',
    },
    {
      id: '6',
      timestamp: '2014-07-26 10:15:38',
      level: 'SUCCESS',
      message: 'System health check passed for all primary sensors.',
    },
  ];

  const logs = initialLogs || defaultLogs;

  return (
    <div className="log-data-panel">
      <h3 className="log-data-title">Log Data</h3>
      <div className="log-data-content">
        {logs.map((log) => (
          <div key={log.id} className="log-entry">
            <span className="log-timestamp">[{log.timestamp}]</span>{' '}
            <span className={`log-level level-${log.level.toLowerCase()}`}>{log.level}:</span>{' '}
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogDataPanel;

