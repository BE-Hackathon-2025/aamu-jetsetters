import { useState, useMemo, useEffect } from 'react';
import './LogViewer.css';

interface LogEntry {
  id: string;
  timestamp: string;
  component: string;
  eventType: string;
  message: string;
  severity: 'Info' | 'Warning' | 'Error';
}

interface LogViewerProps {
  logs?: LogEntry[];
  loading?: boolean;
}

const LOGS_PER_PAGE = 25;

function LogViewer({ logs: initialLogs, loading = false }: LogViewerProps) {
  const [componentFilter, setComponentFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLogs = useMemo(() => {
    if (!initialLogs) return [];
    let filtered = [...initialLogs];
    
    if (componentFilter) {
      filtered = filtered.filter((log) =>
        log.component.toLowerCase().includes(componentFilter.toLowerCase())
      );
    }
    
    if (severityFilter) {
      filtered = filtered.filter((log) =>
        log.severity.toLowerCase() === severityFilter.toLowerCase()
      );
    }
    
    return filtered;
  }, [initialLogs, componentFilter, severityFilter]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
  const endIndex = startIndex + LOGS_PER_PAGE;
  const logs = filteredLogs.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return timestamp;
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cyber Log Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #1a1a1a; color: white; padding: 12px; text-align: left; border: 1px solid #333; }
            td { padding: 10px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .severity-info { color: #3b82f6; font-weight: bold; }
            .severity-warning { color: #f59e0b; font-weight: bold; }
            .severity-error { color: #ef4444; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Cyber Log Report</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Logs:</strong> ${filteredLogs.length}</p>
          <p><strong>Filters:</strong> ${componentFilter ? `Component: ${componentFilter}` : ''} ${severityFilter ? `Severity: ${severityFilter}` : ''}</p>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Component</th>
                <th>Event Type</th>
                <th>Message</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.map((log) => `
                <tr>
                  <td>${formatTimestamp(log.timestamp)}</td>
                  <td>${log.component}</td>
                  <td>${log.eventType}</td>
                  <td>${log.message}</td>
                  <td class="severity-${log.severity.toLowerCase()}">${log.severity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Water System Cyber Defense - Operator Dashboard</p>
            <p>This is an automated report generated from the system logs.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="log-viewer">
      <div className="log-viewer-header">
        <h3 className="log-viewer-title">Cyber Log Viewer</h3>
        <button className="export-pdf-btn" onClick={handleExportPDF} disabled={filteredLogs.length === 0}>
          Export to PDF
        </button>
      </div>
      
      <div className="log-filters">
        <input
          type="text"
          className="filter-input"
          placeholder="Filter component..."
          value={componentFilter}
          onChange={(e) => {
            setComponentFilter(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="filter-input"
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="log-table-container">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>No logs found</div>
        ) : (
          <>
            <table className="log-table">
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>COMPONENT</th>
                  <th>EVENT TYPE</th>
                  <th>MESSAGE</th>
                  <th>SEVERITY</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="log-timestamp">{formatTimestamp(log.timestamp)}</td>
                    <td className="log-component">{log.component}</td>
                    <td className="log-event-type">{log.eventType}</td>
                    <td className="log-message">{log.message}</td>
                    <td>
                      <span className={`severity-badge severity-${log.severity.toLowerCase()}`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="log-pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages} ({filteredLogs.length} total logs)
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LogViewer;

