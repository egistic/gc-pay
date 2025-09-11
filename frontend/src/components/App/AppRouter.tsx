import React from 'react';
import { useAppState, appActions } from '../../context/AppStateContext';
// import { useApiOperations } from '../../hooks/useApiOperations'; // Removed - using useRoleSync instead
import { useRoleManagement } from '../../hooks/useRoleManagement';
import { useRequestHandling } from '../../hooks/useRequestHandling';
import { useAuth } from '../../context/AuthContext';
import { Login } from '../auth/Login';
import { PaymentRequestService } from '../../services/api';
import { Dashboard } from '../Dashboard';
import { RequestsList } from '../requests/RequestsList_fixed';
import { OptimizedCreateRequestForm } from '../executor/OptimizedCreateRequestForm';
import { RequestViewForm } from '../executor/RequestViewForm';
import { ExecutorRequestsList } from '../executor/ExecutorRequestsList';
import { ItemClassificationForm } from '../registrar/ItemClassificationForm';
import { SubRegistrarDashboard } from '../sub-registrar/SubRegistrarDashboard';
import { SubRegistrarAssignmentsList } from '../sub-registrar/SubRegistrarAssignmentsList';
import { RegistrarAssignments } from '../admin/RegistrarAssignments';
import { DistributorRequestsList } from '../distributor/DistributorRequestsList';
import { DistributorWorkflowRequestsList } from '../distributor/DistributorWorkflowRequestsList';
import { ExportContractSelector } from '../distributor/ExportContractSelector';
import { EnhancedApprovalForm } from '../distributor/EnhancedApprovalForm';
import { WorkflowDashboard } from '../common/WorkflowDashboard';
import { DistributorRouting } from '../treasurer/DistributorRouting';
import { UnallocatedExpensesRegister } from '../distributor/UnallocatedExpensesRegister';
import { PaymentRegister } from '../treasurer/PaymentRegister';
import { TreasurerApprovalForm } from '../treasurer/TreasurerApprovalForm';
import { AdminDashboard } from '../admin/AdminDashboard';
import { EnhancedDictionariesManagement } from '../admin/EnhancedDictionariesManagement';
import { SystemSettings } from '../admin/SystemSettings';
import { UserManagement } from '../admin/UserManagement';
import { RoleManagement } from '../admin/RoleManagement';
import { SystemStatistics } from '../admin/SystemStatistics';
import { ExpenseArticleAssignment } from '../admin/ExpenseArticleAssignment';
import { PositionManagement } from '../admin/PositionManagement';
import { RoleBasedRouter } from '../common/RoleBasedRouter';
import { PermissionGate } from '../common/PermissionGate';
import { canAccessRoute, PERMISSIONS } from '../../utils/permissions';
import { Button } from '../ui/button';
import { toast } from 'sonner';

// Test components - placeholders for now
const TestApiIntegration = ({ onBack }: { onBack: () => void }) => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-semibold mb-4">API Integration Test</h2>
    <p className="text-muted-foreground mb-4">Test component for API integration</p>
    <Button onClick={onBack}>Назад</Button>
  </div>
);

const TestDictionaryApi = ({ onBack }: { onBack: () => void }) => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-semibold mb-4">Dictionary API Test</h2>
    <p className="text-muted-foreground mb-4">Test component for dictionary API</p>
    <Button onClick={onBack}>Назад</Button>
  </div>
);

const IntegrationTest = ({ onBack }: { onBack: () => void }) => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-semibold mb-4">Integration Test</h2>
    <p className="text-muted-foreground mb-4">Test component for integration testing</p>
    <Button onClick={onBack}>Назад</Button>
  </div>
);

export function AppRouter() {
  const { state, dispatch } = useAppState();
  // Removed useApiOperations - using useRoleSync and direct service calls instead
  const { handleRoleChange } = useRoleManagement();
  const { handleCreateRequest, handleViewRequest, handleRequestUpdate } = useRequestHandling();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }


  const renderCurrentPage = () => {
    try {
      if (state.showCreateForm) {
        const draftRequest = state.selectedRequestId ? state.paymentRequests.find(r => r.id === state.selectedRequestId) : undefined;
        return (
          <OptimizedCreateRequestForm
            onSubmit={(submittedRequest) => {
              // Just update the app state, don't create another request
              dispatch(appActions.addPaymentRequest(submittedRequest));
              dispatch(appActions.resetFormState());
              dispatch(appActions.setCurrentPage('requests'));
              toast.success(`Заявка ${submittedRequest.requestNumber} успешно создана и отправлена на регистрацию`);
            }}
            onCancel={() => {
              dispatch(appActions.resetFormState());
            }}
            onSaveDraft={PaymentRequestService.update}
            initialData={draftRequest}
            isEditing={!!draftRequest}
            selectedRequestId={state.selectedRequestId || undefined}
          />
        );
      }

      // Handle special views for role-specific forms
      if (state.viewMode === 'view' && state.selectedRequestId) {
        return (
          <RequestViewForm
            requestId={state.selectedRequestId}
            onCancel={() => {
              dispatch(appActions.setViewMode('list'));
              dispatch(appActions.setSelectedRequestId(null));
              // Return to dashboard if we came from there
              if (state.currentPage === 'requests') {
                dispatch(appActions.setCurrentPage('dashboard'));
              }
            }}
            onRequestUpdate={handleRequestUpdate}
          />
        );
      }

      if (state.currentPage === 'requests' && state.viewMode === 'classify' && state.selectedRequestId) {
        const request = state.paymentRequests.find(r => r.id === state.selectedRequestId);
        if (request) {
          return (
            <ItemClassificationForm
              request={request}
              onSubmit={PaymentRequestService.classify}
              onReturn={PaymentRequestService.return}
              onCancel={() => {
                dispatch(appActions.setViewMode('list'));
                dispatch(appActions.setSelectedRequestId(null));
              }}
            />
          );
        }
      }

      if (state.currentPage === 'requests' && state.viewMode === 'classify-items' && state.selectedRequestId) {
        const request = state.paymentRequests.find(r => r.id === state.selectedRequestId);
        if (request) {
          return (
            <ItemClassificationForm
              request={request}
              onSubmit={PaymentRequestService.classify}
              onReturn={PaymentRequestService.return}
              onCancel={() => {
                dispatch(appActions.setViewMode('list'));
                dispatch(appActions.setSelectedRequestId(null));
              }}
            />
          );
        }
      }

      if (state.currentPage === 'requests' && state.viewMode === 'approve' && state.selectedRequestId) {
        const request = state.paymentRequests.find(r => r.id === state.selectedRequestId);
        if (request) {
          return (
            <EnhancedApprovalForm
              request={request}
              onApprove={PaymentRequestService.approve}
              onApproveOnBehalf={PaymentRequestService.approve}
              onReturn={PaymentRequestService.return}
              onDecline={PaymentRequestService.reject}
              onCancel={() => {
                dispatch(appActions.setViewMode('list'));
                dispatch(appActions.setSelectedRequestId(null));
              }}
            />
          );
        }
      }

      if (state.currentPage === 'registers' && state.viewMode === 'register') {
        return (
          <PaymentRegister
            onBack={() => dispatch(appActions.setViewMode('list'))}
            onUpdateRequest={handleRequestUpdate}
          />
        );
      }

      if (state.currentPage === 'requests' && state.viewMode === 'treasurer-approve' && state.selectedRequestId) {
        const request = state.paymentRequests.find(r => r.id === state.selectedRequestId);
        if (request) {
          return (
            <TreasurerApprovalForm
              request={request}
              onUpdateStatus={PaymentRequestService.update}
              onCancel={() => {
                dispatch(appActions.setViewMode('list'));
                dispatch(appActions.setSelectedRequestId(null));
              }}
            />
          );
        }
      }

      switch (state.currentPage) {
        case 'dashboard':
          // Check permissions for different dashboard types
          if (canAccessRoute(state.currentRole, 'admin')) {
            return (
              <RoleBasedRouter userRole={state.currentRole} currentPage="admin">
                <AdminDashboard 
                  onNavigate={(page) => dispatch(appActions.setCurrentPage(page))}
                />
              </RoleBasedRouter>
            );
          }
          
          // Only show SubRegistrarDashboard for SUB_REGISTRAR role specifically
          if (state.currentRole === 'SUB_REGISTRAR') {
            return (
              <RoleBasedRouter userRole={state.currentRole} currentPage="sub-registrar-assignments">
                <SubRegistrarDashboard
                  currentUserId="6c626090-ab4a-44c2-a16d-01b73423557b" // Айгуль Нурланова
                />
              </RoleBasedRouter>
            );
          }
          
          if (canAccessRoute(state.currentRole, 'distributor-workflow')) {
            return (
              <RoleBasedRouter userRole={state.currentRole} currentPage="distributor-workflow">
                <WorkflowDashboard
                  currentRole={state.currentRole}
                  paymentRequests={state.paymentRequests}
                  onNavigate={(page) => dispatch(appActions.setCurrentPage(page))}
                />
              </RoleBasedRouter>
            );
          }
          
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="dashboard">
              <Dashboard 
                currentRole={state.currentRole} 
                onFilterChange={(filter) => {
                  dispatch(appActions.setDashboardFilter(filter));
                  // For registrar and distributor roles, only filter the dashboard, don't redirect
                  if (state.currentRole === 'REGISTRAR' || state.currentRole === 'DISTRIBUTOR') {
                    // Just filter the dashboard, no redirect
                    return;
                  }
                  // Only redirect to requests page for other non-executor roles
                  if (filter && state.currentRole !== 'EXECUTOR') {
                    dispatch(appActions.setCurrentPage('requests'));
                  }
                }}
                currentFilter={state.dashboardFilter}
                onViewRequest={handleViewRequest}
                onCreateRequest={handleCreateRequest}
                paymentRequests={state.paymentRequests}
              />
            </RoleBasedRouter>
          );
        
        case 'requests':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="requests">
              {/* Используем специальный список для исполнителей */}
              {state.currentRole === 'EXECUTOR' ? (
                <ExecutorRequestsList
                  onCreateRequest={handleCreateRequest}
                  onViewRequest={handleViewRequest}
                  onEditRequest={(id) => {
                    dispatch(appActions.setSelectedRequestId(id));
                    dispatch(appActions.setShowCreateForm(true));
                  }}
                />
              ) : state.currentRole === 'DISTRIBUTOR' ? (
                <DistributorRequestsList
                  paymentRequests={state.paymentRequests}
                />
              ) : state.currentRole === 'SUB_REGISTRAR' ? (
                <SubRegistrarDashboard
                  currentUserId="6c626090-ab4a-44c2-a16d-01b73423557b" // Айгуль Нурланова
                />
              ) : (
                <RequestsList
                  currentRole={state.currentRole}
                  onCreateRequest={handleCreateRequest}
                  onViewRequest={handleViewRequest}
                  dashboardFilter={state.dashboardFilter}
                  onClearFilter={() => dispatch(appActions.setDashboardFilter(null))}
                  paymentRequests={state.paymentRequests}
                />
              )}
            </RoleBasedRouter>
          );
        
        case 'registers':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Реестры платежей</h2>
                  <p className="text-muted-foreground">Управление реестрами для отправки в банк</p>
                </div>
                <Button onClick={() => dispatch(appActions.setViewMode('register'))}>
                  Открыть реестр платежей
                </Button>
              </div>
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Здесь будет список созданных реестров</p>
                <p className="text-sm mt-2">Пока что доступно только создание нового реестра</p>
              </div>
            </div>
          );
        
        case 'dictionaries':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="dictionaries">
              <EnhancedDictionariesManagement
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'admin':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="admin">
              <SystemSettings
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'user-management':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="user-management">
              <UserManagement
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'role-management':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="role-management">
              <RoleManagement
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'system-statistics':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="system-statistics">
              <SystemStatistics
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'expense-article-assignment':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="expense-article-assignment">
              <ExpenseArticleAssignment
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'position-management':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="position-management">
              <PositionManagement
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'unallocated':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="unallocated">
              <UnallocatedExpensesRegister 
                onViewRequest={handleViewRequest}
              />
            </RoleBasedRouter>
          );
        
        case 'registrar-assignments':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="registrar-assignments">
              <RegistrarAssignments
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'distributor-routing':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="distributor-routing">
              <DistributorRouting
                onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
              />
            </RoleBasedRouter>
          );
        
        case 'test-api':
          return (
            <TestApiIntegration onBack={() => dispatch(appActions.setCurrentPage('dashboard'))} />
          );
        case 'test-dictionary-api':
          return (
            <TestDictionaryApi onBack={() => dispatch(appActions.setCurrentPage('dashboard'))} />
          );
        case 'integration-test':
          return (
            <IntegrationTest onBack={() => dispatch(appActions.setCurrentPage('dashboard'))} />
          );
        
        // New Workflow Routes
        case 'sub-registrar-assignments':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="sub-registrar-assignments">
              <SubRegistrarAssignmentsList
                onReportUpdate={() => {
                  // Reload data or show notification
                  toast.success('Отчёт обновлён');
                }}
              />
            </RoleBasedRouter>
          );
        
        case 'distributor-workflow':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="distributor-workflow">
              <DistributorWorkflowRequestsList
                onRequestUpdate={() => {
                  // Reload data or show notification
                  toast.success('Заявка обновлена');
                }}
              />
            </RoleBasedRouter>
          );
        
        case 'export-contracts':
          return (
            <RoleBasedRouter userRole={state.currentRole} currentPage="export-contracts">
              <ExportContractSelector
                onContractSelect={(contract) => {
                  toast.success(`Выбран контракт: ${contract.contractNumber}`);
                }}
              />
            </RoleBasedRouter>
          );
        
        default:
          return (
            <Dashboard 
              currentRole={state.currentRole} 
              paymentRequests={state.paymentRequests}
              onViewRequest={handleViewRequest}
            />
          );
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return (
        <div className="p-8 text-center">
          <p className="text-red-600">Произошла ошибка при загрузке страницы</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Обновить страницу
          </Button>
        </div>
      );
    }
  };

  return renderCurrentPage();
}
