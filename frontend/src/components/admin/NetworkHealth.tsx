import './NetworkHealth.css';

interface NetworkHealthProps {
  status: 'warning' | 'healthy' | 'critical';
  trafficVolume: string;
  failedConnections: number;
}

function NetworkHealth({ status, trafficVolume, failedConnections }: NetworkHealthProps) {
  return (
    <div className="network-health-container">
      <div className="network-health-header">
        <h3 className="network-health-title">IT/OT Network Health</h3>
        <span className={`network-status status-${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="network-metrics">
        <div className="network-metric">
          <span className="metric-label">Traffic Volume:</span>
          <span className="metric-value">{trafficVolume}</span>
        </div>
        <div className="network-metric">
          <span className="metric-label">Failed Connections:</span>
          <span className="metric-value">{failedConnections}</span>
        </div>
      </div>

      <div className="network-footer">
        <span className="footer-text">Real-time data from Firewall & Logs.</span>
      </div>
    </div>
  );
}

export default NetworkHealth;

