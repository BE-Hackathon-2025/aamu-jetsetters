const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface Notification {
  id: number;
  type: 'water-quality';
  title: string;
  message: string;
  riskLevel: 'stable' | 'low' | 'moderate' | 'high' | 'critical';
  previousRiskLevel: 'stable' | 'low' | 'moderate' | 'high' | 'critical' | null;
  read: boolean;
  createdAt: string;
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

export const notificationsApi = {
  getAllNotifications: async (limit: number = 50): Promise<Notification[]> => {
    return fetchApi<Notification[]>(`/api/public/notifications?limit=${limit}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const result = fetchApi<{ count: number }>('/api/public/notifications/unread-count');
    return (await result).count;
  },

  getNotificationById: async (id: number): Promise<Notification> => {
    return fetchApi<Notification>(`/api/public/notifications/${id}`);
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await fetch(`${API_BASE_URL}/api/public/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to mark notification as read: ${response.statusText}`);
    }

    const result: ApiResponse<Notification> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to mark notification as read');
    }

    return result.data;
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await fetch(`${API_BASE_URL}/api/public/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to mark all as read: ${response.statusText}`);
    }

    const result: ApiResponse<{ count: number }> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to mark all as read');
    }

    return result.data.count;
  },

  deleteNotification: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/public/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete notification: ${response.statusText}`);
    }
  },

  registerEmail: async (email: string, userId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/public/register-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to register email: ${response.statusText}`);
    }
  },
};

