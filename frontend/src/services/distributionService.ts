import { ContractStatus, DistributionCreate, DistributionOut, ReturnRequestCreate, ReturnRequestOut, User } from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`;

export class DistributionService {
  /**
   * Check contract status for a counterparty
   */
  static async getContractStatus(counterpartyId: string): Promise<ContractStatus> {
    const response = await fetch(`${API_BASE_URL}/distribution/contract-status/${counterpartyId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get contract status: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get all users with SUB_REGISTRAR role
   */
  static async getSubRegistrars(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/distribution/sub-registrars`);
    
    if (!response.ok) {
      throw new Error(`Failed to get sub-registrars: ${response.statusText}`);
    }
    
    return response.json();
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
}
