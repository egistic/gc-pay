import { User, UserRole } from '../types';
import { httpClient, API_CONFIG } from './httpClient';

export class UserService {
  static async getCurrentUser(): Promise<User> {
    try {
      const users = await this.getUsers();
      if (users && users.length > 0) {
        // Return first user with default role
        return {
          ...users[0],
          currentRole: 'executor' as UserRole
        };
      }
      // Fallback user if no users found
      return {
        id: 'dev-user-123',
        full_name: 'Разработчик',
        email: 'dev@example.com',
        phone: '+7 777 000 0000',
        is_active: true,
        currentRole: 'executor' as UserRole
      };
    } catch (error) {
      console.warn('Failed to load users, using fallback user:', error);
      // Fallback user
      return {
        id: 'dev-user-123',
        full_name: 'Разработчик',
        email: 'dev@example.com',
        phone: '+7 777 000 0000',
        is_active: true,
        currentRole: 'executor' as UserRole
      };
    }
  }
  
  static async getUsers(): Promise<User[]> {
    return httpClient.get<User[]>(API_CONFIG.endpoints.getUsers);
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
}
