// Copilot: functions getBusiness(businessId) and updateBusiness(businessId, payload).
// Payload fields: timezone (string), week_start (0-6), open_hours (JSON object).
// Use client.ts wrapper and append businessId to requests if needed.

import { apiClient } from './client';

export interface Business {
  id: string;
  name: string;
  industry?: string;
  timezone: string;
  week_start?: number;
  open_hours?: Record<string, any>;
  address?: Record<string, any>;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BusinessUpdatePayload {
  timezone?: string;
  week_start?: number;
  open_hours?: Record<string, any>;
  name?: string;
  industry?: string;
  address?: Record<string, any>;
  settings?: Record<string, any>;
}

export const businessApi = {
  async getBusiness(businessId: string): Promise<Business> {
    try {
      const businesses = await apiClient.get<Business[]>('/businesses', { 
        business_id: businessId 
      });
      
      if (!businesses || businesses.length === 0) {
        const error = new Error('העסק לא נמצא') as any;
        error.status = 404;
        throw error;
      }
      
      return businesses[0];
    } catch (error: any) {
      // If it's already an API error with status, re-throw it
      if (error.status) {
        throw error;
      }
      // Otherwise create a 404 error
      const notFoundError = new Error('העסק לא נמצא') as any;
      notFoundError.status = 404;
      throw notFoundError;
    }
  },

  async createBusiness(payload: { name: string; industry?: string; timezone: string }): Promise<Business> {
    return apiClient.post<Business>('/businesses', payload);
  },

  async updateBusiness(businessId: string, payload: BusinessUpdatePayload): Promise<Business> {
    return apiClient.put<Business>(`/businesses/${businessId}`, payload);
  },

  async listBusinesses(params?: { page?: number; page_size?: number }): Promise<Business[]> {
    return apiClient.get<Business[]>('/businesses', params);
  }
};
