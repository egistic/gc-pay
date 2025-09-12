import { DictionaryApiClient } from './dictionaries/apiClient';
import { ExpenseSplit } from '../types';

export interface SplitRequestCreate {
  original_request_id: string;
  expense_splits: Omit<ExpenseSplit, 'id' | 'requestId'>[];
  sub_registrar_id: string;
  distributor_id: string;
  comment?: string;
}

export interface SplitRequestOut {
  original_request_id: string;
  split_requests: string[];
  total_amount: number;
  status: string;
}

export class SplitRequestService {
  private static apiClient = new DictionaryApiClient(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`);

  /**
   * Initialize API client with authentication token
   */
  private static initializeAuth(): void {
    const token = localStorage.getItem('test_token');
    if (token) {
      this.apiClient.setAuthToken(token);
    }
  }

  /**
   * Split a payment request by expense articles
   */
  static async splitRequest(payload: SplitRequestCreate): Promise<SplitRequestOut> {
    this.initializeAuth();
    const response = await this.apiClient.post('/distribution/split-request', payload);
    return response;
  }

  /**
   * Get all split requests for an original request
   */
  static async getSplitRequests(originalRequestId: string): Promise<any[]> {
    this.initializeAuth();
    const response = await this.apiClient.get(`/distribution/split-requests/${originalRequestId}`);
    return response;
  }
}
