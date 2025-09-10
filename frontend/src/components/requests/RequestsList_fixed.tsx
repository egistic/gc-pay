import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StatusBadge } from '../common/StatusBadge';
import { RegistrarStatsCards } from '../registrar/RegistrarStatsCards';
import { DistributorStatsCards } from '../distributor/DistributorStatsCards';
import { 
  Search, 
  Filter, 
  Calendar,
  Building,
  DollarSign,
  Download,
  FilePenLine,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { PaymentRequest, PaymentRequestStatus, UserRole } from '../../types';
import { PaymentRequestService } from '../../services/api';
import { useDictionaries } from '../../hooks/useDictionaries';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatting';

interface RequestsListProps {
  currentRole: UserRole;
  onCreateRequest?: () => void;
  onViewRequest?: (id: string) => void;
  dashboardFilter?: string | null;
  onClearFilter?: () => void;
  paymentRequests?: PaymentRequest[];
}

export function RequestsList({ currentRole, onCreateRequest, onViewRequest, dashboardFilter, onClearFilter, paymentRequests }: RequestsListProps) {

  // Get dictionary data
  const { items: counterparties } = useDictionaries('counterparties');
  const [searchTerm, setSearchTerm] = useState('');
  const [counterpartyFilter, setCounterpartyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  
  // API state management
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load requests from API or use passed data
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use passed paymentRequests if available, otherwise load from API
        if (paymentRequests && paymentRequests.length > 0) {
          setRequests(paymentRequests);
        } else {
          // Load requests with role-based filtering
          const loadedRequests = await PaymentRequestService.getAll({
            role: currentRole,
            status: dashboardFilter || undefined
          });
          
          setRequests(loadedRequests);
        }
      } catch (err) {
        console.error('Error loading requests:', err);
        setError('Ошибка загрузки заявок');
        // Fallback to empty array on error
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [currentRole, dashboardFilter, paymentRequests]);

  // Safe date handling functions
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

  const formatTimeSafely = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Некорректная дата';
      }
      return format(date, 'd MMM HH:mm', { locale: ru });
    } catch (error) {
      return 'Некорректная дата';
    }
  };

  const isOverdue = (dueDate: string) => {
    try {
      const date = new Date(dueDate);
      return !isNaN(date.getTime()) && date < new Date();
    } catch (error) {
      return false;
    }
  };

  const isDateOlderThan = (dateString: string, hoursAgo: number) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
      const threshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      return date < threshold;
    } catch (error) {
      return false;
    }
  };

  // Filter requests based on current role and filters
  const filteredRequests = useMemo(() => {
    let filteredRequests = [...requests];

    // Role-based filtering
    if (currentRole === 'registrar') {
      filteredRequests = filteredRequests.filter(req => 
        ['submitted', 'classified', 'returned', 'declined', 'approved', 'in-register', 'paid-full', 'paid-partial'].includes(req.status)
      );
      
      // Apply registrar-specific filters - same as executor
      if (currentFilter) {
        switch (currentFilter) {
          case 'draft':
            filteredRequests = filteredRequests.filter(req => req.status === 'draft');
            break;
          case 'inProgress':
            filteredRequests = filteredRequests.filter(req => ['submitted', 'classified', 'approved', 'in-register'].includes(req.status));
            break;
          case 'approvedNotPaid':
            filteredRequests = filteredRequests.filter(req => ['approved', 'in-register'].includes(req.status));
            break;
          case 'paid':
            filteredRequests = filteredRequests.filter(req => ['paid-full', 'paid-partial'].includes(req.status));
            break;
          case 'declined':
            filteredRequests = filteredRequests.filter(req => ['declined', 'rejected'].includes(req.status));
            break;
          case 'total':
            // Show all registrar requests
            break;
          case 'newRequests':
            filteredRequests = filteredRequests.filter(req => req.status === 'submitted');
            break;
          case 'overdue':
            filteredRequests = filteredRequests.filter(req => 
              req.status === 'submitted' && isDateOlderThan(req.createdAt, 5)
            );
            break;
        }
      }
    } else if (currentRole === 'distributor') {
      filteredRequests = filteredRequests.filter(req => 
        ['classified', 'approved', 'approved-on-behalf', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(req.status)
      );
      
      // Apply distributor-specific filters
      if (currentFilter) {
        switch (currentFilter) {
          case 'total':
            // Show all distributor requests
            break;
          case 'in-work':
            filteredRequests = filteredRequests.filter(req => req.status === 'classified');
            break;
          case 'returned-for-revision':
            filteredRequests = filteredRequests.filter(req => req.status === 'returned');
            break;
          case 'approved-for-payment':
            filteredRequests = filteredRequests.filter(req => ['approved', 'approved-on-behalf', 'in-register', 'approved-for-payment'].includes(req.status));
            break;
          case 'approved-on-behalf':
            filteredRequests = filteredRequests.filter(req => req.status === 'approved-on-behalf');
            break;
          case 'paid':
            filteredRequests = filteredRequests.filter(req => ['paid-full', 'paid-partial'].includes(req.status));
            break;
          case 'declined':
            filteredRequests = filteredRequests.filter(req => req.status === 'declined');
            break;
          case 'newRequests':
            filteredRequests = filteredRequests.filter(req => req.status === 'classified');
            break;
          case 'overdue':
            filteredRequests = filteredRequests.filter(req => 
              req.status === 'classified' && isDateOlderThan(req.createdAt, 5)
            );
            break;
        }
      }
    } else if (currentRole === 'treasurer') {
      filteredRequests = filteredRequests.filter(req => 
        ['approved', 'approved-on-behalf', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(req.status)
      );
      
      // Apply treasurer-specific filters
      if (currentFilter) {
        switch (currentFilter) {
          case 'total':
            // Show all treasurer requests
            break;
          case 'newRequests':
            filteredRequests = filteredRequests.filter(req => ['approved', 'approved-on-behalf'].includes(req.status));
            break;
          case 'overdue':
            filteredRequests = filteredRequests.filter(req => 
              ['approved', 'approved-on-behalf'].includes(req.status) && isDateOlderThan(req.createdAt, 5)
            );
            break;
        }
      }
    }

    // Search filter
    if (searchTerm) {
      filteredRequests = filteredRequests.filter(req => {
        const counterparty = counterparties.find(cp => cp.id === req.counterpartyId);
        return (
          req.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          counterparty?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.amount.toString().includes(searchTerm)
        );
      });
    }

    // Counterparty filter
    if (counterpartyFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.counterpartyId === counterpartyFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
    }

    return filteredRequests.sort((a, b) => {
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
  }, [requests, searchTerm, counterpartyFilter, statusFilter, currentRole, currentFilter, dashboardFilter, counterparties]);

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  // Get unique counterparties from current requests
  const getUniqueCounterparties = () => {
    const uniqueCounterpartyIds = [...new Set(requests.map(req => req.counterpartyId))];
    return uniqueCounterpartyIds.map(id => {
      const counterparty = counterparties.find(cp => cp.id === id);
      return counterparty ? { id, name: counterparty.name } : { id, name: 'Неизвестен' };
    }).sort((a, b) => a.name.localeCompare(b.name));
  };

  const canCreateRequest = false; // No role can create requests from this component

  const getReviewerName = (status: PaymentRequestStatus) => {
    switch (status) {
      case 'submitted':
        return 'Регистратор';
      case 'classified':
      case 'allocated':
        return 'Распорядитель';
      case 'approved':
      case 'approved-on-behalf':
      case 'in-register':
      case 'approved-for-payment':
        return 'Казначей';
      case 'paid-full':
      case 'paid-partial':
        return 'Завершено';
      case 'declined':
      case 'cancelled':
        return 'Отклонено';
      case 'returned':
        return 'Возвращено';
      case 'draft':
        return 'У автора';
      default:
        return '-';
    }
  };

  const handleFilterClick = (filterType: string) => {
    const newFilter = currentFilter === filterType ? null : filterType;
    setCurrentFilter(newFilter);
  };

  const calculateOverdueCount = () => {
    return filteredRequests.filter(r => 
      ['approved', 'approved-on-behalf'].includes(r.status) && isDateOlderThan(r.createdAt, 5)
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Заявки на оплату</h2>
          <p className="text-muted-foreground">
            {currentRole === 'registrar' ? 'Заявки для классификации' :
             currentRole === 'distributor' ? 'Заявки для согласования' :
             currentRole === 'treasurer' ? 'Заявки к оплате' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {dashboardFilter && (
            <Button 
              variant="outline" 
              onClick={onClearFilter}
            >
              Очистить фильтр
            </Button>
          )}
        </div>
      </div>

      {/* Filters - only show for registrar and distributor */}
      {(currentRole === 'registrar' || currentRole === 'distributor') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and filters - same as executor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по номеру, описанию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={counterpartyFilter} onValueChange={setCounterpartyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Контрагент" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все контрагенты</SelectItem>
                    {getUniqueCounterparties().map(cp => (
                      <SelectItem key={cp.id} value={cp.id}>
                        {cp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="draft">Черновики</SelectItem>
                    <SelectItem value="submitted">Новые</SelectItem>
                    <SelectItem value="classified">Классифицированные</SelectItem>
                    <SelectItem value="approved">Согласованные</SelectItem>
                    <SelectItem value="in-register">В реестре</SelectItem>
                    <SelectItem value="paid-full">Оплачено полностью</SelectItem>
                    <SelectItem value="paid-partial">Оплачено частично</SelectItem>
                    <SelectItem value="declined">Отклонено</SelectItem>
                    <SelectItem value="returned">Возвращено</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>
      )}


      {/* Summary stats - different for registrar and distributor */}
      {currentRole === 'registrar' ? (
        <RegistrarStatsCards 
          filteredRequests={filteredRequests}
          currentFilter={currentFilter}
          onFilterClick={handleFilterClick}
        />
      ) : currentRole === 'distributor' ? (
        <DistributorStatsCards 
          filteredRequests={filteredRequests}
          currentFilter={currentFilter}
          onFilterClick={handleFilterClick}
        />
      ) : currentRole === 'treasurer' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentFilter === 'total' ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => handleFilterClick('total')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Всего</p>
                  <p className="text-xl font-semibold">
                    {filteredRequests.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentFilter === 'newRequests' ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => handleFilterClick('newRequests')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Новые заявки</p>
                  <p className="text-xl font-semibold">
                    {filteredRequests.filter(r => ['approved', 'approved-on-behalf'].includes(r.status)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentFilter === 'overdue' ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => handleFilterClick('overdue')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Просроченные</p>
                  <p className="text-xl font-semibold">
                    {calculateOverdueCount()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">На рассмотрении</p>
                  <p className="text-xl font-semibold">
                    {filteredRequests.filter(r => ['submitted', 'classified'].includes(r.status)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Контрагентов</p>
                  <p className="text-xl font-semibold">
                    {new Set(filteredRequests.map(r => r.counterpartyId)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Просрочено</p>
                  <p className="text-xl font-semibold">
                    {filteredRequests.filter(r => isOverdue(r.dueDate)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requests table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Заявки ({filteredRequests.length})
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Экспорт xlsx
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Загрузка заявок...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-500 mb-2">Ошибка загрузки заявок</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№ заявки</TableHead>
                  <TableHead>Контрагент</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Срок оплаты</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>У кого на рассмотрении</TableHead>
                  <TableHead>Создана</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow 
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onViewRequest?.(request.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{request.requestNumber || request.docNumber}</span>
                        {request.requestNumber && (
                          <span className="text-xs text-muted-foreground">{request.docNumber}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCounterpartyName(request.counterpartyId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{formatCurrency(request.amount, request.currency)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${isOverdue(request.dueDate) ? 'text-red-600' : ''}`}>
                        {formatDateSafely(request.dueDate)}
                        {isOverdue(request.dueDate) && (
                          <Badge variant="destructive" className="text-xs">
                            Просрочено
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={request.status}
                        showTooltip={currentRole === 'executor'}
                        responsible={getReviewerName(request.status)}
                        statusTime={formatTimeSafely(request.updatedAt || request.createdAt)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getReviewerName(request.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateSafely(request.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Заявки не найдены
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}