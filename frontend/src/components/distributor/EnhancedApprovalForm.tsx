import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calculator, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  AlertTriangle,
  Info,
  Star,
  Calendar
} from 'lucide-react';
import { PaymentRequestExtended, PaymentAllocation, Contract, ExpenseItem } from '../../types';
import { DistributorService, ApiDictionaryService } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { toast } from 'sonner@2.0.3';

interface EnhancedApprovalFormProps {
  request: PaymentRequestExtended;
  onApprove: (allocations: PaymentAllocation[], priority: string, comment?: string) => Promise<void>;
  onApproveOnBehalf: (allocations: PaymentAllocation[], priority: string, comment?: string) => Promise<void>;
  onReturn: (comment: string) => Promise<void>;
  onDecline: (comment: string) => Promise<void>;
  onCancel: () => void;
}

export function EnhancedApprovalForm({
  request,
  onApprove,
  onApproveOnBehalf,
  onReturn,
  onDecline,
  onCancel
}: EnhancedApprovalFormProps) {
  const [activeTab, setActiveTab] = useState('items');
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [selectedPriority, setSelectedPriority] = useState('p2');
  const [comment, setComment] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [declineComment, setDeclineComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Справочники
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [counterparties, setCounterparties] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  
  // Состояние валидации
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Диалоги
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [request]);

  useEffect(() => {
    validateAllocations();
  }, [allocations]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем справочники
      const [contractsData, expenseItemsData, counterpartiesData, prioritiesData] = await Promise.all([
        ApiDictionaryService.getContracts(),
        ApiDictionaryService.getExpenseItems(),
        ApiDictionaryService.getCounterparties(),
        ApiDictionaryService.getPriorities()
      ]);
      
      setContracts(contractsData);
      setExpenseItems(expenseItemsData);
      setCounterparties(counterpartiesData);
      setPriorities(prioritiesData);
      
      // Инициализируем распределения если они есть
      if (request.paymentAllocations) {
        setAllocations(request.paymentAllocations);
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const validateAllocations = () => {
    const errors: string[] = [];
    
    // Проверяем общую сумму
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    if (totalAllocated !== request.amount) {
      errors.push(`Сумма распределений (${formatCurrency(totalAllocated, request.currency)}) не равна сумме заявки (${formatCurrency(request.amount, request.currency)})`);
    }
    
    // Проверяем каждое распределение
    allocations.forEach((allocation, index) => {
      if (allocation.contractId === 'none' || !allocation.contractId) {
        errors.push(`Строка ${index + 1}: Выберите договор`);
        return;
      }
      
      const contract = contracts.find(c => c.id === allocation.contractId);
      
      if (!contract) {
        errors.push(`Строка ${index + 1}: Договор не найден`);
        return;
      }
      
      if (contract.status !== 'active') {
        errors.push(`Строка ${index + 1}: Договор "${contract.code}" неактивен`);
      }
      
      const availableAmount = contract.limitTotal - contract.usedTotal;
      if (allocation.amount > availableAmount) {
        errors.push(`Строка ${index + 1}: Превышен лимит договора "${contract.code}" (доступно: ${formatCurrency(availableAmount, request.currency)})`);
      }
      
      if (new Date(allocation.plannedDate) < new Date()) {
        errors.push(`Строка ${index + 1}: Плановая дата не может быть в прошлом`);
      }
    });
    
    setValidationErrors(errors);
  };

  const addAllocation = () => {
    const newAllocation: PaymentAllocation = {
      id: `alloc_${Date.now()}`,
      contractId: 'none', // Use non-empty value instead of empty string
      amount: 0,
      currency: request.currency,
      plannedDate: new Date().toISOString().split('T')[0],
      comment: ''
    };
    
    setAllocations([...allocations, newAllocation]);
  };

  const updateAllocation = (index: number, field: keyof PaymentAllocation, value: any) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const autoSplitAllocations = () => {
    if (allocations.length === 0) {
      toast.warning('Добавьте хотя бы одно распределение');
      return;
    }
    
    const activeAllocations = allocations.filter(a => a.contractId && a.contractId !== 'none');
    if (activeAllocations.length === 0) {
      toast.warning('Выберите договоры для автоматического распределения');
      return;
    }
    
    const amountPerContract = Math.floor(request.amount / activeAllocations.length);
    const remainder = request.amount - (amountPerContract * activeAllocations.length);
    
    const updated = [...allocations];
    let remainderAdded = false;
    
    activeAllocations.forEach((allocation, index) => {
      const allocIndex = allocations.findIndex(a => a.id === allocation.id);
      if (allocIndex !== -1) {
        updated[allocIndex].amount = amountPerContract + (index === 0 && !remainderAdded ? remainder : 0);
        if (index === 0) remainderAdded = true;
      }
    });
    
    setAllocations(updated);
    toast.success('Суммы распределены автоматически');
  };

  const getCounterpartyName = (id: string) => {
    const counterparty = counterparties.find(c => c.id === id);
    return counterparty?.name || 'Неизвестно';
  };

  const getExpenseItemName = (id: string) => {
    const item = expenseItems.find(e => e.id === id);
    return item?.name || 'Неизвестно';
  };

  const getContractsByCounterpartyAndExpense = (counterpartyId: string, expenseItemId: string) => {
    return contracts.filter(contract => 
      contract.counterpartyId === counterpartyId &&
      contract.expenseItemId === expenseItemId &&
      contract.status === 'active'
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: currency === 'KZT' ? 'KZT' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleApprove = async () => {
    if (validationErrors.length > 0) {
      toast.error('Исправьте ошибки перед утверждением');
      return;
    }
    
    if (allocations.length === 0) {
      toast.error('Добавьте распределения');
      return;
    }
    
    try {
      await onApprove(allocations, selectedPriority, comment);
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleApproveOnBehalf = async () => {
    if (validationErrors.length > 0) {
      toast.error('Исправьте ошибки перед согласованием');
      return;
    }
    
    if (allocations.length === 0) {
      toast.error('Добавьте распределения');
      return;
    }
    
    try {
      await onApproveOnBehalf(allocations, selectedPriority, comment);
    } catch (error) {
      console.error('Failed to approve on behalf:', error);
    }
  };

  const handleReturn = async () => {
    if (!returnComment.trim()) {
      toast.error('Укажите причину возврата');
      return;
    }
    
    try {
      await onReturn(returnComment);
      setShowReturnDialog(false);
    } catch (error) {
      console.error('Failed to return:', error);
    }
  };

  const handleDecline = async () => {
    if (!declineComment.trim()) {
      toast.error('Укажите причину отклонения');
      return;
    }
    
    try {
      await onDecline(declineComment);
      setShowDeclineDialog(false);
    } catch (error) {
      console.error('Failed to decline:', error);
    }
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
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">
              Согласование заявки {request.requestNumber}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <StatusBadge status={request.status} />
              {request.isAssignedToChief && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Закреплено за главным распорядителем
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Информация о заявке */}
      <Card>
        <CardHeader>
          <CardTitle>Общая информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Контрагент</Label>
              <p className="font-medium">{getCounterpartyName(request.counterpartyId)}</p>
            </div>
            <div>
              <Label>Сумма</Label>
              <p className="font-medium">{formatCurrency(request.amount, request.currency)}</p>
            </div>
            <div>
              <Label>Срок оплаты</Label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(request.dueDate).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className="md:col-span-3">
              <Label>Описание</Label>
              <p>{request.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Вкладки */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Позиции ({request.expenseSplits?.length || 0})</TabsTrigger>
          <TabsTrigger value="allocations">Распределение ({allocations.length})</TabsTrigger>
        </TabsList>

        {/* Вкладка позиций */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Статьи расходов</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Статья расходов</TableHead>
                    <TableHead className="text-right">Сумма без НДС</TableHead>
                    <TableHead>Комментарий</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.expenseSplits?.map((split) => (
                    <TableRow key={split.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {getExpenseItemName(split.expenseItemId)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(split.amount, request.currency)}
                      </TableCell>
                      <TableCell>
                        {split.comment && (
                          <span className="text-sm text-muted-foreground">{split.comment}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка распределений */}
        <TabsContent value="allocations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Распределение по контрактам</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={autoSplitAllocations}>
                    <Calculator className="h-4 w-4 mr-2" />
                    Автосплит
                  </Button>
                  <Button variant="outline" size="sm" onClick={addAllocation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Ошибки валидации */}
              {validationErrors.length > 0 && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Таблица распределений */}
              <div className="space-y-4">
                {allocations.map((allocation, index) => (
                  <div key={allocation.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Распределение {index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllocation(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Договор */}
                      <div className="space-y-2">
                        <Label>Договор</Label>
                        <Select
                          value={allocation.contractId}
                          onValueChange={(value) => updateAllocation(index, 'contractId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите договор" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>
                              Выберите договор
                            </SelectItem>
                            {request.expenseSplits?.map(split => {
                              const availableContracts = getContractsByCounterpartyAndExpense(
                                request.counterpartyId,
                                split.expenseItemId
                              );
                              
                              return availableContracts.map(contract => (
                                <SelectItem key={contract.id} value={contract.id}>
                                  <div className="flex flex-col">
                                    <span>{contract.code}</span>
                                    <span className="text-xs text-muted-foreground">
                                      Лимит: {formatCurrency(contract.limitTotal - contract.usedTotal, request.currency)}
                                    </span>
                                  </div>
                                </SelectItem>
                              ));
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Сумма */}
                      <div className="space-y-2">
                        <Label>Сумма</Label>
                        <Input
                          type="number"
                          value={allocation.amount}
                          onChange={(e) => updateAllocation(index, 'amount', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>

                      {/* Плановая дата */}
                      <div className="space-y-2">
                        <Label>Плановая дата</Label>
                        <Input
                          type="date"
                          value={allocation.plannedDate}
                          onChange={(e) => updateAllocation(index, 'plannedDate', e.target.value)}
                        />
                      </div>

                      {/* Валюта (только для отображения) */}
                      <div className="space-y-2">
                        <Label>Валюта</Label>
                        <Input value={allocation.currency} disabled />
                      </div>
                    </div>

                    {/* Комментарий */}
                    <div className="space-y-2">
                      <Label>Комментарий</Label>
                      <Textarea
                        value={allocation.comment || ''}
                        onChange={(e) => updateAllocation(index, 'comment', e.target.value)}
                        placeholder="Дополнительная информация..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                {allocations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Распределения не добавлены</p>
                    <Button variant="outline" onClick={addAllocation} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить первое распределение
                    </Button>
                  </div>
                )}
              </div>

              {/* Сводка */}
              {allocations.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Общая сумма распределений:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        allocations.reduce((sum, alloc) => sum + alloc.amount, 0),
                        request.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Сумма заявки:</span>
                    <span className="font-medium">
                      {formatCurrency(request.amount, request.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span>Разница:</span>
                    <span className={`font-medium ${
                      allocations.reduce((sum, alloc) => sum + alloc.amount, 0) === request.amount
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(
                        allocations.reduce((sum, alloc) => sum + alloc.amount, 0) - request.amount,
                        request.currency
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Действия */}
      <Card>
        <CardHeader>
          <CardTitle>Решение по заявке</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Приоритет */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.id} value={priority.id}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Комментарий */}
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительные комментарии..."
              rows={3}
            />
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleApprove}
              disabled={validationErrors.length > 0 || allocations.length === 0}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Утвердить
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleApproveOnBehalf}
              disabled={validationErrors.length > 0 || allocations.length === 0}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Согласовать по поручению
            </Button>

            <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Вернуть
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Возврат заявки</DialogTitle>
                  <DialogDescription>
                    Укажите причину возврата заявки на доработку
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    placeholder="Причина возврата..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleReturn}>
                    Вернуть
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Отклонить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Отклонение заявки</DialogTitle>
                  <DialogDescription>
                    Укажите причину отклонения заявки
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    value={declineComment}
                    onChange={(e) => setDeclineComment(e.target.value)}
                    placeholder="Причина отклонения..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                    Отмена
                  </Button>
                  <Button variant="destructive" onClick={handleDecline}>
                    Отклонить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}