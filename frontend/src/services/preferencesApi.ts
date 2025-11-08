const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserPreferences {
  id: number;
  userId: string;
  email: string;
  waterQualityAlerts: boolean;
  systemUpdates: boolean;
  maintenanceNotices: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  updatedAt: string;
}

export interface PreferencesUpdate {
  waterQualityAlerts?: boolean;
  systemUpdates?: boolean;
  maintenanceNotices?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
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

export const preferencesApi = {
  getPreferences: async (userId: string): Promise<UserPreferences | null> => {
    return fetchApi<UserPreferences | null>(`/api/public/preferences?userId=${encodeURIComponent(userId)}`);
  },

  savePreferences: async (
    userId: string,
    email: string,
    preferences: PreferencesUpdate
  ): Promise<UserPreferences> => {
    const response = await fetch(`${API_BASE_URL}/api/public/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, email, preferences }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to save preferences: ${response.statusText}`);
    }

    const result: ApiResponse<UserPreferences> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to save preferences');
    }

    return result.data;
  },
};

