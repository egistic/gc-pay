import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { 
  Save, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { PaymentRequest, ExpenseSplit, ContractStatus, ParallelDistributionCreate } from '../../types';
import { useDictionaries } from '../../hooks/useDictionaries';
import { RequestInformationCard } from '../common/RequestInformationCard';
import { ExpenseSplitForm } from './shared/ExpenseSplitForm';
import { DistributionService } from '../../services/distributionService';
import { NotificationService } from '../../services/notificationService';
import { SplitRequestService } from '../../services/splitRequestService';
import { PaymentRequestService } from '../../services/paymentRequestService';
import { RegistrarAssignmentService } from '../../services/registrarAssignmentService';
import { useExpenseSplits } from '../../hooks/useExpenseSplits';
import { useAuth } from '../../context/AuthContext';


interface ItemClassificationFormProps {
  request: PaymentRequest;
  onSubmit: (expenseSplits: ExpenseSplit[], comment?: string) => void;
  onReturn: (comment: string) => void;
  onCancel: () => void;
}

// Constants for default values
const DEFAULT_CONTRACT_ID = 'outside-contract';
const DEFAULT_PRIORITY = 'medium';
const RELEVANT_COUNTERPARTY_CATEGORIES = ['Элеватор', 'Поставщик Услуг'];

export function ItemClassificationForm({ request, onSubmit, onReturn, onCancel }: ItemClassificationFormProps) {
  // Get authentication context
  const { user } = useAuth();
  
  // Get dictionary data
  const { items: expenseItems, state: expenseItemsState } = useDictionaries('expense-articles');
  const { items: counterparties, state: counterpartiesState } = useDictionaries('counterparties');
  
  const [returnComment, setReturnComment] = useState('');
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);

  // Use the centralized expense splits hook
  const { 
    splits: expenseSplits, 
    setSplits: setExpenseSplits, 
    validationWarnings, 
    isFormValid 
  } = useExpenseSplits({ 
    request, 
    initialSplits: [] 
  });

  // Load contract status only for relevant counterparty categories
  useEffect(() => {
    const loadContractStatus = async () => {
      try {
        // Only check contract status for counterparties that might have contracts
        // This prevents unnecessary API calls for counterparties that don't need contract validation
        const counterparty = counterparties.find(cp => cp.id === request.counterpartyId);
        if (!counterparty || !RELEVANT_COUNTERPARTY_CATEGORIES.includes(counterparty.category)) {
          setContractStatus(null);
          return;
        }

        const contractStatusData = await DistributionService.getContractStatus(request.counterpartyId);
        setContractStatus(contractStatusData);
      } catch (error) {
        console.error('Error loading contract status:', error);
        setContractStatus(null);
      }
    };

    // Only load if counterparties are loaded and we have a valid counterparty
    if (counterparties.length > 0 && request.counterpartyId) {
      loadContractStatus();
    }
  }, [request.counterpartyId, counterparties]);

  // Utility function to extract request ID with proper validation
  const extractRequestId = (request: PaymentRequest | PaymentRequest[]): string => {
    if (Array.isArray(request)) {
      if (request.length === 0) {
        throw new Error('Invalid request array: array is empty');
      }
      
      const firstRequest = request[0];
      if (!firstRequest || typeof firstRequest !== 'object' || !firstRequest.id) {
        throw new Error('Invalid request array: first element must have an id property');
      }
      
      return typeof firstRequest.id === 'string' ? firstRequest.id : String(firstRequest.id);
    } 
    
    if (typeof request === 'object' && request !== null) {
      if (!request.id) {
        throw new Error('Invalid request object: missing id property');
      }
      return typeof request.id === 'string' ? request.id : String(request.id);
    } 
    
    if (typeof request === 'string') {
      throw new Error(`Invalid request type: string. Expected object or array.`);
    }
    
    throw new Error(`Invalid request type: ${typeof request}. Expected object or array.`);
  };

  // Utility function to validate UUID format
  const validateRequestId = (requestId: string): void => {
    if (!requestId || requestId.includes('[object') || requestId.includes(',')) {
      throw new Error(`Invalid request ID: ${requestId}`);
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      throw new Error(`Invalid request ID format: ${requestId}. Expected UUID format.`);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.error('Исправьте ошибки валидации перед отправкой');
      return;
    }

    // Check if expenseSplits is defined and not empty
    if (!expenseSplits || expenseSplits.length === 0) {
      toast.error('Добавьте статьи расходов для классификации');
      return;
    }

    // Check if all splits have sub-registrars assigned
    const unassignedSplits = (expenseSplits || []).filter(split => !split.subRegistrarId);
    if (unassignedSplits.length > 0) {
      toast.error('Выберите суб-регистратора для всех позиций');
      return;
    }

    // Early validation of request object
    if (!request) {
      toast.error('Ошибка: объект заявки не найден');
      return;
    }

    setIsLoading(true);
    try {
      // Extract and validate request ID using utility function
      const requestId = extractRequestId(request);
      validateRequestId(requestId);


      // Check if we need to split (multiple expense items) or just assign (single item)
      if (expenseSplits.length === 1) {
        // Single expense item - create registrar assignment only (no status change)
        const singleSplit = expenseSplits[0];
        
        // Create registrar assignment
        const assignmentData = {
          request_id: requestId,
          assigned_sub_registrar_id: singleSplit.subRegistrarId,
          expense_article_id: singleSplit.expenseItemId,
          assigned_amount: singleSplit.amount,
          registrar_comments: singleSplit.comment || 'Заявка назначена суб-регистратору'
        };

        // Create or update registrar assignment
        await RegistrarAssignmentService.upsertRegistrarAssignment(assignmentData);
        
        toast.success('Заявка успешно назначена суб-регистратору');
      } else {
        // Multiple expense items - use split logic
        const distributorId = user?.id || '';
        
        // Prepare expense splits for split request with individual sub-registrar assignments
        const splitExpenseSplits = (expenseSplits || []).map(split => ({
          expense_item_id: split.expenseItemId,
          amount: split.amount,
          comment: split.comment || '',
          contract_id: split.contractId || DEFAULT_CONTRACT_ID,
          priority: split.priority || DEFAULT_PRIORITY,
          sub_registrar_id: split.subRegistrarId
        }));

        // Debug: Log the expense splits to see what sub-registrar IDs are being sent
        console.log('Expense splits being sent:', splitExpenseSplits);
        console.log('Individual sub-registrar IDs:', splitExpenseSplits.map(s => s.sub_registrar_id));

        // Call Split endpoint
        console.log('Sending split request with payload:', {
          original_request_id: requestId,
          expense_splits: splitExpenseSplits,
          sub_registrar_id: null,
          distributor_id: distributorId,
          comment: 'Заявка разделена на статьи расходов'
        });
        
        const splitResult = await SplitRequestService.splitRequest({
          original_request_id: requestId,
          expense_splits: splitExpenseSplits,
          sub_registrar_id: null, // Not used anymore - individual assignments in expense_splits
          distributor_id: distributorId,
          comment: 'Заявка разделена на статьи расходов'
        });
        
        console.log('Split result:', splitResult);

        // Registrar assignments are now created automatically by the backend during split

        // Send notifications
        NotificationService.notifyRequestDistributed(requestId, request.requestNumber || 'Без номера');
        NotificationService.notifyDistributorRequestCreated(requestId, request.requestNumber || 'Без номера');
        
        toast.success(`Заявка успешно разделена на ${splitResult.split_requests.length} заявок с назначениями суб-регистраторов`);
      }
      
      // Convert to ExpenseSplit format for parent component
      const expenseSplitsForParent: ExpenseSplit[] = (expenseSplits || []).map((split, index) => ({
        id: `split-${Date.now()}-${index}`,
        requestId: requestId,
        expenseItemId: split.expenseItemId,
        amount: split.amount,
        comment: split.comment,
        contractId: DEFAULT_CONTRACT_ID,
        priority: DEFAULT_PRIORITY,
        subRegistrarId: split.subRegistrarId
      }));
      
      onSubmit(expenseSplitsForParent);
    } catch (error) {
      console.error('Error classifying request:', error);
      toast.error('Ошибка при классификации заявки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!returnComment.trim()) {
      toast.error('Укажите причину возврата');
      return;
    }

    // Early validation of request object
    if (!request) {
      toast.error('Ошибка: объект заявки не найден');
      return;
    }

    setIsLoading(true);
    try {
      // Extract and validate request ID using utility function
      const requestId = extractRequestId(request);
      validateRequestId(requestId);
      
      await DistributionService.returnRequest({
        requestId: requestId,
        comment: returnComment
      });
      toast.success('Заявка возвращена исполнителю');
      onReturn(returnComment);
      setShowReturnDialog(false);
    } catch (error) {
      console.error('Error returning request:', error);
      toast.error('Ошибка при возврате заявки');
    } finally {
      setIsLoading(false);
    }
  };

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const getExpenseItemName = (id: string): string => {
    const item = expenseItems.find(item => item.id === id);
    return item?.name || '';
  };

  
  // Show loading state while dictionaries are loading
  if (expenseItemsState.isLoading || counterpartiesState.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка справочников...</p>
        </div>
      </div>
    );
  }

  // Show error state if dictionaries failed to load
  if (expenseItemsState.error || counterpartiesState.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Ошибка загрузки справочников</p>
          <p className="text-sm text-muted-foreground">
            {expenseItemsState.error || counterpartiesState.error}
          </p>
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
          </Button>
          <div>
            <h2>Классификация заявки {request.requestNumber}</h2>
            <p className="text-muted-foreground">
              Выберите статьи расходов и укажите суммы
            </p>
          </div>
        </div>
      </div>

      {/* Request Information */}
      <RequestInformationCard
        request={request}
        getCounterpartyName={getCounterpartyName}
        onViewDocument={() => {
          if (request.docFileUrl) {
            window.open(request.docFileUrl, '_blank');
          } else {
            toast.info(`Скачивание файла: ${request.fileName}`);
          }
        }}
        onDownloadDocument={() => {
          toast.info(`Скачивание файла: ${request.fileName}`);
        }}
        showDocumentActions={true}
      />

      {/* Contract Status */}
      {contractStatus && (
        <Card className={contractStatus.hasContract ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-2 ${contractStatus.hasContract ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex-1">
                {contractStatus.hasContract ? (
                  <div className="text-green-800">
                    <p className="font-medium">Имеется договор с контрагентом</p>
                    <p className="text-sm">№ {contractStatus.contractNumber} от {contractStatus.contractDate}</p>
                    {contractStatus.validityPeriod && (
                      <p className="text-sm mt-1">Срок действия: {contractStatus.validityPeriod}</p>
                    )}
                    {contractStatus.rates && (
                      <p className="text-sm mt-1">Тарифы: {contractStatus.rates}</p>
                    )}
                    {contractStatus.contractInfo && (
                      <p className="text-sm mt-1">Информация: {contractStatus.contractInfo}</p>
                    )}
                    {contractStatus.contractFileUrl && (
                      <button 
                        className="text-sm mt-2 text-blue-600 hover:text-blue-800 underline"
                        onClick={() => window.open(contractStatus.contractFileUrl, '_blank')}
                      >
                        📄 Скачать договор
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-red-800">
                    <p className="font-medium">Договор с контрагентом отсутствует</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Expense Splits Form */}
      <ExpenseSplitForm
        request={request}
        expenseItems={expenseItems as any}
        onSplitsChange={setExpenseSplits}
        showValidation={true}
      />

      {/* Validation Warnings */}
      {!isFormValid && validationWarnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-amber-800">Требуется исправление</h4>
                <ul className="space-y-1 text-sm text-amber-700">
                  {validationWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-6 border-t">
        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">Вернуть</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Возврат заявки</DialogTitle>
              <DialogDescription>
                Укажите причину возврата заявки исполнителю для доработки.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Причина возврата *</Label>
                <Textarea
                  placeholder="Укажите причину возврата заявки исполнителю..."
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                  Отмена
                </Button>
                <Button onClick={handleReturn} disabled={!returnComment.trim()}>
                  Вернуть заявку
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid || isLoading}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Классифицировать
        </Button>
      </div>
    </div>
  );
}

export default ItemClassificationForm;
