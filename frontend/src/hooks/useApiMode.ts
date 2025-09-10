import { useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { useAppState, appActions } from '../context/AppStateContext';
import { PaymentRequestService } from '../services/api';
import { toggleApiMode, getApiStatus } from '../services/api';

export function useApiMode() {
  const { state, dispatch } = useAppState();

  const handleToggleApiMode = useCallback(async (useMockData: boolean) => {
    console.log('Toggle API mode requested:', useMockData);
    toggleApiMode(useMockData);
    toast.info(`Переключено на ${useMockData ? 'mock' : 'API'} режим`);
    
    // Reload data after toggle
    if (state.currentUser) {
      try {
        const requests = await PaymentRequestService.getAll({ role: state.currentRole });
        dispatch(appActions.setPaymentRequests(requests));
      } catch (error) {
        console.error('Failed to reload after API mode toggle:', error);
        toast.error('Ошибка загрузки после переключения режима');
      }
    }
  }, [state.currentUser, state.currentRole, dispatch]);

  const getApiStatusInfo = useCallback(() => {
    return getApiStatus();
  }, []);

  return {
    handleToggleApiMode,
    getApiStatusInfo,
  };
}
