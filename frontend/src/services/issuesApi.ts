const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface CommunityIssue {
  id: number;
  issueType: string;
  description: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  contactEmail?: string;
  contactPhone?: string;
  status: 'new' | 'acknowledged' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface SubmitIssueRequest {
  issueType: string;
  description: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  contactEmail?: string;
  contactPhone?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

export const issuesApi = {
  submitIssue: async (issueData: SubmitIssueRequest): Promise<CommunityIssue> => {
    const response = await fetch(`${API_BASE_URL}/api/public/report-issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(issueData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to submit issue: ${response.statusText}`);
    }

    const result: ApiResponse<CommunityIssue> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to submit issue');
    }

    return result.data;
  },

  getAllIssues: async (status?: string, priority?: string): Promise<CommunityIssue[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<CommunityIssue[]>(`/api/admin/issues${query}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const result = await fetchApi<{ count: number }>('/api/admin/issues/unread-count');
    return result.count;
  },

  getIssueById: async (id: number): Promise<CommunityIssue> => {
    return fetchApi<CommunityIssue>(`/api/admin/issues/${id}`);
  },

  updateIssueStatus: async (id: number, status: 'new' | 'acknowledged' | 'resolved'): Promise<CommunityIssue> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/issues/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update issue: ${response.statusText}`);
    }

    const result: ApiResponse<CommunityIssue> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update issue');
    }

    return result.data;
  },
};

