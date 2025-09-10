// HTTP Client Configuration and Base Client
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
    getPriorities: string;
    
    // Payment Registry
    getPaymentRegistry: string;
    createRegistryEntry: string;
    updateRegistryEntry: string;
    deleteRegistryEntry: string;
    getRegistryStatistics: string;
    
    // Users
    getUsers: string;
    getCurrentUser: string;
    createUser: string;
    updateUser: string;
    deleteUser: string;
    getUser: string;
    
    // Roles
    getRoles: string;
    createRole: string;
    updateRole: string;
    deleteRole: string;
    assignUserRole: string;
    
    // File upload
    uploadFile: string;
    downloadFile: string;
    
    // Reports
    exportRegisterExcel: string;
    exportRegisterPdf: string;
    downloadDocuments: string;
    
    // Distributor routing
    getDistributorBindings: string;
    createDistributorBinding: string;
    updateDistributorBinding: string;
    deleteDistributorBinding: string;
  };
}

export const API_CONFIG: ApiConfig = {
  baseUrl: 'http://localhost:8000',
  endpoints: {
    // Payment Requests
    getPaymentRequests: '/api/v1/requests/list',
    createPaymentRequest: '/api/v1/requests',
    updatePaymentRequest: '/api/v1/requests/:id',
    deletePaymentRequest: '/api/v1/requests/:id',
    getPaymentRequest: '/api/v1/requests/:id',
    
    // Statistics
    getRequestStatistics: '/api/v1/requests/statistics',
    getDashboardMetrics: '/api/v1/requests/metrics/dashboard',
    
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
    getPriorities: '/api/v1/dictionaries/priorities',
    
    // Payment Registry
    getPaymentRegistry: '/api/v1/registry',
    createRegistryEntry: '/api/v1/registry',
    updateRegistryEntry: '/api/v1/registry/:id',
    deleteRegistryEntry: '/api/v1/registry/:id',
    getRegistryStatistics: '/api/v1/registry/statistics',
    
    // Users
    getUsers: '/api/v1/users',
    getCurrentUser: '/api/v1/users/current',
    createUser: '/api/v1/users',
    updateUser: '/api/v1/users/:id',
    deleteUser: '/api/v1/users/:id',
    getUser: '/api/v1/users/:id',
    
    // Roles
    getRoles: '/api/v1/roles',
    createRole: '/api/v1/roles',
    updateRole: '/api/v1/roles/:id',
    deleteRole: '/api/v1/roles/:id',
    assignUserRole: '/api/v1/users/:id/roles',
    
    // File upload
    uploadFile: '/api/v1/files/upload',
    downloadFile: '/api/v1/files/:id',
    
    // Reports
    exportRegisterExcel: '/api/v1/payment-registers/:id/export/excel',
    exportRegisterPdf: '/api/v1/payment-registers/:id/export/pdf',
    downloadDocuments: '/api/v1/payment-registers/:id/documents',
    
    // Distributor routing
    getDistributorBindings: '/api/v1/distributor-bindings',
    createDistributorBinding: '/api/v1/distributor-bindings',
    updateDistributorBinding: '/api/v1/distributor-bindings/:id',
    deleteDistributorBinding: '/api/v1/distributor-bindings/:id'
  }
};

export class HttpClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
  
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
  
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  async download(endpoint: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    return response.blob();
  }
}

// Create singleton HTTP client instance
export const httpClient = new HttpClient(API_CONFIG.baseUrl);
