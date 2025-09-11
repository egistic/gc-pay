import { httpClient } from './httpClient';

export interface ImportResult {
  message: string;
  total_processed: number;
  success_count: number;
  error_count: number;
  success_records: any[];
  errors: ValidationError[];
}

export interface ValidationError {
  row: number;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  data: any;
}

export interface ExportResult {
  content: string;
  filename: string;
  content_type: string;
}

export interface TemplateResult {
  content: string;
  filename: string;
  content_type: string;
}

export class DictionaryImportExportService {
  // Import dictionary data
  static async importData(
    dictionaryType: string,
    file: File,
    includeInactive: boolean = false
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('include_inactive', includeInactive.toString());

    return httpClient.post<ImportResult>(
      `/api/v1/dictionaries/import-export/import/${dictionaryType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // Export dictionary data
  static async exportData(
    dictionaryType: string,
    format: 'csv' | 'xlsx' | 'json' = 'csv',
    includeInactive: boolean = false,
    dateRange?: { start: string; end: string }
  ): Promise<ExportResult> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    queryParams.append('include_inactive', includeInactive.toString());
    if (dateRange) {
      queryParams.append('date_range', `${dateRange.start},${dateRange.end}`);
    }

    const url = `/api/v1/dictionaries/import-export/export/${dictionaryType}?${queryParams.toString()}`;
    
    return httpClient.get<ExportResult>(url);
  }

  // Get import template
  static async getTemplate(
    dictionaryType: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<TemplateResult> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);

    const url = `/api/v1/dictionaries/import-export/template/${dictionaryType}?${queryParams.toString()}`;
    
    return httpClient.get<TemplateResult>(url);
  }

  // Download file from content
  static downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Download file from base64 content (for Excel files)
  static downloadFileFromBase64(content: string, filename: string, contentType: string) {
    // Convert base64 to blob
    const byteCharacters = atob(content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
