import './CommunityActions.css';

interface CommunityActionsProps {
  onReportIssue?: () => void;
  onViewFAQ?: () => void;
}

function CommunityActions({ onReportIssue, onViewFAQ }: CommunityActionsProps) {
  return (
    <div className="community-actions">
      <h2 className="actions-title">Community Resources & Reporting</h2>

      <div className="action-buttons">
        <button className="action-btn" onClick={onReportIssue} data-tour="report-issue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7 3-1-7-5-5 5-5 1-7-7 3-5 5-5-5-7 3 3 7 5 5-5 5-3 7 7-3 5-5z" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span>Report Issue</span>
        </button>

        <button className="action-btn" onClick={onViewFAQ} data-tour="view-faq">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>View FAQ</span>
        </button>
      </div>
    </div>
  );
}

export default CommunityActions;

