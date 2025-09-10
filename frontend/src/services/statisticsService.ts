import { PaymentRequestService, RegisterService } from './index';
import { UserRole } from '../types';
import { toFrontendStatistics } from '../features/payment-requests/adapters/normalize';

// Statistics cache interface
interface StatisticsCache {
  data: any;
  timestamp: number;
  expiresIn: number;
}

// Statistics service class for real-time metrics and caching
export class StatisticsService {
  private static cache: Map<string, StatisticsCache> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 50;

  /**
   * Get role-based statistics with caching
   */
  static async getRoleStatistics(role: UserRole, userId?: string): Promise<any> {
    const cacheKey = `role_stats_${role}_${userId || 'all'}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const statistics = await PaymentRequestService.getStatistics(role, userId);
      
      // Normalize data using adapter
      const normalizedStatistics = toFrontendStatistics(statistics);
      this.setCache(cacheKey, normalizedStatistics);
      
      return normalizedStatistics;
    } catch (error) {
      console.error('Error fetching role statistics:', error);
      throw new Error(`Failed to fetch statistics for role: ${role}`);
    }
  }

  /**
   * Get dashboard metrics with caching
   */
  static async getDashboardMetrics(role: UserRole, userId?: string): Promise<any> {
    const cacheKey = `dashboard_metrics_${role}_${userId || 'all'}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const metrics = await PaymentRequestService.getDashboardMetrics(role, userId);
      
      // Data is already normalized by PaymentRequestService
      this.setCache(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw new Error(`Failed to fetch dashboard metrics for role: ${role}`);
    }
  }

  /**
   * Get registry statistics with caching
   */
  static async getRegistryStatistics(): Promise<any> {
    const cacheKey = 'registry_statistics';
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const statistics = await RegisterService.getStatistics();
      
      // Cache the result
      this.setCache(cacheKey, statistics);
      
      return statistics;
    } catch (error) {
      console.error('Error fetching registry statistics:', error);
      throw new Error('Failed to fetch registry statistics');
    }
  }

  /**
   * Get real-time statistics (bypasses cache)
   */
  static async getRealTimeStatistics(role: UserRole, userId?: string): Promise<any> {
    try {
      const statistics = await PaymentRequestService.getStatistics(role, userId);
      
      // Data is already normalized by PaymentRequestService
      const cacheKey = `role_stats_${role}_${userId || 'all'}`;
      this.setCache(cacheKey, statistics);
      
      return statistics;
    } catch (error) {
      console.error('Error fetching real-time statistics:', error);
      throw new Error(`Failed to fetch real-time statistics for role: ${role}`);
    }
  }

  /**
   * Get comprehensive statistics for all roles
   */
  static async getAllRoleStatistics(): Promise<Record<UserRole, any>> {
    const roles: UserRole[] = ['executor', 'registrar', 'distributor', 'treasurer'];
    const results: Record<string, any> = {};

    try {
      // Fetch statistics for all roles in parallel
      const promises = roles.map(async (role) => {
        try {
          const stats = await this.getRoleStatistics(role);
          return { role, stats };
        } catch (error) {
          console.error(`Error fetching statistics for role ${role}:`, error);
          return { role, stats: null };
        }
      });

      const roleStats = await Promise.all(promises);
      
      // Organize results by role
      roleStats.forEach(({ role, stats }) => {
        results[role] = stats;
      });

      return results as Record<UserRole, any>;
    } catch (error) {
      console.error('Error fetching all role statistics:', error);
      throw new Error('Failed to fetch statistics for all roles');
    }
  }

  /**
   * Get statistics with fallback to cached data
   */
  static async getStatisticsWithFallback(role: UserRole, userId?: string): Promise<any> {
    try {
      // Try to get fresh data
      return await this.getRealTimeStatistics(role, userId);
    } catch (error) {
      console.warn('Failed to fetch fresh statistics, trying cache:', error);
      
      // Fallback to cached data
      const cacheKey = `role_stats_${role}_${userId || 'all'}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        console.log('Using cached statistics as fallback');
        return cached;
      }
      
      // If no cache available, throw the original error
      throw error;
    }
  }

  /**
   * Clear cache for specific role or all cache
   */
  static clearCache(role?: UserRole, userId?: string): void {
    if (role) {
      const cacheKey = `role_stats_${role}_${userId || 'all'}`;
      this.cache.delete(cacheKey);
      console.log(`Cleared cache for role: ${role}`);
    } else {
      this.cache.clear();
      console.log('Cleared all statistics cache');
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Private method to get data from cache
   */
  private static getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Private method to set data in cache
   */
  private static setCache(key: string, data: any): void {
    // Clean up old cache entries if we're at the limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: this.CACHE_DURATION
    });
  }

  /**
   * Private method to cleanup old cache entries
   */
  private static cleanupCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    // Find expired entries
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.expiresIn) {
        entriesToDelete.push(key);
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(key => this.cache.delete(key));

    // If still at limit, delete oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = sortedEntries.slice(0, this.cache.size - this.MAX_CACHE_SIZE + 1);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }
}

// Export utility functions for common statistics operations
export const StatisticsUtils = {
  /**
   * Calculate percentage change between two values
   */
  calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  },

  /**
   * Format statistics for display
   */
  formatStatistics(stats: any): any {
    if (!stats) return null;

    return {
      ...stats,
      formatted: {
        total_requests: stats.total_requests?.toLocaleString() || '0',
        draft: stats.draft?.toLocaleString() || '0',
        submitted: stats.submitted?.toLocaleString() || '0',
        classified: stats.classified?.toLocaleString() || '0',
        approved: stats.approved?.toLocaleString() || '0',
        in_registry: stats.in_registry?.toLocaleString() || '0',
        rejected: stats.rejected?.toLocaleString() || '0',
        overdue: stats.overdue?.toLocaleString() || '0'
      }
    };
  },

  /**
   * Get role-specific badge colors
   */
  getRoleBadgeColor(role: UserRole, count: number): string {
    if (count === 0) return 'bg-gray-100 text-gray-600';
    
    switch (role) {
      case 'executor':
        return 'bg-blue-100 text-blue-800';
      case 'registrar':
        return 'bg-orange-100 text-orange-800';
      case 'distributor':
        return 'bg-green-100 text-green-800';
      case 'treasurer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  },

  /**
   * Get priority color based on count
   */
  getPriorityColor(count: number): string {
    if (count === 0) return 'text-gray-500';
    if (count < 5) return 'text-green-600';
    if (count < 10) return 'text-yellow-600';
    return 'text-red-600';
  }
};

export default StatisticsService;
