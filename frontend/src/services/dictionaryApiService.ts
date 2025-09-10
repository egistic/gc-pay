import { 
  Counterparty, 
  Contract, 
  ExpenseItem, 
  Priority, 
  Normative
} from '../types';
import { httpClient, API_CONFIG } from './httpClient';

export class DictionaryApiService {
  static async getCounterparties(): Promise<Counterparty[]> {
    return httpClient.get<Counterparty[]>(API_CONFIG.endpoints.getCounterparties);
  }
  
  static async getContracts(): Promise<Contract[]> {
    return httpClient.get<Contract[]>(API_CONFIG.endpoints.getCounterparties); // Assuming contracts endpoint exists
  }
  
  static async getExpenseItems(): Promise<ExpenseItem[]> {
    return httpClient.get<ExpenseItem[]>(API_CONFIG.endpoints.getExpenseArticles);
  }
  
  static async getPriorities(): Promise<Priority[]> {
    return httpClient.get<Priority[]>(API_CONFIG.endpoints.getPriorities);
  }
  
  static async getNormatives(): Promise<Normative[]> {
    return httpClient.get<Normative[]>(API_CONFIG.endpoints.getCounterparties); // Assuming normatives endpoint exists
  }
  
  static async getCurrencies(): Promise<any[]> {
    return httpClient.get<any[]>(API_CONFIG.endpoints.getCurrencies);
  }
  
  static async getVatRates(): Promise<any[]> {
    return httpClient.get<any[]>(API_CONFIG.endpoints.getVatRates);
  }
}
