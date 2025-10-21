// Copilot: CRUD for availability scoped by businessId.
// Fields: employee_id, day_of_week (0-6), start_time (HH:mm), end_time (HH:mm), is_available (boolean).
// list supports filters by employee_id/day_of_week.

import { apiClient } from './client';

export interface Availability {
  id: string;
  business_id: string;
  employee_id: string;
  day_of_week: number; // 0-6, 0=Sunday
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_available: boolean;
  effective_from?: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityCreatePayload {
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  effective_from?: string;
  effective_until?: string;
}

export interface AvailabilityUpdatePayload extends Partial<AvailabilityCreatePayload> {}

export interface AvailabilityListParams {
  businessId: string;
  employee_id?: string;
  day_of_week?: number;
  page?: number;
  page_size?: number;
}

export interface AvailabilityListResponse {
  availability: Availability[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const availabilityApi = {
  async list(params: AvailabilityListParams): Promise<AvailabilityListResponse> {
    const queryParams = {
      business_id: params.businessId,
      employee_id: params.employee_id,
      day_of_week: params.day_of_week,
      page: params.page,
      page_size: params.page_size,
    };

    const response = await apiClient.get<Availability[]>('/availability', queryParams);
    
    // If API returns paginated response, use it; otherwise create a simple response
    if (Array.isArray(response)) {
      return {
        availability: response,
        total: response.length,
        page: params.page || 1,
        page_size: params.page_size || 10,
        total_pages: Math.ceil(response.length / (params.page_size || 10)),
      };
    }
    
    return response as AvailabilityListResponse;
  },

  async create(businessId: string, data: AvailabilityCreatePayload): Promise<Availability> {
    return apiClient.post<Availability>('/availability', {
      ...data,
      business_id: businessId,
    });
  },

  async getById(id: string): Promise<Availability> {
    return apiClient.get<Availability>(`/availability/${id}`);
  },

  async update(id: string, data: AvailabilityUpdatePayload): Promise<Availability> {
    return apiClient.patch<Availability>(`/availability/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/availability/${id}`);
  },
};
