// Copilot: CRUD for employees scoped by businessId.
// list({ businessId, page, pageSize, search }), create(businessId, data), update(id, data), remove(id).
// Support query params for pagination & search. Use client.ts.

import { apiClient } from './client';

export interface Employee {
  id: string;
  business_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hire_date?: string;
  hourly_rate?: number;
  role: 'employee' | 'manager';
  status: 'active' | 'inactive' | 'terminated';
  skills?: string[];
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreatePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hire_date?: string;
  hourly_rate?: number;
  role: 'employee' | 'manager';
  skills?: string[];
  preferences?: Record<string, any>;
}

export interface EmployeeUpdatePayload extends Partial<EmployeeCreatePayload> {
  status?: 'active' | 'inactive' | 'terminated';
}

export interface EmployeeListParams {
  businessId: string;
  page?: number;
  page_size?: number;
  search?: string;
  role?: 'employee' | 'manager';
  status?: 'active' | 'inactive' | 'terminated';
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const employeeApi = {
  async list(params: EmployeeListParams): Promise<EmployeeListResponse> {
    const queryParams = {
      business_id: params.businessId,
      page: params.page,
      page_size: params.page_size,
      search: params.search,
      role: params.role,
      status: params.status,
    };

    const response = await apiClient.get<Employee[]>('/employees', queryParams);
    
    // If API returns paginated response, use it; otherwise create a simple response
    if (Array.isArray(response)) {
      return {
        employees: response,
        total: response.length,
        page: params.page || 1,
        page_size: params.page_size || 10,
        total_pages: Math.ceil(response.length / (params.page_size || 10)),
      };
    }
    
    return response as EmployeeListResponse;
  },

  async create(businessId: string, data: EmployeeCreatePayload): Promise<Employee> {
    return apiClient.post<Employee>('/employees', {
      ...data,
      business_id: businessId,
    });
  },

  async getById(id: string): Promise<Employee> {
    return apiClient.get<Employee>(`/employees/${id}`);
  },

  async update(id: string, data: EmployeeUpdatePayload): Promise<Employee> {
    return apiClient.patch<Employee>(`/employees/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/employees/${id}`);
  },
};
