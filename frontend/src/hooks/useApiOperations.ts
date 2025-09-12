import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAppState, appActions } from '../context/AppStateContext';
import { PaymentRequestService, UserService } from '../services/api';
import { UserRole, PaymentRequest, ExpenseSplit, PaymentAllocation } from '../types';

export function useApiOperations() {
  const { state, dispatch } = useAppState();

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      dispatch(appActions.setIsLoading(true));
      
      const user = await UserService.getCurrentUser();
      
      // Only set user if they are active
      if (user && user.is_active) {
        dispatch(appActions.setCurrentUser(user));
      } else {
        dispatch(appActions.setCurrentUser(null));
      }
      // Note: currentRole will be set by useRoleSync hook
      
      // Load payment requests - will be loaded after role is set by useRoleSync
      // Note: Payment requests will be loaded by useRoleSync after role is set
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error(`Ошибка загрузки данных: ${error.message || error}`);
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [dispatch]);

  // Load requests for specific role
  const loadRequestsForRole = useCallback(async (role: UserRole) => {
    try {
      console.log('Loading requests for role change:', role);
      const requests = await PaymentRequestService.getAll({ role });
      console.log('Requests loaded for role:', role, requests.length);
      dispatch(appActions.setPaymentRequests(requests));
    } catch (error) {
      console.error('Failed to load requests for role:', role, error);
      toast.error(`Ошибка загрузки заявок для роли ${getRoleLabel(role)}: ${error.message || error}`);
    }
  }, [dispatch]);

  // Submit request
  const submitRequest = useCallback(async (request: Partial<PaymentRequest>) => {
    try {
      dispatch(appActions.setIsLoading(true));
      
      const userId = state.currentUser?.id || 'dev-user-123';
      
      if (state.selectedRequestId && request.id) {
        // Update existing request
        const updatedRequest = await PaymentRequestService.update(state.selectedRequestId, request);
        dispatch(appActions.updatePaymentRequest(updatedRequest));
        
        if (request.status === 'draft') {
          toast.success(`Черновик заявки ${updatedRequest.requestNumber} успешно обновлен`);
        } else {
          toast.success(`Заявка ${updatedRequest.requestNumber} успешно обновлена и отправлена на регистрацию`);
        }
      } else {
        // Create new request
        const newRequest = await PaymentRequestService.create(request);
        dispatch(appActions.addPaymentRequest(newRequest));
        
        if (request.status === 'draft') {
          toast.success(`Черновик заявки ${newRequest.requestNumber} успешно сохранен`);
        } else {
          toast.success(`Заявка ${newRequest.requestNumber} успешно создана и отправлена на регистрацию`);
        }
      }
      
      dispatch(appActions.resetFormState());
      dispatch(appActions.setCurrentPage('requests'));
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error(request.status === 'draft' ? 'Ошибка сохранения черновика' : 'Ошибка создания заявки');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.currentUser, state.selectedRequestId, dispatch]);

  // Save draft
  const saveDraft = useCallback(async (request: Partial<PaymentRequest>) => {
    try {
      dispatch(appActions.setIsLoading(true));
      
      const userId = state.currentUser?.id || 'dev-user-123';
      
      if (state.selectedRequestId && request.id) {
        // Update existing draft
        const updatedDraft = await PaymentRequestService.update(state.selectedRequestId, {
          ...request,
          status: 'draft'
        });
        dispatch(appActions.updatePaymentRequest(updatedDraft));
        toast.success(`Черновик заявки ${updatedDraft.requestNumber} успешно обновлен`);
      } else {
        // Create new draft
        const draftRequest = await PaymentRequestService.create({
          ...request,
          status: 'draft'
        });
        dispatch(appActions.addPaymentRequest(draftRequest));
        toast.success(`Черновик заявки ${draftRequest.requestNumber} успешно сохранен`);
      }
      
      dispatch(appActions.resetFormState());
      dispatch(appActions.setCurrentPage('requests'));
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Ошибка сохранения черновика');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.currentUser, state.selectedRequestId, dispatch]);

  // Classify request
  const classifyRequest = useCallback(async (splits: ExpenseSplit[], comment?: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.classify(state.selectedRequestId, splits, comment);
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      dispatch(appActions.setCurrentPage('dashboard'));
      toast.success('Заявка классифицирована и отправлена распорядителю');
    } catch (error) {
      console.error('Failed to classify request:', error);
      toast.error('Ошибка классификации заявки');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  // Classify request with items
  const classifyRequestWithItems = useCallback(async (expenseSplits: ExpenseSplit[], comment?: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      // First classify the request
      const classifiedRequest = await PaymentRequestService.classify(state.selectedRequestId, expenseSplits, comment);
      dispatch(appActions.updatePaymentRequest(classifiedRequest));
      
      // Then send to distributor
      const sentRequest = await PaymentRequestService.sendToDistributor(state.selectedRequestId, expenseSplits, comment);
      dispatch(appActions.updatePaymentRequest(sentRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      dispatch(appActions.setCurrentPage('dashboard'));
      toast.success('Заявка классифицирована и отправлена распорядителю для проверки контрактов и нормативов');
    } catch (error) {
      console.error('Failed to classify and send request to distributor:', error);
      toast.error('Ошибка отправки заявки распорядителю');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  // Return request
  const returnRequest = useCallback(async (comment: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.returnRequest(state.selectedRequestId, comment);
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      dispatch(appActions.setCurrentPage('dashboard'));
      toast.success('Заявка возвращена');
    } catch (error) {
      console.error('Failed to return request:', error);
      toast.error('Ошибка возврата заявки');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  // Approve request
  const approveRequest = useCallback(async (allocations: PaymentAllocation[], priority: string, comment?: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.approve(
        state.selectedRequestId, 
        allocations, 
        priority, 
        comment
      );
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      toast.success('Заявка утверждена и отправлена казначею');
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Ошибка утверждения заявки');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  // Approve on behalf request
  const approveOnBehalfRequest = useCallback(async (allocations: PaymentAllocation[], priority: string, comment?: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.updateStatus(
        state.selectedRequestId, 
        'approved-on-behalf', 
        { 
          paymentAllocations: allocations,
          priority: priority,
          executionComment: comment 
        }
      );
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      toast.success('Заявка согласована по поручению руководства и отправлена казначею');
    } catch (error) {
      console.error('Failed to approve request on behalf:', error);
      toast.error('Ошибка согласования заявки по поручению');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  // Decline request
  const declineRequest = useCallback(async (comment: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.updateStatus(
        state.selectedRequestId, 
        'declined', 
        { executionComment: comment }
      );
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      toast.success('Заявка отклонена');
    } catch (error) {
      console.error('Failed to decline request:', error);
      toast.error('Ошибка отклонения заявки');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  // Treasurer update status
  const treasurerUpdateStatus = useCallback(async (status: string, executionData?: any) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.updateStatus(
        state.selectedRequestId, 
        status, 
        executionData
      );
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      toast.success(getStatusSuccessMessage(status));
    } catch (error) {
      console.error('Failed to update request status:', error);
      toast.error('Ошибка обновления статуса заявки');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  // Distributor actions
  const distributorApprove = useCallback(async (allocations: PaymentAllocation[], priority?: string, comment?: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.distributorAction(
        state.selectedRequestId, 
        'approve', 
        comment, 
        allocations, 
        priority
      );
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      toast.success('Заявка утверждена распорядителем и отправлена казначею');
    } catch (error) {
      console.error('Failed to approve request as distributor:', error);
      toast.error('Ошибка утверждения заявки распорядителем');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  const distributorDecline = useCallback(async (comment: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.distributorAction(
        state.selectedRequestId, 
        'decline', 
        comment
      );
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      toast.success('Заявка отклонена распорядителем');
    } catch (error) {
      console.error('Failed to decline request as distributor:', error);
      toast.error('Ошибка отклонения заявки распорядителем');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  const distributorReturn = useCallback(async (comment: string) => {
    if (!state.selectedRequestId) return;
    
    try {
      dispatch(appActions.setIsLoading(true));
      const updatedRequest = await PaymentRequestService.distributorAction(
        state.selectedRequestId, 
        'return', 
        comment
      );
      dispatch(appActions.updatePaymentRequest(updatedRequest));
      
      dispatch(appActions.setViewMode('list'));
      dispatch(appActions.setSelectedRequestId(null));
      toast.success('Заявка возвращена распорядителем регистратору');
    } catch (error) {
      console.error('Failed to return request as distributor:', error);
      toast.error('Ошибка возврата заявки регистратору');
    } finally {
      dispatch(appActions.setIsLoading(false));
    }
  }, [state.selectedRequestId, dispatch]);

  return {
    loadInitialData,
    loadRequestsForRole,
    submitRequest,
    saveDraft,
    classifyRequest,
    classifyRequestWithItems,
    returnRequest,
    approveRequest,
    approveOnBehalfRequest,
    declineRequest,
    treasurerUpdateStatus,
    distributorApprove,
    distributorDecline,
    distributorReturn,
  };
}

// Helper functions
function getRoleLabel(role: UserRole): string {
  const labels = {
    executor: 'Исполнитель',
    registrar: 'Регистратор', 
    distributor: 'Распорядитель',
    treasurer: 'Казначей',
    admin: 'Администратор'
  };
  return labels[role];
}

function getStatusSuccessMessage(status: string) {
  switch (status) {
    case 'in-register': return 'Платеж включен в реестр на оплату';
    case 'approved-for-payment': return 'Платеж утвержден к оплате';
    case 'paid-full': return 'Платеж отмечен как оплаченный полностью';
    case 'paid-partial': return 'Платеж отмечен как частично оплаченный';
    case 'declined': return 'Платеж отклонен';
    case 'cancelled': return 'Платеж аннулирован';
    default: return 'Статус платежа обновлен';
  }
}
