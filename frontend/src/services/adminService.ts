import { httpClient, API_CONFIG } from './httpClient';
import { Position, Department } from '../types';
import { PositionService, PositionOut, DepartmentOut, PositionCreate, PositionUpdate, DepartmentCreate, DepartmentUpdate, UserPositionAssign, UserPositionOut } from './positionService';

// Admin-specific types
export interface SystemStatistics {
  total_users: number;
  active_users: number;
  total_roles: number;
  total_requests: number;
  system_health: 'healthy' | 'warning' | 'error';
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface UserSearchParams {
  query?: string;
  role?: string;
  is_active?: boolean;
  position_id?: string;
  department_id?: string;
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

export interface UserWithRoles {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  roles: RoleOut[];
  position?: PositionOut;
  department?: DepartmentOut;
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

export interface BulkUserCreate {
  users: UserCreate[];
}

export interface BulkUserUpdate {
  users: UserUpdate[];
}

export interface BulkUserDelete {
  user_ids: string[];
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

export class AdminService {
  // System Statistics
  static async getSystemStatistics(): Promise<SystemStatistics> {
    return httpClient.get<SystemStatistics>('/api/v1/admin/statistics');
  }

  // Activity Log
  static async getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
    return httpClient.get<ActivityLog[]>(`/api/v1/admin/activity-log?limit=${limit}`);
  }

  // User Search and Management
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

  static async getUsersByRole(roleCode: string): Promise<UserWithRoles[]> {
    return httpClient.get<UserWithRoles[]>(`/api/v1/admin/users/by-role/${roleCode}`);
  }

  // Bulk User Operations
  static async bulkCreateUsers(users: UserCreate[]): Promise<UserWithRoles[]> {
    return httpClient.post<UserWithRoles[]>('/api/v1/admin/users/bulk-create', { users });
  }

  static async bulkUpdateUsers(users: UserUpdate[]): Promise<UserWithRoles[]> {
    return httpClient.put<UserWithRoles[]>('/api/v1/admin/users/bulk-update', { users });
  }

  static async bulkDeleteUsers(userIds: string[]): Promise<void> {
    return httpClient.delete<void>('/api/v1/admin/users/bulk-delete', { user_ids: userIds });
  }

  // Role Statistics
  static async getRoleStatistics(): Promise<RoleStatistics> {
    return httpClient.get<RoleStatistics>('/api/v1/admin/roles/statistics');
  }

  static async getRoleUsage(roleId: string): Promise<RoleUsage> {
    return httpClient.get<RoleUsage>(`/api/v1/admin/roles/${roleId}/usage`);
  }

  // Position and Department Management (delegated to PositionService)
  static async getDepartments(): Promise<DepartmentOut[]> {
    return PositionService.getDepartments();
  }

  static async createDepartment(department: DepartmentCreate): Promise<DepartmentOut> {
    return PositionService.createDepartment(department);
  }

  static async updateDepartment(departmentId: string, department: DepartmentUpdate): Promise<DepartmentOut> {
    return PositionService.updateDepartment(departmentId, department);
  }

  static async deleteDepartment(departmentId: string): Promise<void> {
    return PositionService.deleteDepartment(departmentId);
  }

  static async getPositions(): Promise<PositionOut[]> {
    return PositionService.getPositions();
  }

  static async getPosition(positionId: string): Promise<PositionOut> {
    return PositionService.getPosition(positionId);
  }

  static async createPosition(position: PositionCreate): Promise<PositionOut> {
    return PositionService.createPosition(position);
  }

  static async updatePosition(positionId: string, position: PositionUpdate): Promise<PositionOut> {
    return PositionService.updatePosition(positionId, position);
  }

  static async deletePosition(positionId: string): Promise<void> {
    return PositionService.deletePosition(positionId);
  }

  static async assignUserToPosition(positionId: string, assignment: UserPositionAssign): Promise<UserPositionOut> {
    return PositionService.assignUserToPosition(positionId, assignment);
  }

  static async getPositionUsers(positionId: string): Promise<UserPositionOut[]> {
    return PositionService.getPositionUsers(positionId);
  }

  static async removeUserFromPosition(assignmentId: string): Promise<void> {
    return PositionService.removeUserFromPosition(assignmentId);
  }
}
