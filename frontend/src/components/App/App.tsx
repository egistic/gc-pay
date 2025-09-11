import React, { useEffect } from 'react';
import { initCSSPolyfills } from '../../utils/browserPolyfills';
import { Header } from '../layout/Header';
import { Navigation } from '../layout/Navigation';
import { AppRouter } from './AppRouter';
import { DictionaryProvider } from '../../context/DictionaryContext';
import { AppStateProvider, useAppState, appActions } from '../../context/AppStateContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { useApiMode } from '../../hooks/useApiMode';
import { useRoleSync } from '../../hooks/useRoleSync';
import { ENHANCED_API_CONFIG } from '../../services/api';
import { Toaster } from '../ui/sonner';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { navItems } from '../layout/Navigation';
import { useAuth } from '../../context/AuthContext';

// Main App Content Component
interface AppContentProps {
  logout: () => void;
}

function AppContent({ logout }: AppContentProps) {
  const { state, dispatch } = useAppState();
  const { loadInitialData } = useApiOperations();
  const { handleToggleApiMode } = useApiMode();
  
  // Sync role from AuthContext to AppState
  useRoleSync();

  // Initialize browser polyfills and error handling
  useEffect(() => {
    initCSSPolyfills();
    
    // Add global error handler for CSS-related errors
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('CSSScopeRule')) {
        console.warn('CSSScopeRule error caught and handled:', event.message);
        event.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Show loading if still loading initial data
  if (state.isLoading && !state.currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <DictionaryProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        <Header
          currentRole={state.currentRole}
          onRoleChange={(role) => dispatch(appActions.setCurrentRole(role))}
          userName={state.currentUser?.full_name || 'Пользователь'}
          onLogout={logout}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <div className="hidden md:block">
            <Navigation
              currentPage={state.currentPage}
              onPageChange={(page) => dispatch(appActions.setCurrentPage(page))}
              currentRole={state.currentRole}
              currentUser={state.currentUser}
              isCreatingRequest={state.showCreateForm}
              paymentRequests={state.paymentRequests}
              onFilterChange={(filter) => dispatch(appActions.setDashboardFilter(filter))}
            />
          </div>
          
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
              <AppRouter />
            </div>
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <div className="md:hidden border-t bg-white p-2">
          <div className="flex justify-around">
            {navItems.filter(item => item.roles.includes(state.currentRole)).slice(0, 4).map(item => (
              <Button
                key={item.id}
                variant={state.currentPage === item.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex-col h-auto py-2 px-3",
                  state.showCreateForm && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                  if (state.showCreateForm) {
                    toast.warning('Завершите создание заявки или сохраните черновик перед переходом', {
                      duration: 4000
                    });
                    return;
                  }
                  dispatch(appActions.setCurrentPage(item.id));
                }}
                disabled={state.showCreateForm}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Toaster position="top-right" />
      </div>
    </DictionaryProvider>
  );
}

// Main App Component with Providers
export default function App() {
  return (
    <AppStateProvider>
      <AppContentWithAuth />
    </AppStateProvider>
  );
}

// Component that has access to AuthContext
function AppContentWithAuth() {
  const { logout } = useAuth();
  return <AppContent logout={logout} />;
}
