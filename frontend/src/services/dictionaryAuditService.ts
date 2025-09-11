import { httpClient } from './httpClient';

export interface AuditEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  item_id: string;
  item_name: string;
  user_id: string;
  user_name: string;
  timestamp: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  changes?: Record<string, { old: any; new: any }>;
}

export interface DataIntegrityIssue {
  id: string;
  type: 'orphaned' | 'duplicate' | 'invalid' | 'missing';
  severity: 'low' | 'medium' | 'high';
  item_id: string;
  item_name: string;
  description: string;
  suggestion?: string;
  affected_fields?: string[];
}

export interface AuditStatistics {
  total_actions: number;
  actions_by_type: Record<string, number>;
  actions_by_user: Record<string, number>;
  recent_activity: number;
  data_integrity_issues: number;
}

export interface AuditHistoryResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface IntegrityIssuesResponse {
  issues: DataIntegrityIssue[];
  total: number;
}

export class DictionaryAuditService {
  // Get audit history
  static async getAuditHistory(
    dictionaryType: string,
    params: {
      start_date?: string;
      end_date?: string;
      action?: string;
      user_id?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<AuditHistoryResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.action) queryParams.append('action', params.action);
    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString 
      ? `/api/v1/dictionaries/audit/history/${dictionaryType}?${queryString}`
      : `/api/v1/dictionaries/audit/history/${dictionaryType}`;
    
    return httpClient.get<AuditHistoryResponse>(url);
  }

  // Get audit statistics
  static async getAuditStatistics(dictionaryType: string): Promise<AuditStatistics> {
    return httpClient.get<AuditStatistics>(`/api/v1/dictionaries/audit/statistics/${dictionaryType}`);
  }

  // Get data integrity issues
  static async getDataIntegrityIssues(
    dictionaryType: string,
    severity?: string
  ): Promise<IntegrityIssuesResponse> {
    const queryParams = new URLSearchParams();
    if (severity) queryParams.append('severity', severity);

    const queryString = queryParams.toString();
    const url = queryString 
      ? `/api/v1/dictionaries/audit/integrity/${dictionaryType}?${queryString}`
      : `/api/v1/dictionaries/audit/integrity/${dictionaryType}`;
    
    return httpClient.get<IntegrityIssuesResponse>(url);
  }

  // Export audit log
  static async exportAuditLog(
    dictionaryType: string,
    exportOptions: Record<string, any>
  ): Promise<{ message: string; download_url: string }> {
    return httpClient.post<{ message: string; download_url: string }>(
      `/api/v1/dictionaries/audit/export/${dictionaryType}`,
      exportOptions
    );
  }
}
