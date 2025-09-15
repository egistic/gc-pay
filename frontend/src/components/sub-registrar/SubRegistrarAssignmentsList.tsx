import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Search, 
  Filter, 
  Calendar,
  Building,
  DollarSign,
  Download,
  Edit,
  AlertTriangle
} from 'lucide-react';
import { useDictionaryData } from '../../hooks/useDictionaryData';
import { formatCurrency } from '../../utils/formatting';
import { formatDateSafe } from '../../features/payment-requests/lib/formatDateSafe';
import { isOverdue } from '../../features/payment-requests/lib/isOverdue';
import { getReviewerByStatus } from '../../features/payment-requests/constants/status-map';
import { PaymentRequestService } from '../../services/paymentRequestService';
import { useAuth } from '../../context/AuthContext';

interface SubRegistrarRequestsListProps {
  onViewRequest?: (id: string) => void;
  onEditRequest?: (id: string) => void;
}

function SubRegistrarRequestsList({ onViewRequest, onEditRequest }: SubRegistrarRequestsListProps) {
  // Get dictionary data
  const { items: counterparties } = useDictionaryData('counterparties');
  
  // Get current user
  const { user } = useAuth();
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [counterpartyFilter, setCounterpartyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load requests assigned to this sub-registrar
  React.useEffect(() => {
    const loadRequests = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get requests for sub-registrar (all SUBMITTED and CLASSIFIED requests)
        const data = await PaymentRequestService.getAll({ 
          role: 'SUB_REGISTRAR'
        });
        
        setRequests(data);
      } catch (err) {
        console.error('Error loading sub-registrar requests:', err);
        setError(err instanceof Error ? err.message : 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user?.id]);

  // Get unique counterparties from user's requests
  const availableCounterparties = useMemo(() => {
    const counterpartyIds = [...new Set(requests.map(req => req.counterpartyId))];
    return counterparties.filter(cp => counterpartyIds.includes(cp.id));
  }, [requests, counterparties]);

  // Filter requests based on filters
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];
    
    // SUB_REGISTRAR only sees 'classified' requests
    filtered = filtered.filter(req => req.status === 'classified');
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(req => {
        const counterparty = counterparties.find(cp => cp.id === req.counterpartyId);
        return (
          req.docNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          counterparty?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.amount.toString().includes(searchTerm)
        );
      });
    }
    
    // Apply counterparty filter
    if (counterpartyFilter !== 'all') {
      filtered = filtered.filter(req => req.counterpartyId === counterpartyFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    return filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }
        return dateB.getTime() - dateA.getTime(); // Newest first
      } catch (error) {
        return 0;
      }
    });
  }, [requests, searchTerm, counterpartyFilter, statusFilter, counterparties]);

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const getStatusOptions = () => {
    const statusLabels: Record<string, string> = {
      'classified': 'Классифицирована',
      'returned': 'Возвращена',
      'approved': 'Утверждена',
      'in-register': 'В реестре',
      'to-pay': 'К оплате',
      'approved-for-payment': 'Утверждена к оплате',
      'paid-full': 'Оплачена полностью',
      'paid-partial': 'Оплачена частично',
      'rejected': 'Отклонена',
      'declined': 'Отклонена',
      'cancelled': 'Аннулирована',
      'closed': 'Закрыта'
    };
    
    // Use statuses relevant for sub-registrar (excluding submitted/new)
    const subRegistrarStatuses = [
      'classified', 'returned', 'approved', 'in-register', 
      'to-pay', 'approved-for-payment', 'paid-full', 'paid-partial',
      'rejected', 'declined', 'cancelled', 'closed'
    ];
    
    const statuses = [
      { value: 'all', label: 'Все статусы' },
      ...subRegistrarStatuses.map(status => ({
        value: status,
        label: statusLabels[status] || status
      }))
    ];
    
    return statuses;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Загрузка заявок...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500 mb-2">Ошибка загрузки заявок</p>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="mt-4"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Заявки на оплату</h2>
          <p className="text-muted-foreground">
            Все ваши заявки, отсортированные от новых к старым
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <SelectValue placeholder={`Контрагент (${availableCounterparties.length})`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все контрагенты ({availableCounterparties.length})</SelectItem>
                {availableCounterparties.map(cp => (
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
                {getStatusOptions().map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Всего заявок</p>
                <p className="text-xl font-semibold">{filteredRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-orange-500" />
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
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Общая сумма</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(filteredRequests.reduce((sum, r) => sum + r.amount, 0), 'KZT')}
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
          <div>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">№ заявки</TableHead>
                  <TableHead className="w-40">Контрагент</TableHead>
                  <TableHead className="w-24">Сумма</TableHead>
                  <TableHead className="w-28">Срок оплаты</TableHead>
                  <TableHead className="w-32">Статус</TableHead>
                  <TableHead className="w-36">У кого на рассмотрении</TableHead>
                  <TableHead className="w-28">Создана</TableHead>
                  <TableHead className="w-16">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow 
                    key={request.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onViewRequest?.(request.id)}
                  >
                    <TableCell className="font-medium w-32">
                      <div className="flex flex-col">
                        <span 
                          className="truncate text-ellipsis overflow-hidden" 
                          title={request.requestNumber || request.docNumber}
                          style={{ maxWidth: '128px' }}
                        >
                          {request.requestNumber || request.docNumber}
                        </span>
                        {request.requestNumber && (
                          <span 
                            className="text-xs text-muted-foreground truncate text-ellipsis overflow-hidden" 
                            title={request.docNumber}
                            style={{ maxWidth: '128px' }}
                          >
                            {request.docNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-40">
                      <span 
                        className="truncate block text-ellipsis overflow-hidden" 
                        title={getCounterpartyName(request.counterpartyId)}
                        style={{ maxWidth: '160px' }}
                      >
                        {getCounterpartyName(request.counterpartyId)}
                      </span>
                    </TableCell>
                    <TableCell className="w-24">
                      <div className="flex items-center gap-1">
                        <span className="truncate">{formatCurrency(request.amount, request.currency)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-28">
                      <div className={`flex items-center gap-2 ${isOverdue(request.dueDate) ? 'text-red-600' : ''}`}>
                        <span className="truncate">{formatDateSafe(request.dueDate)}</span>
                        {isOverdue(request.dueDate) && (
                          <Badge variant="destructive" className="text-xs">
                            Просрочено
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-32">
                      <StatusBadge 
                        status={request.status}
                        showTooltip={true}
                        responsible={getReviewerByStatus(request.status)}
                        statusTime={formatDateSafe(request.updatedAt || request.createdAt)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground w-36">
                      <span 
                        className="truncate block text-ellipsis overflow-hidden" 
                        title={getReviewerByStatus(request.status)}
                        style={{ maxWidth: '144px' }}
                      >
                        {getReviewerByStatus(request.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground w-28">
                      <span className="truncate block">{formatDateSafe(request.createdAt)}</span>
                    </TableCell>
                    <TableCell className="w-16">
                      <div className="flex items-center justify-end gap-1">
                        {request.status === 'returned' && onEditRequest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onEditRequest(request.id);
                            }}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
        </CardContent>
      </Card>
    </div>
  );
}

// Export as default and named export for compatibility
export default SubRegistrarRequestsList;
export { SubRegistrarRequestsList };
export { SubRegistrarRequestsList as SubRegistrarAssignmentsList };
