import React from 'react';
import { useAppState, appActions } from '../../context/AppStateContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { useRoleManagement } from '../../hooks/useRoleManagement';
import { useRequestHandling } from '../../hooks/useRequestHandling';
import { Dashboard } from '../Dashboard';
import { RequestsList } from '../requests/RequestsList_fixed';
import { OptimizedCreateRequestForm } from '../executor/OptimizedCreateRequestForm';
import { RequestViewForm } from '../executor/RequestViewForm';
import { ExecutorRequestsList } from '../executor/ExecutorRequestsList';
import { ClassificationForm } from '../registrar/ClassificationForm';
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
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';

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
  const {
    submitRequest,
    saveDraft,
    classifyRequest,
    classifyRequestWithItems,
    returnRequest,
    approveRequest,
    approveOnBehalfRequest,
    declineRequest,
    treasurerUpdateStatus,
  } = useApiOperations();
  const { handleRoleChange } = useRoleManagement();
  const { handleCreateRequest, handleViewRequest, handleRequestUpdate } = useRequestHandling();


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
            onSaveDraft={saveDraft}
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
            <ClassificationForm
              request={request}
              onSubmit={classifyRequest}
              onReturn={returnRequest}
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
              onSubmit={classifyRequestWithItems}
              onReturn={returnRequest}
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
              onApprove={approveRequest}
              onApproveOnBehalf={approveOnBehalfRequest}
              onReturn={returnRequest}
              onDecline={declineRequest}
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
              onUpdateStatus={treasurerUpdateStatus}
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
          // Если это администратор, показываем админский дашборд
          if (state.currentRole === 'admin') {
            return (
              <AdminDashboard 
                onNavigate={(page) => dispatch(appActions.setCurrentPage(page))}
              />
            );
          }
          // Если это суб-регистратор, показываем специальный дашборд
          if (state.currentRole === 'sub_registrar') {
            return (
              <SubRegistrarDashboard
                currentUserId="6c626090-ab4a-44c2-a16d-01b73423557b" // Айгуль Нурланова
                onViewRequest={handleViewRequest}
              />
            );
          }
          // Если это один из workflow ролей, показываем WorkflowDashboard
          if (['registrar', 'sub_registrar', 'distributor'].includes(state.currentRole)) {
            return (
              <WorkflowDashboard
                currentRole={state.currentRole}
                paymentRequests={state.paymentRequests}
                onViewRequest={handleViewRequest}
                onNavigate={(page) => dispatch(appActions.setCurrentPage(page))}
              />
            );
          }
          return (
            <Dashboard 
              currentRole={state.currentRole} 
              onFilterChange={(filter) => {
                dispatch(appActions.setDashboardFilter(filter));
                // For registrar and distributor roles, only filter the dashboard, don't redirect
                if (state.currentRole === 'registrar' || state.currentRole === 'distributor') {
                  // Just filter the dashboard, no redirect
                  return;
                }
                // Only redirect to requests page for other non-executor roles
                if (filter && state.currentRole !== 'executor') {
                  dispatch(appActions.setCurrentPage('requests'));
                }
              }}
              currentFilter={state.dashboardFilter}
              onViewRequest={handleViewRequest}
              onCreateRequest={handleCreateRequest}
              paymentRequests={state.paymentRequests}
            />
          );
        
        case 'requests':
          // Используем специальный список для исполнителей
          if (state.currentRole === 'executor') {
            return (
              <ExecutorRequestsList
                onCreateRequest={handleCreateRequest}
                onViewRequest={handleViewRequest}
                onEditRequest={(id) => {
                  dispatch(appActions.setSelectedRequestId(id));
                  dispatch(appActions.setShowCreateForm(true));
                }}
              />
            );
          }
          // Используем специальный список для распорядителей
          if (state.currentRole === 'distributor') {
            return (
              <DistributorRequestsList
                onViewRequest={handleViewRequest}
                paymentRequests={state.paymentRequests}
              />
            );
          }
          // Используем специальный дашборд для суб-регистраторов
          if (state.currentRole === 'sub_registrar') {
            return (
              <SubRegistrarDashboard
                currentUserId="6c626090-ab4a-44c2-a16d-01b73423557b" // Айгуль Нурланова
                onViewRequest={handleViewRequest}
              />
            );
          }
          return (
            <RequestsList
              currentRole={state.currentRole}
              onCreateRequest={handleCreateRequest}
              onViewRequest={handleViewRequest}
              dashboardFilter={state.dashboardFilter}
              onClearFilter={() => dispatch(appActions.setDashboardFilter(null))}
              paymentRequests={state.paymentRequests}
            />
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
            <EnhancedDictionariesManagement
              onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
            />
          );
        
        case 'admin':
          return (
            <SystemSettings
              onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
            />
          );
        
        case 'unallocated':
          return (
            <UnallocatedExpensesRegister 
              onViewRequest={handleViewRequest}
            />
          );
        
        case 'registrar-assignments':
          return (
            <RegistrarAssignments
              onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
            />
          );
        
        case 'distributor-routing':
          return (
            <DistributorRouting
              onBack={() => dispatch(appActions.setCurrentPage('dashboard'))}
            />
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
            <SubRegistrarAssignmentsList
              onReportUpdate={() => {
                // Reload data or show notification
                toast.success('Отчёт обновлён');
              }}
            />
          );
        
        case 'distributor-workflow':
          return (
            <DistributorWorkflowRequestsList
              onRequestUpdate={() => {
                // Reload data or show notification
                toast.success('Заявка обновлена');
              }}
            />
          );
        
        case 'export-contracts':
          return (
            <ExportContractSelector
              onContractSelect={(contract) => {
                toast.success(`Выбран контракт: ${contract.contractNumber}`);
              }}
            />
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
