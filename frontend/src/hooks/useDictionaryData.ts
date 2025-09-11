import { useState, useEffect, useCallback, useMemo } from 'react';
import { DictionaryType, DictionaryItem } from '../types/dictionaries';
import { DictionaryService } from '../services/dictionaries/dictionaryService';

/**
 * Hook for loading dictionary data without statistics
 * Optimized for forms and components that only need data, not statistics
 */
export function useDictionaryData<T extends DictionaryItem>(type: DictionaryType) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = DictionaryService.getInstance();
  const handler = useMemo(() => service.getHandler<T>(type), [service, type]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await handler.getItems();
      setItems(data);
    } catch (err) {
      console.error(`Failed to load ${type}:`, err);
      setError(err instanceof Error ? err.message : `Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  }, [handler, type]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    refetch: loadItems
  };
}
