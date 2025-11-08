import './HealthAdvisory.css';

interface HealthAdvisoryProps {
  advisory: string;
  updatedAt: string;
  onViewDetails?: () => void;
}

function HealthAdvisory({ advisory, updatedAt, onViewDetails }: HealthAdvisoryProps) {
  return (
    <div className="health-advisory" data-tour="health-advisory">
      <div className="advisory-header">
        <h2 className="advisory-title">Health Advisory</h2>
        <button className="info-icon" aria-label="More information">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </div>

      <p className="advisory-text">{advisory}</p>

      <p className="advisory-updated">Updated: {updatedAt}</p>

      <button className="view-details-btn" onClick={onViewDetails}>
        View Details
      </button>
    </div>
  );
}

export default HealthAdvisory;

