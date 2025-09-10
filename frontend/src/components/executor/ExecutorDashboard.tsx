import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  FilePenLine,
  Loader2,
  Plus
} from 'lucide-react';
import { useDictionaries } from '../../hooks/useDictionaries';
import { formatCurrency } from '../../utils/formatting';
import { useExecutorRequests } from '../../features/payment-requests/hooks/useExecutorRequests';
import { useRoleStatistics } from '../../hooks/useStatistics';
import { formatDateSafe, isOverdue } from '../../features/payment-requests/lib/formatDateSafe';
import { getReviewerByStatus, STATUS_MAP } from '../../features/payment-requests/constants/status-map';

interface ExpenseArticle {
  id: string;
  name: string;
  code: string;
}

interface ExecutorDashboardProps {
  onViewRequest?: (id: string) => void;
  onCreateRequest?: () => void;
}

function ExecutorDashboard({ onViewRequest, onCreateRequest }: ExecutorDashboardProps) {
  // State for filtering and pagination
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const itemsPerPage = 5;
  
  // Get dictionary data
  const { items: counterparties } = useDictionaries('counterparties');
  
  // Use custom hooks for data fetching
  const { 
    data: requests, 
    loading: requestsLoading, 
    error: requestsError 
  } = useExecutorRequests({
    status: currentFilter !== 'total' ? currentFilter : undefined,
    page: currentPage,
    limit: itemsPerPage
  });

  const { 
    statistics, 
    loading: statisticsLoading, 
    error: statisticsError 
  } = useRoleStatistics('executor');

  const isLoading = requestsLoading || statisticsLoading;
  const error = requestsError || statisticsError;
  
  // Filter requests based on current filter
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];
    
    // Apply status filter
    if (currentFilter) {
      switch (currentFilter) {
        case 'draft':
          filtered = filtered.filter(r => r.status === 'draft');
          break;
        case 'submitted':
          filtered = filtered.filter(r => r.status === 'submitted');
          break;
        case 'in-register':
          filtered = filtered.filter(r => r.status === 'in-register');
          break;
        case 'to-pay':
          filtered = filtered.filter(r => r.status === 'to-pay');
          break;
        case 'rejected':
          filtered = filtered.filter(r => r.status === 'rejected');
          break;
        case 'total':
          // Show all requests
          break;
      }
    }
    
    return filtered.sort((a, b) => {
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
    });
  }, [requests, currentFilter]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
  
  // Calculate metrics from statistics
  const metrics = useMemo(() => {
    if (!statistics) {
      return {
        total: 0,
        inProgress: 0,
        approvedNotPaid: 0,
        paid: 0,
        declined: 0,
        draft: 0,
        totalAmount: 0
      };
    }
    
    return {
      total: statistics.totalRequests || 0,
      inProgress: statistics.submittedCount || 0, // Только submitted
      approvedNotPaid: statistics.inRegistryCount || 0, // Только in-register
      paid: (statistics.paidFullCount || 0) + (statistics.paidPartialCount || 0),
      declined: statistics.rejectedCount || 0,
      draft: statistics.draftCount || 0,
      totalAmount: statistics.totalAmount || 0
    };
  }, [statistics]);
  
  const getCounterpartyName = useCallback((id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  }, [counterparties]);

  const handleFilterClick = useCallback((filterType: string) => {
    // Toggle filter - if same filter is clicked, clear it
    const newFilter = currentFilter === filterType ? null : filterType;
    setCurrentFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [currentFilter]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  }, []);

  const handlePageInputSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput);
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        setPageInput('');
      }
    }
  }, [pageInput, totalPages]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Обзор системы управления платежами
          </p>
        </div>
        <Button onClick={onCreateRequest}>
          <Plus className="h-4 w-4 mr-2" />
          Новая заявка
        </Button>
      </div>

      {/* Filter tiles */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-3">Фильтры заявок</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div 
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                currentFilter === 'draft' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleFilterClick('draft')}
            >
              <div className="flex items-center gap-2 mb-1">
                <FilePenLine className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium">Черновики</span>
              </div>
              <div className="text-lg font-semibold">{metrics.draft}</div>
            </div>
            
            <div 
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                currentFilter === 'submitted' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleFilterClick('submitted')}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 text-orange-500" />
                <span className="text-xs font-medium">В работе</span>
              </div>
              <div className="text-lg font-semibold">{metrics.inProgress}</div>
            </div>
            
            <div 
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                currentFilter === 'in-register' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleFilterClick('in-register')}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium">Согласовано</span>
              </div>
              <div className="text-lg font-semibold">{metrics.approvedNotPaid}</div>
            </div>
            
            <div 
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                currentFilter === 'to-pay' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleFilterClick('to-pay')}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium">Оплачено</span>
              </div>
              <div className="text-lg font-semibold">{metrics.paid}</div>
            </div>
            
            <div 
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                currentFilter === 'rejected' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleFilterClick('rejected')}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-xs font-medium">Отклонено</span>
              </div>
              <div className="text-lg font-semibold">{metrics.declined}</div>
            </div>
            
            <div 
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                currentFilter === 'total' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleFilterClick('total')}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">Всего</span>
              </div>
              <div className="text-lg font-semibold">{metrics.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent requests with pagination */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Последние заявки</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredRequests.length > 0 && (
              <span>Показано {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} из {filteredRequests.length}</span>                                                                   
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedRequests.map(request => (
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
                      {formatDateSafe(request.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Нет заявок для отображения
              </p>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:flex"
                >
                  Первая
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Назад
                </Button>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Страница {currentPage} из {totalPages}
                </span>
                <span className="text-sm text-muted-foreground sm:hidden">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Вперед
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex"
                >
                  Последняя
                </Button>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto">
                {(() => {
                  const maxVisiblePages = 7; // Максимальное количество видимых страниц
                  const pages = [];
                  
                  if (totalPages <= maxVisiblePages) {
                    // Если страниц мало, показываем все
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                          className="w-8 h-8 p-0"
                        >
                          {i}
                        </Button>
                      );
                    }
                  } else {
                    // Если страниц много, показываем умную пагинацию
                    const showEllipsis = totalPages > maxVisiblePages;
                    const halfVisible = Math.floor(maxVisiblePages / 2);
                    
                    // Всегда показываем первую страницу
                    pages.push(
                      <Button
                        key={1}
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        className="w-8 h-8 p-0"
                      >
                        1
                      </Button>
                    );
                    
                    if (currentPage > halfVisible + 2) {
                      pages.push(
                        <span key="ellipsis1" className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    
                    // Показываем страницы вокруг текущей
                    const startPage = Math.max(2, currentPage - halfVisible);
                    const endPage = Math.min(totalPages - 1, currentPage + halfVisible);
                    
                    for (let i = startPage; i <= endPage; i++) {
                      if (i !== 1 && i !== totalPages) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(i)}
                            className="w-8 h-8 p-0"
                          >
                            {i}
                          </Button>
                        );
                      }
                    }
                    
                    if (currentPage < totalPages - halfVisible - 1) {
                      pages.push(
                        <span key="ellipsis2" className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    
                    // Всегда показываем последнюю страницу (если не первая)
                    if (totalPages > 1) {
                      pages.push(
                        <Button
                          key={totalPages}
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      );
                    }
                  }
                  
                  return pages;
                })()}
              </div>
              
              {/* Page input for large datasets */}
              {totalPages > 10 && (
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-muted-foreground">Перейти к:</span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={handlePageInputChange}
                    onKeyDown={handlePageInputSubmit}
                    placeholder="№"
                    className="w-16 h-8 text-center"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

export { ExecutorDashboard };
export default ExecutorDashboard;