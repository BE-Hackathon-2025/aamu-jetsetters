import { useState, useEffect } from 'react';
import { issuesApi } from '../../services/issuesApi';
import { mapBackendIssueToReport, mapFrontendStatusToBackend, type Report } from '../../utils/issuesMapper';
import './CommunityReports.css';

function CommunityReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendStatus = filterStatus !== 'All' 
        ? (filterStatus === 'New' ? 'new' : filterStatus === 'In Review' ? 'acknowledged' : 'resolved')
        : undefined;
      const backendPriority = filterPriority !== 'All' && filterPriority !== 'Critical'
        ? filterPriority
        : filterPriority === 'Critical' ? 'Urgent' : undefined;

      const issues = await issuesApi.getAllIssues(backendStatus, backendPriority);
      const mappedReports = issues.map(mapBackendIssueToReport);
      setReports(mappedReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus, filterPriority]);

  const filteredReports = reports.filter((report) => {
    if (filterStatus !== 'All' && report.status !== filterStatus) return false;
    if (filterPriority !== 'All' && report.priority !== filterPriority) return false;
    return true;
  });

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Community Reports - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .priority-high { color: #d32f2f; }
            .priority-medium { color: #f57c00; }
            .priority-low { color: #388e3c; }
          </style>
        </head>
        <body>
          <h1>Community Reports</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Issue Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Location</th>
                <th>Date Reported</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map(report => `
                <tr>
                  <td>${report.id}</td>
                  <td>${report.issueType}</td>
                  <td class="priority-${report.priority.toLowerCase()}">${report.priority}</td>
                  <td>${report.status}</td>
                  <td>${report.location}</td>
                  <td>${report.dateReported}</td>
                  <td>${report.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleMarkAsClosed = async (report: Report) => {
    try {
      const backendStatus = mapFrontendStatusToBackend('Resolved');
      await issuesApi.updateIssueStatus(report.backendId, backendStatus);
      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'priority-critical';
      case 'High':
        return 'priority-high';
      case 'Medium':
        return 'priority-medium';
      case 'Low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'status-new';
      case 'In Review':
        return 'status-review';
      case 'Resolved':
        return 'status-resolved';
      case 'Closed':
        return 'status-closed';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-page">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#d32f2f' }}>
          Error: {error}
          <button onClick={fetchReports} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
            <div className="reports-header">
              <div className="reports-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Reports</span>
                  <span className="stat-value">{reports.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">New</span>
                  <span className="stat-value stat-new">{reports.filter(r => r.status === 'New').length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">In Review</span>
                  <span className="stat-value stat-review">{reports.filter(r => r.status === 'In Review').length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Resolved</span>
                  <span className="stat-value stat-resolved">{reports.filter(r => r.status === 'Resolved').length}</span>
                </div>
              </div>
              
              <button className="download-btn" onClick={handleDownloadPDF}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download PDF</span>
              </button>
            </div>

            <div className="reports-filters">
              <div className="filter-group">
                <label className="filter-label">Status:</label>
                <select 
                  className="filter-select" 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="New">New</option>
                  <option value="In Review">In Review</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Priority:</label>
                <select 
                  className="filter-select"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <div className="filter-results">
                Showing {filteredReports.length} of {reports.length} reports
              </div>
            </div>

            <div className="reports-list">
              {filteredReports.length === 0 ? (
                <div className="no-reports">
                  <p>No reports found matching your filters.</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <div className="report-id">{report.id}</div>
                      <div className="report-meta">
                        <span className={`priority-badge ${getPriorityColor(report.priority)}`}>
                          {report.priority}
                        </span>
                        <span className={`status-badge ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="report-content">
                      <div className="report-info-row">
                        <div className="info-item">
                          <span className="info-label">Reported By:</span>
                          <span className="info-value">{report.reportedBy}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Email:</span>
                          <span className="info-value">{report.email}</span>
                        </div>
                      </div>
                      
                      <div className="report-info-row">
                        <div className="info-item">
                          <span className="info-label">Issue Type:</span>
                          <span className="info-value">{report.issueType}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Location:</span>
                          <span className="info-value">{report.location}</span>
                        </div>
                      </div>
                      
                      <div className="report-info-row">
                        <div className="info-item full-width">
                          <span className="info-label">Date Reported:</span>
                          <span className="info-value">{report.dateReported}</span>
                        </div>
                      </div>
                      
                      <div className="report-description">
                        <span className="description-label">Description:</span>
                        <p className="description-text">{report.description}</p>
                      </div>
                    </div>
                    
                    {report.status !== 'Resolved' && report.status !== 'Closed' && (
                      <div className="report-actions">
                        <button 
                          className="action-btn close-btn"
                          onClick={() => handleMarkAsClosed(report)}
                        >
                          Mark as Resolved
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
  );
}

export default CommunityReports;

