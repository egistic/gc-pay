import { PaymentRegister } from '../types';
import { httpClient, API_CONFIG } from './httpClient';

export class PaymentRegisterService {
  static async getAll(): Promise<PaymentRegister[]> {
    return httpClient.get<PaymentRegister[]>(API_CONFIG.endpoints.getPaymentRegistry);
  }
  
  static async create(register: Partial<PaymentRegister>): Promise<PaymentRegister> {
    return httpClient.post<PaymentRegister>(API_CONFIG.endpoints.createRegistryEntry, register);
  }
  
  static async exportExcel(id: string): Promise<Blob> {
    const endpoint = API_CONFIG.endpoints.exportRegisterExcel.replace(':id', id);
    return httpClient.download(endpoint);
  }
  
  static async exportPDF(id: string): Promise<Blob> {
    const endpoint = API_CONFIG.endpoints.exportRegisterPdf.replace(':id', id);
    return httpClient.download(endpoint);
  }
  
  static async downloadDocuments(id: string): Promise<Blob> {
    const endpoint = API_CONFIG.endpoints.downloadDocuments.replace(':id', id);
    return httpClient.download(endpoint);
  }

  static async getStatistics(): Promise<any> {
    return httpClient.get<any>(API_CONFIG.endpoints.getRegistryStatistics);
  }

  static async getEntries(): Promise<any[]> {
    return httpClient.get<any[]>(API_CONFIG.endpoints.getPaymentRegistry);
  }

  static async createEntry(entry: any): Promise<any> {
    return httpClient.post<any>(API_CONFIG.endpoints.createRegistryEntry, entry);
  }

  static async updateEntry(id: string, entry: any): Promise<any> {
    const endpoint = API_CONFIG.endpoints.updateRegistryEntry.replace(':id', id);
    return httpClient.put<any>(endpoint, entry);
  }

  static async deleteEntry(id: string): Promise<void> {
    const endpoint = API_CONFIG.endpoints.deleteRegistryEntry.replace(':id', id);
    return httpClient.delete<void>(endpoint);
  }
}
