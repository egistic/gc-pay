/**
 * Custom hook for managing executor requests
 * Provides data fetching, caching, and error handling for request lists
 */

import { useState, useEffect, useCallback } from 'react';
import { FrontendPaymentRequest } from '../models/FrontendTypes';
import { PaymentRequestService } from '../../../services/api';
import { toFrontendRequestListItemList } from '../adapters/normalize';

interface UseExecutorRequestsOptions {
  status?: string;
  searchTerm?: string;
  counterpartyFilter?: string;
  page?: number;
  limit?: number;
}

interface UseExecutorRequestsReturn {
  data: FrontendPaymentRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  totalCount: number;
}

/**
 * Hook for fetching and managing executor requests
 * @param options - Filtering and pagination options
 * @returns Request data, loading state, error state, and refetch function
 */
export const useExecutorRequests = (options: UseExecutorRequestsOptions = {}): UseExecutorRequestsReturn => {
  const [data, setData] = useState<FrontendPaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const {
    status,
    searchTerm,
    counterpartyFilter,
    page = 1,
    limit = 10
  } = options;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('role', 'EXECUTOR');
      
      if (status && status !== 'all') {
        queryParams.append('status', status);
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (counterpartyFilter && counterpartyFilter !== 'all') {
        queryParams.append('counterparty_id', counterpartyFilter);
      }
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      // Fetch data from API (already normalized by service)
      const response = await PaymentRequestService.getAll({
        role: 'EXECUTOR',
        // Don't pass status filter to API - filter on client side
      });

      // Data is already normalized by PaymentRequestService
      let filteredData = response;
      
      // Apply status filter on client side
      if (status && status !== 'all') {
        filteredData = response.filter(req => req.status === status);
      }
      
      // Apply search filter on client side
      if (searchTerm) {
        filteredData = filteredData.filter(req => 
          req.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply counterparty filter on client side
      if (counterpartyFilter && counterpartyFilter !== 'all') {
        filteredData = filteredData.filter(req => req.counterpartyId === counterpartyFilter);
      }
      
      setData(filteredData);
      setHasMore(filteredData.length === limit);
      setTotalCount(filteredData.length);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch requests';
      setError(errorMessage);
      console.error('Error fetching executor requests:', err);
    } finally {
      setLoading(false);
    }
  }, [status, searchTerm, counterpartyFilter, page, limit]);

  const refetch = useCallback(async () => {
    await fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    data,
    loading,
    error,
    refetch,
    hasMore,
    totalCount
  };
};
