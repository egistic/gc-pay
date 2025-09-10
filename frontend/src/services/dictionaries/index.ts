// Export all dictionary services and utilities
export { DictionaryService } from './dictionaryService';
export { DictionaryCacheManager, CacheKeys, CacheTags } from './cacheManager';
export { ValidationManager, BaseValidator } from './validationManager';
export { 
  DictionaryApiClient, 
  DictionaryApiEndpoints, 
  MockApiClient, 
  ApiError 
} from './apiClient';

// Re-export types for convenience
export type {
  DictionaryItem,
  DictionaryType,
  DictionaryHandler,
  ValidationResult,
  ValidationError,
  FilterState,
  PaginationState,
  DictionaryStatistics,
  ImportExportOptions,
  BulkAction
} from '../../types/dictionaries';
