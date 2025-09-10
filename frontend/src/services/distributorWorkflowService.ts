import { 
  DistributorRequest, 
  ExportContract, 
  DistributorExportLink, 
  ExportContractLink 
} from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`;

export class DistributorWorkflowService {
  /**
   * Get all distributor requests for the current distributor
   */
  static async getDistributorRequests(skip = 0, limit = 100): Promise<{ requests: DistributorRequest[], total: number }> {
    const response = await fetch(`${API_BASE_URL}/distributor/requests?skip=${skip}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get distributor requests: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get a specific distributor request by ID
   */
  static async getDistributorRequest(requestId: string): Promise<DistributorRequest> {
    const response = await fetch(`${API_BASE_URL}/distributor/requests/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get distributor request: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Link a distributor request to an export contract
   */
  static async linkExportContract(requestId: string, data: ExportContractLink): Promise<DistributorExportLink> {
    const response = await fetch(`${API_BASE_URL}/distributor/requests/${requestId}/export-contract`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        export_contract_id: data.exportContractId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to link export contract: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get distributor request with enriched data from sub-registrar reports
   */
  static async getEnrichedRequest(requestId: string): Promise<{
    request: DistributorRequest;
    subRegistrarReport?: any;
    exportLinks: DistributorExportLink[];
  }> {
    const response = await fetch(`${API_BASE_URL}/distributor/requests/${requestId}/enriched`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get enriched request: ${response.statusText}`);
    }
    
    return response.json();
  }
}
