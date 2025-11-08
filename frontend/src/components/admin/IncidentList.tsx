import './IncidentList.css';

interface Incident {
  id: string;
  timestamp: string;
  status: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface IncidentListProps {
  incidents: Incident[];
}

function IncidentList({ incidents }: IncidentListProps) {
  const activeIncidents = incidents.filter((inc) => inc.status === 'Open');
  const recentIncidents = incidents.filter((inc) => inc.status !== 'Open').slice(0, 5);

  const formatTimestamp = (timestamp: string) => {
    try {
      let date: Date;
      
      if (timestamp.includes('T')) {
        date = new Date(timestamp);
      } else {
        const normalizedTimestamp = timestamp.replace(' UTC', 'Z').replace(' ', 'T');
        date = new Date(normalizedTimestamp);
      }
      
      if (isNaN(date.getTime())) {
        return timestamp;
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) {
        return 'Just now';
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="incident-list-container">
      {activeIncidents.length > 0 && (
        <>
          <h3 className="incident-list-title">Active Incidents</h3>
          <div className="incident-list">
            {activeIncidents.map((incident) => (
              <div key={incident.id} className="incident-item incident-active">
                <div className="incident-header">
                  <span className="incident-timestamp">{formatTimestamp(incident.timestamp)}</span>
                  <span className={`incident-severity severity-${incident.severity.toLowerCase()}`}>
                    {incident.severity}
                  </span>
                </div>
                <div className="incident-status status-open">Status: {incident.status}</div>
                <div className="incident-description">{incident.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {recentIncidents.length > 0 && (
        <>
          <h3 className="incident-list-title" style={{ marginTop: activeIncidents.length > 0 ? '24px' : '0' }}>
            Recent Incidents
          </h3>
          <div className="incident-list">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="incident-item">
                <div className="incident-header">
                  <span className="incident-timestamp">{formatTimestamp(incident.timestamp)}</span>
                  <span className={`incident-severity severity-${incident.severity.toLowerCase()}`}>
                    {incident.severity}
                  </span>
                </div>
                <div className="incident-status">Status: {incident.status}</div>
                <div className="incident-description">{incident.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {incidents.length === 0 && (
        <div className="incident-empty">
          <p>No incidents reported</p>
          <span className="incident-empty-subtitle">System operating normally</span>
        </div>
      )}
    </div>
  );
}

export default IncidentList;

