import ChartWidget from '../../components/admin/ChartWidget';
import SchematicWidget from '../../components/admin/SchematicWidget';
import LogViewer from '../../components/admin/LogViewer';
import { useSensorData } from '../../hooks/useSensorData';
import { useLogs } from '../../hooks/useLogs';
import { adminApi } from '../../services/adminApi';
import { useState, useEffect } from 'react';
import './DiagnosticsForensics.css';

function DiagnosticsForensics() {
  const { sensorData, loading: sensorLoading } = useSensorData(24, 60000);
  const { logs, loading: logsLoading } = useLogs(24, undefined, undefined, 60000);
  const [schematicStatus, setSchematicStatus] = useState<any[]>([]);

  useEffect(() => {
    const fetchSchematicStatus = async () => {
      try {
        const status = await adminApi.getSchematicStatus();
        setSchematicStatus(status);
      } catch (error) {
        console.error('Error fetching schematic status:', error);
      }
    };
    fetchSchematicStatus();
    const interval = setInterval(fetchSchematicStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="diagnostics-page">
      <div className="diagnostics-header">
        <h2 className="diagnostics-title">Real-Time Diagnostics & Forensics</h2>
        <p className="diagnostics-subtitle">Detailed insights into system health and incident analysis.</p>
      </div>

      {/* Top Section: Chart and Schematic */}
      <div className="diagnostics-top-section">
        <div className="chart-section">
          <ChartWidget showLiveBadge={true} sensorData={sensorData} loading={sensorLoading} />
        </div>
        <div className="schematic-section">
          <SchematicWidget componentStatus={schematicStatus} />
        </div>
      </div>

      {/* Bottom Section: Log Viewer */}
      <div className="diagnostics-bottom-section">
        <LogViewer logs={logs} loading={logsLoading} />
      </div>
    </div>
  );
}

export default DiagnosticsForensics;

