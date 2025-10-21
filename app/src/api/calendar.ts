// Copilot: Calendar API layer for seasonality/holidays/events management
import { apiClient } from './client';

// Seasonal Profiles Types
export interface SeasonalProfile {
  id: string;
  business_id: string;
  name: string;
  profile_type: 'weekly' | 'monthly' | 'seasonal' | 'holiday';
  multiplier_data: Record<string, number>; // 24-hour multiplier data: {"00": 1.0, "01": 1.2, ...}
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonalProfileData {
  name: string;
  profile_type: 'weekly' | 'monthly' | 'seasonal' | 'holiday';
  multiplier_data: Record<string, number>;
  is_active?: boolean;
  priority?: number;
}

export interface UpdateSeasonalProfileData {
  name?: string;
  profile_type?: 'weekly' | 'monthly' | 'seasonal' | 'holiday';
  multiplier_data?: Record<string, number>;
  is_active?: boolean;
  priority?: number;
}

// Calendar Overrides Types
export interface CalendarOverride {
  id: string;
  business_id: string;
  date: string; // ISO date string
  override_type: 'holiday' | 'closure' | 'special_hours' | 'high_demand';
  multiplier?: number;
  custom_hours?: Record<string, any>;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarOverrideData {
  date: string;
  override_type: 'holiday' | 'closure' | 'special_hours' | 'high_demand';
  multiplier?: number;
  custom_hours?: Record<string, any>;
  description: string;
  is_active?: boolean;
}

export interface UpdateCalendarOverrideData {
  date?: string;
  override_type?: 'holiday' | 'closure' | 'special_hours' | 'high_demand';
  multiplier?: number;
  custom_hours?: Record<string, any>;
  description?: string;
  is_active?: boolean;
}

// Business Events Types
export interface BusinessEvent {
  id: string;
  business_id: string;
  name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  expected_impact?: number;
  description?: string;
  location?: string;
  is_recurring: boolean;
  recurrence_pattern?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessEventData {
  name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  expected_impact?: number;
  description?: string;
  location?: string;
  is_recurring?: boolean;
  recurrence_pattern?: Record<string, any>;
}

export interface UpdateBusinessEventData {
  name?: string;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  expected_impact?: number;
  description?: string;
  location?: string;
  is_recurring?: boolean;
  recurrence_pattern?: Record<string, any>;
}

// Seasonal Profiles API
export const seasonalProfilesApi = {
  async getAll(businessId: string, page = 1, pageSize = 100): Promise<SeasonalProfile[]> {
    const response = await apiClient.get<SeasonalProfile[]>(`/api/seasonal-profiles?business_id=${businessId}&page=${page}&page_size=${pageSize}`);
    return response;
  },

  async create(businessId: string, data: CreateSeasonalProfileData): Promise<SeasonalProfile> {
    const response = await apiClient.post<SeasonalProfile>(`/api/seasonal-profiles?business_id=${businessId}`, data);
    return response;
  },

  async update(id: string, data: UpdateSeasonalProfileData): Promise<SeasonalProfile> {
    const response = await apiClient.put<SeasonalProfile>(`/api/seasonal-profiles/${id}`, data);
    return response;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/seasonal-profiles/${id}`);
  }
};

// Calendar Overrides API
export const calendarOverridesApi = {
  async getAll(
    businessId: string, 
    options: {
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<CalendarOverride[]> {
    const params = new URLSearchParams({ business_id: businessId });
    
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);
    if (options.page) params.append('page', options.page.toString());
    if (options.pageSize) params.append('page_size', options.pageSize.toString());
    
    const response = await apiClient.get<CalendarOverride[]>(`/api/calendar-overrides?${params}`);
    return response;
  },

  async create(businessId: string, data: CreateCalendarOverrideData): Promise<CalendarOverride> {
    const response = await apiClient.post<CalendarOverride>(`/api/calendar-overrides?business_id=${businessId}`, data);
    return response;
  },

  async update(id: string, data: UpdateCalendarOverrideData): Promise<CalendarOverride> {
    const response = await apiClient.put<CalendarOverride>(`/api/calendar-overrides/${id}`, data);
    return response;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/calendar-overrides/${id}`);
  }
};

// Business Events API
export const businessEventsApi = {
  async getAll(
    businessId: string, 
    options: {
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<BusinessEvent[]> {
    const params = new URLSearchParams({ business_id: businessId });
    
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);
    if (options.page) params.append('page', options.page.toString());
    if (options.pageSize) params.append('page_size', options.pageSize.toString());
    
    const response = await apiClient.get<BusinessEvent[]>(`/api/business-events?${params}`);
    return response;
  },

  async create(businessId: string, data: CreateBusinessEventData): Promise<BusinessEvent> {
    const response = await apiClient.post<BusinessEvent>(`/api/business-events?business_id=${businessId}`, data);
    return response;
  },

  async update(id: string, data: UpdateBusinessEventData): Promise<BusinessEvent> {
    const response = await apiClient.put<BusinessEvent>(`/api/business-events/${id}`, data);
    return response;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/business-events/${id}`);
  }
};
