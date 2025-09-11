import { httpClient, API_CONFIG } from './httpClient';

// Expense Article Role Assignment types
export interface ExpenseArticleRoleAssignment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role_id: string;
  role_name: string;
  role_code: string;
  expense_article_id: string;
  expense_article_name: string;
  expense_article_code: string;
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ExpenseArticleRoleAssignmentCreate {
  user_id: string;
  role_id: string;
  expense_article_id: string;
  valid_from: string;
  valid_to?: string;
}

export interface ExpenseArticleRoleAssignmentUpdate {
  valid_from?: string;
  valid_to?: string;
  is_active?: boolean;
}

export interface ExpenseArticleRoleAssignmentSearchParams {
  user_id?: string;
  role_id?: string;
  expense_article_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface ExpenseArticleRoleAssignmentStatistics {
  total_assignments: number;
  active_assignments: number;
  users_with_assignments: number;
  articles_with_assignments: number;
  roles_in_use: number;
}

export interface UserExpenseArticleAssignment {
  user_id: string;
  user_name: string;
  user_email: string;
  assignments: {
    expense_article_id: string;
    expense_article_name: string;
    expense_article_code: string;
    role_id: string;
    role_name: string;
    role_code: string;
    valid_from: string;
    valid_to?: string;
    is_active: boolean;
  }[];
}

export interface ExpenseArticleUserAssignment {
  expense_article_id: string;
  expense_article_name: string;
  expense_article_code: string;
  assignments: {
    user_id: string;
    user_name: string;
    user_email: string;
    role_id: string;
    role_name: string;
    role_code: string;
    valid_from: string;
    valid_to?: string;
    is_active: boolean;
  }[];
}

class ExpenseArticleRoleService {
  private static instance: ExpenseArticleRoleService;

  public static getInstance(): ExpenseArticleRoleService {
    if (!ExpenseArticleRoleService.instance) {
      ExpenseArticleRoleService.instance = new ExpenseArticleRoleService();
    }
    return ExpenseArticleRoleService.instance;
  }

  // Get all expense article role assignments
  async getAssignments(params?: ExpenseArticleRoleAssignmentSearchParams): Promise<ExpenseArticleRoleAssignment[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.role_id) queryParams.append('role_id', params.role_id);
    if (params?.expense_article_id) queryParams.append('expense_article_id', params.expense_article_id);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.get(`${baseUrl}/api/v1/expense-article-roles?${queryParams.toString()}`);
    return response.data;
  }

  // Get assignment by ID
  async getAssignment(id: string): Promise<ExpenseArticleRoleAssignment> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.get(`${baseUrl}/api/v1/expense-article-roles/${id}`);
    return response.data;
  }

  // Create new assignment
  async createAssignment(data: ExpenseArticleRoleAssignmentCreate): Promise<ExpenseArticleRoleAssignment> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.post(`${baseUrl}/api/v1/expense-article-roles`, data);
    return response.data;
  }

  // Update assignment
  async updateAssignment(id: string, data: ExpenseArticleRoleAssignmentUpdate): Promise<ExpenseArticleRoleAssignment> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.put(`${baseUrl}/api/v1/expense-article-roles/${id}`, data);
    return response.data;
  }

  // Delete assignment
  async deleteAssignment(id: string): Promise<void> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    await httpClient.delete(`${baseUrl}/api/v1/expense-article-roles/${id}`);
  }

  // Bulk create assignments
  async bulkCreateAssignments(assignments: ExpenseArticleRoleAssignmentCreate[]): Promise<ExpenseArticleRoleAssignment[]> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.post(`${baseUrl}/api/v1/expense-article-roles/bulk`, {
      assignments
    });
    return response.data;
  }

  // Bulk update assignments
  async bulkUpdateAssignments(assignments: { id: string; data: ExpenseArticleRoleAssignmentUpdate }[]): Promise<ExpenseArticleRoleAssignment[]> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.put(`${baseUrl}/api/v1/expense-article-roles/bulk`, {
      assignments
    });
    return response.data;
  }

  // Bulk delete assignments
  async bulkDeleteAssignments(ids: string[]): Promise<void> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    await httpClient.delete(`${baseUrl}/api/v1/expense-article-roles/bulk`, {
      data: { ids }
    });
  }

  // Get assignments by user
  async getAssignmentsByUser(userId: string): Promise<UserExpenseArticleAssignment> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.get(`${baseUrl}/api/v1/expense-article-roles/user/${userId}`);
    return response.data;
  }

  // Get assignments by expense article
  async getAssignmentsByExpenseArticle(expenseArticleId: string): Promise<ExpenseArticleUserAssignment> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    console.log('API_CONFIG.baseUrl:', API_CONFIG.baseUrl);
    console.log('Using baseUrl:', baseUrl);
    const response = await httpClient.get(`${baseUrl}/api/v1/expense-article-roles/expense-article/${expenseArticleId}`);
    return response.data;
  }

  // Get statistics
  async getStatistics(): Promise<ExpenseArticleRoleAssignmentStatistics> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.get(`${baseUrl}/api/v1/expense-article-roles/statistics`);
    return response.data;
  }

  // Get user assignments for expense article (for role-based access)
  async getUserAssignmentsForArticle(expenseArticleId: string, userId: string): Promise<ExpenseArticleRoleAssignment[]> {
    const baseUrl = API_CONFIG.baseUrl || 'http://localhost:8000';
    const response = await httpClient.get(`${baseUrl}/api/v1/expense-article-roles/user/${userId}/article/${expenseArticleId}`);
    return response.data;
  }

  // Check if user has access to expense article
  async checkUserAccess(expenseArticleId: string, userId: string): Promise<boolean> {
    try {
      const assignments = await this.getUserAssignmentsForArticle(expenseArticleId, userId);
      return assignments.some(assignment => assignment.is_active);
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  }
}

export const expenseArticleRoleService = ExpenseArticleRoleService.getInstance();