import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { 
  ArrowLeft, 
  Send,
  FileText,
  Building,
  Calendar,
  Target,
  Download,
  Eye,
  User,
  DollarSign,
  CreditCard,
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { PaymentRequest } from '../../types';
import { useDictionaries } from '../../hooks/useDictionaries';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TreasurerApprovalFormProps {
  request: PaymentRequest;
  onUpdateStatus: (status: string, data?: any) => void;
  onCancel: () => void;
}

export function TreasurerApprovalForm({ request, onUpdateStatus, onCancel }: TreasurerApprovalFormProps) {
  const [actionType, setActionType] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [actualAmount, setActualAmount] = useState(request.amount);
  const [executionDate, setExecutionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exchangeRate, setExchangeRate] = useState(1);
  const [paymentOrderFile, setPaymentOrderFile] = useState<File | null>(null);

  // Get dictionary data
  const { items: counterparties } = useDictionaries('counterparties');
  const { items: expenseItems } = useDictionaries('expense-articles');
  const { items: priorities } = useDictionaries('priorities');
  const { items: contracts } = useDictionaries('contracts');

  // Get related data
  const counterparty = counterparties.find(cp => cp.id === request.counterpartyId);
  const expenseSplits = request.expenseSplits || [];
  const paymentAllocations = request.paymentAllocations || [];

  const getExpenseItemName = (id: string) => {
    const item = expenseItems.find(item => item.id === id);
    return item ? `${item.code} - ${item.name}` : 'Неизвестно';
  };

  const getPriorityInfo = (id: string) => {
    return priorities.find(p => p.id === id);
  };

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const getContractInfo = (id: string) => {
    if (id === 'outside-deals') return { code: 'Вне сделок', id: 'outside-deals' };
    return contracts.find(c => c.id === id);
  };

  const handleAction = () => {
    const executionData = {
      actualAmount: actionType === 'paid-partial' || actionType === 'paid-full' ? actualAmount : undefined,
      executionDate: actionType === 'paid-partial' || actionType === 'paid-full' ? executionDate : undefined,
      exchangeRate: actionType === 'paid-partial' || actionType === 'paid-full' ? exchangeRate : undefined,
      executionComment: comment || undefined
    };

    onUpdateStatus(actionType!, executionData);
  };

  const handleViewDocument = () => {
    alert('Открытие документа: ' + request.fileName);
  };

  const handleDownloadDocument = () => {
    alert('Скачивание документа: ' + request.fileName);
  };



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPaymentOrderFile(event.target.files[0]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in-register': return 'bg-purple-100 text-purple-800';
      case 'approved-for-payment': return 'bg-green-100 text-green-800';
      case 'paid-full': return 'bg-emerald-100 text-emerald-800';
      case 'paid-partial': return 'bg-yellow-100 text-yellow-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Утверждена распорядителем';
      case 'in-register': return 'Включена в реестр';
      case 'approved-for-payment': return 'Утверждена к оплате';
      case 'paid-full': return 'Оплачена полностью';
      case 'paid-partial': return 'Оплачена частично';
      case 'declined': return 'Отклонена';
      case 'cancelled': return 'Аннулирована';
      default: return 'Неизвестен';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          К списку
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Обработка платежа</h2>
          <p className="text-muted-foreground">
            {request.requestNumber ? `Заявка: ${request.requestNumber}` : `Документ: ${request.docNumber}`}
          </p>
        </div>
        <Badge className={getStatusColor(request.status)}>
          {getStatusLabel(request.status)}
        </Badge>
      </div>

      {/* Main Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Информация о платеже
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Row 1 */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Оплачивающая компания</Label>
              <p className="font-medium">{request.payingCompany || 'Не указано'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Контрагент</Label>
              <p className="font-medium">{getCounterpartyName(request.counterpartyId)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Тип документа-основания</Label>
              <p className="font-medium">{request.docType || 'Не указано'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Срок оплаты</Label>
              <p className="font-medium">
                {format(new Date(request.dueDate), 'd MMM yyyy', { locale: ru })}
              </p>
            </div>

            {/* Row 2 */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Номер документа</Label>
              <p className="font-medium">{request.docNumber}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Дата документа</Label>
              <p className="font-medium">{request.docDate}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сумма</Label>
              <p className="text-lg font-semibold text-primary">{request.amount.toLocaleString()} {request.currency}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ставка НДС</Label>
              <p className="font-medium">{request.vatRate || 'Не указано'}</p>
            </div>

            {/* Document actions */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-1">
              <Label className="text-xs text-muted-foreground">Документ-основание</Label>
              <div className="flex items-center gap-2">
                {request.fileName && (
                  <>
                    <p className="text-sm text-muted-foreground flex-1">{request.fileName}</p>
                    <Button variant="outline" size="sm" onClick={handleViewDocument}>
                      <Eye className="h-4 w-4 mr-1" />
                      Просмотр
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadDocument}>
                      <Download className="h-4 w-4 mr-1" />
                      Скачать
                    </Button>

                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment Description - moved from separate card */}
          {(request.expenseCategory || request.productService || request.volume || request.priceRate || request.period || request.description) && (
            <>
              <Separator className="my-6" />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Описание платежа</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {request.expenseCategory && (
                    <div><span className="text-muted-foreground">Статья расходов:</span> {request.expenseCategory}</div>
                  )}
                  {request.productService && (
                    <div><span className="text-muted-foreground">Товар/услуга:</span> {request.productService}</div>
                  )}
                  {request.volume && (
                    <div><span className="text-muted-foreground">Объем:</span> {request.volume}</div>
                  )}
                  {request.priceRate && (
                    <div><span className="text-muted-foreground">Тариф:</span> {request.priceRate}</div>
                  )}
                  {request.period && (
                    <div><span className="text-muted-foreground">Период:</span> {request.period}</div>
                  )}
                </div>
                

              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expense Items */}
      <Card>
        <CardHeader>
          <CardTitle>Статьи расходов</CardTitle>
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

      {/* Payment Assignments from Distributor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Назначение платежа от распорядителя
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentAllocations.length > 0 ? (
              paymentAllocations.map((allocation, index) => {
                const contract = getContractInfo(allocation.contractId);
                const priorityInfo = allocation.priority ? getPriorityInfo(allocation.priority) : null;
                
                return (
                  <div key={allocation.id} className="border rounded-lg p-4 bg-blue-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Контракт</Label>
                        <p className="font-medium">
                          {contract?.code || (allocation.contractId === 'outside-deals' ? 'Вне сделок' : 'Неизвестен')}
                        </p>
                        {allocation.contractId === 'outside-deals' && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-600">Не привязан к контракту</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Сумма распределения</Label>
                        <p className="font-semibold text-lg">{allocation.amount.toLocaleString()} {request.currency}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Приоритет</Label>
                        <div className="flex items-center gap-2">
                          {priorityInfo ? (
                            <>
                              <div className={`w-3 h-3 rounded-full ${
                                priorityInfo.color === 'red' ? 'bg-red-500' :
                                priorityInfo.color === 'orange' ? 'bg-orange-500' :
                                priorityInfo.color === 'yellow' ? 'bg-yellow-500' :
                                priorityInfo.color === 'green' ? 'bg-green-500' :
                                'bg-gray-500'
                              }`} />
                              <span className="text-sm font-medium">{priorityInfo.label}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Не указан</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Платежное поручение</Label>
                        <div className="flex items-center gap-2">
                          {allocation.requiresPaymentOrder ? (
                            <>
                              <CreditCard className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium text-orange-600">Требуется</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-muted-foreground">Не требуется</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {allocation.comment && (
                      <div className="mt-4 pt-3 border-t bg-white rounded p-3">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Комментарий распорядителя:
                        </Label>
                        <p className="text-sm mt-1 italic">{allocation.comment}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Распорядитель еще не назначил контракты для данного платежа</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Comments History */}
      {request.history && request.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>История и комментарии</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.history.map((entry) => (
                <div key={entry.id} className="flex gap-3 p-3 bg-muted/30 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{entry.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {entry.role === 'EXECUTOR' ? 'Исполнитель' :
                         entry.role === 'registrar' ? 'Регистратор' :
                         entry.role === 'distributor' ? 'Распорядитель' :
                         'Казначей'}
                      </Badge>
                    </div>
                    {entry.comment && (
                      <p className="text-sm text-muted-foreground">{entry.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(entry.date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {!actionType && (
        <div className="flex flex-wrap gap-4 justify-end">
          {request.status === 'approved' && (
            <Button
              onClick={() => setActionType('in-register')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Включить в реестр на оплату
            </Button>
          )}
          
          {(request.status === 'in-register' || request.status === 'approved-for-payment') && (
            <>
              <Button
                onClick={() => setActionType('paid-full')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Оплачено полностью
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setActionType('paid-partial')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Оплачено частично
              </Button>
            </>
          )}
          
          <Button
            variant="destructive"
            onClick={() => setActionType('declined')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Отклонить
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setActionType('cancelled')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Аннулировать
          </Button>
        </div>
      )}

      {/* Action confirmation */}
      {actionType && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {actionType === 'in-register' && <CheckCircle className="h-4 w-4 text-purple-500" />}
              {(actionType === 'paid-full' || actionType === 'paid-partial') && <CheckCircle className="h-4 w-4 text-green-500" />}
              {(actionType === 'declined' || actionType === 'cancelled') && <XCircle className="h-4 w-4 text-red-500" />}
              Подтверждение действия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              {actionType === 'in-register' && 'Платеж будет включен в реестр на оплату.'}
              {actionType === 'paid-full' && 'Платеж будет помечен как оплаченный полностью.'}
              {actionType === 'paid-partial' && 'Платеж будет помечен как частично оплаченный.'}
              {actionType === 'declined' && 'Платеж будет отклонен.'}
              {actionType === 'cancelled' && 'Платеж будет аннулирован.'}
            </p>
            
            {/* Payment execution details */}
            {(actionType === 'paid-full' || actionType === 'paid-partial') && (
              <div className="space-y-4 p-4 bg-muted/30 rounded">
                <h4 className="font-medium">Данные об оплате</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Фактическая сумма оплаты *</Label>
                    <Input
                      type="number"
                      value={actualAmount}
                      onChange={(e) => setActualAmount(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Дата оплаты *</Label>
                    <Input
                      type="date"
                      value={executionDate}
                      onChange={(e) => setExecutionDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Курс на момент оплаты</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Number(e.target.value))}
                      placeholder="1.00"
                    />
                  </div>
                </div>
                
                {/* Payment order upload */}
                {paymentAllocations.some(a => a.requiresPaymentOrder) && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Платежное поручение *
                    </Label>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-sm text-orange-700 mb-2">
                        Распорядитель указал, что для данного платежа требуется приложить платежное поручение
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="flex-1"
                        />
                        {paymentOrderFile && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {paymentOrderFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Comment */}
            <div className="space-y-2">
              <Label>Комментарий</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий к действию"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setActionType(null)}>
                Отмена
              </Button>
              <Button 
                onClick={handleAction}
                disabled={
                  (actionType === 'paid-full' || actionType === 'paid-partial') && 
                  (!actualAmount || !executionDate)
                }
                variant={actionType === 'declined' || actionType === 'cancelled' ? 'destructive' : 'default'}
              >
                <Send className="h-4 w-4 mr-2" />
                Подтвердить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}