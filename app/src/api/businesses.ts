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
    const businesses = await apiClient.get<Business[]>('/businesses', { 
      business_id: businessId 
    });
    
    if (!businesses || businesses.length === 0) {
      throw new Error('העסק לא נמצא');
    }
    
    return businesses[0];
  },

  async updateBusiness(businessId: string, payload: BusinessUpdatePayload): Promise<Business> {
    return apiClient.patch<Business>(`/businesses/${businessId}`, payload);
  },

  async listBusinesses(params?: { page?: number; page_size?: number }): Promise<Business[]> {
    return apiClient.get<Business[]>('/businesses', params);
  }
};
