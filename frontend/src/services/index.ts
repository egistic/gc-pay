// Main API Services Export
export { PaymentRequestService } from './paymentRequestService';
export { DictionaryApiService } from './dictionaryApiService';
export { PaymentRegisterService } from './paymentRegisterService';
export { UserService } from './userService';
export { FileService } from './fileService';
export { DistributorService } from './distributorService';
export { httpClient, API_CONFIG } from './httpClient';

// Re-export existing services
export { DictionaryService } from './dictionaries/dictionaryService';
export { StatisticsService } from './statisticsService';

// Legacy exports for backward compatibility
export { PaymentRequestService as PaymentRequestApiService } from './paymentRequestService';
export { DictionaryApiService as ApiDictionaryService } from './dictionaryApiService';
export { PaymentRegisterService as RegisterService } from './paymentRegisterService';
