import { User, UserRole } from '../types';
import { httpClient, API_CONFIG } from './httpClient';

// Extended types for admin functionality
export interface UserWithRoles {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  roles: RoleOut[];
  created_at: string;
  updated_at?: string;
}

export interface RoleOut {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserSearchParams {
  query?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface UserCreate {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  roles?: UserRoleAssign[];
}

export interface UserUpdate {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UserRoleAssign {
  role_id: string;
  valid_from: string;
  valid_to?: string;
  is_primary?: boolean;
}

export class UserService {
  static async getCurrentUser(): Promise<User> {
    try {
      // Use the real API endpoint for current user
      const user = await httpClient.get<User>(API_CONFIG.endpoints.getCurrentUser);
      return user;
    } catch (error) {
      console.error('Failed to load current user:', error);
      throw new Error('Unable to load current user. Please log in again.');
    }
  }
  
  static async getUsers(): Promise<User[]> {
    return httpClient.get<User[]>('/api/v1/users');
  }
  
  static async getUser(id: string): Promise<User> {
    const endpoint = API_CONFIG.endpoints.getUser.replace(':id', id);
    return httpClient.get<User>(endpoint);
  }
  
  static async createUser(user: Partial<User>): Promise<User> {
    return httpClient.post<User>(API_CONFIG.endpoints.createUser, user);
  }
  
  static async updateUser(id: string, user: Partial<User>): Promise<User> {
    const endpoint = API_CONFIG.endpoints.updateUser.replace(':id', id);
    return httpClient.put<User>(endpoint, user);
  }
  
  static async deleteUser(id: string): Promise<void> {
    const endpoint = API_CONFIG.endpoints.deleteUser.replace(':id', id);
    return httpClient.delete<void>(endpoint);
  }
  
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      // Use the real API endpoint for getting users by role
      return httpClient.get<User[]>(`/api/v1/admin/users/by-role/${role}`);
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  // Admin-specific methods
  static async searchUsers(params: UserSearchParams): Promise<UserWithRoles[]> {
    const queryParams = new URLSearchParams();
    
    if (params.query) queryParams.append('query', params.query);
    if (params.role) queryParams.append('role', params.role);
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/api/v1/admin/users/search?${queryString}` : '/api/v1/admin/users/search';
    
    return httpClient.get<UserWithRoles[]>(url);
  }

  static async getUsersByRoleCode(roleCode: string): Promise<UserWithRoles[]> {
    return httpClient.get<UserWithRoles[]>(`/api/v1/admin/users/by-role/${roleCode}`);
  }

  static async getUserWithRoles(userId: string): Promise<UserWithRoles> {
    return httpClient.get<UserWithRoles>(`/api/v1/users/${userId}`);
  }

  static async updateUserRoles(userId: string, roles: UserRoleAssign[]): Promise<UserWithRoles> {
    return httpClient.put<UserWithRoles>(`/api/v1/users/${userId}/roles`, { roles });
  }

  static async bulkCreateUsers(users: UserCreate[]): Promise<UserWithRoles[]> {
    return httpClient.post<UserWithRoles[]>('/api/v1/admin/users/bulk-create', { users });
  }

  static async bulkUpdateUsers(users: UserUpdate[]): Promise<UserWithRoles[]> {
    return httpClient.put<UserWithRoles[]>('/api/v1/admin/users/bulk-update', { users });
  }

  static async bulkDeleteUsers(userIds: string[]): Promise<void> {
    return httpClient.delete<void>('/api/v1/admin/users/bulk-delete', { user_ids: userIds });
  }
}
