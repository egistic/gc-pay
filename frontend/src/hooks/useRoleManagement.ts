import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAppState, appActions } from '../context/AppStateContext';
import { useApiOperations } from './useApiOperations';
import { UserRole } from '../types';

export function useRoleManagement() {
  const { state, dispatch } = useAppState();
  const { loadRequestsForRole } = useApiOperations();

  const handleRoleChange = useCallback(async (role: UserRole) => {
    dispatch(appActions.setCurrentRole(role));
    dispatch(appActions.resetRoleState());
    toast.success(`Переключились на роль: ${getRoleLabel(role)}`);
    
    // Load requests for the new role
    await loadRequestsForRole(role);
  }, [dispatch, loadRequestsForRole]);

  const getRoleLabel = (role: UserRole): string => {
    const labels = {
      executor: 'Исполнитель',
      registrar: 'Регистратор', 
      distributor: 'Распорядитель',
      treasurer: 'Казначей',
      admin: 'Администратор'
    };
    return labels[role];
  };

  return {
    handleRoleChange,
    getRoleLabel,
  };
}
