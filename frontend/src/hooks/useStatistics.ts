import { useState, useEffect, useCallback } from 'react';
import { StatisticsService, StatisticsUtils } from '../services/statisticsService';
import { UserRole } from '../types';

// Hook for role-based statistics
export function useRoleStatistics(role: UserRole, userId?: string, options?: {
  enableCache?: boolean;
  refreshInterval?: number;
  autoRefresh?: boolean;
}) {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    enableCache = true,
    refreshInterval = 30000, // 30 seconds
    autoRefresh = false
  } = options || {};

  const fetchStatistics = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      let stats;
      if (forceRefresh || !enableCache) {
        stats = await StatisticsService.getRealTimeStatistics(role, userId);
      } else {
        stats = await StatisticsService.getStatisticsWithFallback(role, userId);
      }

      // Data is already normalized by StatisticsService
      setStatistics(stats);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching role statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [role, userId, enableCache]);

  // Initial fetch
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatistics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStatistics]);

  const refresh = useCallback(() => {
    fetchStatistics(true);
  }, [fetchStatistics]);

  const clearCache = useCallback(() => {
    StatisticsService.clearCache(role, userId);
  }, [role, userId]);

  return {
    statistics,
    loading,
    error,
    lastUpdated,
    refresh,
    clearCache,
    formatted: statistics?.formatted || null
  };
}

// Hook for dashboard metrics
export function useDashboardMetrics(role: UserRole, userId?: string, options?: {
  enableCache?: boolean;
  refreshInterval?: number;
  autoRefresh?: boolean;
}) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    enableCache = true,
    refreshInterval = 30000, // 30 seconds
    autoRefresh = false
  } = options || {};

  const fetchMetrics = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      let dashboardMetrics;
      if (forceRefresh || !enableCache) {
        // For dashboard metrics, we'll use the regular method since it doesn't have a real-time version
        dashboardMetrics = await StatisticsService.getDashboardMetrics(role, userId);
      } else {
        dashboardMetrics = await StatisticsService.getDashboardMetrics(role, userId);
      }

      setMetrics(dashboardMetrics);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [role, userId, enableCache]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  const refresh = useCallback(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refresh
  };
}

// Hook for registry statistics
export function useRegistryStatistics(options?: {
  enableCache?: boolean;
  refreshInterval?: number;
  autoRefresh?: boolean;
}) {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    enableCache = true,
    refreshInterval = 30000, // 30 seconds
    autoRefresh = false
  } = options || {};

  const fetchStatistics = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const stats = await StatisticsService.getRegistryStatistics();
      setStatistics(stats);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching registry statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch registry statistics');
    } finally {
      setLoading(false);
    }
  }, [enableCache]);

  // Initial fetch
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatistics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStatistics]);

  const refresh = useCallback(() => {
    fetchStatistics(true);
  }, [fetchStatistics]);

  const clearCache = useCallback(() => {
    StatisticsService.clearCache();
  }, []);

  return {
    statistics,
    loading,
    error,
    lastUpdated,
    refresh,
    clearCache
  };
}

// Hook for all role statistics (admin view)
export function useAllRoleStatistics(options?: {
  enableCache?: boolean;
  refreshInterval?: number;
  autoRefresh?: boolean;
}) {
  const [allStatistics, setAllStatistics] = useState<Record<UserRole, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    enableCache = true,
    refreshInterval = 60000, // 1 minute
    autoRefresh = false
  } = options || {};

  const fetchAllStatistics = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const stats = await StatisticsService.getAllRoleStatistics();
      setAllStatistics(stats);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching all role statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch all role statistics');
    } finally {
      setLoading(false);
    }
  }, [enableCache]);

  // Initial fetch
  useEffect(() => {
    fetchAllStatistics();
  }, [fetchAllStatistics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllStatistics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllStatistics]);

  const refresh = useCallback(() => {
    fetchAllStatistics(true);
  }, [fetchAllStatistics]);

  const clearCache = useCallback(() => {
    StatisticsService.clearCache();
  }, []);

  return {
    allStatistics,
    loading,
    error,
    lastUpdated,
    refresh,
    clearCache
  };
}

// Utility hook for statistics comparison
export function useStatisticsComparison(role: UserRole, userId?: string) {
  const [comparison, setComparison] = useState<{
    current: any;
    previous: any;
    change: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current statistics
        const current = await StatisticsService.getRoleStatistics(role, userId);
        
        // For comparison, we would typically store previous values
        // For now, we'll simulate with mock previous data
        const previous = {
          total_requests: Math.max(0, current.total_requests - Math.floor(Math.random() * 5)),
          draft: Math.max(0, current.draft - Math.floor(Math.random() * 3)),
          submitted: Math.max(0, current.submitted - Math.floor(Math.random() * 2)),
          classified: Math.max(0, current.classified - Math.floor(Math.random() * 2)),
          approved: Math.max(0, current.approved - Math.floor(Math.random() * 2)),
          in_registry: Math.max(0, current.in_registry - Math.floor(Math.random() * 2)),
          rejected: Math.max(0, current.rejected - Math.floor(Math.random() * 1)),
          overdue: Math.max(0, current.overdue - Math.floor(Math.random() * 1))
        };

        // Calculate percentage changes
        const change = {
          total_requests: StatisticsUtils.calculatePercentageChange(previous.total_requests, current.total_requests),
          draft: StatisticsUtils.calculatePercentageChange(previous.draft, current.draft),
          submitted: StatisticsUtils.calculatePercentageChange(previous.submitted, current.submitted),
          classified: StatisticsUtils.calculatePercentageChange(previous.classified, current.classified),
          approved: StatisticsUtils.calculatePercentageChange(previous.approved, current.approved),
          in_registry: StatisticsUtils.calculatePercentageChange(previous.in_registry, current.in_registry),
          rejected: StatisticsUtils.calculatePercentageChange(previous.rejected, current.rejected),
          overdue: StatisticsUtils.calculatePercentageChange(previous.overdue, current.overdue)
        };

        setComparison({
          current,
          previous,
          change
        });
      } catch (err) {
        console.error('Error fetching statistics comparison:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics comparison');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [role, userId]);

  return {
    comparison,
    loading,
    error
  };
}

export default {
  useRoleStatistics,
  useDashboardMetrics,
  useRegistryStatistics,
  useAllRoleStatistics,
  useStatisticsComparison
};
