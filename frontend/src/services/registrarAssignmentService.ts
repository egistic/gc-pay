import { httpClient } from './httpClient';

export interface RegistrarAssignment {
  id: string;
  request_id: string;
  registrar_id: string;
  assigned_sub_registrar_id?: string;
  expense_article_id?: string;
  assigned_amount?: number;
  registrar_comments?: string;
  classification_date: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrarAssignmentCreate {
  request_id: string;
  assigned_sub_registrar_id?: string;
  expense_article_id?: string;
  assigned_amount?: number;
  registrar_comments?: string;
}

export interface RegistrarAssignmentUpdate {
  assigned_sub_registrar_id?: string;
  expense_article_id?: string;
  assigned_amount?: number;
  registrar_comments?: string;
}

export interface RegistrarAssignmentListResponse {
  assignments: RegistrarAssignment[];
  total: number;
  skip: number;
  limit: number;
}

export class RegistrarAssignmentService {
  /**
   * Get registrar assignment by request ID
   */
  static async getRegistrarAssignment(requestId: string): Promise<RegistrarAssignment> {
    return httpClient.get(`/api/v1/registrar-assignments/${requestId}`);
  }

  /**
   * Create registrar assignment
   */
  static async createRegistrarAssignment(data: RegistrarAssignmentCreate): Promise<RegistrarAssignment> {
    return httpClient.post('/api/v1/registrar-assignments/', data);
  }

  /**
   * Update registrar assignment
   */
  static async updateRegistrarAssignment(requestId: string, data: RegistrarAssignmentUpdate): Promise<RegistrarAssignment> {
    return httpClient.put(`/api/v1/registrar-assignments/${requestId}`, data);
  }

  /**
   * List registrar assignments
   */
  static async listRegistrarAssignments(params?: {
    skip?: number;
    limit?: number;
    request_id?: string;
    registrar_id?: string;
    assigned_sub_registrar_id?: string;
  }): Promise<RegistrarAssignmentListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.request_id) queryParams.append('request_id', params.request_id);
    if (params?.registrar_id) queryParams.append('registrar_id', params.registrar_id);
    if (params?.assigned_sub_registrar_id) queryParams.append('assigned_sub_registrar_id', params.assigned_sub_registrar_id);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/v1/registrar-assignments/?${queryString}` : '/api/v1/registrar-assignments/';
    
    return httpClient.get(url);
  }

  /**
   * Create or update registrar assignment (upsert)
   */
  static async upsertRegistrarAssignment(data: RegistrarAssignmentCreate): Promise<RegistrarAssignment> {
    try {
      // Try to get existing assignment
      const existing = await this.getRegistrarAssignment(data.request_id);
      
      // If exists, update it
      const updateData: RegistrarAssignmentUpdate = {
        assigned_sub_registrar_id: data.assigned_sub_registrar_id,
        expense_article_id: data.expense_article_id,
        assigned_amount: data.assigned_amount,
        registrar_comments: data.registrar_comments,
      };
      
      return this.updateRegistrarAssignment(data.request_id, updateData);
    } catch (error: any) {
      // If not found (404) or any other error, create new assignment
      if (error?.message?.includes('404') || error?.status === 404 || error?.response?.status === 404) {
        return this.createRegistrarAssignment(data);
      }
      // Re-throw other errors
      throw error;
    }
  }
}
