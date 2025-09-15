import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  Building,
  Calendar,
  DollarSign,
  User,
  Target,
  ExternalLink
} from 'lucide-react';
import { PaymentRequest } from '../../types';
import { PaymentRequestService } from '../../services/api';
import { useDictionaries } from '../../hooks/useDictionaries';
import { StatusBadge } from '../common/StatusBadge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner@2.0.3';

interface UndistributedExpensesRegisterProps {
  onViewRequest?: (requestId: string) => void;
}

export function UndistributedExpensesRegister({ onViewRequest }: UndistributedExpensesRegisterProps) {

  // Get dictionary data
  const { items: counterparties } = useDictionaries('counterparties');
  const { items: expenseitems } = useDictionaries('expense-articles');
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'counterparty'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadUndistributedRequests();
  }, []);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchQuery, statusFilter, sortBy, sortOrder]);

  const loadUndistributedRequests = async () => {
    try {
      setIsLoading(true);
      const allRequests = await PaymentRequestService.getAll({ role: 'distributor' });
      
      // Фильтруем заявки, которые имеют allocations с contractId = 'outside-deals'
      const undistributedRequests = allRequests.filter(request => 
        request.paymentAllocations && 
        request.paymentAllocations.some(allocation => allocation.contractId === 'outside-deals')
      );
      
      setRequests(undistributedRequests);
    } catch (error) {
      console.error('Failed to load undistributed requests:', error);
      toast.error('Ошибка загрузки нераспределенных расходов');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = [...requests];

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        request.requestNumber?.toLowerCase().includes(query) ||
        request.docNumber?.toLowerCase().includes(query) ||
        getCounterpartyName(request.counterpartyId).toLowerCase().includes(query) ||
        request.description?.toLowerCase().includes(query)
      );
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'counterparty':
          comparison = getCounterpartyName(a.counterpartyId).localeCompare(getCounterpartyName(b.counterpartyId));
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredRequests(filtered);
  };

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const getExpenseItemName = (id: string) => {
    const item = expenseitems.find(item => item.id === id);
    return item ? `${item.code} - ${item.name}` : 'Неизвестно';
  };

  const getTotalUndistributedAmount = () => {
    return filteredRequests.reduce((sum, request) => sum + request.amount, 0);
  };

  const getStatusCounts = () => {
    const counts = {
      approved: 0,
      'in-register': 0,
      'approved-for-payment': 0,
      'paid-full': 0,
      'paid-partial': 0
    };
    
    filteredRequests.forEach(request => {
      if (counts.hasOwnProperty(request.status)) {
        counts[request.status]++;
      }
    });
    
    return counts;
  };

  const handleViewDocument = (request: PaymentRequest) => {
    if (request.docFileUrl) {
      window.open(request.docFileUrl, '_blank');
    } else {
      toast.info(`Просмотр документа: ${request.fileName}`);
    }
  };

  const handleDownloadDocument = (request: PaymentRequest) => {
    toast.info(`Скачивание документа: ${request.fileName}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Реестр нераспределенных расходов</h2>
          <p className="text-muted-foreground">
            Заявки, по которым в "Назначении платежа" указано "Вне сделок"
          </p>
        </div>
        <Button variant="outline" onClick={loadUndistributedRequests}>
          Обновить
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Всего заявок</p>
                <p className="text-2xl font-semibold">{filteredRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Общая сумма</p>
                <p className="text-2xl font-semibold">
                  {getTotalUndistributedAmount().toLocaleString()} ₸
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Утверждено</p>
                <p className="text-2xl font-semibold">{statusCounts.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Оплачено</p>
                <p className="text-2xl font-semibold">
                  {statusCounts['paid-full'] + statusCounts['paid-partial']}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры и поиск
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Номер заявки, контрагент..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="approved">Утверждено</SelectItem>
                  <SelectItem value="in-register">В реестре</SelectItem>
                  <SelectItem value="approved-for-payment">К оплате</SelectItem>
                  <SelectItem value="paid-full">Оплачено полностью</SelectItem>
                  <SelectItem value="paid-partial">Оплачено частично</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Сортировка</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">По дате</SelectItem>
                  <SelectItem value="amount">По сумме</SelectItem>
                  <SelectItem value="counterparty">По контрагенту</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Направление</label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">По убыванию</SelectItem>
                  <SelectItem value="asc">По возрастанию</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет нераспределенных расходов</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'По заданным фильтрам ничего не найдено' 
                : 'Все заявки распределены по контрактам'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header with status and actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {request.requestNumber}
                      </Badge>
                      <StatusBadge status={request.status} />
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Вне сделок
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {onViewRequest && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewRequest(request.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Просмотр
                        </Button>
                      )}
                      {request.fileName && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(request)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Документ
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Main information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Контрагент</p>
                        <p className="text-sm">{getCounterpartyName(request.counterpartyId)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Сумма</p>
                        <p className="text-lg font-semibold">{request.amount.toLocaleString()} {request.currency}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Срок оплаты</p>
                        <p className="text-sm">{format(new Date(request.dueDate), 'd MMMM yyyy', { locale: ru })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Документ</p>
                        <p className="text-sm">{request.docNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expense splits */}
                  {request.expenseSplits && request.expenseSplits.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold text-sm">Статьи расходов</p>
                      </div>
                      <div className="space-y-2">
                        {request.expenseSplits.map((split, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                            <span className="text-sm">{getExpenseItemName(split.expenseItemId)}</span>
                            <Badge variant="outline">
                              {split.amount.toLocaleString()} {request.currency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment allocation info */}
                  {request.paymentAllocations && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <p className="font-semibold text-sm">Назначение платежа</p>
                      </div>
                      {request.paymentAllocations
                        .filter(allocation => allocation.contractId === 'outside-deals')
                        .map((allocation, index) => (
                          <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-orange-800">Платеж вне сделок</p>
                                <p className="text-sm text-orange-600 mt-1">
                                  Данный платеж не привязан к конкретному контракту
                                </p>
                                {allocation.comment && (
                                  <p className="text-sm text-orange-700 mt-2 italic">
                                    Комментарий: {allocation.comment}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-white">
                                {allocation.amount.toLocaleString()} {request.currency}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}