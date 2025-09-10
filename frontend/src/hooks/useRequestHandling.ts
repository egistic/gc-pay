import { useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { useAppState, appActions } from '../context/AppStateContext';
import { UserRole, PaymentRequest } from '../types';

export function useRequestHandling() {
  const { state, dispatch } = useAppState();

  const handleCreateRequest = useCallback(() => {
    if (state.currentRole === 'executor') {
      dispatch(appActions.setShowCreateForm(true));
    }
  }, [state.currentRole, dispatch]);

  const handleViewRequest = useCallback((id: string) => {
    dispatch(appActions.setSelectedRequestId(id));
    
    const request = state.paymentRequests.find(r => r.id === id);
    
    if (state.currentRole === 'executor') {
      dispatch(appActions.setCurrentPage('requests'));
      
      // If it's a draft, open it for editing
      if (request && request.status === 'draft') {
        dispatch(appActions.setShowCreateForm(true));
      } else {
        dispatch(appActions.setViewMode('view'));
      }
    } else if (state.currentRole === 'registrar') {
      dispatch(appActions.setCurrentPage('requests'));
      if (request && request.status === 'submitted') {
        dispatch(appActions.setViewMode('classify-items')); // Use new item classification form
      } else {
        // Allow viewing any request for registrar
        dispatch(appActions.setViewMode('view'));
      }
    } else if (state.currentRole === 'distributor') {
      dispatch(appActions.setCurrentPage('requests'));
      if (request && request.status === 'classified') {
        dispatch(appActions.setViewMode('approve'));
      } else {
        // Allow viewing any request for distributor
        dispatch(appActions.setViewMode('view'));
      }
    } else if (state.currentRole === 'treasurer') {
      if (request && ['approved', 'in-register', 'approved-for-payment'].includes(request.status)) {
        dispatch(appActions.setCurrentPage('requests'));
        dispatch(appActions.setViewMode('treasurer-approve'));
      } else {
        toast.info('Заявка не требует обработки казначеем');
      }
    }
  }, [state.currentRole, state.paymentRequests, dispatch]);

  const handleRequestUpdate = useCallback((updatedRequest: PaymentRequest) => {
    dispatch(appActions.updatePaymentRequest(updatedRequest));
  }, [dispatch]);

  return {
    handleCreateRequest,
    handleViewRequest,
    handleRequestUpdate,
  };
}
