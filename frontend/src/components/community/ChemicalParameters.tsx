import './ChemicalParameters.css';

interface Parameter {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: 'Normal' | 'Warning' | 'Anomaly';
  icon: string;
}

interface ChemicalParametersProps {
  parameters?: Parameter[];
}

function ChemicalParameters({ parameters: customParameters }: ChemicalParametersProps) {
  const defaultParameters: Parameter[] = [
    {
      id: '1',
      name: 'Chlorine Residual',
      value: '0.8',
      unit: 'mg/L',
      status: 'Normal',
      icon: 'droplet',
    },
    {
      id: '2',
      name: 'pH Level',
      value: '7.8',
      unit: '',
      status: 'Warning',
      icon: 'balance',
    },
    {
      id: '3',
      name: 'Turbidity',
      value: '3.5',
      unit: 'NTU',
      status: 'Anomaly',
      icon: 'cloud',
    },
    {
      id: '4',
      name: 'Water Temperature',
      value: '22',
      unit: '°C',
      status: 'Normal',
      icon: 'thermometer',
    },
    {
      id: '5',
      name: 'Lead Concentration',
      value: '0.007',
      unit: 'mg/L',
      status: 'Warning',
      icon: 'atoms',
    },
  ];

  const parameters = customParameters || defaultParameters;

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'droplet':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'balance':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="3" x2="12" y2="21" />
            <path d="M5 9l-3 6h6z" />
            <path d="M16 9l-3 6h6z" />
          </svg>
        );
      case 'cloud':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            <line x1="8" y1="19" x2="8" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="16" y1="19" x2="16" y2="21" />
          </svg>
        );
      case 'thermometer':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          </svg>
        );
      case 'atoms':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Normal':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'Warning':
        return null;
      case 'Anomaly':
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="chemical-parameters">
      <div className="parameters-header">
        <div className="parameters-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="parameters-title">Chemical Parameters Monitoring</h2>
      </div>

      <div className="parameters-list">
        {parameters.map((param) => (
          <div key={param.id} className="parameter-item">
            <div className="parameter-left">
              <div className="parameter-icon">{getIcon(param.icon)}</div>
              <div className="parameter-info">
                <h3 className="parameter-name">{param.name}</h3>
                <p className="parameter-value">
                  {param.value} {param.unit}
                </p>
              </div>
            </div>
            <div className={`parameter-status status-${param.status.toLowerCase()}`}>
              <span className="status-icon">{getStatusIcon(param.status)}</span>
              <span className="status-text">{param.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChemicalParameters;

