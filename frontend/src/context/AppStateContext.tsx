import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { UserRole, PaymentRequest } from '../types';

// App State Interface
export interface AppState {
  currentUser: any | null;
  currentRole: UserRole;
  currentPage: string;
  showCreateForm: boolean;
  selectedRequestId: string | null;
  viewMode: 'list' | 'classify' | 'classify-items' | 'approve' | 'register' | 'treasurer-approve' | 'view';
  dashboardFilter: string | null;
  isLoading: boolean;
  paymentRequests: PaymentRequest[];
}

// Action Types
export type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: any }
  | { type: 'SET_CURRENT_ROLE'; payload: UserRole }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_SHOW_CREATE_FORM'; payload: boolean }
  | { type: 'SET_SELECTED_REQUEST_ID'; payload: string | null }
  | { type: 'SET_VIEW_MODE'; payload: AppState['viewMode'] }
  | { type: 'SET_DASHBOARD_FILTER'; payload: string | null }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'SET_PAYMENT_REQUESTS'; payload: PaymentRequest[] }
  | { type: 'UPDATE_PAYMENT_REQUEST'; payload: PaymentRequest }
  | { type: 'ADD_PAYMENT_REQUEST'; payload: PaymentRequest }
  | { type: 'RESET_FORM_STATE' }
  | { type: 'RESET_ROLE_STATE' };

// Initial State
const initialState: AppState = {
  currentUser: null,
  currentRole: 'executor',
  currentPage: 'dashboard',
  showCreateForm: false,
  selectedRequestId: null,
  viewMode: 'list',
  dashboardFilter: null,
  isLoading: true,
  paymentRequests: [],
};

// Reducer
function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    case 'SET_CURRENT_ROLE':
      return { ...state, currentRole: action.payload };
    
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    
    case 'SET_SHOW_CREATE_FORM':
      return { ...state, showCreateForm: action.payload };
    
    case 'SET_SELECTED_REQUEST_ID':
      return { ...state, selectedRequestId: action.payload };
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    
    case 'SET_DASHBOARD_FILTER':
      return { ...state, dashboardFilter: action.payload };
    
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_PAYMENT_REQUESTS':
      return { ...state, paymentRequests: action.payload };
    
    case 'UPDATE_PAYMENT_REQUEST':
      return {
        ...state,
        paymentRequests: state.paymentRequests.map(r => 
          r.id === action.payload.id ? action.payload : r
        )
      };
    
    case 'ADD_PAYMENT_REQUEST':
      return {
        ...state,
        paymentRequests: [action.payload, ...state.paymentRequests]
      };
    
    case 'RESET_FORM_STATE':
      return {
        ...state,
        showCreateForm: false,
        selectedRequestId: null,
        viewMode: 'list'
      };
    
    case 'RESET_ROLE_STATE':
      return {
        ...state,
        currentPage: 'dashboard',
        showCreateForm: false,
        viewMode: 'list',
        selectedRequestId: null,
        dashboardFilter: null
      };
    
    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider Component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom Hook
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// Action Creators
export const appActions = {
  setCurrentUser: (user: any) => ({ type: 'SET_CURRENT_USER' as const, payload: user }),
  setCurrentRole: (role: UserRole) => ({ type: 'SET_CURRENT_ROLE' as const, payload: role }),
  setCurrentPage: (page: string) => ({ type: 'SET_CURRENT_PAGE' as const, payload: page }),
  setShowCreateForm: (show: boolean) => ({ type: 'SET_SHOW_CREATE_FORM' as const, payload: show }),
  setSelectedRequestId: (id: string | null) => ({ type: 'SET_SELECTED_REQUEST_ID' as const, payload: id }),
  setViewMode: (mode: AppState['viewMode']) => ({ type: 'SET_VIEW_MODE' as const, payload: mode }),
  setDashboardFilter: (filter: string | null) => ({ type: 'SET_DASHBOARD_FILTER' as const, payload: filter }),
  setIsLoading: (loading: boolean) => ({ type: 'SET_IS_LOADING' as const, payload: loading }),
  setPaymentRequests: (requests: PaymentRequest[]) => ({ type: 'SET_PAYMENT_REQUESTS' as const, payload: requests }),
  updatePaymentRequest: (request: PaymentRequest) => ({ type: 'UPDATE_PAYMENT_REQUEST' as const, payload: request }),
  addPaymentRequest: (request: PaymentRequest) => ({ type: 'ADD_PAYMENT_REQUEST' as const, payload: request }),
  resetFormState: () => ({ type: 'RESET_FORM_STATE' as const }),
  resetRoleState: () => ({ type: 'RESET_ROLE_STATE' as const }),
};
