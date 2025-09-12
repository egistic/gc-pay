import { httpClient } from './httpClient';
import { Position, Department } from '../types';

// Position and Department API types
export interface PositionCreate {
  department_id: string;
  title: string;
  description?: string;
  is_active?: boolean;
}

export interface PositionUpdate {
  department_id?: string;
  title?: string;
  description?: string;
  is_active?: boolean;
}

export interface PositionOut {
  id: string;
  department_id: string;
  title: string;
  description?: string;
  is_active: boolean;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface DepartmentCreate {
  name: string;
  code: string;
}

export interface DepartmentUpdate {
  name?: string;
  code?: string;
}

export interface DepartmentOut {
  id: string;
  name: string;
  code: string;
}

export interface UserPositionAssign {
  user_id: string;
  position_id: string;
  valid_from: string;
  valid_to?: string;
}

export interface UserPositionOut {
  id: string;
  user_id: string;
  position_id: string;
  valid_from: string;
  valid_to?: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  position?: {
    id: string;
    title: string;
    description?: string;
  };
}

export class PositionService {
  // Department Management
  static async getDepartments(): Promise<DepartmentOut[]> {
    return httpClient.get<DepartmentOut[]>('/api/v1/positions/departments');
  }

  static async createDepartment(department: DepartmentCreate): Promise<DepartmentOut> {
    return httpClient.post<DepartmentOut>('/api/v1/positions/departments', department);
  }

  static async updateDepartment(departmentId: string, department: DepartmentUpdate): Promise<DepartmentOut> {
    return httpClient.put<DepartmentOut>(`/api/v1/positions/departments/${departmentId}`, department);
  }

  static async deleteDepartment(departmentId: string): Promise<void> {
    return httpClient.delete<void>(`/api/v1/positions/departments/${departmentId}`);
  }

  // Position Management
  static async getPositions(): Promise<PositionOut[]> {
    return httpClient.get<PositionOut[]>('/api/v1/positions');
  }

  static async getPosition(positionId: string): Promise<PositionOut> {
    return httpClient.get<PositionOut>(`/api/v1/positions/${positionId}`);
  }

  static async createPosition(position: PositionCreate): Promise<PositionOut> {
    return httpClient.post<PositionOut>('/api/v1/positions', position);
  }

  static async updatePosition(positionId: string, position: PositionUpdate): Promise<PositionOut> {
    return httpClient.put<PositionOut>(`/api/v1/positions/${positionId}`, position);
  }

  static async deletePosition(positionId: string): Promise<void> {
    return httpClient.delete<void>(`/api/v1/positions/${positionId}`);
  }

  // User Position Assignment
  static async assignUserToPosition(positionId: string, assignment: UserPositionAssign): Promise<UserPositionOut> {
    return httpClient.post<UserPositionOut>(`/api/v1/positions/${positionId}/assign-user`, assignment);
  }

  static async getPositionUsers(positionId: string): Promise<UserPositionOut[]> {
    return httpClient.get<UserPositionOut[]>(`/api/v1/positions/${positionId}/users`);
  }

  static async removeUserFromPosition(assignmentId: string): Promise<void> {
    return httpClient.delete<void>(`/api/v1/positions/assignments/${assignmentId}`);
  }
}
