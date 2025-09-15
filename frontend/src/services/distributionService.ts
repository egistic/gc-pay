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

    return await httpClient.post('/api/v1/distribution/classify', apiData);
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

    return await httpClient.post('/api/v1/distribution/return', apiData);
  }

  /**
   * Get expense splits for a request
   */
  static async getExpenseSplits(requestId: string): Promise<any[]> {
    return await httpClient.get(`/api/v1/distribution/expense-splits/${requestId}`);
  }

  /**
   * Get requests pending distribution
   */
  static async getPendingRequests(skip = 0, limit = 100): Promise<PendingRequest[]> {
    return await httpClient.get(`/api/v1/distribution/pending-requests?skip=${skip}&limit=${limit}`);
  }

  /**
   * Send requests to both SUB_REGISTRAR and DISTRIBUTOR in parallel
   */
  static async sendRequestsParallel(data: ParallelDistributionCreate): Promise<ParallelDistributionOut> {
    const payload: any = {
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
    };

    // Add original_request_id if provided (for split requests)
    if (data.originalRequestId) {
      payload.original_request_id = data.originalRequestId;
    }

    return await httpClient.post('/api/v1/distribution/send-requests', payload);
  }

  /**
   * Split request by expense articles for distributor
   */
  static async splitRequestByArticles(data: ParallelDistributionCreate): Promise<ParallelDistributionOut> {
    const payload = {
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
    };

    return await httpClient.post('/api/v1/distribution/split-request', payload);
  }

  /**
   * Distribute request - changes status from classified to distributed
   */
  static async distributeRequest(requestId: string): Promise<DistributionOut> {
    return await httpClient.post(`/api/v1/distribution/distribute/${requestId}`);
  }
}
