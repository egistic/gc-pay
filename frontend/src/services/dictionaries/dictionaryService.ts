import { 
  DictionaryItem, 
  DictionaryType, 
  DictionaryHandler, 
  ValidationResult,
  FilterState,
  PaginationState,
  DictionaryStatistics,
  ImportExportOptions
} from '../../types/dictionaries';
import { DictionaryCacheManager, CacheKeys, CacheTags } from './cacheManager';
import { ValidationManager } from './validationManager';
import { DictionaryApiClient, DictionaryApiEndpoints, MockApiClient } from './apiClient';
// import { DictionaryInitialization } from '../../data/dictionaries/initialization'; // Disabled - using real API data

/**
 * Dictionary Service - Main service for managing all dictionary operations
 */
export class DictionaryService {
  private static instance: DictionaryService;
  private handlers: Map<DictionaryType, DictionaryHandler<any>> = new Map();
  private cache: DictionaryCacheManager;
  private validator: ValidationManager;
  private api: DictionaryApiEndpoints;
  private isOnline: boolean = true;

  private constructor() {
    this.cache = new DictionaryCacheManager();
    this.validator = new ValidationManager();
    
    // Use real API for production
    const apiClient = new DictionaryApiClient(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`);
    this.api = new DictionaryApiEndpoints(apiClient);
    
    this.initializeHandlers();
    this.setupOnlineStatusListener();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  /**
   * Initialize handlers for each dictionary type
   */
  private initializeHandlers(): void {
    const types: DictionaryType[] = [
      'expense-articles',
      'counterparties', 
      'contracts',
      'normatives',
      'priorities',
      'users',
      'currencies',
      'vat-rates'
    ];

    types.forEach(type => {
      const handler = this.createHandler(type);
      this.handlers.set(type, handler);
    });
  }

  /**
   * Create handler for specific dictionary type
   */
  private createHandler<T extends DictionaryItem>(type: DictionaryType): DictionaryHandler<T> {
    return {
      getItems: () => this.getItems<T>(type),
      getItemById: (id: string) => this.getItemById<T>(type, id),
      createItem: (item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => this.createItem<T>(type, item),
      updateItem: (id: string, item: Partial<T>) => this.updateItem<T>(type, id, item),
      deleteItem: (id: string) => this.deleteItem(type, id),
      validateItem: (item: T) => this.validateItem(type, item),
      searchItems: (query: string) => this.searchItems<T>(type, query),
      getItemsByFilter: (filters: FilterState) => this.getItemsByFilter<T>(type, filters),
      getStatistics: () => this.getStatistics(type),
      bulkCreate: (items: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>[]) => this.bulkCreate<T>(type, items),
      bulkUpdate: (updates: { id: string; data: Partial<T> }[]) => this.bulkUpdate<T>(type, updates),
      bulkDelete: (ids: string[]) => this.bulkDelete(type, ids),
      exportItems: (options: ImportExportOptions) => this.exportItems(type, options),
      importItems: (file: File) => this.importItems<T>(type, file)
    };
  }

  /**
   * Setup online/offline status listener
   */
  private setupOnlineStatusListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncOfflineChanges();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Get handler for specific dictionary type
   */
  getHandler<T extends DictionaryItem>(type: DictionaryType): DictionaryHandler<T> {
    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler found for dictionary type: ${type}`);
    }
    return handler as DictionaryHandler<T>;
  }

  /**
   * Get all items for a dictionary type
   */
  async getItems<T extends DictionaryItem>(type: DictionaryType): Promise<T[]> {
    // Skip initialization check - we use real API data
    // await this.ensureInitialized();

    const cacheKey = CacheKeys.dictionaryItems(type);
    
    // Check cache first
    const cached = this.cache.get<T[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let items: T[];
      
      if (this.isOnline) {
        // Fetch from API
        items = await this.getApiMethod<T[]>(type, 'getItems')();
      } else {
        // Use offline data
        items = this.getOfflineData<T>(type);
      }

      // Cache the results
      this.cache.set(cacheKey, items, undefined, [CacheTags.DICTIONARY, type as any]);
      
      return items;
    } catch (error) {
      console.error(`Error fetching ${type} items:`, error);
      
      // Fallback to offline data
      return this.getOfflineData<T>(type);
    }
  }

  /**
   * Get single item by ID
   */
  async getItemById<T extends DictionaryItem>(type: DictionaryType, id: string): Promise<T | null> {
    const cacheKey = CacheKeys.dictionaryItem(type, id);
    
    // Check cache first
    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let item: T;
      
      if (this.isOnline) {
        // Fetch from API
        item = await this.getApiMethod<T>(type, 'getItem')(id);
      } else {
        // Find in offline data
        const items = this.getOfflineData<T>(type);
        item = items.find(item => item.id === id) || null;
      }

      if (item) {
        // Cache the result
        this.cache.set(cacheKey, item, undefined, [CacheTags.DICTIONARY, type as any]);
      }
      
      return item;
    } catch (error) {
      console.error(`Error fetching ${type} item ${id}:`, error);
      return null;
    }
  }

  /**
   * Create new item
   */
  async createItem<T extends DictionaryItem>(
    type: DictionaryType, 
    item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<T> {
    // Validate the item
    const validation = this.validator.validate(type, item as T);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    try {
      let createdItem: T;
      
      if (this.isOnline) {
        // Create via API
        createdItem = await this.getApiMethod<T>(type, 'createItem')(item);
      } else {
        // Create offline
        createdItem = this.createOfflineItem<T>(type, item);
      }

      // Invalidate cache
      this.cache.invalidate(CacheKeys.dictionaryItems(type));
      this.cache.invalidateByTags([type as any]);

      return createdItem;
    } catch (error) {
      console.error(`Error creating ${type} item:`, error);
      throw error;
    }
  }

  /**
   * Update existing item
   */
  async updateItem<T extends DictionaryItem>(
    type: DictionaryType, 
    id: string, 
    item: Partial<T>
  ): Promise<T> {
    // Validate the item
    const validation = this.validator.validate(type, item as T);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    try {
      let updatedItem: T;
      
      if (this.isOnline) {
        // Update via API
        updatedItem = await this.getApiMethod<T>(type, 'updateItem')(id, item);
      } else {
        // Update offline
        updatedItem = this.updateOfflineItem<T>(type, id, item);
      }

      // Invalidate cache
      this.cache.invalidate(CacheKeys.dictionaryItems(type));
      this.cache.invalidate(CacheKeys.dictionaryItem(type, id));
      this.cache.invalidateByTags([type as any]);

      return updatedItem;
    } catch (error) {
      console.error(`Error updating ${type} item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete item
   */
  async deleteItem(type: DictionaryType, id: string): Promise<boolean> {
    try {
      if (this.isOnline) {
        // Delete via API
        await this.getApiMethod<void>(type, 'deleteItem')(id);
      } else {
        // Delete offline
        this.deleteOfflineItem(type, id);
      }

      // Invalidate cache
      this.cache.invalidate(CacheKeys.dictionaryItems(type));
      this.cache.invalidate(CacheKeys.dictionaryItem(type, id));
      this.cache.invalidateByTags([type as any]);

      return true;
    } catch (error) {
      console.error(`Error deleting ${type} item ${id}:`, error);
      return false;
    }
  }

  /**
   * Validate item
   */
  validateItem<T extends DictionaryItem>(type: DictionaryType, item: T): ValidationResult {
    return this.validator.validate(type, item);
  }

  /**
   * Search items
   */
  async searchItems<T extends DictionaryItem>(type: DictionaryType, query: string): Promise<T[]> {
    const cacheKey = CacheKeys.dictionarySearch(type, query);
    
    // Check cache first
    const cached = this.cache.get<T[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let items: T[];
      
      if (this.isOnline) {
        // Search via API
        items = await this.api.search(type, query);
      } else {
        // Search offline
        const allItems = this.getOfflineData<T>(type);
        items = allItems.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.code.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Cache the results
      this.cache.set(cacheKey, items, 60000, [CacheTags.SEARCH, type as any]);
      
      return items;
    } catch (error) {
      console.error(`Error searching ${type} items:`, error);
      return [];
    }
  }

  /**
   * Get items by filter
   */
  async getItemsByFilter<T extends DictionaryItem>(type: DictionaryType, filters: FilterState): Promise<T[]> {
    const cacheKey = CacheKeys.dictionaryFilter(type, filters);
    
    // Check cache first
    const cached = this.cache.get<T[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let items: T[];
      
      if (this.isOnline) {
        // Filter via API
        items = await this.api.filter(type, filters);
      } else {
        // Filter offline
        const allItems = this.getOfflineData<T>(type);
        items = this.applyFilters(allItems, filters);
      }

      // Cache the results
      this.cache.set(cacheKey, items, 60000, [CacheTags.FILTER, type as any]);
      
      return items;
    } catch (error) {
      console.error(`Error filtering ${type} items:`, error);
      return [];
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(type: DictionaryType): Promise<DictionaryStatistics> {
    const cacheKey = CacheKeys.dictionaryStatistics(type);
    
    // Check cache first
    const cached = this.cache.get<DictionaryStatistics>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let stats: DictionaryStatistics;
      
      if (this.isOnline) {
        // Get from API
        stats = await this.api.getStatistics(type);
      } else {
        // Calculate from offline data
        const items = this.getOfflineData(type);
        stats = this.calculateStatistics(items);
      }

      // Cache the results
      this.cache.set(cacheKey, stats, 300000, [CacheTags.STATISTICS, type as any]);
      
      return stats;
    } catch (error) {
      console.error(`Error getting ${type} statistics:`, error);
      return {
        totalItems: 0,
        activeItems: 0,
        inactiveItems: 0,
        recentlyUpdated: 0
      };
    }
  }

  /**
   * Bulk create items
   */
  async bulkCreate<T extends DictionaryItem>(
    type: DictionaryType, 
    items: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>[]
  ): Promise<T[]> {
    // Validate all items
    for (const item of items) {
      const validation = this.validator.validate(type, item as T);
      if (!validation.isValid) {
        throw new Error(`Validation failed for item: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    try {
      let createdItems: T[];
      
      if (this.isOnline) {
        // Create via API
        createdItems = await this.api.bulkCreate(type, items);
      } else {
        // Create offline
        createdItems = items.map(item => this.createOfflineItem<T>(type, item));
      }

      // Invalidate cache
      this.cache.invalidate(CacheKeys.dictionaryItems(type));
      this.cache.invalidateByTags([type as any]);

      return createdItems;
    } catch (error) {
      console.error(`Error bulk creating ${type} items:`, error);
      throw error;
    }
  }

  /**
   * Bulk update items
   */
  async bulkUpdate<T extends DictionaryItem>(
    type: DictionaryType, 
    updates: { id: string; data: Partial<T> }[]
  ): Promise<T[]> {
    try {
      let updatedItems: T[];
      
      if (this.isOnline) {
        // Update via API
        updatedItems = await this.api.bulkUpdate(type, updates);
      } else {
        // Update offline
        updatedItems = updates.map(({ id, data }) => this.updateOfflineItem<T>(type, id, data));
      }

      // Invalidate cache
      this.cache.invalidate(CacheKeys.dictionaryItems(type));
      this.cache.invalidateByTags([type as any]);

      return updatedItems;
    } catch (error) {
      console.error(`Error bulk updating ${type} items:`, error);
      throw error;
    }
  }

  /**
   * Bulk delete items
   */
  async bulkDelete(type: DictionaryType, ids: string[]): Promise<boolean> {
    try {
      if (this.isOnline) {
        // Delete via API
        await this.api.bulkDelete(type, ids);
      } else {
        // Delete offline
        ids.forEach(id => this.deleteOfflineItem(type, id));
      }

      // Invalidate cache
      this.cache.invalidate(CacheKeys.dictionaryItems(type));
      this.cache.invalidateByTags([type as any]);

      return true;
    } catch (error) {
      console.error(`Error bulk deleting ${type} items:`, error);
      return false;
    }
  }

  /**
   * Export items
   */
  async exportItems(type: DictionaryType, options: ImportExportOptions): Promise<Blob> {
    try {
      if (this.isOnline) {
        // Export via API
        return await this.api.export(type, options);
      } else {
        // Export offline data
        const items = this.getOfflineData(type);
        const data = JSON.stringify(items, null, 2);
        return new Blob([data], { type: 'application/json' });
      }
    } catch (error) {
      console.error(`Error exporting ${type} items:`, error);
      throw error;
    }
  }

  /**
   * Import items
   */
  async importItems<T extends DictionaryItem>(type: DictionaryType, file: File): Promise<{ success: T[]; errors: any[] }> {
    try {
      if (this.isOnline) {
        // Import via API
        return await this.api.import(type, file);
      } else {
        // Import offline (mock)
        return { success: [], errors: [] };
      }
    } catch (error) {
      console.error(`Error importing ${type} items:`, error);
      throw error;
    }
  }

  /**
   * Get API method for specific type and operation
   */
  private getApiMethod<T>(type: DictionaryType, operation: string): (...args: any[]) => Promise<T> {
    const methodMap: Record<string, Record<string, (...args: any[]) => Promise<any>>> = {
      'expense-articles': {
        getItems: () => this.api.getExpenseItems(),
        getItem: (id: string) => this.api.getExpenseItem(id),
        createItem: (data: any) => this.api.createExpenseItem(data),
        updateItem: (id: string, data: any) => this.api.updateExpenseItem(id, data),
        deleteItem: (id: string) => this.api.deleteExpenseItem(id)
      },
      'counterparties': {
        getItems: () => this.api.getCounterparties(),
        getItem: (id: string) => this.api.getCounterparty(id),
        createItem: (data: any) => this.api.createCounterparty(data),
        updateItem: (id: string, data: any) => this.api.updateCounterparty(id, data),
        deleteItem: (id: string) => this.api.deleteCounterparty(id)
      },
      'contracts': {
        getItems: () => this.api.getContracts(),
        getItem: (id: string) => this.api.getContract(id),
        createItem: (data: any) => this.api.createContract(data),
        updateItem: (id: string, data: any) => this.api.updateContract(id, data),
        deleteItem: (id: string) => this.api.deleteContract(id)
      },
      'normatives': {
        getItems: () => this.api.getNormatives(),
        getItem: (id: string) => this.api.getNormative(id),
        createItem: (data: any) => this.api.createNormative(data),
        updateItem: (id: string, data: any) => this.api.updateNormative(id, data),
        deleteItem: (id: string) => this.api.deleteNormative(id)
      },
      'priorities': {
        getItems: () => this.api.getPriorities(),
        getItem: (id: string) => this.api.getPriority(id),
        createItem: (data: any) => this.api.createPriority(data),
        updateItem: (id: string, data: any) => this.api.updatePriority(id, data),
        deleteItem: (id: string) => this.api.deletePriority(id)
      },
      'users': {
        getItems: () => this.api.getUsers(),
        getItem: (id: string) => this.api.getUser(id),
        createItem: (data: any) => this.api.createUser(data),
        updateItem: (id: string, data: any) => this.api.updateUser(id, data),
        deleteItem: (id: string) => this.api.deleteUser(id)
      },
      'currencies': {
        getItems: () => this.api.getCurrencies(),
        getItem: (code: string) => this.api.getCurrency(code),
        createItem: (data: any) => Promise.reject(new Error('Currencies are read-only')),
        updateItem: (id: string, data: any) => Promise.reject(new Error('Currencies are read-only')),
        deleteItem: (id: string) => Promise.reject(new Error('Currencies are read-only'))
      },
      'vat-rates': {
        getItems: () => this.api.getVatRates(),
        getItem: (id: string) => this.api.getVatRate(id),
        createItem: (data: any) => this.api.createVatRate(data),
        updateItem: (id: string, data: any) => this.api.updateVatRate(id, data),
        deleteItem: (id: string) => this.api.deleteVatRate(id)
      }
    };

    const typeMethods = methodMap[type];
    if (!typeMethods || !typeMethods[operation]) {
      throw new Error(`No API method found for ${type}.${operation}`);
    }

    return typeMethods[operation];
  }

  /**
   * Get offline data from localStorage
   */
  private getOfflineData<T>(type: DictionaryType): T[] {
    try {
      const data = localStorage.getItem(`dictionary_${type}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error loading offline data for ${type}:`, error);
      return [];
    }
  }

  /**
   * Save offline data to localStorage
   */
  private saveOfflineData<T>(type: DictionaryType, items: T[]): void {
    try {
      localStorage.setItem(`dictionary_${type}`, JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving offline data for ${type}:`, error);
    }
  }

  /**
   * Create item offline
   */
  private createOfflineItem<T>(type: DictionaryType, item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>): T {
    const newItem = {
      ...item,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    } as T;

    const items = this.getOfflineData<T>(type);
    items.push(newItem);
    this.saveOfflineData(type, items);

    return newItem;
  }

  /**
   * Update item offline
   */
  private updateOfflineItem<T>(type: DictionaryType, id: string, data: Partial<T>): T {
    const items = this.getOfflineData<T>(type);
    const index = items.findIndex(item => (item as any).id === id);
    
    if (index === -1) {
      throw new Error(`Item not found: ${id}`);
    }

    const updatedItem = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
      version: ((items[index] as any).version || 0) + 1
    } as T;

    items[index] = updatedItem;
    this.saveOfflineData(type, items);

    return updatedItem;
  }

  /**
   * Delete item offline
   */
  private deleteOfflineItem(type: DictionaryType, id: string): void {
    const items = this.getOfflineData(type);
    const filteredItems = items.filter(item => (item as any).id !== id);
    this.saveOfflineData(type, filteredItems);
  }

  /**
   * Apply filters to items
   */
  private applyFilters<T>(items: T[], filters: FilterState): T[] {
    return items.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        
        const itemValue = (item as any)[key];
        
        if (key === 'isActive') {
          if (itemValue !== value) return false;
        } else if (key === 'category') {
          if (itemValue !== value) return false;
        } else if (key === 'ownerRole') {
          if (itemValue !== value) return false;
        } else if (key === 'dateRange') {
          const itemDate = new Date(itemValue);
          const startDate = new Date(value.start);
          const endDate = new Date(value.end);
          if (itemDate < startDate || itemDate > endDate) return false;
        } else if (typeof value === 'string') {
          if (!itemValue || !itemValue.toString().toLowerCase().includes(value.toLowerCase())) {
            return false;
          }
        }
      }
      return true;
    });
  }

  /**
   * Calculate statistics from items
   */
  private calculateStatistics(items: any[]): DictionaryStatistics {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalItems: items.length,
      activeItems: items.filter(item => item.isActive).length,
      inactiveItems: items.filter(item => !item.isActive).length,
      recentlyUpdated: items.filter(item => 
        new Date(item.updatedAt) > oneWeekAgo
      ).length
    };
  }

  /**
   * Sync offline changes when coming back online
   */
  private async syncOfflineChanges(): Promise<void> {
    // TODO: Implement sync logic for offline changes
    console.log('Syncing offline changes...');
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.cache.getStats();
  }

  /**
   * Ensure dictionary system is initialized
   * DISABLED: We now use real API data instead of migration
   */
  private async ensureInitialized(): Promise<void> {
    // Skip initialization - we use real API data
    return;
    /*
    if (DictionaryInitialization.isInitializationNeeded()) {
      console.log('🔄 Dictionary system needs initialization, initializing...');
      try {
        await DictionaryInitialization.initialize();
        console.log('✅ Dictionary system initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize dictionary system:', error);
        throw new Error('Dictionary system initialization failed');
      }
    }
    */
  }
}
