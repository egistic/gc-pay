import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, File, Eye, Edit, FileText, Building, Calendar, User, DollarSign, Percent, AlignLeft, Target } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { StatusBadge } from '../common/StatusBadge';
import { StatusProgress } from '../common/StatusProgress';
import { RequestInformationCard } from '../common/RequestInformationCard';
import { PaymentRequest } from '../../types';
import { PaymentRequestService } from '../../services/api';
import { RegistrarAssignmentService } from '../../services/registrarAssignmentService';
import { useDictionaries } from '../../hooks/useDictionaries';
import { toast } from 'sonner';
import { OptimizedCreateRequestForm } from './OptimizedCreateRequestForm';
import { ExpenseSplitForm } from '../registrar/shared/ExpenseSplitForm';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import { formatDateSafe } from '../../features/payment-requests/lib/formatDateSafe';
import { buildDocumentFileName } from '../../features/payment-requests/lib/buildDocumentFileName';

interface RequestViewFormProps {
  requestId: string;
  onCancel: () => void;
  onRequestUpdate?: (updatedRequest: PaymentRequest) => void;
}

export function RequestViewForm({ requestId, onCancel, onRequestUpdate }: RequestViewFormProps) {

  // Get dictionary data
  const { items: counterparties } = useDictionaries('counterparties');
  const { items: expenseitems } = useDictionaries('expense-articles');
  const { items: vatRates } = useDictionaries('vat-rates');
  const { items: users } = useDictionaries('users');
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [registrarAssignment, setRegistrarAssignment] = useState<any>(null);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setIsLoading(true);
        const data = await PaymentRequestService.getById(requestId);
        setRequest(data);
        
        // Load registrar assignment data if available
        try {
          const assignmentData = await RegistrarAssignmentService.getRegistrarAssignment(requestId);
          console.log('Registrar assignment data:', assignmentData);
          setRegistrarAssignment(assignmentData);
        } catch (error) {
          // Registrar assignment not found, this is normal for some requests
          console.log('No registrar assignment found for request:', requestId);
          setRegistrarAssignment(null);
        }
      } catch (error) {
        console.error('Failed to load request:', error);
        toast.error('Ошибка загрузки заявки');
      } finally {
        setIsLoading(false);
      }
    };

    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  // Helper function to get counterparty name
  const getCounterpartyName = (counterpartyId: string): string => {
    const counterparty = counterparties.find(cp => cp.id === counterpartyId) as any;
    return counterparty ? counterparty.name : 'Неизвестный контрагент';
  };

  // Helper function to get counterparty category
  const getCounterpartyCategory = (counterpartyId: string): string => {
    const counterparty = counterparties.find(cp => cp.id === counterpartyId) as any;
    return counterparty ? (counterparty.category || 'Не указано') : 'Не указано';
  };

  // Helper function to get VAT rate
  const getVatRate = (vatRateName: string | undefined): string => {
    if (!vatRateName) return 'Не указано';
    // Since vatRate is stored as name in the form, we can return it directly
    // or find by name if needed for validation
    const vatRate = vatRates.find(vr => vr.name === vatRateName) as any;
    return vatRate ? vatRate.name : vatRateName;
  };

  // Helper function to generate document name using shared utility
  const generateDocumentName = (request: PaymentRequest) => {
    // Check if there are files in the request
    if (request.files && request.files.length > 0) {
      return request.files[0].name || request.files[0].originalName || 'Документ';
    }
    
    // Fallback to fileName if available
    if (request.fileName) {
      return request.fileName;
    }
    
    const counterparty = counterparties.find(cp => cp.id === request.counterpartyId) as any;
    const counterpartyName = counterparty?.abbreviation || counterparty?.name || 'Unknown';
    
    return buildDocumentFileName({
      docType: request.docType || 'Заявка',
      docNumber: request.docNumber || request.requestNumber || 'UNKNOWN',
      docDate: request.docDate || request.createdAt,
      payingCompany: request.payingCompany || 'KD',
      counterpartyName
    });
  };

  const handleDownloadFile = (file: { name: string; url?: string }) => {
    if (file.url) {
      // В реальном приложении здесь был бы просмотр файла
      window.open(file.url, '_blank');
    } else {
      // Показать информацию о документе
      toast.info(`Просмотр документа: ${file.name}`);
    }
  };

  const handleViewFile = (file: { name: string; url?: string; originalName?: string }) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else {
      toast.info(`Просмотр документа: ${file.originalName || file.name}`);
    }
  };

  const handleDownloadMultipleFile = (file: { name: string; url?: string; originalName?: string }) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.originalName || file.name;
      link.click();
    } else {
      toast.info(`Скачивание документа: ${file.originalName || file.name}`);
    }
  };

  const handleEditRequest = () => {
    setIsEditing(true);
  };

  const handleRequestSave = async (updatedRequest: Partial<PaymentRequest>) => {
    try {
      setIsLoading(true);
      const updated = await PaymentRequestService.update(requestId, updatedRequest);
      setRequest(updated);
      setIsEditing(false);
      
      if (onRequestUpdate) {
        onRequestUpdate(updated);
      }
      
      const actionText = updatedRequest.status === 'draft' ? 'сохранен' : 'обновлен и отправлен';
      toast.success(`Черновик заявки ${actionText}`);
    } catch (error) {
      console.error('Failed to update request:', error);
      toast.error('Ошибка сохранения заявки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const getExpenseItemName = (id: string) => {
    const item = expenseitems.find(item => item.id === id) as any;
    return item ? `${item.code} - ${item.name}` : id || 'Неизвестно';
  };

  // Helper function to get expense article name for registrar assignment
  const getExpenseArticleName = (id: string) => {
    console.log('Looking for expense article ID:', id);
    console.log('Available expense items:', expenseitems);
    const article = expenseitems.find(item => item.id === id) as any;
    console.log('Found article:', article);
    return article ? article.name : 'Неизвестная статья';
  };

  // Helper function to get user name for registrar assignment
  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id) as any;
    return user ? user.fullName || user.name : 'Неизвестный пользователь';
  };

  // Если режим редактирования, показываем форму редактирования
  if (isEditing && request) {
    return (
      <OptimizedCreateRequestForm
        onSubmit={handleRequestSave}
        onCancel={handleCancelEdit}
        onSaveDraft={handleRequestSave}
        initialData={request}
        isEditing={true}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Заявка не найдена</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Заявка {request.requestNumber}</h1>
            <p className="text-muted-foreground">
              {request.status === 'draft' ? 'Просмотр и редактирование черновика' : 'Просмотр деталей заявки'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {request.status === 'draft' && (
            <Button onClick={handleEditRequest} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Редактировать
            </Button>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Статус обработки</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusProgress status={request.status} />
        </CardContent>
      </Card>

      {/* Request Information */}
      <RequestInformationCard
        request={request}
        getCounterpartyName={getCounterpartyName}
        getCounterpartyCategory={getCounterpartyCategory}
        getVatRate={getVatRate}
        onViewDocument={() => {
          if (request.files && request.files.length > 0) {
            handleViewFile(request.files[0]);
          } else if (request.docFileUrl) {
            handleViewFile({ name: generateDocumentName(request), url: request.docFileUrl });
          } else {
            toast.info('Документ не прикреплен');
          }
        }}
        onDownloadDocument={() => {
          if (request.files && request.files.length > 0) {
            handleDownloadMultipleFile(request.files[0]);
          } else if (request.docFileUrl) {
            handleDownloadFile({ name: generateDocumentName(request), url: request.docFileUrl });
          } else {
            toast.info('Документ не прикреплен');
          }
        }}
        showDocumentActions={true}
      />

      {/* Registrar Assignment Info */}
      {registrarAssignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Назначение суб-регистратора
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Статья расходов</label>
                <p className="text-sm font-medium">
                  {registrarAssignment.expense_article_id ? getExpenseArticleName(registrarAssignment.expense_article_id) : 'Не назначена'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Назначенная сумма</label>
                <p className="text-sm font-medium">
                  {registrarAssignment.assigned_amount ? formatCurrency(registrarAssignment.assigned_amount, request.currency) : 'Не указана'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Назначенный суб-регистратор</label>
                <p className="text-sm font-medium">
                  {registrarAssignment.assigned_sub_registrar_id ? getUserName(registrarAssignment.assigned_sub_registrar_id) : 'Не назначен'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Дата назначения</label>
                <p className="text-sm font-medium">
                  {registrarAssignment.classification_date ? formatDateSafe(registrarAssignment.classification_date) : 'Не указана'}
                </p>
              </div>
            </div>
            {registrarAssignment.registrar_comments && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Комментарии регистратора</label>
                <p className="text-sm bg-muted p-3 rounded-md">{registrarAssignment.registrar_comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Distribution Form for Registrar */}
      {request.status === 'approved' && (
        <ExpenseSplitForm
          request={request}
          expenseItems={expenseitems as any[]}
          onSplitsChange={(splits) => {
            // Handle splits change if needed
          }}
          showValidation={true}
        />
      )}

      {/* Payment Allocations */}
      {request.paymentAllocations && request.paymentAllocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Распределение платежа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.paymentAllocations.map((allocation, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Договор</label>
                      <p className="font-medium">{allocation.contractId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Сумма</label>
                      <p className="font-medium">{formatCurrency(allocation.amount, request.currency)}</p>
                    </div>
                  </div>
                  {allocation.comment && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-muted-foreground">Комментарий</label>
                      <p>{allocation.comment}</p>
                    </div>
                  )}
                  {allocation.priority && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-muted-foreground">Приоритет</label>
                      <Badge variant={allocation.priority === 'high' ? 'destructive' : 
                                     allocation.priority === 'medium' ? 'default' : 'secondary'}>
                        {allocation.priority === 'high' ? 'Высокий' : 
                         allocation.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Info */}
      {request.paymentExecution && (
        <Card>
          <CardHeader>
            <CardTitle>Исполнение платежа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.paymentExecution.actualAmount && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Фактическая сумма</label>
                <p className="font-medium">{formatCurrency(request.paymentExecution.actualAmount, request.currency)}</p>
              </div>
            )}
            
            {request.paymentExecution.executionDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Дата исполнения</label>
                <p>{formatDateSafe(request.paymentExecution.executionDate)}</p>
              </div>
            )}
            
            {request.paymentExecution.exchangeRate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Курс валют</label>
                <p>{request.paymentExecution.exchangeRate}</p>
              </div>
            )}
            
            {request.paymentExecution.executionComment && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <label className="text-sm font-medium text-orange-800">Комментарий казначея</label>
                <p className="mt-1 text-orange-700">{request.paymentExecution.executionComment}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}