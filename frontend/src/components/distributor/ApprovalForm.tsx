import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Send,
  FileText,
  Building,
  Calendar,
  Target,
  Plus,
  Trash2,
  Download,
  Eye,
  User,
  DollarSign,
  CreditCard,
  Flag,
  Shield,
  Percent,
  AlignLeft
} from 'lucide-react';
import { PaymentRequest, Contract, Normative, Priority, PaymentAllocation } from '../../types';
import { useDictionaries } from '../../hooks/useDictionaries';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';



interface ApprovalFormProps {
  request: PaymentRequest;
  onApprove: (allocations: PaymentAllocation[], priority: string, comment?: string) => void;
  onApproveOnBehalf: (allocations: PaymentAllocation[], priority: string, comment?: string) => void;
  onReturn: (comment: string) => void;
  onDecline: (comment: string) => void;
  onCancel: () => void;
}

export function ApprovalForm({ request, onApprove, onApproveOnBehalf, onReturn, onDecline, onCancel }: ApprovalFormProps) {

  // Get dictionary data
  const { items: counterparties } = useDictionaries('counterparties');
  const { items: contracts } = useDictionaries('contracts');
  const { items: expenseitems } = useDictionaries('expense-articles');
  const { items: priorities } = useDictionaries('priorities');
  const { items: normatives } = useDictionaries('normatives');
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'approve-on-behalf' | 'return' | 'decline' | null>(null);
  
  // Payment allocations state - multiple contract assignments
  const [paymentAllocations, setPaymentAllocations] = useState<PaymentAllocation[]>([
    { id: '1', contractId: '', amount: request.amount, comment: '', priority: '', requiresPaymentOrder: false }
  ]);

  // Get related data
  const counterparty = counterparties.find(cp => cp.id === request.counterpartyId);
  const expenseSplits = request.expenseSplits || [];
  
  // Find relevant contracts and normatives
  const relevantContracts = contracts.filter(contract => 
    contract.counterpartyId === request.counterpartyId ||
    expenseSplits.some(split => split.expenseItemId === contract.expenseItemId)
  );

  const relevantNormatives = normatives.filter(normative =>
    expenseSplits.some(split => split.expenseItemId === normative.expenseItemId)
  );

  const getExpenseItemName = (id: string) => {
    const item = expenseitems.find(item => item.id === id);
    return item ? `${item.code} - ${item.name}` : 'Неизвестно';
  };

  const getPriorityInfo = (id: string) => {
    return priorities.find(p => p.id === id);
  };

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const getContractInfo = (id: string) => {
    return contracts.find(c => c.id === id);
  };

  const checkNormativeViolations = () => {
    const violations = relevantNormatives.filter(normative => {
      const splitAmount = expenseSplits
        .filter(split => split.expenseItemId === normative.expenseItemId)
        .reduce((sum, split) => sum + split.amount, 0);
      
      return (normative.currentUsed + splitAmount) > normative.amountLimit;
    });
    
    return violations;
  };

  const violations = checkNormativeViolations();
  const hasHardViolations = violations.some(v => v.rule === 'hard');

  // Check K-2 violations for specific contract/expense
  const checkK2Violations = (contractId: string, amount: number) => {
    const contract = getContractInfo(contractId);
    if (!contract) return null;

    const normative = relevantNormatives.find(n => n.expenseItemId === contract.expenseItemId);
    if (!normative) return null;

    const newUsed = normative.currentUsed + amount;
    const newUsedWithVAT = normative.currentUsedWithVAT + amount * 1.12;
    const isViolation = newUsed > normative.amountLimit;
    const isViolationWithVAT = newUsedWithVAT > normative.amountLimitWithVAT;

    return {
      normative,
      newUsed,
      newUsedWithVAT,
      isViolation,
      isViolationWithVAT
    };
  };

  // Payment allocation functions
  const addAllocation = () => {
    setPaymentAllocations([
      ...paymentAllocations,
      { id: Date.now().toString(), contractId: '', amount: 0, comment: '', priority: '', requiresPaymentOrder: false }
    ]);
  };

  const removeAllocation = (index: number) => {
    if (paymentAllocations.length > 1) {
      setPaymentAllocations(paymentAllocations.filter((_, i) => i !== index));
    }
  };

  const updateAllocation = (index: number, field: keyof PaymentAllocation, value: any) => {
    const newAllocations = [...paymentAllocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    setPaymentAllocations(newAllocations);
  };

  const totalAllocated = paymentAllocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
  const isAllocationBalanced = Math.abs(totalAllocated - request.amount) < 0.01;
  const allAllocationsValid = paymentAllocations.every(alloc => 
    alloc.contractId && alloc.amount > 0 && alloc.priority
  );

  const handleAction = () => {
    if (actionType === 'approve') {
      if (!isAllocationBalanced || !allAllocationsValid) {
        return;
      }
      // Pass allocations and use first allocation's priority
      onApprove(paymentAllocations, paymentAllocations[0].priority!, comment);
    } else if (actionType === 'approve-on-behalf') {
      if (!isAllocationBalanced || !allAllocationsValid) {
        return;
      }
      // Pass allocations and use first allocation's priority
      onApproveOnBehalf(paymentAllocations, paymentAllocations[0].priority!, comment);
    } else if (actionType === 'return') {
      if (!comment.trim()) {
        return;
      }
      onReturn(comment);
    } else if (actionType === 'decline') {
      if (!comment.trim()) {
        return;
      }
      onDecline(comment);
    }
    setActionType(null);
  };

  const handleViewDocument = () => {
    alert('Открытие документа: ' + request.fileName);
  };

  const handleDownloadDocument = () => {
    alert('Скачивание документа: ' + request.fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          К списку
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Согласование заявки</h2>
          <p className="text-muted-foreground">
            {request.requestNumber ? `Заявка: ${request.requestNumber}` : `Документ: ${request.docNumber}`}
          </p>
        </div>
      </div>

      {/* Compact Main Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Информация по заявке
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Paying Company */}
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Оплачивающая компания</p>
                <p className="text-sm">{request.payingCompany || 'Не указано'}</p>
              </div>
            </div>

            {/* Document Type */}
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Тип документа-основания</p>
                <p className="text-sm">{request.docType || 'Не указано'}</p>
              </div>
            </div>

            {/* Document Number */}
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Номер документа</p>
                <p className="text-sm">{request.docNumber}</p>
              </div>
            </div>

            {/* Document Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Дата документа</p>
                <p className="text-sm">{request.docDate}</p>
              </div>
            </div>

            {/* Counterparty Category */}
            {request.counterpartyCategory && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">Категория контрагента</p>
                  <p className="text-sm">{request.counterpartyCategory}</p>
                </div>
              </div>
            )}

            {/* Counterparty Name */}
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Контрагент</p>
                <p className="text-sm">{getCounterpartyName(request.counterpartyId)}</p>
              </div>
            </div>

            {/* Amount and Currency */}
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Сумма</p>
                <p className="text-lg font-semibold">{request.amount.toLocaleString()} {request.currency}</p>
              </div>
            </div>

            {/* VAT Rate */}
            {request.vatRate && (
              <div className="flex items-center gap-3">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">Ставка НДС</p>
                  <p className="text-sm">{request.vatRate}</p>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Срок оплаты</p>
                <p className="text-sm">
                  {format(new Date(request.dueDate), 'd MMMM yyyy', { locale: ru })}
                </p>
              </div>
            </div>
          </div>

          {/* Описание */}
          {request.description && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-start gap-3">
                <AlignLeft className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Описание</p>
                  <div className="text-sm mt-2">
                    {request.description.split('\n').map((line, index) => {
                      const colonIndex = line.indexOf(':');
                      if (colonIndex !== -1) {
                        const label = line.substring(0, colonIndex + 1);
                        const value = line.substring(colonIndex + 1);
                        return (
                          <span key={index} className="inline-block mr-4">
                            <span className="font-semibold">{label}</span>
                            <span>{value}</span>
                          </span>
                        );
                      }
                      return line.trim() ? <span key={index} className="inline-block mr-4">{line}</span> : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document File */}
          {request.fileName && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Документ-основание</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground flex-1">{request.fileName}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleViewDocument}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Просмотр
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDownloadDocument}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Скачать
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense splits with registrar comments */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение по статьям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenseSplits.map((split, index) => (
              <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{getExpenseItemName(split.expenseItemId)}</p>
                  {split.comment && (
                    <div className="mt-1">
                      <Label className="text-xs text-muted-foreground">Комментарий регистратора:</Label>
                      <p className="text-sm text-muted-foreground italic">{split.comment}</p>
                    </div>
                  )}
                </div>
                <Badge variant="secondary">
                  {split.amount.toLocaleString()} {request.currency}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Assignment per Contract */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Назначение платежа
            </div>
            <Badge variant={isAllocationBalanced ? "default" : "destructive"}>
              Распределено: {totalAllocated.toLocaleString()} {request.currency}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isAllocationBalanced && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Сумма распределения ({totalAllocated.toLocaleString()} {request.currency}) 
                не равна сумме заявки ({request.amount.toLocaleString()} {request.currency})
              </AlertDescription>
            </Alert>
          )}

          {paymentAllocations.map((allocation, index) => {
            const isOutsideDeals = allocation.contractId === 'outside-deals';
            const k2Check = allocation.contractId && allocation.amount > 0 && !isOutsideDeals ? 
              checkK2Violations(allocation.contractId, allocation.amount) : null;
            const contract = allocation.contractId && !isOutsideDeals ? getContractInfo(allocation.contractId) : null;
            const remaining = contract ? contract.limitTotal - contract.usedTotal : 0;
            const wouldExceed = contract && allocation.amount > remaining;

            return (
              <div key={allocation.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium">Контракт {index + 1}</h4>
                  {paymentAllocations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllocation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Contract Selection and Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Контракт *</Label>
                    <Select 
                      value={allocation.contractId} 
                      onValueChange={(value) => updateAllocation(index, 'contractId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите контракт" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Special "Out of deals" option */}
                        <SelectItem value="outside-deals">
                          <div className="flex flex-col">
                            <span className="font-medium text-orange-600">Вне сделок</span>
                            <span className="text-xs text-muted-foreground">
                              Платеж не привязан к контракту
                            </span>
                          </div>
                        </SelectItem>
                        
                        {/* Separator */}
                        <div className="px-2 py-1">
                          <div className="h-px bg-border"></div>
                        </div>
                        
                        {/* Regular contracts */}
                        {relevantContracts.map(contract => {
                          const remaining = contract.limitTotal - contract.usedTotal;
                          return (
                            <SelectItem key={contract.id} value={contract.id}>
                              <div className="flex flex-col">
                                <span>{contract.code}</span>
                                <span className="text-xs text-muted-foreground">
                                  Остаток: {remaining.toLocaleString()} ₸
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Сумма *</Label>
                    <Input
                      type="number"
                      value={allocation.amount || ''}
                      onChange={(e) => updateAllocation(index, 'amount', Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Contract Usage or Outside Deals Info */}
                {isOutsideDeals ? (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Платеж вне сделок</span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      Данный платеж не привязан к конкретному контракту и будет обработан отдельно
                    </p>
                  </div>
                ) : null}

                {/* K-2 Normatives Check for this contract */}
                {!isOutsideDeals && k2Check?.normative && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Label className="font-medium">Проверка нормативов К-2</Label>
                    </div>
                    
                    <div className={`border rounded-lg p-3 ${!k2Check.isViolation && !k2Check.isViolationWithVAT ? 'bg-green-50 border-green-200' : ''}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Расходы К-2 без НДС:</Label>
                          <p className="text-lg font-semibold">{k2Check.normative.amountLimit.toLocaleString()} тенге</p>
                          <div className="text-sm text-muted-foreground">
                            Текущие: {k2Check.normative.currentUsed.toLocaleString()} | 
                            После платежа: {k2Check.newUsed.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Расходы К-2 с НДС:</Label>
                          <p className="text-lg font-semibold">{k2Check.normative.amountLimitWithVAT.toLocaleString()} тенге</p>
                          <div className="text-sm text-muted-foreground">
                            Текущие: {k2Check.normative.currentUsedWithVAT.toLocaleString()} | 
                            После платежа: {k2Check.newUsedWithVAT.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      {(k2Check.isViolation || k2Check.isViolationWithVAT) && (
                        <Alert variant={k2Check.normative.rule === 'hard' ? 'destructive' : 'default'} className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="font-medium">
                            Платеж превышает бюджет К-2 по сделке!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Info for outside deals payments */}
                {isOutsideDeals && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Label className="font-medium">Проверка нормативов К-2</Label>
                    </div>
                    
                    <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Платеж вне контрактной системы</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        Для платежей вне сделок проверка нормативов К-2 не применяется. 
                        Убедитесь в обоснованности данного платежа.
                      </p>
                    </div>
                  </div>
                )}

                {/* Priority Selection for this contract */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Выберите приоритет *</Label>
                    <Select 
                      value={allocation.priority} 
                      onValueChange={(value) => updateAllocation(index, 'priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите приоритет платежа" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority.id} value={priority.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                priority.color === 'red' ? 'bg-red-500' :
                                priority.color === 'orange' ? 'bg-orange-500' :
                                priority.color === 'yellow' ? 'bg-yellow-500' :
                                priority.color === 'green' ? 'bg-green-500' :
                                'bg-gray-500'
                              }`} />
                              {priority.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-order-${index}`}
                      checked={allocation.requiresPaymentOrder}
                      onCheckedChange={(checked) => updateAllocation(index, 'requiresPaymentOrder', checked)}
                    />
                    <Label 
                      htmlFor={`payment-order-${index}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Требуется платежное поручение
                    </Label>
                  </div>
                  
                  {allocation.priority && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {getPriorityInfo(allocation.priority)?.ruleDescription}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Comment for this allocation */}
                <div className="space-y-2">
                  <Label>Комментарий</Label>
                  <Textarea
                    value={allocation.comment || ''}
                    onChange={(e) => updateAllocation(index, 'comment', e.target.value)}
                    placeholder="Комментарий к данному распределению"
                    rows={2}
                  />
                </div>
              </div>
            );
          })}

          <Button variant="outline" onClick={addAllocation} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Добавить контракт
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => setActionType('return')}
          disabled={!!actionType}
        >
          Вернуть регистратору
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => setActionType('decline')}
          disabled={!!actionType}
        >
          Отклонить
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setActionType('approve-on-behalf')}
          disabled={hasHardViolations || !isAllocationBalanced || !allAllocationsValid || !!actionType}
        >
          <Send className="h-4 w-4 mr-2" />
          Согласовать по поручению рук-ва
        </Button>
        
        <Button
          onClick={() => setActionType('approve')}
          disabled={hasHardViolations || !isAllocationBalanced || !allAllocationsValid || !!actionType}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {hasHardViolations ? 'Заблокировано' : 'Утвердить'}
        </Button>
      </div>

      {/* Action confirmation modal */}
      {actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(actionType === 'approve' || actionType === 'approve-on-behalf') && <CheckCircle className="h-4 w-4 text-green-500" />}
                {actionType === 'return' && <ArrowLeft className="h-4 w-4 text-orange-500" />}
                {actionType === 'decline' && <XCircle className="h-4 w-4 text-red-500" />}
                Подтверждение действия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {(actionType === 'approve' || actionType === 'approve-on-behalf') && 
                  'Если Вы подтверждаете корректность заполненной информации, заявка будет отправлена Казначею.'}
                {actionType === 'return' && 'Заявка будет возвращена регистратору для корректировки.'}
                {actionType === 'decline' && 'Заявка будет отклонена окончательно.'}
              </p>
              
              {(actionType === 'return' || actionType === 'decline') && (
                <div className="space-y-2 mb-4">
                  <Label>Причина {actionType === 'return' ? 'возврата' : 'отклонения'} *</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Укажите причину ${actionType === 'return' ? 'возврата' : 'отклонения'} заявки`}
                    rows={3}
                  />
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setActionType(null)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleAction}
                  disabled={
                    ((actionType === 'approve' || actionType === 'approve-on-behalf') && (!isAllocationBalanced || !allAllocationsValid)) ||
                    ((actionType === 'return' || actionType === 'decline') && !comment.trim())
                  }
                  variant={(actionType === 'approve' || actionType === 'approve-on-behalf') ? 'default' : actionType === 'decline' ? 'destructive' : 'default'}
                >
                  {(actionType === 'approve' || actionType === 'approve-on-behalf') && 'Подтвердить'}
                  {actionType === 'return' && 'Вернуть'}
                  {actionType === 'decline' && 'Отклонить'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}