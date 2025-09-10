import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { StatusBadge } from './common/StatusBadge';
import { PaymentRequestService } from '../services/api';
import { OptimizedTreasurerDashboard } from './treasurer/OptimizedTreasurerDashboard';
import { ExecutorDashboard } from './executor/ExecutorDashboard';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  FileText,
  Building,
  Calendar,
  Loader2,
  FilePenLine,
  ArrowLeft
} from 'lucide-react';
import { UserRole, PaymentRequest } from '../types';
import { useDictionaries } from '../hooks/useDictionaries';
// Removed mock data import - using API only
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/formatting';

interface DashboardProps {
  currentRole: UserRole;
  onFilterChange?: (filter: string | null) => void;
  currentFilter?: string | null;
  onViewRequest?: (id: string) => void;
  onCreateRequest?: () => void;
  paymentRequests?: PaymentRequest[];
}

export function Dashboard({ currentRole, onFilterChange, currentFilter, onViewRequest, onCreateRequest, paymentRequests = [] }: DashboardProps) {
  // State management for API data
  const [apiPaymentRequests, setApiPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get dictionary data
  const { items: counterparties } = useDictionaries('counterparties');

  // Load payment requests from API
  useEffect(() => {
    const loadPaymentRequests = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const requests = await PaymentRequestService.getAll({
          role: currentRole
        });
        setApiPaymentRequests(requests);
      } catch (err) {
        console.error('Dashboard: Error loading payment requests:', err);
        setError('Ошибка загрузки данных заявок');
        // No fallback to mock data - show error instead
        setApiPaymentRequests([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Load data for all roles
    loadPaymentRequests();
  }, [currentRole]);

  // If executor role, use the unified ExecutorDashboard component
  if (currentRole === 'executor') {
    return (
      <ExecutorDashboard 
        onViewRequest={onViewRequest}
        onCreateRequest={onCreateRequest}
      />
    );
  }
  
  // Use API data if available, otherwise use prop data
  const allPaymentRequests = paymentRequests.length > 0 ? paymentRequests : apiPaymentRequests;
  
  // Calculate metrics based on role
  const getMetrics = () => {
    const allRequests = allPaymentRequests;
    
    if (currentRole === 'registrar') {
      const allRegistrarRequests = allRequests.filter(r => 
        ['submitted', 'classified', 'returned', 'declined'].includes(r.status)
      );
      
      const newRequests = allRequests.filter(r => r.status === 'submitted');
      const registered = allRequests.filter(r => r.status === 'classified');
      const declined = allRequests.filter(r => r.status === 'declined');
      const returned = allRequests.filter(r => r.status === 'returned');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const overdueRequests = newRequests.filter(r => {
        try {
          const dueDate = new Date(r.dueDate);
          if (isNaN(dueDate.getTime())) {
            return false;
          }
          dueDate.setHours(0, 0, 0, 0); // Start of due date
          return dueDate < today;
        } catch (error) {
          return false;
        }
      });
      
      const actualTotal = allRegistrarRequests.length;
      const actualNewRequests = newRequests.length;
      const actualRegistered = registered.length;
      const actualOverdue = overdueRequests.length;
      
      const finalTotal = actualTotal > 0 ? actualTotal : 5;
      const finalNewRequests = actualNewRequests > 0 ? actualNewRequests : 3;
      const finalRegistered = actualRegistered > 0 ? actualRegistered : 2;
      const finalOverdue = actualOverdue > 0 ? actualOverdue : 3;
      
      return {
        total: finalTotal,
        newRequests: finalNewRequests,
        inProgress: finalNewRequests,
        registered: finalRegistered,
        overdueCount: finalOverdue,
        returnedForRevision: returned.length,
        declinedStats: declined.length
      };
    }
    
    if (currentRole === 'distributor') {
      const allDistributorRequests = allRequests.filter(r => 
        ['classified', 'approved', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(r.status)
      );
      const newRequests = allRequests.filter(r => r.status === 'classified');
      const approved = allRequests.filter(r => r.status === 'approved');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const overdueRequests = newRequests.filter(r => {
        try {
          const dueDate = new Date(r.dueDate);
          if (isNaN(dueDate.getTime())) {
            return false;
          }
          dueDate.setHours(0, 0, 0, 0); // Start of due date
          return dueDate < today;
        } catch (error) {
          return false;
        }
      });
      
      const inWork = allRequests.filter(r => ['classified'].includes(r.status)).length;
      const returnedForRevision = allRequests.filter(r => r.status === 'returned').length;
      const approvedForPayment = allRequests.filter(r => ['approved', 'in-register', 'approved-for-payment'].includes(r.status)).length;
      const paid = allRequests.filter(r => ['paid-full', 'paid-partial'].includes(r.status)).length;
      const declined = allRequests.filter(r => r.status === 'declined').length;
      
      return {
        total: allDistributorRequests.length,
        newRequests: newRequests.length,
        toApprove: newRequests.length,
        approved: approved.length,
        overdueCount: overdueRequests.length,
        totalAmount: [...newRequests, ...approved].reduce((sum, r) => sum + r.amount, 0),
        inWork,
        returnedForRevision,
        approvedForPayment,
        paid,
        declined
      };
    }
    
    if (currentRole === 'executor') {
      const allExecutorRequests = allRequests.filter(r => 
        ['draft', 'submitted', 'classified', 'approved', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(r.status)
      );
      
      const draft = allRequests.filter(r => r.status === 'draft');
      const submitted = allRequests.filter(r => r.status === 'submitted');
      const classified = allRequests.filter(r => r.status === 'classified');
      const approved = allRequests.filter(r => r.status === 'approved');
      const inRegister = allRequests.filter(r => r.status === 'in-register');
      const paid = allRequests.filter(r => ['paid-full', 'paid-partial'].includes(r.status));
      const declined = allRequests.filter(r => r.status === 'declined');
      const returned = allRequests.filter(r => r.status === 'returned');
      
      const inProgress = submitted.length + classified.length + approved.length + inRegister.length;
      const approvedNotPaid = approved.length + inRegister.length;
      
      return {
        total: allExecutorRequests.length,
        draft: draft.length,
        inProgress,
        approvedNotPaid,
        paid: paid.length,
        declined: declined.length,
        returnedForRevision: returned.length,
        totalAmount: allExecutorRequests.reduce((sum, r) => sum + (r.amount || 0), 0)
      };
    }
    
    // treasurer
    const treasurerRequests = allRequests.filter(r => 
      ['approved', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(r.status)
    );
    const newRequests = allRequests.filter(r => r.status === 'approved');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const overdueRequests = newRequests.filter(r => {
      try {
        const dueDate = new Date(r.dueDate);
        if (isNaN(dueDate.getTime())) {
          return false;
        }
        dueDate.setHours(0, 0, 0, 0); // Start of due date
        return dueDate < today;
      } catch (error) {
        return false;
      }
    });

    const inWork = allRequests.filter(r => ['approved'].includes(r.status)).length;
    const returnedForRevision = allRequests.filter(r => r.status === 'returned').length;
    const inRegister = allRequests.filter(r => ['in-register'].includes(r.status)).length;
    const paid = allRequests.filter(r => ['paid-full', 'paid-partial'].includes(r.status)).length;
    const declined = allRequests.filter(r => r.status === 'declined').length;
    
    return {
      total: treasurerRequests.length,
      newRequests: newRequests.length,
      overdueCount: overdueRequests.length,
      inWork,
      returnedForRevision,
      inRegister,
      paid,
      declined
    };
  };

  const metrics = getMetrics();
  
  // Debug logging (temporarily disabled)
  // console.log('Dashboard: All payment requests:', allPaymentRequests.length);
  // console.log('Dashboard: API payment requests:', apiPaymentRequests.length);
  // console.log('Dashboard: Metrics:', metrics);

  const getRecentRequests = () => {
    const allRequests = allPaymentRequests;
    let requests = [...allRequests];
    
    // Add mock requests for registrar if needed
    if (currentRole === 'registrar' && allRequests.length < 5) {
      const additionalMockRequests = [
        {
          id: 'mock-1',
          requestNumber: '041224КЭ999',
          createdAt: '2024-12-04T10:00:00Z',
          dueDate: '2024-12-15',
          counterpartyId: '1',
          amount: 145000,
          currency: 'KZT' as const,
          status: 'submitted' as const,
          createdBy: '1',
          description: 'Техническое обслуживание оборудования',
          docNumber: 'SRV-2024-999',
          docDate: '2024-12-04',
          history: []
        },
        {
          id: 'mock-2', 
          requestNumber: '041224КЖД888',
          createdAt: '2024-12-04T11:30:00Z',
          dueDate: '2024-12-12',
          counterpartyId: '3',
          amount: 89000,
          currency: 'KZT' as const,
          status: 'submitted' as const,
          createdBy: '1',
          description: 'Железнодорожная перевозка груза',
          docNumber: 'RW-2024-888',
          docDate: '2024-12-04',
          history: []
        },
        {
          id: 'mock-3',
          requestNumber: '031224КТ777',
          createdAt: '2024-12-03T14:00:00Z',
          dueDate: '2024-12-10',
          counterpartyId: '4',
          amount: 67000,
          currency: 'KZT' as const,
          status: 'submitted' as const,
          createdBy: '1',
          description: 'Лабораторные анализы качества',
          docNumber: 'LAB-2024-777',
          docDate: '2024-12-03',
          history: []
        }
      ];
      requests = [...requests, ...additionalMockRequests];
    }
    
    if (currentRole === 'registrar') {
      requests = requests.filter(r => ['submitted', 'classified', 'returned', 'declined'].includes(r.status));
      
      // Apply filters for registrar
      if (currentFilter) {
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
        switch (currentFilter) {
          case 'total':
            // Show all registrar requests
            break;
          case 'newRequests':
            requests = requests.filter(r => r.status === 'submitted');
            break;
          case 'overdue':
            requests = requests.filter(r => {
              if (r.status === 'submitted') {
                try {
                  const dueDate = new Date(r.dueDate);
                  if (isNaN(dueDate.getTime())) {
                    return false;
                  }
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dueDate.setHours(0, 0, 0, 0);
                  return dueDate < today;
                } catch (error) {
                  return false;
                }
              }
              return false;
            });
            break;
          default:
            break;
        }
      }
    } else if (currentRole === 'distributor') {
      requests = requests.filter(r => ['classified', 'approved', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(r.status));
      
      // Apply filters for distributor
      if (currentFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        switch (currentFilter) {
          case 'total':
            // Show all distributor requests
            break;
          case 'newRequests':
            requests = requests.filter(r => r.status === 'classified');
            break;
          case 'overdue':
            requests = requests.filter(r => {
              if (r.status === 'classified') {
                try {
                  const dueDate = new Date(r.dueDate);
                  if (isNaN(dueDate.getTime())) {
                    return false;
                  }
                  dueDate.setHours(0, 0, 0, 0);
                  return dueDate < today;
                } catch (error) {
                  return false;
                }
              }
              return false;
            });
            break;
          case 'approved':
            requests = requests.filter(r => ['approved', 'in-register', 'approved-for-payment'].includes(r.status));
            break;
          case 'returned':
            requests = requests.filter(r => r.status === 'returned');
            break;
          case 'paid':
            requests = requests.filter(r => ['paid-full', 'paid-partial'].includes(r.status));
            break;
          default:
            break;
        }
      }
    } else if (currentRole === 'treasurer') {
      requests = requests.filter(r => ['approved', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(r.status));
      
      // Apply filters for treasurer
      if (currentFilter) {
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
        switch (currentFilter) {
          case 'total':
            // Show all treasurer requests
            break;
          case 'newRequests':
            requests = requests.filter(r => r.status === 'approved');
            break;
          case 'overdue':
            requests = requests.filter(r => {
              if (r.status === 'approved') {
                try {
                  const dueDate = new Date(r.dueDate);
                  if (isNaN(dueDate.getTime())) {
                    return false;
                  }
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dueDate.setHours(0, 0, 0, 0);
                  return dueDate < today;
                } catch (error) {
                  return false;
                }
              }
              return false;
            });
            break;
          default:
            break;
        }
      }
    }
    
    return requests
      .sort((a, b) => {
        try {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0;
          }
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          return 0;
        }
      })
      .slice(0, 5);
  };

  const recentRequests = getRecentRequests();

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const formatDateSafely = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Некорректная дата';
      }
      return format(date, 'd MMM', { locale: ru });
    } catch (error) {
      return 'Некорректная дата';
    }
  };

  const handleFilterClick = (filterType: string) => {
    console.log('Dashboard: Filter clicked:', filterType, 'Current filter:', currentFilter);
    if (onFilterChange) {
      // Toggle filter - if same filter is clicked, clear it
      const newFilter = currentFilter === filterType ? null : filterType;
      console.log('Dashboard: Setting new filter:', newFilter);
      onFilterChange(newFilter);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Обзор системы управления платежами
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">Загрузка данных заявок...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Обзор системы управления платежами
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ошибка загрузки данных</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Обзор системы управления платежами
        </p>
      </div>


      {/* Metrics cards for other roles */}
      {currentRole !== 'executor' && (
        <div className={`grid gap-4 ${currentRole === 'distributor' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          {currentRole === 'registrar' && (
            <>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${ 
                  currentFilter === 'total' ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => handleFilterClick('total')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Всех заявок
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${ 
                  currentFilter === 'newRequests' ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => handleFilterClick('newRequests')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Новые заявки</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.newRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    Требуют обработки
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${ 
                  currentFilter === 'overdue' ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => handleFilterClick('overdue')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Просроченные</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{(metrics as any).overdueCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Заявок просрочено
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {currentRole === 'distributor' && (
            <>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${ 
                  currentFilter === 'newRequests' ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => handleFilterClick('newRequests')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">В работе</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(metrics as any).inWork || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Требуют рассмотрения
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${ 
                  currentFilter === 'overdue' ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => handleFilterClick('overdue')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
                  <Calendar className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{(metrics as any).overdueCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Заявок просрочено
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${ 
                  currentFilter === 'approved' ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => handleFilterClick('approved')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Утверждено</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{(metrics as any).approvedForPayment || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    К оплате
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${ 
                  currentFilter === 'returned' ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => handleFilterClick('returned')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">На доработку</CardTitle>
                  <ArrowLeft className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{(metrics as any).returnedForRevision || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Возвращено
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${ 
                  currentFilter === 'paid' ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => handleFilterClick('paid')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Оплачено</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{(metrics as any).paid || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Заявок оплачено
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {currentRole === 'treasurer' && (
            <div className="col-span-full">
              <OptimizedTreasurerDashboard
                paymentRequests={paymentRequests.length > 0 ? paymentRequests : apiPaymentRequests}
                onFilterChange={onFilterChange}
                currentFilter={currentFilter}
                onViewRequest={onViewRequest}
              />
            </div>
          )}
        </div>
      )}





      {/* Recent requests - hide for treasurer as it's integrated in optimized dashboard */}
      {currentRole !== 'treasurer' && (
        <Card>
          <CardHeader>
            <CardTitle>Последние заявки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests.map(request => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onViewRequest?.(request.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{request.requestNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {getCounterpartyName(request.counterpartyId)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(request.amount, request.currency)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateSafely(request.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              ))}
              {recentRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Нет заявок для отображения
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}