// Environment configuration
export interface EnvironmentConfig {
  apiBaseUrl: string;
  environment: 'development' | 'production';
  debug: boolean;
}

// Get environment from Vite environment variables
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Get API base URL from environment variable or use default
const getApiBaseUrl = (): string => {
  // Check for Vite environment variable first
  const viteApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (viteApiUrl) {
    return viteApiUrl;
  }
  
  // Fallback to environment-based defaults
  if (isProduction) {
    return 'https://gcback.openlayers.kz';
  }
  
  return 'http://localhost:8000';
};

// Default configuration
const defaultConfig: EnvironmentConfig = {
  apiBaseUrl: 'http://localhost:8000',
  environment: 'development',
  debug: true,
};

// Production configuration
const productionConfig: EnvironmentConfig = {
  apiBaseUrl: 'https://gcback.openlayers.kz',
  environment: 'production',
  debug: false,
};

// Development configuration
const developmentConfig: EnvironmentConfig = {
  apiBaseUrl: 'http://localhost:8000',
  environment: 'development',
  debug: true,
};

// Get configuration based on environment
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const baseConfig = isProduction ? productionConfig : developmentConfig;
  
  return {
    ...baseConfig,
    apiBaseUrl: getApiBaseUrl(),
  };
};

// Export current configuration
export const ENV_CONFIG = getEnvironmentConfig();

// Log configuration in development
if (isDevelopment) {
  console.log('🌍 Environment Configuration:', ENV_CONFIG);
}
