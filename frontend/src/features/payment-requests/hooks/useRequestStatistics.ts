/**
 * Custom hook for managing request statistics
 * Provides data fetching and caching for statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { FrontendStatistics } from '../models/FrontendTypes';
import { StatisticsService } from '../../../services/api';
import { toFrontendStatistics } from '../adapters/normalize';

interface UseRequestStatisticsOptions {
  role?: string;
  userId?: string;
}

interface UseRequestStatisticsReturn {
  data: FrontendStatistics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing request statistics
 * @param options - Role and user filtering options
 * @returns Statistics data, loading state, error state, and refetch function
 */
export const useRequestStatistics = (options: UseRequestStatisticsOptions = {}): UseRequestStatisticsReturn => {
  const [data, setData] = useState<FrontendStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { role = 'EXECUTOR', userId } = options;

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch statistics from API (already normalized by service)
      const response = await StatisticsService.getRoleStatistics(role, userId);
      
      // Data is already normalized by StatisticsService
      setData(response);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('Error fetching request statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  const refetch = useCallback(async () => {
    await fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    data,
    loading,
    error,
    refetch
  };
};
