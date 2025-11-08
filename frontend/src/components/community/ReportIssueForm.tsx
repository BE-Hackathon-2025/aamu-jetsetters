import { useState } from 'react';
import { issuesApi } from '../../services/issuesApi';
import './ReportIssueForm.css';

interface ReportIssueFormProps {
  onClose?: () => void;
  onSubmit?: (issue: IssueData) => void;
}

export interface IssueData {
  issueType: string;
  description: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  contactEmail?: string;
  contactPhone?: string;
}

function ReportIssueForm({ onClose, onSubmit }: ReportIssueFormProps) {
  const [formData, setFormData] = useState<IssueData>({
    issueType: '',
    description: '',
    location: '',
    priority: 'Medium',
    contactEmail: '',
    contactPhone: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const issueTypes = [
    'Water Quality Concern',
    'Unusual Taste or Odor',
    'Discolored Water',
    'Low Water Pressure',
    'Leak or Pipe Issue',
    'Billing Question',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const newErrors: string[] = [];
    if (!formData.issueType) newErrors.push('Please select an issue type');
    if (!formData.description.trim()) newErrors.push('Please provide a description');
    if (!formData.location.trim()) newErrors.push('Please provide a location');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      await issuesApi.submitIssue({
        issueType: formData.issueType,
        description: formData.description,
        location: formData.location,
        priority: formData.priority,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
      });

      setSubmitSuccess(true);

    if (onSubmit) {
      onSubmit(formData);
    }

      setTimeout(() => {
    setFormData({
      issueType: '',
      description: '',
      location: '',
      priority: 'Medium',
      contactEmail: '',
      contactPhone: '',
    });
        setSubmitSuccess(false);
        setIsSubmitting(false);
    if (onClose) {
      onClose();
        }
      }, 2000);
    } catch (error) {
      setIsSubmitting(false);
      setErrors([error instanceof Error ? error.message : 'Failed to submit issue. Please try again.']);
    }
  };

  return (
    <div className="report-issue-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Report Water Issue</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {submitSuccess && (
          <div className="success-message" style={{ 
            padding: '1rem', 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            ✓ Issue submitted successfully! Thank you for your report.
          </div>
        )}

        {errors.length > 0 && (
          <div className="error-messages">
            {errors.map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="issue-form">
          <div className="form-group">
            <label htmlFor="issueType" className="form-label">
              Issue Type *
            </label>
            <select
              id="issueType"
              className="form-select"
              value={formData.issueType}
              onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
              required
            >
              <option value="">Select an issue type</option>
              {issueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority" className="form-label">
              Priority
            </label>
            <div className="priority-buttons">
              {(['Low', 'Medium', 'High', 'Urgent'] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={`priority-btn priority-${priority.toLowerCase()} ${
                    formData.priority === priority ? 'active' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, priority })}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location" className="form-label">
              Location/Address *
            </label>
            <input
              type="text"
              id="location"
              className="form-input"
              placeholder="Enter your address or location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description *
            </label>
            <textarea
              id="description"
              className="form-textarea"
              placeholder="Please describe the issue in detail..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactEmail" className="form-label">
                Contact Email (Optional)
              </label>
              <input
                type="email"
                id="contactEmail"
                className="form-input"
                placeholder="your@email.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone" className="form-label">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                id="contactPhone"
                className="form-input"
                placeholder="+1234567890"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportIssueForm;

