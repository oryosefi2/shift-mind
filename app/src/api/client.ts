// Copilot: create a typed fetch wrapper using VITE_API_URL, JSON requests/responses, and throw on !ok with Hebrew error messages.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';

export interface ApiError extends Error {
  status: number;
  data?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    let data: any;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(this.getErrorMessage(response.status, data)) as ApiError;
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  private getErrorMessage(status: number, data: any): string {
    // Extract error message from response data if available
    const serverMessage = data?.detail || data?.message || data?.error;
    
    switch (status) {
      case 400:
        return serverMessage || 'בקשה לא תקינה';
      case 401:
        return 'נדרשת הזדהות מחדש';
      case 403:
        return 'אין הרשאה לביצוע הפעולה';
      case 404:
        return serverMessage || 'הרשומה לא נמצאה';
      case 409:
        return serverMessage || 'קיים קונפליקט במידע';
      case 422:
        return serverMessage || 'נתונים לא תקינים';
      case 500:
        return 'שגיאה פנימית בשרת';
      case 502:
        return 'השרת אינו זמין';
      case 503:
        return 'השירות אינו זמין כעת';
      default:
        return serverMessage || `שגיאה לא צפויה (${status})`;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(BASE_URL);
