import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppState, appActions } from '../context/AppStateContext';
import { UserRole } from '../types';
import { PaymentRequestService } from '../services/api';

export const useRoleSync = () => {
  const { user, isAuthenticated } = useAuth();
  const { dispatch } = useAppState();

  useEffect(() => {
    if (isAuthenticated && user && user.is_active) {
      // Check if user has roles assigned
      if (user.roles && user.roles.length > 0) {
        // Get the primary role or the first role
        const primaryRole = user.roles.find(role => role.is_primary) || user.roles[0];
        
        // Map backend role code to frontend UserRole type
        const roleMapping: Record<string, UserRole> = {
          'ADMIN': 'ADMIN',
          'REGISTRAR': 'REGISTRAR',
          'SUB_REGISTRAR': 'SUB_REGISTRAR',
          'DISTRIBUTOR': 'DISTRIBUTOR',
          'TREASURER': 'TREASURER',
          'EXECUTOR': 'EXECUTOR',
        };

        const frontendRole = roleMapping[primaryRole.code] || 'EXECUTOR';
        
        // Update the current role in AppState
        dispatch(appActions.setCurrentRole(frontendRole));
        
        // Update the current user
        dispatch(appActions.setCurrentUser(user));
        
        // Load payment requests for the new role
        PaymentRequestService.getAll({ role: frontendRole })
          .then(requests => {
            dispatch(appActions.setPaymentRequests(requests));
          })
          .catch(error => {
            console.error('useRoleSync: failed to load payment requests:', error);
          });
      } else {
        // User has no roles assigned - show as executor but with warning
        console.warn('User has no roles assigned, defaulting to EXECUTOR');
        dispatch(appActions.setCurrentRole('EXECUTOR'));
        dispatch(appActions.setCurrentUser(user));
        
        // Load payment requests for executor role
        PaymentRequestService.getAll({ role: 'EXECUTOR' })
          .then(requests => {
            dispatch(appActions.setPaymentRequests(requests));
          })
          .catch(error => {
            console.error('useRoleSync: failed to load payment requests:', error);
          });
      }
    } else if (!isAuthenticated || (user && !user.is_active)) {
      // Reset to default role when not authenticated or user is inactive
      dispatch(appActions.setCurrentRole('EXECUTOR'));
      dispatch(appActions.setCurrentUser(null));
    }
  }, [user, isAuthenticated, dispatch]);
};
