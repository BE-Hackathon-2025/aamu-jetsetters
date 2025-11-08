const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  questions: FAQItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/public${endpoint}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

export const faqApi = {
  getAllFAQs: async (): Promise<{ categories: FAQCategory[]; count: number }> => {
    return fetchApi<{ categories: FAQCategory[]; count: number }>('/faq');
  },

  getFAQByCategory: async (categoryId: string): Promise<FAQCategory> => {
    return fetchApi<FAQCategory>(`/faq?category=${categoryId}`);
  },

  searchFAQs: async (searchTerm: string): Promise<{ searchTerm: string; results: FAQItem[]; count: number }> => {
    return fetchApi<{ searchTerm: string; results: FAQItem[]; count: number }>(`/faq?search=${encodeURIComponent(searchTerm)}`);
  },
};

