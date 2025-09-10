// Main API Services Export
// This file provides a centralized export point for all API services and utilities

// Re-export all services from index
export { PaymentRequestService } from './paymentRequestService';
export { DictionaryApiService } from './dictionaryApiService';
export { PaymentRegisterService } from './paymentRegisterService';
export { UserService } from './userService';
export { FileService } from './fileService';
export { DistributorService } from './distributorService';
export { httpClient, API_CONFIG } from './httpClient';

// Import API_CONFIG for use in ENHANCED_API_CONFIG
import { API_CONFIG } from './httpClient';

// Re-export existing services
export { DictionaryService } from './dictionaries/dictionaryService';
export { StatisticsService } from './statisticsService';

// Legacy exports for backward compatibility
export { PaymentRequestService as PaymentRequestApiService } from './paymentRequestService';
export { DictionaryApiService as ApiDictionaryService } from './dictionaryApiService';
export { PaymentRegisterService as RegisterService } from './paymentRegisterService';

// API Mode Management
// Global state for API mode (mock vs real API)
let useMockData = true; // Default to mock data

/**
 * Toggle between mock data and real API
 * @param mockMode - true for mock data, false for real API
 */
export const toggleApiMode = (mockMode: boolean): void => {
  useMockData = mockMode;
  console.log(`API mode switched to: ${mockMode ? 'MOCK' : 'API'}`);
  
  // Store preference in localStorage
  localStorage.setItem('api_mode', mockMode ? 'mock' : 'api');
};

/**
 * Get current API mode status
 * @returns object with current API mode information
 */
export const getApiStatus = (): { useMockData: boolean; mode: 'mock' | 'api' } => {
  return {
    useMockData,
    mode: useMockData ? 'mock' : 'api'
  };
};

/**
 * Initialize API mode from localStorage on app start
 */
export const initializeApiMode = (): void => {
  const savedMode = localStorage.getItem('api_mode');
  if (savedMode) {
    useMockData = savedMode === 'mock';
  }
};

// Enhanced API_CONFIG with mock data flag
export const ENHANCED_API_CONFIG = {
  ...API_CONFIG,
  get USE_MOCK_DATA() {
    return useMockData;
  }
};

// Initialize API mode on module load
initializeApiMode();
