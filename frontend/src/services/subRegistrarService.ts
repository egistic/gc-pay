import { 
  SubRegistrarAssignment, 
  SubRegistrarReport, 
  SubRegistrarReportCreate, 
  SubRegistrarReportUpdate,
  DocumentStatus 
} from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`;

export class SubRegistrarService {
  /**
   * Get all assignments for the current sub-registrar
   */
  static async getAssignments(skip = 0, limit = 100): Promise<{ assignments: SubRegistrarAssignment[], total: number }> {
    const response = await fetch(`${API_BASE_URL}/sub-registrar/assignments?skip=${skip}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get assignments: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get sub-registrar report for a specific request
   */
  static async getReport(requestId: string): Promise<SubRegistrarReport> {
    const response = await fetch(`${API_BASE_URL}/sub-registrar/reports/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get report: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Save a sub-registrar report as draft
   */
  static async saveDraftReport(data: SubRegistrarReportCreate): Promise<SubRegistrarReport> {
    const response = await fetch(`${API_BASE_URL}/sub-registrar/save-draft`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: data.requestId,
        document_status: data.documentStatus,
        report_data: data.reportData,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save draft report: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Publish a sub-registrar report
   */
  static async publishReport(requestId: string): Promise<SubRegistrarReport> {
    const response = await fetch(`${API_BASE_URL}/sub-registrar/publish-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request_id: requestId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to publish report: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Save closing document data
   */
  static async saveClosingDocs(requestId: string, data: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sub-registrar/closing-docs/${requestId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save closing document: ${response.statusText}`);
    }
  }
}
