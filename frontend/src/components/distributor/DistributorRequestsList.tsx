import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Search, Filter, Eye, Clock, AlertTriangle, Star } from 'lucide-react';
import { PaymentRequestExtended } from '../../types';
import { DistributorService, ApiDictionaryService } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { toast } from 'sonner@2.0.3';

interface DistributorRequestsListProps {
  onViewRequest: (id: string) => void;
  paymentRequests?: PaymentRequestExtended[];
}

export function DistributorRequestsList({ onViewRequest, paymentRequests }: DistributorRequestsListProps) {
  const [requests, setRequests] = useState<PaymentRequestExtended[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequestExtended[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Справочники
  const [counterparties, setCounterparties] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, showOnlyAssigned, selectedCounterparty, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Use passed paymentRequests if available, otherwise load from API
      if (paymentRequests && paymentRequests.length > 0) {
        setRequests(paymentRequests);
      } else {
        // Загружаем заявки с признаками закрепления
        const requestsData = await DistributorService.getRequestsWithChiefAssignment('distributor');
        setRequests(requestsData);
      }
      
      // Загружаем справочники
      const counterpartiesData = await ApiDictionaryService.getCounterparties();
      setCounterparties(counterpartiesData);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Фильтр по поисковому запросу
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCounterpartyName(request.counterpartyId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр "только закрепленные"
    if (showOnlyAssigned) {
      filtered = filtered.filter(request => request.isAssignedToChief);
    }

    // Фильтр по контрагенту
    if (selectedCounterparty && selectedCounterparty !== 'all') {
      filtered = filtered.filter(request => request.counterpartyId === selectedCounterparty);
    }

    // Фильтр по периоду
    if (dateFrom) {
      filtered = filtered.filter(request => request.createdAt >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(request => request.createdAt <= dateTo);
    }

    setFilteredRequests(filtered);
  };

  const getCounterpartyName = (id: string) => {
    const counterparty = counterparties.find(c => c.id === id);
    return counterparty?.name || 'Неизвестно';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: currency === 'KZT' ? 'KZT' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUrgencyIcon = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (diffDays <= 3) {
      return <Clock className="h-4 w-4 text-orange-500" />;
    }
    return null;
  };

  const getItemsCount = (request: PaymentRequestExtended) => {
    return request.expenseSplits?.length || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Заявки к согласованию</h2>
          <p className="text-muted-foreground">
            Классифицированные заявки для распределения по контрактам
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredRequests.length} из {requests.length}
        </Badge>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Поиск */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Номер, описание, контрагент..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Контрагент */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Контрагент</label>
              <Select value={selectedCounterparty} onValueChange={setSelectedCounterparty}>
                <SelectTrigger>
                  <SelectValue placeholder="Все контрагенты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все контрагенты</SelectItem>
                  {counterparties.map(counterparty => (
                    <SelectItem key={counterparty.id} value={counterparty.id}>
                      {counterparty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Период с */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Дата с</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Период по */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Дата по</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Дополнительные фильтры */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyAssigned"
                checked={showOnlyAssigned}
                onCheckedChange={setShowOnlyAssigned}
              />
              <label
                htmlFor="onlyAssigned"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Только закрепленные статьи
              </label>
            </div>

            {showOnlyAssigned && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Главный распорядитель
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Таблица заявок */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">№ заявки</TableHead>
                <TableHead>Контрагент</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>Срок</TableHead>
                <TableHead className="text-center">Позиций</TableHead>
                <TableHead className="text-center">Закрепление</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {request.requestNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getCounterpartyName(request.counterpartyId)}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {request.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">
                      {formatCurrency(request.amount, request.currency)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getUrgencyIcon(request.dueDate)}
                      <span className="text-sm">
                        {new Date(request.dueDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {getItemsCount(request)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {request.isAssignedToChief ? (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Закреплено
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Нет</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.priority && (
                      <Badge variant="outline" className="text-xs">
                        {request.priority}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewRequest(request.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRequests.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>Заявки не найдены</p>
              {showOnlyAssigned && (
                <p className="text-sm mt-2">
                  Попробуйте снять фильтр "Только закрепленные статьи"
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}