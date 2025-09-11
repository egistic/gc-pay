// HTTP Client Configuration and Base Client
import { ENV_CONFIG } from '../config/environment';

export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    // Payment Requests
    getPaymentRequests: string;
    createPaymentRequest: string;
    updatePaymentRequest: string;
    deletePaymentRequest: string;
    getPaymentRequest: string;
    
    // Statistics
    getRequestStatistics: string;
    getDashboardMetrics: string;
    
    // Workflow Actions
    submitRequest: string;
    classifyRequest: string;
    approveRequest: string;
    rejectRequest: string;
    addToRegistry: string;
    sendToDistributor: string;
    distributorAction: string;
    getRequestEvents: string;
    
    // Dictionaries
    getCounterparties: string;
    getCurrencies: string;
    getVatRates: string;
    getExpenseArticles: string;
    getPayingCompanies: string;
    getDocumentTypes: string;
    getCounterpartyCategories: string;
    
    // Users
    getUsers: string;
    getCurrentUser: string;
    
    // Files
    uploadFile: string;
    downloadFile: string;
    deleteFile: string;
    
    // Distribution
    getUnallocatedRequests: string;
    getDistributionLines: string;
    createDistributionLine: string;
    updateDistributionLine: string;
    deleteDistributionLine: string;
    getLineContracts: string;
    createLineContract: string;
    updateLineContract: string;
    deleteLineContract: string;
    
    // Registry
    getRegistryEntries: string;
    createRegistryEntry: string;
    updateRegistryEntry: string;
    deleteRegistryEntry: string;
  };
}

export const API_CONFIG: ApiConfig = {
  baseUrl: ENV_CONFIG.apiBaseUrl,
  endpoints: {
    // Payment Requests
    getPaymentRequests: '/api/v1/requests/list',
    createPaymentRequest: '/api/v1/requests/create',
    updatePaymentRequest: '/api/v1/requests/:id',
    deletePaymentRequest: '/api/v1/requests/delete',
    getPaymentRequest: '/api/v1/requests/:id',
    
    // Statistics
    getRequestStatistics: '/api/v1/requests/statistics',
    getDashboardMetrics: '/api/v1/requests/dashboard-metrics',
    
    // Workflow Actions
    submitRequest: '/api/v1/requests/:id/submit',
    classifyRequest: '/api/v1/requests/:id/classify',
    approveRequest: '/api/v1/requests/:id/approve',
    rejectRequest: '/api/v1/requests/:id/reject',
    addToRegistry: '/api/v1/requests/:id/add-to-registry',
    sendToDistributor: '/api/v1/requests/:id/send-to-distributor',
    distributorAction: '/api/v1/requests/:id/distributor-action',
    getRequestEvents: '/api/v1/requests/:id/events',
    
    // Dictionaries
    getCounterparties: '/api/v1/dictionaries/counterparties',
    getCurrencies: '/api/v1/dictionaries/currencies',
    getVatRates: '/api/v1/dictionaries/vat-rates',
    getExpenseArticles: '/api/v1/dictionaries/expense-articles',
    getPayingCompanies: '/api/v1/dictionaries/paying-companies',
    getDocumentTypes: '/api/v1/dictionaries/document-types',
    getCounterpartyCategories: '/api/v1/dictionaries/counterparty-categories',
    
    // Users
    getUsers: '/api/v1/users/list',
    getCurrentUser: '/api/v1/auth/me',
    getUser: '/api/v1/users/:id',
    createUser: '/api/v1/users',
    updateUser: '/api/v1/users/:id',
    deleteUser: '/api/v1/users/:id',
    
    // Roles
    getRoles: '/api/v1/roles',
    getRole: '/api/v1/roles/:id',
    createRole: '/api/v1/roles',
    updateRole: '/api/v1/roles/:id',
    deleteRole: '/api/v1/roles/:id',
    
    // Files
    uploadFile: '/api/v1/files/upload',
    downloadFile: '/api/v1/files/download',
    deleteFile: '/api/v1/files/delete',
    
    // Distribution
    getUnallocatedRequests: '/api/v1/distribution/unallocated-requests',
    getDistributionLines: '/api/v1/distribution/lines',
    createDistributionLine: '/api/v1/distribution/lines/create',
    updateDistributionLine: '/api/v1/distribution/lines/update',
    deleteDistributionLine: '/api/v1/distribution/lines/delete',
    getLineContracts: '/api/v1/distribution/line-contracts',
    createLineContract: '/api/v1/distribution/line-contracts/create',
    updateLineContract: '/api/v1/distribution/line-contracts/update',
    deleteLineContract: '/api/v1/distribution/line-contracts/delete',
    
    // Registry
    getRegistryEntries: '/api/v1/registry/entries',
    createRegistryEntry: '/api/v1/registry/entries/create',
    updateRegistryEntry: '/api/v1/registry/entries/update',
    deleteRegistryEntry: '/api/v1/registry/entries/delete',
  },
};

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('test_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async get(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('test_token');
        window.location.href = '/login';
        throw new Error('Unauthorized - please login again');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async post(url: string, data: any, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('test_token');
        window.location.href = '/login';
        throw new Error('Unauthorized - please login again');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async put(url: string, data: any, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('test_token');
        window.location.href = '/login';
        throw new Error('Unauthorized - please login again');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async delete(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('test_token');
        window.location.href = '/login';
        throw new Error('Unauthorized - please login again');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content response
    if (response.status === 204) {
      return;
    }

    return response.json();
  }
}

// Create singleton instance
export const httpClient = new HttpClient(API_CONFIG.baseUrl);
