import './AlertList.css';

interface Alert {
  id: string;
  type: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  time: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface AlertListProps {
  alerts: Alert[];
}

function AlertList({ alerts }: AlertListProps) {
  const groupedAlerts = alerts.reduce((acc, alert) => {
    const severity = `${alert.severity} Severity`;
    if (!acc[severity]) {
      acc[severity] = [];
    }
    acc[severity].push(alert);
    return acc;
  }, {} as Record<string, Alert[]>);

  const severityOrder = ['Critical Severity', 'High Severity', 'Medium Severity', 'Low Severity'];

  return (
    <div className="alert-list-container">
      <h3 className="alert-list-title">Active Alerts</h3>
      <div className="alert-list">
        {severityOrder.map((severity) => (
          groupedAlerts[severity] && (
            <div key={severity} className="alert-severity-group">
              <h4 className="severity-heading">{severity}</h4>
              {groupedAlerts[severity].map((alert) => (
                <div key={alert.id} className="alert-item">
                  <span className="alert-type">{alert.type}</span>
                  <span className={`alert-status status-${alert.status.toLowerCase()}`}>
                    {alert.status}
                  </span>
                  <span className="alert-time">{alert.time}</span>
                </div>
              ))}
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default AlertList;

