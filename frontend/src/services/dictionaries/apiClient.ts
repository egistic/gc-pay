import { DictionaryItem, DictionaryType, ImportExportOptions } from '../../types/dictionaries';

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * API Client interface
 */
export interface ApiClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
  upload<T>(endpoint: string, file: File): Promise<T>;
  download(endpoint: string, options?: any): Promise<Blob>;
}

/**
 * Dictionary API Client implementation
 */
export class DictionaryApiClient implements ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private timeout: number = 30000; // 30 seconds

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: this.getHeaders(),
      ...options,
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, response.statusText, errorData);
      }

      // Handle empty responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }

      throw new ApiError(0, error.message || 'Network error');
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Upload file
   */
  async upload<T>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {};

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, response.statusText, errorData);
    }

    return await response.json();
  }

  /**
   * Download file
   */
  async download(endpoint: string, options?: any): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {};

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return await response.blob();
  }
}

/**
 * Dictionary API endpoints
 */
export class DictionaryApiEndpoints {
  constructor(private apiClient: ApiClient) {}

  // Expense Items
  getExpenseItems = (): Promise<DictionaryItem[]> => 
    this.apiClient.get('/dictionaries/expense-articles');

  getExpenseItem = (id: string): Promise<DictionaryItem> => 
    this.apiClient.get(`/dictionaries/expense-articles/${id}`);

  createExpenseItem = (data: any): Promise<DictionaryItem> => 
    this.apiClient.post('/dictionaries/expense-articles', data);

  updateExpenseItem = (id: string, data: any): Promise<DictionaryItem> => 
    this.apiClient.put(`/dictionaries/expense-articles/${id}`, data);

  deleteExpenseItem = (id: string): Promise<void> => 
    this.apiClient.delete(`/dictionaries/expense-articles/${id}`);

  // Counterparties
  getCounterparties = async (): Promise<DictionaryItem[]> => {
    const response = await this.apiClient.get('/dictionaries/counterparties');
    // Map backend response to frontend format
    return response.map((item: any) => ({
      id: item.id,
      name: item.name,
      abbreviation: item.name.substring(0, 10) + '...', // Generate abbreviation from name
      binIin: item.tax_id || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      region: item.region || '',
      category: item.category,
      isActive: item.is_active,
      code: item.id, // Use ID as code for now
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
      version: 1
    }));
  };

  getCounterparty = async (id: string): Promise<DictionaryItem> => {
    const response = await this.apiClient.get(`/dictionaries/counterparties/${id}`);
    // Map backend response to frontend format
    return {
      id: response.id,
      name: response.name,
      abbreviation: response.name.substring(0, 10) + '...',
      binIin: response.tax_id || '',
      phone: response.phone || '',
      email: response.email || '',
      address: response.address || '',
      region: response.region || '',
      category: response.category,
      isActive: response.is_active,
      code: response.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
      version: 1
    };
  };

  createCounterparty = (data: any): Promise<DictionaryItem> => 
    this.apiClient.post('/dictionaries/counterparties', data);

  updateCounterparty = (id: string, data: any): Promise<DictionaryItem> => 
    this.apiClient.put(`/dictionaries/counterparties/${id}`, data);

  deleteCounterparty = (id: string): Promise<void> => 
    this.apiClient.delete(`/dictionaries/counterparties/${id}`);

  // Contracts
  getContracts = (): Promise<DictionaryItem[]> => 
    this.apiClient.get('/dictionaries/contracts');

  getContract = (id: string): Promise<DictionaryItem> => 
    this.apiClient.get(`/dictionaries/contracts/${id}`);

  createContract = (data: any): Promise<DictionaryItem> => 
    this.apiClient.post('/dictionaries/contracts', data);

  updateContract = (id: string, data: any): Promise<DictionaryItem> => 
    this.apiClient.put(`/dictionaries/contracts/${id}`, data);

  deleteContract = (id: string): Promise<void> => 
    this.apiClient.delete(`/dictionaries/contracts/${id}`);

  // Normatives
  getNormatives = (): Promise<DictionaryItem[]> => 
    this.apiClient.get('/dictionaries/normatives');

  getNormative = (id: string): Promise<DictionaryItem> => 
    this.apiClient.get(`/dictionaries/normatives/${id}`);

  createNormative = (data: any): Promise<DictionaryItem> => 
    this.apiClient.post('/dictionaries/normatives', data);

  updateNormative = (id: string, data: any): Promise<DictionaryItem> => 
    this.apiClient.put(`/dictionaries/normatives/${id}`, data);

  deleteNormative = (id: string): Promise<void> => 
    this.apiClient.delete(`/dictionaries/normatives/${id}`);

  // Priorities
  getPriorities = (): Promise<DictionaryItem[]> => 
    this.apiClient.get('/dictionaries/priorities');

  getPriority = (id: string): Promise<DictionaryItem> => 
    this.apiClient.get(`/dictionaries/priorities/${id}`);

  createPriority = (data: any): Promise<DictionaryItem> => 
    this.apiClient.post('/dictionaries/priorities', data);

  updatePriority = (id: string, data: any): Promise<DictionaryItem> => 
    this.apiClient.put(`/dictionaries/priorities/${id}`, data);

  deletePriority = (id: string): Promise<void> => 
    this.apiClient.delete(`/dictionaries/priorities/${id}`);

  // Users
  getUsers = (): Promise<DictionaryItem[]> => 
    this.apiClient.get('/dictionaries/users');

  getUser = (id: string): Promise<DictionaryItem> => 
    this.apiClient.get(`/dictionaries/users/${id}`);

  createUser = (data: any): Promise<DictionaryItem> => 
    this.apiClient.post('/dictionaries/users', data);

  updateUser = (id: string, data: any): Promise<DictionaryItem> => 
    this.apiClient.put(`/dictionaries/users/${id}`, data);

  deleteUser = (id: string): Promise<void> => 
    this.apiClient.delete(`/dictionaries/users/${id}`);

  // Currencies
  getCurrencies = (): Promise<DictionaryItem[]> => 
    this.apiClient.get('/dictionaries/currencies');

  getCurrency = (code: string): Promise<DictionaryItem> => 
    this.apiClient.get(`/dictionaries/currencies/${code}`);

  // VAT Rates
  getVatRates = (): Promise<DictionaryItem[]> => 
    this.apiClient.get('/dictionaries/vat-rates');

  getVatRate = (id: string): Promise<DictionaryItem> => 
    this.apiClient.get(`/dictionaries/vat-rates/${id}`);

  createVatRate = (data: any): Promise<DictionaryItem> => 
    this.apiClient.post('/dictionaries/vat-rates', data);

  updateVatRate = (id: string, data: any): Promise<DictionaryItem> => 
    this.apiClient.put(`/dictionaries/vat-rates/${id}`, data);

  deleteVatRate = (id: string): Promise<void> => 
    this.apiClient.delete(`/dictionaries/vat-rates/${id}`);

  // Bulk operations
  bulkCreate = (type: DictionaryType, items: any[]): Promise<{ success_count: number; error_count: number; errors: any[]; created_items: any[] }> => 
    this.apiClient.post(`/dictionaries/${type}/bulk`, { items });

  bulkUpdate = (type: DictionaryType, updates: { id: string; data: any }[]): Promise<{ success_count: number; error_count: number; errors: any[]; updated_items: any[] }> => 
    this.apiClient.put(`/dictionaries/${type}/bulk`, { updates });

  bulkDelete = (type: DictionaryType, ids: string[]): Promise<{ success_count: number; error_count: number; errors: any[] }> => 
    this.apiClient.post(`/dictionaries/${type}/bulk-delete`, { ids });

  // Search and filter
  search = async (type: DictionaryType, query: string): Promise<DictionaryItem[]> => {
    if (type === 'counterparties') {
      // For counterparties, we'll search in the full list since backend doesn't have search endpoint
      const allItems = await this.getCounterparties();
      return allItems.filter(item => 
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.binIin?.includes(query) ||
        (item.email && item.email.toLowerCase().includes(query.toLowerCase())) ||
        (item.region && item.region.toLowerCase().includes(query.toLowerCase())) ||
        item.abbreviation?.toLowerCase().includes(query.toLowerCase())
      );
    }
    return this.apiClient.get(`/dictionaries/${type}/search?q=${encodeURIComponent(query)}`);
  };

  filter = async (type: DictionaryType, filters: Record<string, any>): Promise<DictionaryItem[]> => {
    if (type === 'counterparties') {
      // For counterparties, we'll filter in the full list since backend doesn't have filter endpoint
      const allItems = await this.getCounterparties();
      return allItems.filter(item => {
        if (filters.category && item.category !== filters.category) return false;
        if (filters.isActive !== undefined && item.isActive !== filters.isActive) return false;
        return true;
      });
    }
    return this.apiClient.post(`/dictionaries/${type}/filter`, filters);
  };

  // Statistics
  getStatistics = async (type: DictionaryType): Promise<any> => {
    if (type === 'counterparties') {
      const items = await this.getCounterparties();
      return {
        total: items.length,
        active: items.filter(item => item.isActive).length,
        inactive: items.filter(item => !item.isActive).length,
        recentlyUpdated: 0
      };
    }
    // Mock statistics since backend doesn't have this endpoint yet
    const items = await this.apiClient.get(`/dictionaries/${type}`);
    return {
      total: items.length,
      active: items.filter((item: any) => item.is_active).length,
      inactive: items.filter((item: any) => !item.is_active).length,
      categories: type === 'counterparties' ? 
        items.reduce((acc: any, item: any) => {
          const category = item.category || 'Не указана';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}) : {}
    };
  };

  // Import/Export
  export = (type: DictionaryType, options: ImportExportOptions): Promise<Blob> => 
    this.apiClient.download(`/dictionaries/export/${type}?format=${options.format || 'csv'}&active_only=${options.active_only || true}`);

  import = (type: DictionaryType, file: File): Promise<{ success: boolean; imported_count: number; error_count: number; errors: any[]; warnings: any[] }> => 
    this.apiClient.upload(`/dictionaries/import?dictionary_type=${type}`, file);

  // Template download
  getTemplate = (type: DictionaryType): Promise<Blob> => 
    this.apiClient.download(`/dictionaries/template/${type}`);
}

/**
 * Mock API Client for development
 */
export class MockApiClient implements ApiClient {
  private mockData: Map<string, any[]> = new Map();
  private delay: number = 500; // Simulate network delay

  constructor() {
    this.initializeMockData();
  }

  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  private initializeMockData(): void {
    // Initialize with empty arrays for each dictionary type
    const types = ['expense-articles', 'counterparties', 'contracts', 'normatives', 'priorities', 'users'];
    types.forEach(type => {
      this.mockData.set(type, []);
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    await this.simulateDelay();
    
    const path = endpoint.replace('/api/dictionaries/', '');
    const [type, id] = path.split('/');
    
    if (id) {
      // Get single item
      const items = this.mockData.get(type) || [];
      const item = items.find((item: any) => item.id === id);
      if (!item) {
        throw new ApiError(404, 'Not found');
      }
      return item as T;
    } else {
      // Get all items
      return (this.mockData.get(type) || []) as T;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    await this.simulateDelay();
    
    const path = endpoint.replace('/api/dictionaries/', '');
    const [type] = path.split('/');
    
    const newItem = {
      ...data,
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    
    const items = this.mockData.get(type) || [];
    items.push(newItem);
    this.mockData.set(type, items);
    
    return newItem as T;
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    await this.simulateDelay();
    
    const path = endpoint.replace('/api/dictionaries/', '');
    const [type, id] = path.split('/');
    
    const items = this.mockData.get(type) || [];
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index === -1) {
      throw new ApiError(404, 'Not found');
    }
    
    const updatedItem = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
      version: (items[index].version || 0) + 1,
    };
    
    items[index] = updatedItem;
    this.mockData.set(type, items);
    
    return updatedItem as T;
  }

  async delete<T>(endpoint: string): Promise<T> {
    await this.simulateDelay();
    
    const path = endpoint.replace('/api/dictionaries/', '');
    const [type, id] = path.split('/');
    
    const items = this.mockData.get(type) || [];
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index === -1) {
      throw new ApiError(404, 'Not found');
    }
    
    items.splice(index, 1);
    this.mockData.set(type, items);
    
    return {} as T;
  }

  async upload<T>(endpoint: string, file: File): Promise<T> {
    await this.simulateDelay();
    
    // Mock import response
    return {
      success: [],
      errors: []
    } as T;
  }

  async download(endpoint: string, options?: any): Promise<Blob> {
    await this.simulateDelay();
    
    // Mock export response
    return new Blob(['Mock export data'], { type: 'application/json' });
  }
}
