// Copilot: CRUD for budgets scoped by businessId.
// Fields: budget_type, amount, currency, period_start, period_end, department.
// list supports pagination and filter by period range.

import { apiClient } from './client';

export interface Budget {
  id: string;
  business_id: string;
  name: string;
  budget_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  period_start: string; // Date string
  period_end: string; // Date string
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreatePayload {
  name: string;
  budget_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  period_start: string;
  period_end: string;
  department?: string;
  is_active?: boolean;
}

export interface BudgetUpdatePayload extends Partial<BudgetCreatePayload> {}

export interface BudgetListParams {
  businessId: string;
  page?: number;
  page_size?: number;
  from?: string; // period_start filter
  to?: string; // period_end filter
  budget_type?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  department?: string;
  is_active?: boolean;
}

export interface BudgetListResponse {
  budgets: Budget[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const budgetApi = {
  async list(params: BudgetListParams): Promise<BudgetListResponse> {
    const queryParams = {
      business_id: params.businessId,
      page: params.page,
      page_size: params.page_size,
      from: params.from,
      to: params.to,
      budget_type: params.budget_type,
      department: params.department,
      is_active: params.is_active,
    };

    const response = await apiClient.get<Budget[]>('/budgets', queryParams);
    
    // If API returns paginated response, use it; otherwise create a simple response
    if (Array.isArray(response)) {
      return {
        budgets: response,
        total: response.length,
        page: params.page || 1,
        page_size: params.page_size || 10,
        total_pages: Math.ceil(response.length / (params.page_size || 10)),
      };
    }
    
    return response as BudgetListResponse;
  },

  async create(businessId: string, data: BudgetCreatePayload): Promise<Budget> {
    return apiClient.post<Budget>('/budgets', {
      ...data,
      business_id: businessId,
    });
  },

  async getById(id: string): Promise<Budget> {
    return apiClient.get<Budget>(`/budgets/${id}`);
  },

  async update(id: string, data: BudgetUpdatePayload): Promise<Budget> {
    return apiClient.patch<Budget>(`/budgets/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/budgets/${id}`);
  },
};
