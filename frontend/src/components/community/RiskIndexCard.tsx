import './RiskIndexCard.css';

interface RiskIndexCardProps {
  percentage: number;
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk';
  description: string;
}

function RiskIndexCard({ percentage, riskLevel, description }: RiskIndexCardProps) {
  const getRiskClass = () => {
    if (riskLevel === 'Low Risk') return 'low';
    if (riskLevel === 'Moderate Risk') return 'moderate';
    if (riskLevel === 'High Risk') return 'high';
    return 'critical';
  };

  return (
    <div className="risk-index-card">
      <div className="risk-header">
        <div className="risk-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h2 className="risk-title">Overall Water Risk Index</h2>
      </div>

      <div className="risk-circle-container">
        <svg className="risk-circle" width="160" height="160" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="12"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#ffffff"
            strokeWidth="12"
            strokeDasharray={`${(percentage / 100) * 439.8} 439.8`}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="risk-percentage">{percentage}%</div>
      </div>

      <div className={`risk-badge risk-${getRiskClass()}`}>
        {riskLevel}
      </div>

      <p className="risk-description">{description}</p>
    </div>
  );
}

export default RiskIndexCard;

