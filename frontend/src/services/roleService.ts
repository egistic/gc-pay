import { httpClient, API_CONFIG } from './httpClient';

// Role-specific types
export interface Role {
  id: string;
  code: string;
  name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleCreate {
  code: string;
  name: string;
}

export interface RoleUpdate {
  code?: string;
  name?: string;
  is_active?: boolean;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  resource: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface RoleUsage {
  role_id: string;
  role_name: string;
  user_count: number;
  last_assigned?: string;
  is_active: boolean;
}

export interface RoleStatistics {
  total_roles: number;
  active_roles: number;
  most_used_role?: string;
  least_used_role?: string;
}

export class RoleService {
  // Basic CRUD operations
  static async getRoles(): Promise<Role[]> {
    return httpClient.get<Role[]>(API_CONFIG.endpoints.getRoles);
  }

  static async getRole(roleId: string): Promise<Role> {
    return httpClient.get<Role>(`${API_CONFIG.endpoints.getRole.replace(':id', roleId)}`);
  }

  static async createRole(role: RoleCreate): Promise<Role> {
    return httpClient.post<Role>(API_CONFIG.endpoints.createRole, role);
  }

  static async updateRole(roleId: string, role: RoleUpdate): Promise<Role> {
    return httpClient.put<Role>(`${API_CONFIG.endpoints.updateRole.replace(':id', roleId)}`, role);
  }

  static async deleteRole(roleId: string): Promise<void> {
    return httpClient.delete<void>(`${API_CONFIG.endpoints.deleteRole.replace(':id', roleId)}`);
  }

  // Role Statistics
  static async getRoleStatistics(): Promise<RoleStatistics> {
    return httpClient.get<RoleStatistics>('/api/v1/admin/roles/statistics');
  }

  static async getRoleUsage(roleId: string): Promise<RoleUsage> {
    return httpClient.get<RoleUsage>(`/api/v1/admin/roles/${roleId}/usage`);
  }

  // Permission Management (placeholder for future implementation)
  static async getPermissions(): Promise<Permission[]> {
    // This would be implemented when permission system is added
    return Promise.resolve([]);
  }

  static async getRolePermissions(roleId: string): Promise<Permission[]> {
    // This would be implemented when permission system is added
    return Promise.resolve([]);
  }

  static async updateRolePermissions(roleId: string, permissions: Permission[]): Promise<void> {
    // This would be implemented when permission system is added
    return Promise.resolve();
  }
}
