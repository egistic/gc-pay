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
import { PaymentRequest } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { useDictionaries } from '../../hooks/useDictionaries';
import { SubRegistrarRequestView } from './SubRegistrarRequestView';

interface SubRegistrarDashboardProps {
  currentUserId: string;
  onViewRequest: (request: PaymentRequest) => void;
}

interface ClosingDocumentData {
  documentType: string;
  documentNumber: string;
  documentDate: string;
  amountWithoutVat: number;
  vatAmount: number;
  currency: string;
  files: Array<{id: string, name: string, url: string, originalName: string}>;
  originalDocumentsStatus: string;
  comment?: string;
}

export function SubRegistrarDashboard({ currentUserId, onViewRequest }: SubRegistrarDashboardProps) {
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
        // TODO: Implement actual API call to get requests assigned to this sub-registrar
        // For testing purposes, using mock data
        const mockRequests: PaymentRequest[] = [
          {
            id: '1',
            requestNumber: 'REQ-001',
            createdAt: '2024-01-15T10:00:00Z',
            dueDate: '2024-01-20T18:00:00Z',
            counterpartyId: '101c496f-ba9d-4c44-bacb-e1db78f1923f', // ООО "Элеватор 1"
            amount: 150000,
            currency: 'KZT',
            description: 'Оплата услуг элеватора за хранение зерна',
            status: 'classified',
            responsibleRegistrarId: currentUserId,
            files: [
              {
                id: 'file1',
                name: 'contract_elevator.pdf',
                url: '/documents/contract_elevator.pdf',
                originalName: 'Договор_элеватор_2024.pdf'
              }
            ],
            docType: 'Договор',
            docNumber: 'Д-ЭЛ-2024-001',
            docDate: '2024-01-15',
            payingCompany: 'KD',
            vatRate: '12%'
          },
          {
            id: '2',
            requestNumber: 'REQ-002',
            createdAt: '2024-01-16T14:30:00Z',
            dueDate: '2024-01-22T18:00:00Z',
            counterpartyId: 'cp2',
            amount: 75000,
            currency: 'KZT',
            description: 'Логистические услуги по транспортировке',
            status: 'classified',
            responsibleRegistrarId: currentUserId,
            files: [],
            docType: 'АВР',
            docNumber: 'АВР-2024-001',
            docDate: '2024-01-16',
            payingCompany: 'SD',
            vatRate: '12%'
          }
        ];
        setRequests(mockRequests);
        setFilteredRequests(mockRequests);
      } catch (error) {
        console.error('Error loading assigned requests:', error);
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
        getCounterpartyName(request.counterpartyId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter]);

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const handleViewRequest = (request: PaymentRequest) => {
    setSelectedRequest(request);
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
  };

  const handleSaveClosingDocument = async (data: ClosingDocumentData) => {
    // TODO: Implement API call to save closing document data
    console.log('Saving closing document data:', data);
    // For now, just show success message
    return Promise.resolve();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'classified':
        return <Badge className="bg-blue-100 text-blue-800">Классифицирована</Badge>;
      case 'allocated':
        return <Badge className="bg-green-100 text-green-800">Распределена</Badge>;
      case 'returned':
        return <Badge className="bg-red-100 text-red-800">Возвращена</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'classified':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'allocated':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'returned':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
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
                      {getCounterpartyName(request.counterpartyId)}
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
