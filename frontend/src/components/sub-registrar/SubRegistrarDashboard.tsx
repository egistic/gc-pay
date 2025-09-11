import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Eye, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { PaymentRequest, ClosingDocumentData } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { useDictionaries } from '../../hooks/useDictionaries';
import { SubRegistrarRequestView } from './SubRegistrarRequestView';
import { getStatusIcon, getStatusBadge } from '../common/RequestStatus';
import { getCounterpartyName } from '../../utils/counterparty';
import { PaymentRequestService } from '../../services/paymentRequestService';
import { SubRegistrarService } from '../../services/subRegistrarService';
import { toast } from 'sonner';

interface SubRegistrarDashboardProps {
  currentUserId: string;
}

export function SubRegistrarDashboard({ currentUserId }: SubRegistrarDashboardProps) {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);

  const { items: counterparties, state: counterpartiesState } = useDictionaries('counterparties');
  const { items: expenseItems, state: expenseItemsState } = useDictionaries('expense-articles');

  // Simple date formatting function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load assigned requests
  useEffect(() => {
    const loadAssignedRequests = async () => {
      try {
        setIsLoading(true);
        
        // Get requests assigned to this sub-registrar
        const data = await PaymentRequestService.getAll({ responsibleRegistrarId: currentUserId });
        
        // Transform backend data to frontend format
        const transformedRequests: PaymentRequest[] = data.map((req: any) => ({
          id: req.id,
          requestNumber: req.number,
          createdAt: req.created_at,
          dueDate: req.due_date,
          counterpartyId: req.counterparty_id,
          amount: req.amount_total,
          currency: req.currency_code,
          description: req.title,
          status: req.status,
          responsibleRegistrarId: req.responsible_registrar_id,
          files: req.files || [],
          docType: req.doc_type,
          docNumber: req.doc_number,
          docDate: req.doc_date,
          payingCompany: req.paying_company,
          vatRate: req.vat_rate
        }));
        
        setRequests(transformedRequests);
        setFilteredRequests(transformedRequests);
      } catch (error) {
        console.error('Error loading assigned requests:', error);
        setRequests([]);
        setFilteredRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignedRequests();
  }, [currentUserId]);

  // Filter requests
  useEffect(() => {
    let filtered = requests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCounterpartyName(counterparties, request.counterpartyId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter]);


  const handleViewRequest = (request: PaymentRequest) => {
    setSelectedRequest(request);
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
  };

  const handleSaveClosingDocument = async (data: ClosingDocumentData) => {
    try {
      if (!selectedRequest) {
        throw new Error('No request selected');
      }
      
      await SubRegistrarService.saveClosingDocs(selectedRequest.id, data);
      toast.success('Закрывающие документы успешно сохранены');
    } catch (error) {
      console.error('Error saving closing document:', error);
      toast.error('Ошибка при сохранении закрывающих документов');
      throw error;
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  // Show request view if a request is selected
  if (selectedRequest) {
    return (
      <SubRegistrarRequestView
        request={selectedRequest}
        onBack={handleBackToList}
        onSave={handleSaveClosingDocument}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Мои заявки</h2>
          <p className="text-muted-foreground">
            Заявки, назначенные вам как ответственному регистратору
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-800">
            Суб-Регистратор
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Всего заявок</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Классифицированы</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'classified').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Возвращены</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'returned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Общая сумма</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(requests.reduce((sum, r) => sum + r.amount, 0), 'KZT')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск по номеру, описанию или контрагенту..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Все статусы</option>
                <option value="classified">Классифицированы</option>
                <option value="allocated">Распределены</option>
                <option value="returned">Возвращены</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список заявок ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет заявок для отображения</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Контрагент</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead>Срок</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.requestNumber}
                    </TableCell>
                    <TableCell>
                      {getCounterpartyName(counterparties, request.counterpartyId)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(request.amount, request.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell>
                      {formatDate(request.dueDate)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
