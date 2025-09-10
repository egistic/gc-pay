import { httpClient, API_CONFIG } from './httpClient';

export class FileService {
  static async upload(file: File): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return httpClient.upload<{ id: string; url: string }>(API_CONFIG.endpoints.uploadFile, formData);
  }
  
  static getDownloadUrl(fileId: string): string {
    return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.downloadFile.replace(':id', fileId)}`;
  }
  
  static async download(fileId: string): Promise<Blob> {
    const endpoint = API_CONFIG.endpoints.downloadFile.replace(':id', fileId);
    return httpClient.download(endpoint);
  }
}
