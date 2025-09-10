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
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setIsLoading(true);
        const data = await PaymentRequestService.getById(requestId);
        setRequest(data);
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
  const getCounterpartyName = (counterpartyId: string) => {
    const counterparty = counterparties.find(cp => cp.id === counterpartyId);
    return counterparty ? counterparty.name : 'Неизвестный контрагент';
  };

  // Helper function to get counterparty category
  const getCounterpartyCategory = (counterpartyId: string) => {
    const counterparty = counterparties.find(cp => cp.id === counterpartyId);
    return counterparty ? counterparty.category : 'Не указано';
  };

  // Helper function to get VAT rate
  const getVatRate = (vatRateName: string | undefined) => {
    if (!vatRateName) return 'Не указано';
    // Since vatRate is stored as name in the form, we can return it directly
    // or find by name if needed for validation
    const vatRate = vatRates.find(vr => vr.name === vatRateName);
    return vatRate ? vatRate.name : vatRateName;
  };

  // Helper function to generate document name using shared utility
  const generateDocumentName = (request: PaymentRequest) => {
    if (request.fileName) {
      return request.fileName;
    }
    
    const counterparty = counterparties.find(cp => cp.id === request.counterpartyId);
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
    const item = expenseitems.find(item => item.id === id);
    return item ? `${item.code} - ${item.name}` : id || 'Неизвестно';
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
        onViewDocument={() => handleDownloadFile({ name: generateDocumentName(request), url: request.docFileUrl })}
        onDownloadDocument={() => handleDownloadFile({ name: generateDocumentName(request), url: request.docFileUrl })}
        showDocumentActions={true}
      />

      {/* Classification Info */}
      {request.expenseSplits && request.expenseSplits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Распределение по статьям расходов
              </div>
              <Badge variant="default">
                Итого: {formatCurrency(request.expenseSplits.reduce((sum, split) => sum + split.amount, 0), request.currency)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.expenseSplits.map((split, index) => (
                <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{getExpenseItemName(split.expenseItemId)}</p>
                    {split.comment && (
                      <div className="mt-1">
                        <p className="text-xs text-muted-foreground">Комментарий регистратора:</p>
                        <p className="text-sm text-muted-foreground italic">{split.comment}</p>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {formatCurrency(split.amount, request.currency)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution Form for Registrar */}
      {request.status === 'approved' && (
        <ExpenseSplitForm
          request={request}
          expenseItems={expenseitems}
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