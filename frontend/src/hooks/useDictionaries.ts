import { useState, useEffect, useCallback } from 'react';
import { 
  DictionaryItem, 
  DictionaryType, 
  DictionaryState, 
  FilterState,
  PaginationState,
  DictionaryStatistics,
  ImportExportOptions,
  ValidationResult
} from '../types/dictionaries';
import { DictionaryService } from '../services/dictionaries/dictionaryService';

/**
 * Hook for managing dictionary state and operations
 */
export function useDictionaries<T extends DictionaryItem>(type: DictionaryType) {
  const [state, setState] = useState<DictionaryState>({
    currentDictionary: type,
    selectedItems: [],
    searchQuery: '',
    filters: {},
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    editingItem: null,
    bulkActionMode: false,
    relatedData: {},
    isLoading: false,
    error: null
  });

  const [items, setItems] = useState<T[]>([]);
  const [statistics, setStatistics] = useState<DictionaryStatistics | null>(null);

  const service = DictionaryService.getInstance();
  const handler = service.getHandler<T>(type);

  /**
   * Load items from service
   */
  const loadItems = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await handler.getItems();
      setItems(data);
      
      // Update pagination
      setState(prev => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          total: data.length,
          totalPages: Math.ceil(data.length / prev.pagination.pageSize)
        }
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load items' 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Load statistics
   */
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await handler.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, [handler]);

  /**
   * Search items
   */
  const searchItems = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query, isLoading: true }));
    
    try {
      const data = await handler.searchItems(query);
      setItems(data);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Search failed' 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Filter items
   */
  const filterItems = useCallback(async (filters: FilterState) => {
    setState(prev => ({ ...prev, filters, isLoading: true }));
    
    try {
      const data = await handler.getItemsByFilter(filters);
      setItems(data);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Filter failed' 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Create new item
   */
  const createItem = useCallback(async (item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newItem = await handler.createItem(item);
      setItems(prev => [...prev, newItem]);
      setState(prev => ({ ...prev, editingItem: null }));
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Update existing item
   */
  const updateItem = useCallback(async (id: string, item: Partial<T>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const updatedItem = await handler.updateItem(id, item);
      setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
      setState(prev => ({ ...prev, editingItem: null }));
      return updatedItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Delete item
   */
  const deleteItem = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const success = await handler.deleteItem(id);
      if (success) {
        setItems(prev => prev.filter(i => i.id !== id));
        setState(prev => ({ 
          ...prev, 
          selectedItems: prev.selectedItems.filter(itemId => itemId !== id) 
        }));
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Bulk create items
   */
  const bulkCreate = useCallback(async (items: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newItems = await handler.bulkCreate(items);
      setItems(prev => [...prev, ...newItems]);
      return newItems;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create items';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Bulk update items
   */
  const bulkUpdate = useCallback(async (updates: { id: string; data: Partial<T> }[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const updatedItems = await handler.bulkUpdate(updates);
      setItems(prev => {
        const updatedMap = new Map(updatedItems.map(item => [item.id, item]));
        return prev.map(item => updatedMap.get(item.id) || item);
      });
      setState(prev => ({ ...prev, selectedItems: [] }));
      return updatedItems;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update items';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Bulk delete items
   */
  const bulkDelete = useCallback(async (ids: string[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const success = await handler.bulkDelete(ids);
      if (success) {
        setItems(prev => prev.filter(item => !ids.includes(item.id)));
        setState(prev => ({ ...prev, selectedItems: [] }));
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete items';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Export items
   */
  const exportItems = useCallback(async (options: ImportExportOptions) => {
    try {
      return await handler.exportItems(options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export items';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [handler]);

  /**
   * Import items
   */
  const importItems = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await handler.importItems(file);
      if (result.success.length > 0) {
        setItems(prev => [...prev, ...result.success]);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import items';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handler]);

  /**
   * Validate item
   */
  const validateItem = useCallback((item: T): ValidationResult => {
    return handler.validateItem(item);
  }, [handler]);

  /**
   * Select item
   */
  const selectItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(id)
        ? prev.selectedItems.filter(itemId => itemId !== id)
        : [...prev.selectedItems, id]
    }));
  }, []);

  /**
   * Select all items
   */
  const selectAllItems = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: items.map(item => item.id)
    }));
  }, [items]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedItems: [] }));
  }, []);

  /**
   * Set editing item
   */
  const setEditingItem = useCallback((item: T | null) => {
    setState(prev => ({ ...prev, editingItem: item }));
  }, []);

  /**
   * Set bulk action mode
   */
  const setBulkActionMode = useCallback((mode: boolean) => {
    setState(prev => ({ 
      ...prev, 
      bulkActionMode: mode,
      selectedItems: mode ? prev.selectedItems : []
    }));
  }, []);

  /**
   * Update pagination
   */
  const updatePagination = useCallback((pagination: Partial<PaginationState>) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, ...pagination }
    }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await Promise.all([loadItems(), loadStatistics()]);
  }, [loadItems, loadStatistics]);

  // Load data on mount
  useEffect(() => {
    loadItems();
    loadStatistics();
  }, [loadItems, loadStatistics]);

  return {
    // State
    items,
    statistics,
    state,
    
    // Actions
    loadItems,
    loadStatistics,
    searchItems,
    filterItems,
    createItem,
    updateItem,
    deleteItem,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
    exportItems,
    importItems,
    validateItem,
    selectItem,
    selectAllItems,
    clearSelection,
    setEditingItem,
    setBulkActionMode,
    updatePagination,
    clearError,
    refresh
  };
}

/**
 * Hook for managing single dictionary item
 */
export function useDictionaryItem<T extends DictionaryItem>(type: DictionaryType, id: string) {
  const [item, setItem] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = DictionaryService.getInstance();
  const handler = service.getHandler<T>(type);

  const loadItem = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await handler.getItemById(id);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
    } finally {
      setIsLoading(false);
    }
  }, [handler, id]);

  const updateItem = useCallback(async (data: Partial<T>) => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedItem = await handler.updateItem(id, data);
      setItem(updatedItem);
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handler, id]);

  const deleteItem = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await handler.deleteItem(id);
      if (success) {
        setItem(null);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handler, id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  return {
    item,
    isLoading,
    error,
    loadItem,
    updateItem,
    deleteItem
  };
}
