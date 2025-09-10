import { 
  DistributorBinding,
  Contract,
  UserRole,
  PaymentRequestExtended
} from '../types';
import { httpClient, API_CONFIG } from './httpClient';
import { PaymentRequestService } from './paymentRequestService';

export class DistributorService {
  static async getBindings(filters?: {
    expenseItemId?: string;
    active?: boolean;
    date?: string;
  }): Promise<DistributorBinding[]> {
    const queryParams = new URLSearchParams();
    if (filters?.expenseItemId) queryParams.append('expenseItemId', filters.expenseItemId);
    if (filters?.active !== undefined) queryParams.append('active', filters.active.toString());
    if (filters?.date) queryParams.append('date', filters.date);
    
    const endpoint = `${API_CONFIG.endpoints.getDistributorBindings}?${queryParams}`;
    return httpClient.get<DistributorBinding[]>(endpoint);
  }
  
  static async createBinding(binding: Omit<DistributorBinding, 'id' | 'createdAt' | 'updatedAt'>): Promise<DistributorBinding> {
    return httpClient.post<DistributorBinding>(API_CONFIG.endpoints.createDistributorBinding, binding);
  }
  
  static async updateBinding(id: string, binding: Partial<DistributorBinding>): Promise<DistributorBinding> {
    const endpoint = API_CONFIG.endpoints.updateDistributorBinding.replace(':id', id);
    return httpClient.put<DistributorBinding>(endpoint, binding);
  }
  
  static async deleteBinding(id: string): Promise<void> {
    const endpoint = API_CONFIG.endpoints.deleteDistributorBinding.replace(':id', id);
    return httpClient.delete<void>(endpoint);
  }
  
  static async getContractsByExpenseItem(
    counterpartyId: string, 
    expenseItemId: string, 
    active = true
  ): Promise<Contract[]> {
    const queryParams = new URLSearchParams({
      counterpartyId,
      expenseItemId,
      active: active.toString()
    });
    
    const endpoint = `${API_CONFIG.endpoints.getCounterparties}?${queryParams}`; // Assuming contracts endpoint
    return httpClient.get<Contract[]>(endpoint);
  }
  
  static async getRequestsWithChiefAssignment(
    role: UserRole,
    assignedToMe = false
  ): Promise<PaymentRequestExtended[]> {
    const requests = await PaymentRequestService.getAll({ role, status: 'classified' });
    const bindings = await this.getBindings({ active: true, date: new Date().toISOString().split('T')[0] });
    
    return requests.map(request => {
      const assignedBinding = bindings.find(binding =>
        request.expenseSplits.some(split => split.expenseItemId === binding.expenseItemId)
      );
      
      return {
        ...request,
        isAssignedToChief: !!assignedBinding,
        chiefDistributorName: assignedBinding ? 'Иванов И.И.' : undefined,
        assignmentReason: assignedBinding ? `Привязка к статье расходов` : undefined
      };
    });
  }
}
