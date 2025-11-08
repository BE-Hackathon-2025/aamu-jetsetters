import type { CommunityIssue } from '../services/issuesApi';

export interface Report {
  id: string;
  reportedBy: string;
  email: string;
  issueType: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  location: string;
  description: string;
  dateReported: string;
  status: 'New' | 'In Review' | 'Resolved' | 'Closed';
  backendId: number;
}

export function mapBackendIssueToReport(issue: CommunityIssue): Report {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleString('en-US', options);
  };

  const getReportedBy = (email?: string): string => {
    if (!email) return 'Anonymous';
    const namePart = email.split('@')[0];
    return namePart
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Anonymous';
  };

  const mapPriority = (priority: string): 'Low' | 'Medium' | 'High' | 'Critical' => {
    if (priority === 'Urgent') return 'Critical';
    return priority as 'Low' | 'Medium' | 'High';
  };

  const mapStatus = (status: string): 'New' | 'In Review' | 'Resolved' | 'Closed' => {
    switch (status) {
      case 'new':
        return 'New';
      case 'acknowledged':
        return 'In Review';
      case 'resolved':
        return 'Resolved';
      default:
        return 'New';
    }
  };

  return {
    id: `RPT-${String(issue.id).padStart(3, '0')}`,
    reportedBy: getReportedBy(issue.contactEmail),
    email: issue.contactEmail || 'No email provided',
    issueType: issue.issueType,
    priority: mapPriority(issue.priority),
    location: issue.location,
    description: issue.description,
    dateReported: formatDate(issue.createdAt),
    status: mapStatus(issue.status),
    backendId: issue.id,
  };
}

export function mapFrontendStatusToBackend(status: 'New' | 'In Review' | 'Resolved' | 'Closed'): 'new' | 'acknowledged' | 'resolved' {
  switch (status) {
    case 'New':
      return 'new';
    case 'In Review':
      return 'acknowledged';
    case 'Resolved':
    case 'Closed':
      return 'resolved';
    default:
      return 'new';
  }
}

