import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { 
  Save, 
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { PaymentRequest, ExpenseSplit, ExpenseItem, ContractStatus, User, DistributionCreate, ExpenseSplitCreate } from '../../types';
import { useDictionaries } from '../../hooks/useDictionaries';
import { RequestInformationCard } from '../common/RequestInformationCard';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import { DistributionService } from '../../services/distributionService';

interface ExpenseSplitData {
  id: string;
  requestId: string;
  expenseItemId: string;
  amount: number;
  comment?: string;
}

interface ItemClassificationFormProps {
  request: PaymentRequest;
  onSubmit: (expenseSplits: ExpenseSplit[], comment?: string) => void;
  onReturn: (comment: string) => void;
  onCancel: () => void;
}

export function ItemClassificationForm({ request, onSubmit, onReturn, onCancel }: ItemClassificationFormProps) {
  // Get dictionary data
  const { items: expenseItems, state: expenseItemsState } = useDictionaries('expense-articles');
  const { items: counterparties, state: counterpartiesState } = useDictionaries('counterparties');
  
  const [expenseSplits, setExpenseSplits] = useState<ExpenseSplitData[]>([]);
  const [comment, setComment] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [subRegistrars, setSubRegistrars] = useState<User[]>([]);
  const [responsibleRegistrarId, setResponsibleRegistrarId] = useState<string>('');

  // Initialize with single expense split if none exist
  useEffect(() => {
    if (expenseSplits.length === 0) {
      const initialSplit: ExpenseSplitData = {
        id: 'split-1',
        requestId: request.id,
        expenseItemId: '',
        amount: request.amount,
        comment: ''
      };
      setExpenseSplits([initialSplit]);
    }
  }, [request]);

  // Load contract status and sub-registrars
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load contract status
        const contractStatusData = await DistributionService.getContractStatus(request.counterpartyId);
        setContractStatus(contractStatusData);

        // Load sub-registrars
        const subRegistrarsData = await DistributionService.getSubRegistrars();
        setSubRegistrars(subRegistrarsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Ошибка загрузки данных');
      }
    };

    loadData();
  }, [request.counterpartyId]);


  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error('Исправьте ошибки валидации перед отправкой');
      return;
    }

    if (!responsibleRegistrarId) {
      toast.error('Выберите ответственного регистратора');
      return;
    }

    setIsLoading(true);
    try {
      // Convert to ExpenseSplitCreate format for API
      const expenseSplitsForApi: ExpenseSplitCreate[] = expenseSplits.map(split => ({
        expenseItemId: split.expenseItemId,
        amount: split.amount,
        comment: split.comment,
        contractId: 'outside-contract', // Default value
        priority: 'medium' // Default value
      }));

      const distributionData: DistributionCreate = {
        requestId: request.id,
        responsibleRegistrarId: responsibleRegistrarId,
        expenseSplits: expenseSplitsForApi,
        comment: comment
      };

      await DistributionService.classifyRequest(distributionData);
      toast.success('Заявка успешно классифицирована');
      
      // Convert to ExpenseSplit format for parent component
      const expenseSplitsForParent: ExpenseSplit[] = expenseSplits.map(split => ({
        id: split.id,
        requestId: split.requestId,
        expenseItemId: split.expenseItemId,
        amount: split.amount,
        comment: split.comment,
        contractId: 'outside-contract',
        priority: 'medium'
      }));
      
      onSubmit(expenseSplitsForParent, comment);
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

    setIsLoading(true);
    try {
      await DistributionService.returnRequest({
        requestId: request.id,
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
    return item ? item.name : '';
  };

  const getTotalSplitsAmount = () => {
    return expenseSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
  };

  const isFormValid = () => {
    // Check if responsible registrar is selected
    if (!responsibleRegistrarId) {
      return false;
    }

    // Check if all splits have expense items assigned
    const unassignedSplits = expenseSplits.filter(split => !split.expenseItemId);
    if (unassignedSplits.length > 0) {
      return false;
    }

    // Check if total amount matches request amount
    const totalSplitsAmount = expenseSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
    if (Math.abs(totalSplitsAmount - request.amount) > 0.01) {
      return false;
    }

    return true;
  };

  const getValidationWarnings = () => {
    const warnings: string[] = [];
    
    // Check if responsible registrar is selected
    if (!responsibleRegistrarId) {
      warnings.push('Необходимо выбрать ответственного регистратора');
    }

    // Check if all splits have expense items assigned
    const unassignedSplits = expenseSplits.filter(split => !split.expenseItemId);
    if (unassignedSplits.length > 0) {
      warnings.push(`Необходимо выбрать статью расходов для ${unassignedSplits.length} позиций`);
    }

    // Check if total amount matches request amount
    const totalSplitsAmount = expenseSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
    if (Math.abs(totalSplitsAmount - request.amount) > 0.01) {
      warnings.push(`Сумма распределения (${formatCurrency(totalSplitsAmount, 'KZT')}) не равна сумме заявки (${formatCurrency(request.amount, 'KZT')})`);
    }

    return warnings;
  };

  const addExpenseSplit = () => {
    const newSplit: ExpenseSplitData = {
      id: `split-${Date.now()}`,
      requestId: request.id,
      expenseItemId: '',
      amount: 0,
      comment: ''
    };
    setExpenseSplits([...expenseSplits, newSplit]);
  };

  const removeExpenseSplit = (id: string) => {
    if (expenseSplits.length > 1) {
      setExpenseSplits(expenseSplits.filter(split => split.id !== id));
    }
  };

  const updateExpenseSplit = (id: string, field: keyof ExpenseSplitData, value: any) => {
    setExpenseSplits(expenseSplits.map(split => 
      split.id === id ? { ...split, [field]: value } : split
    ));
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
      <Card>
        <CardHeader>
          <CardTitle>Распределение по статьям расходов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Responsible Registrar Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
            <div>
              <Label htmlFor="responsible-registrar" className="mb-2 block">Ответственный регистратор *</Label>
              <Select
                value={responsibleRegistrarId}
                onValueChange={setResponsibleRegistrarId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ответственного регистратора" />
                </SelectTrigger>
                <SelectContent>
                  {subRegistrars.map((registrar) => (
                    <SelectItem key={registrar.id} value={registrar.id}>
                      {registrar.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comment" className="mb-2 block">Комментарий к распределению</Label>
              <Input
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Дополнительная информация"
              />
            </div>
          </div>
          {expenseSplits.map((split, index) => (
            <div key={split.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="md:col-span-2">
                <Label htmlFor={`expense-item-${split.id}`} className="mb-2 block">Статья расходов *</Label>
                <Select
                  value={split.expenseItemId}
                  onValueChange={(value) => updateExpenseSplit(split.id, 'expenseItemId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статью расходов" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor={`amount-${split.id}`} className="mb-2 block">Сумма *</Label>
                <Input
                  id={`amount-${split.id}`}
                  type="number"
                  value={split.amount || ''}
                  onChange={(e) => updateExpenseSplit(split.id, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-end gap-2">
                {expenseSplits.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeExpenseSplit(split.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="md:col-span-4">
                <Label htmlFor={`comment-${split.id}`} className="mb-2 block">Комментарий</Label>
                <Input
                  id={`comment-${split.id}`}
                  value={split.comment || ''}
                  onChange={(e) => updateExpenseSplit(split.id, 'comment', e.target.value)}
                  placeholder="Дополнительная информация"
                />
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addExpenseSplit}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить статью расходов
          </Button>
        </CardContent>
      </Card>

      {/* Validation Warnings */}
      {!isFormValid() && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-amber-800">Требуется исправление</h4>
                <ul className="space-y-1 text-sm text-amber-700">
                  {getValidationWarnings().map((warning, index) => (
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
          disabled={!isFormValid() || isLoading}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Классифицировать и отправить Распорядителю
        </Button>
      </div>
    </div>
  );
}
