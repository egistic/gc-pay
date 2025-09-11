import { DictionaryItem } from '../../types/dictionaries';

/**
 * Cache entry interface
 */
interface CacheEntry {
  value: any;
  expiresAt: number;
  tags: string[];
}

/**
 * Cache Manager for Dictionary Service
 */
export class DictionaryCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private maxSize: number = 1000; // Maximum number of entries

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number, tags: string[] = []): void {
    // Check cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt, tags });
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate keys by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate keys by tags
   */
  invalidateByTags(tags: string[]): void {
    for (const [key, entry] of this.cache.entries()) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; expiresAt: number; tags: string[] }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresAt: entry.expiresAt,
      tags: entry.tags
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Implement hit rate tracking
      entries
    };
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    // Remove 10% of oldest entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}

/**
 * Cache key generators
 */
export class CacheKeys {
  static dictionaryItems(type: string): string {
    return `dictionary:${type}:items`;
  }

  static dictionaryItem(type: string, id: string): string {
    return `dictionary:${type}:item:${id}`;
  }

  static dictionarySearch(type: string, query: string): string {
    return `dictionary:${type}:search:${query}`;
  }

  static dictionaryFilter(type: string, filters: Record<string, any>): string {
    const filterKey = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    return `dictionary:${type}:filter:${filterKey}`;
  }

  static dictionaryStatistics(type: string): string {
    return `dictionary:${type}:statistics`;
  }
}

/**
 * Cache tags
 */
export const CacheTags = {
  DICTIONARY: 'dictionary',
  EXPENSE_ITEMS: 'expense-articles',
  COUNTERPARTIES: 'counterparties',
  CURRENCIES: 'currencies',
  VAT_RATES: 'vat-rates',
  SEARCH: 'search',
  FILTER: 'filter',
  STATISTICS: 'statistics'
} as const;
