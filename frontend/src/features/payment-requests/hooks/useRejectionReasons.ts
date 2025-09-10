/**
 * Custom hook for managing rejection reasons
 * Provides data fetching and caching for rejection reasons
 */

import { useState, useEffect, useCallback } from 'react';
import { PaymentRequestService } from '../../../services/api';
import { toFrontendRequestEvent } from '../adapters/normalize';

interface UseRejectionReasonsOptions {
  requestIds: string[];
}

interface UseRejectionReasonsReturn {
  rejectionReasons: Record<string, string>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing rejection reasons for requests
 * @param options - Array of request IDs to fetch rejection reasons for
 * @returns Rejection reasons map, loading state, error state, and refetch function
 */
export const useRejectionReasons = (options: UseRejectionReasonsOptions): UseRejectionReasonsReturn => {
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { requestIds } = options;

  const fetchRejectionReasons = useCallback(async () => {
    if (requestIds.length === 0) {
      setRejectionReasons({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reasons: Record<string, string> = {};

      // Fetch events for each request in parallel
      const eventPromises = requestIds.map(async (requestId) => {
        try {
          const events = await PaymentRequestService.getRequestEvents(requestId);
          const normalizedEvents = events.map(toFrontendRequestEvent);
          
          // Find the most recent rejection event
          const rejectionEvent = normalizedEvents
            .filter(event => event.eventType === 'REJECTED')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          
          if (rejectionEvent && rejectionEvent.comment) {
            reasons[requestId] = rejectionEvent.comment;
          }
        } catch (err) {
          console.warn(`Failed to fetch events for request ${requestId}:`, err);
        }
      });

      await Promise.all(eventPromises);
      setRejectionReasons(reasons);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rejection reasons';
      setError(errorMessage);
      console.error('Error fetching rejection reasons:', err);
    } finally {
      setLoading(false);
    }
  }, [requestIds.join(',')]); // Use stringified array to prevent infinite re-renders

  const refetch = useCallback(async () => {
    await fetchRejectionReasons();
  }, [fetchRejectionReasons]);

  useEffect(() => {
    fetchRejectionReasons();
  }, [fetchRejectionReasons]);

  return {
    rejectionReasons,
    loading,
    error,
    refetch
  };
};
