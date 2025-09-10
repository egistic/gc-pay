import { ExportContract } from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`;

export interface ExportContractCreate {
  contractNumber: string;
  contractDate: string;
  counterpartyId?: string;
  amount?: number;
  currencyCode?: string;
}

export interface ExportContractUpdate {
  contractNumber?: string;
  contractDate?: string;
  counterpartyId?: string;
  amount?: number;
  currencyCode?: string;
  isActive?: boolean;
}

export class ExportContractsService {
  /**
   * Get all export contracts
   */
  static async getExportContracts(skip = 0, limit = 100, isActive = true): Promise<{ contracts: ExportContract[], total: number }> {
    const response = await fetch(`${API_BASE_URL}/export-contracts/?skip=${skip}&limit=${limit}&is_active=${isActive}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get export contracts: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get a specific export contract by ID
   */
  static async getExportContract(contractId: string): Promise<ExportContract> {
    const response = await fetch(`${API_BASE_URL}/export-contracts/${contractId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get export contract: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Create a new export contract
   */
  static async createExportContract(data: ExportContractCreate): Promise<ExportContract> {
    const response = await fetch(`${API_BASE_URL}/export-contracts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contract_number: data.contractNumber,
        contract_date: data.contractDate,
        counterparty_id: data.counterpartyId,
        amount: data.amount,
        currency_code: data.currencyCode,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create export contract: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Update an existing export contract
   */
  static async updateExportContract(contractId: string, data: ExportContractUpdate): Promise<ExportContract> {
    const response = await fetch(`${API_BASE_URL}/export-contracts/${contractId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contract_number: data.contractNumber,
        contract_date: data.contractDate,
        counterparty_id: data.counterpartyId,
        amount: data.amount,
        currency_code: data.currencyCode,
        is_active: data.isActive,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update export contract: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Delete an export contract (soft delete)
   */
  static async deleteExportContract(contractId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/export-contracts/${contractId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete export contract: ${response.statusText}`);
    }
  }
}
