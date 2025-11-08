import './DataCard.css';

interface DataCardProps {
  title: string;
  value?: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  status?: {
    label: string;
    type: 'warning' | 'danger' | 'success' | 'info';
  };
  detail?: string;
  description?: string;
  icon?: string;
}

function DataCard({ title, value, trend, status, detail, description, icon }: DataCardProps) {
  return (
    <div className="data-card">
      <div className="data-card-header">
        <h3 className="data-card-title">{title}</h3>
        {trend && (
          <span className={`data-card-trend trend-${trend.direction}`}>
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.value}
          </span>
        )}
      </div>

      {status && (
        <div className="data-card-status">
          {icon && <span className="status-icon">{icon}</span>}
          <span className={`status-badge status-${status.type}`}>
            {status.label}
          </span>
        </div>
      )}

      {value && (
        <div className="data-card-value">{value}</div>
      )}

      {detail && (
        <div className="data-card-detail">{detail}</div>
      )}

      {description && (
        <div className="data-card-description">{description}</div>
      )}
    </div>
  );
}

export default DataCard;

