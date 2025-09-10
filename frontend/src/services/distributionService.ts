import { 
  ContractStatus, 
  DistributionCreate, 
  DistributionOut, 
  ReturnRequestCreate, 
  ReturnRequestOut, 
  User,
  ParallelDistributionCreate,
  ParallelDistributionOut,
  PendingRequest
} from '../types';
import { httpClient } from './httpClient';

export class DistributionService {
  /**
   * Check contract status for a counterparty
   */
  static async getContractStatus(counterpartyId: string): Promise<ContractStatus> {
    return await httpClient.get(`/api/v1/distribution/contract-status/${counterpartyId}`);
  }

  /**
   * Get all users with SUB_REGISTRAR role
   */
  static async getSubRegistrars(): Promise<User[]> {
    return await httpClient.get('/api/v1/distribution/sub-registrars');
  }

  /**
   * Classify payment request and assign to sub-registrar
   */
  static async classifyRequest(data: DistributionCreate): Promise<DistributionOut> {
    // Convert camelCase to snake_case for API
    const apiData = {
      request_id: data.requestId,
      responsible_registrar_id: data.responsibleRegistrarId,
      expense_splits: data.expenseSplits.map(split => ({
        expense_item_id: split.expenseItemId,
        amount: split.amount,
        comment: split.comment,
        contract_id: split.contractId,
        priority: split.priority
      })),
      comment: data.comment
    };

    const response = await fetch(`${API_BASE_URL}/distribution/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to classify request: ${errorData.detail || response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Return request to executor for revision
   */
  static async returnRequest(data: ReturnRequestCreate): Promise<ReturnRequestOut> {
    // Convert camelCase to snake_case for API
    const apiData = {
      request_id: data.requestId,
      comment: data.comment
    };

    const response = await fetch(`${API_BASE_URL}/distribution/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to return request: ${errorData.detail || response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get expense splits for a request
   */
  static async getExpenseSplits(requestId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/distribution/expense-splits/${requestId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get expense splits: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get requests pending distribution
   */
  static async getPendingRequests(skip = 0, limit = 100): Promise<PendingRequest[]> {
    const response = await fetch(`${API_BASE_URL}/distribution/pending-requests?skip=${skip}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get pending requests: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Send requests to both SUB_REGISTRAR and DISTRIBUTOR in parallel
   */
  static async sendRequestsParallel(data: ParallelDistributionCreate): Promise<ParallelDistributionOut> {
    return await httpClient.post('/api/v1/distribution/send-requests', {
      request_id: data.requestId,
      sub_registrar_id: data.subRegistrarId,
      distributor_id: data.distributorId,
      expense_splits: data.expenseSplits.map(split => ({
        expense_item_id: split.expenseItemId,
        amount: split.amount,
        comment: split.comment,
        contract_id: split.contractId,
        priority: split.priority
      })),
      comment: data.comment
    });
  }

  /**
   * Split request by expense articles for distributor
   */
  static async splitRequestByArticles(data: ParallelDistributionCreate): Promise<ParallelDistributionOut> {
    const response = await fetch(`${API_BASE_URL}/distribution/split-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: data.requestId,
        sub_registrar_id: data.subRegistrarId,
        distributor_id: data.distributorId,
        expense_splits: data.expenseSplits.map(split => ({
          expense_item_id: split.expenseItemId,
          amount: split.amount,
          comment: split.comment,
          contract_id: split.contractId,
          priority: split.priority
        })),
        comment: data.comment
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to split request: ${response.statusText}`);
    }
    
    return response.json();
  }
}
