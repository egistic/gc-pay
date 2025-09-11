import { 
  PaymentRequest, 
  ExpenseSplit,
  PaymentAllocation,
  UserRole,
  PaymentRequestExtended
} from '../types';
import { httpClient, API_CONFIG } from './httpClient';
import { generateRequestNumber } from '../utils/generators';
import { 
  toFrontendRequest, 
  toFrontendRequestList, 
  toFrontendRequestListItemList,
  toFrontendStatistics 
} from '../features/payment-requests/adapters/normalize';
import { BackendRequestOut, BackendRequestListOut, BackendStatistics } from '../features/payment-requests/models/BackendTypes';
import { toBackendStatus } from '../features/payment-requests/constants/status-map';

export class PaymentRequestService {
  static async getAll(filters?: {
    status?: string;
    role?: UserRole;
    dateFrom?: string;
    dateTo?: string;
    responsibleRegistrarId?: string;
  }): Promise<PaymentRequest[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.role) queryParams.append('role', filters.role);
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters?.responsibleRegistrarId) queryParams.append('responsible_registrar_id', filters.responsibleRegistrarId);
    
    const endpoint = `${API_CONFIG.endpoints.getPaymentRequests}?${queryParams}`;
    const backendResponse = await httpClient.get<BackendRequestListOut[]>(endpoint);
    
    // Use adapter to normalize data
    try {
      const normalizedData = toFrontendRequestListItemList(backendResponse);
      return normalizedData;
    } catch (error) {
      console.error('Error normalizing data:', error);
      console.error('Backend response:', backendResponse);
      return [];
    }
  }
  
  static async getById(id: string): Promise<PaymentRequest | null> {
    const endpoint = API_CONFIG.endpoints.getPaymentRequest.replace(':id', id);
    const backendResponse = await httpClient.get<BackendRequestOut>(endpoint);
    
    // Use adapter to normalize data
    return toFrontendRequest(backendResponse);
  }
  
  static async create(request: Partial<PaymentRequest>): Promise<PaymentRequest> {
    // Add validation to prevent creating drafts with incomplete data
    if (request.status === 'draft' && (!request.counterpartyId || !request.dueDate)) {
      throw new Error('Cannot create draft without required fields (counterpartyId and dueDate)');
    }
    
    // Map frontend data to backend format
    const backendRequest = await this.mapFrontendToBackend(request);
    const backendResponse = await httpClient.post<BackendRequestOut>(API_CONFIG.endpoints.createPaymentRequest, backendRequest);
    
    // Use adapter to normalize data
    return toFrontendRequest(backendResponse);
  }

  static async update(id: string, request: Partial<PaymentRequest>): Promise<PaymentRequest> {
    // Map frontend data to backend format
    const backendRequest = await this.mapFrontendToBackend(request);
    const endpoint = API_CONFIG.endpoints.updatePaymentRequest.replace(':id', id);
    const backendResponse = await httpClient.put<BackendRequestOut>(endpoint, backendRequest);
    
    // Use adapter to normalize data
    return toFrontendRequest(backendResponse);
  }
  
  static async submit(
    id: string,
    comment?: string
  ): Promise<PaymentRequest> {
    const endpoint = API_CONFIG.endpoints.submitRequest.replace(':id', id);
    const backendResponse = await httpClient.post<BackendRequestOut>(endpoint, { comment });
    return toFrontendRequest(backendResponse);
  }
  
  static async classify(
    id: string, 
    splits: ExpenseSplit[], 
    comment?: string
  ): Promise<PaymentRequest> {
    const endpoint = API_CONFIG.endpoints.classifyRequest.replace(':id', id);
    
    // Map frontend expense splits to backend format
    const expense_splits = splits.map(split => ({
      article_id: split.expenseItemId,
      amount: split.amount,
      comment: split.comment || null
    }));
    
    const backendResponse = await httpClient.post<BackendRequestOut>(endpoint, { 
      comment: comment || null,
      expense_splits
    });
    return toFrontendRequest(backendResponse);
  }
  
  static async approve(
    id: string,
    allocations: PaymentAllocation[],
    priority?: string,
    comment?: string
  ): Promise<PaymentRequest> {
    const endpoint = API_CONFIG.endpoints.approveRequest.replace(':id', id);
    const backendResponse = await httpClient.post<BackendRequestOut>(endpoint, { comment });
    return toFrontendRequest(backendResponse);
  }
  
  static async updateStatus(
    id: string,
    status: string,
    executionData?: any
  ): Promise<PaymentRequest> {
    const endpoint = API_CONFIG.endpoints.updatePaymentRequest.replace(':id', id);
    return httpClient.patch<PaymentRequest>(endpoint, { status, executionData });
  }
  
  static async addToRegistry(
    id: string,
    comment?: string
  ): Promise<PaymentRequest> {
    const endpoint = API_CONFIG.endpoints.addToRegistry.replace(':id', id);
    const backendResponse = await httpClient.post<BackendRequestOut>(endpoint, { comment });
    return toFrontendRequest(backendResponse);
  }
  
  static async returnRequest(id: string, comment: string): Promise<PaymentRequest> {
    const endpoint = API_CONFIG.endpoints.rejectRequest.replace(':id', id);
    const backendResponse = await httpClient.post<BackendRequestOut>(endpoint, { comment });
    return toFrontendRequest(backendResponse);
  }
  
  static async sendToDistributor(
    id: string, 
    splits: ExpenseSplit[], 
    comment?: string
  ): Promise<PaymentRequest> {
    const endpoint = API_CONFIG.endpoints.sendToDistributor.replace(':id', id);
    
    // Map frontend expense splits to backend format
    const expense_splits = splits.map(split => ({
      article_id: split.expenseItemId,
      amount: split.amount,
      comment: split.comment || null
    }));
    
    const backendResponse = await httpClient.post<BackendRequestOut>(endpoint, { 
      comment: comment || null,
      expense_splits
    });
    return toFrontendRequest(backendResponse);
  }
  
  static async distributorAction(
    id: string,
    action: 'approve' | 'decline' | 'return',
    comment?: string,
    allocations?: any[],
    priority?: string
  ): Promise<PaymentRequest> {
    const endpoint = API_CONFIG.endpoints.distributorAction.replace(':id', id);
    const backendResponse = await httpClient.post<BackendRequestOut>(endpoint, { 
      action,
      comment,
      allocations: allocations || [],
      priority
    });
    return toFrontendRequest(backendResponse);
  }
  
  static getStatusActionLabel(status: string): string {
    switch (status) {
      case 'in-register': return 'Включена в реестр на оплату';
      case 'approved-for-payment': return 'Утверждена к оплате';
      case 'paid-full': return 'Оплачена полностью';
      case 'paid-partial': return 'Оплачена частично';
      case 'declined': return 'Отклонена';
      case 'cancelled': return 'Аннулирована';
      default: return 'Статус обновлен';
    }
  }

  // Map frontend PaymentRequest to backend format
  private static async mapFrontendToBackend(request: Partial<PaymentRequest>): Promise<any> {
    
    // Fix amount handling - ensure it's properly converted
    const amount = Number(request.amount) || 0;
    
    // For draft status, allow amount to be 0 or undefined
    if (request.status !== 'draft' && amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Fix description concatenation - use comma separator instead of newline
    const description = [
      request.expenseCategory && `Статья расходов: ${request.expenseCategory}`,
      request.productService && `Товар/услуга: ${request.productService}`,
      request.volume && `Объем: ${request.volume}`,
      request.priceRate && `Цена/тариф: ${request.priceRate}`,
      request.period && `Период: ${request.period}`
    ].filter(Boolean).join(', '); // Use comma separator instead of newline

    // Create a single line item from the frontend data
    const lines = [];
    
    // Create a line item if amount exists and is greater than 0, or if it's a draft
    if ((request.amount !== undefined && request.amount !== null && amount > 0) || request.status === 'draft') {
      lines.push({
        article_id: "8e1ff15d-79ea-48a6-ba30-59f64dcc9f6d", // First available expense article ID
        executor_position_id: "27a48e7e-0e8b-4124-95b1-a37e6ae2bbb6", // Исполнитель position ID
        quantity: 1, // Default quantity
        amount_net: amount || 0, // Use properly converted amount, default to 0 for drafts
        vat_rate_id: "55689349-dfc3-42ce-8f86-e473e2e00477", // 0% VAT rate ID
        currency_code: request.currency || 'KZT',
        note: description || 'Черновик заявки' // Use concatenated description
      });
    }

    // Validate required fields (only for non-draft requests)
    if (request.status !== 'draft') {
      if (!request.counterpartyId) {
        throw new Error('Counterparty ID is required');
      }
      if (!request.currency) {
        throw new Error('Currency is required');
      }
      if (!request.dueDate) {
        throw new Error('Due date is required');
      }
    }

    // Build backend request with required fields
    const backendRequest: any = {
      title: description || 'Черновик заявки',
      currency_code: request.currency || 'KZT',
      files: request.files || [],
      lines: lines,
      counterparty_id: request.counterpartyId, // Required field
      due_date: request.dueDate, // Required field
      amount_total: amount, // Include total amount
      vat_total: 0 // Default VAT total
    };

    // Add optional fields that have values
    if (request.requestNumber) {
      backendRequest.number = request.requestNumber;
    }
    if (request.expenseCategory) {
      backendRequest.expense_article_text = request.expenseCategory;
    }
    if (request.docNumber) {
      backendRequest.doc_number = request.docNumber;
    }
    if (request.docDate) {
      backendRequest.doc_date = request.docDate;
    }
    if (request.docType) {
      backendRequest.doc_type = request.docType;
    }
    if (request.payingCompany) {
      backendRequest.paying_company = request.payingCompany;
    }
    if (request.counterpartyCategory) {
      backendRequest.counterparty_category = request.counterpartyCategory;
    }
    if (request.vatRate) {
      backendRequest.vat_rate = request.vatRate;
    }
    if (request.productService) {
      backendRequest.product_service = request.productService;
    }
    if (request.volume) {
      backendRequest.volume = request.volume;
    }
    if (request.priceRate) {
      backendRequest.price_rate = request.priceRate;
    }
    if (request.period) {
      backendRequest.period = request.period;
    }

    return backendRequest;
  }


  // Statistics methods
  static async getStatistics(role?: string, userId?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (role) queryParams.append('role', role);
    if (userId) queryParams.append('user_id', userId);
    
    const endpoint = `${API_CONFIG.endpoints.getRequestStatistics}?${queryParams}`;
    const backendResponse = await httpClient.get<BackendStatistics>(endpoint);
    return toFrontendStatistics(backendResponse);
  }

  static async getDashboardMetrics(role: string, userId?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('role', role);
    if (userId) queryParams.append('user_id', userId);
    
    const endpoint = `${API_CONFIG.endpoints.getDashboardMetrics}?${queryParams}`;
    const backendResponse = await httpClient.get<BackendStatistics>(endpoint);
    return toFrontendStatistics(backendResponse);
  }

  // Get request events for a specific request
  static async getRequestEvents(requestId: string): Promise<any[]> {
    const endpoint = API_CONFIG.endpoints.getRequestEvents.replace(':id', requestId);
    return httpClient.get<any[]>(endpoint);
  }
}
