import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ArrowLeft, Send, Calendar, DollarSign, FileText, Download, Package, Building, CheckCircle, XCircle, Clock, Save } from 'lucide-react';
import { PaymentRequestService } from '../../services/api';
import { useDictionaries } from '../../hooks/useDictionaries';
import { PaymentRequest } from '../../types';
import { toast } from 'sonner@2.0.3';

interface PaymentRegisterProps {
  onBack: () => void;
  onUpdateRequest?: (request: PaymentRequest) => void;
}

export function PaymentRegister({ onBack, onUpdateRequest }: PaymentRegisterProps) {

  // Get dictionary data
  const { items: counterparties } = useDictionaries('counterparties');
  const { items: priorities } = useDictionaries('priorities');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'create' | 'existing' | 'process'>('create');
  const [paymentData, setPaymentData] = useState<Record<string, {
    actualAmount: number;
    status: string;
    comment: string;
    executionDate: string;
  }>>({});
  
  // API state management
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load requests from API
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all requests for treasurer role
        const loadedRequests = await PaymentRequestService.getAll({
          role: 'treasurer'
        });
        
        setRequests(loadedRequests);
      } catch (err) {
        console.error('Error loading requests:', err);
        setError('Ошибка загрузки заявок');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);
  
  // Filter requests that can be included in register
  const availableRequests = requests.filter(request => 
    ['approved', 'approved-on-behalf'].includes(request.status)
  );

  // Filter requests already in register
  const registerRequests = requests.filter(request => 
    ['in-register', 'approved-for-payment', 'paid-full', 'paid-partial'].includes(request.status)
  );

  const toggleRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const totalAmount = selectedRequests.reduce((sum, requestId) => {
    const request = availableRequests.find(r => r.id === requestId);
    return sum + (request?.amount || 0);
  }, 0);

  const registerTotalAmount = registerRequests.reduce((sum, request) => {
    return sum + request.amount;
  }, 0);

  const getPriorityInfo = (priorityId?: string) => {
    if (!priorityId) return null;
    return priorities.find(p => p.id === priorityId);
  };

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-register': return 'bg-purple-100 text-purple-800';
      case 'approved-for-payment': return 'bg-green-100 text-green-800';
      case 'paid-full': return 'bg-emerald-100 text-emerald-800';
      case 'paid-partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-register': return 'В реестре';
      case 'approved-for-payment': return 'Утвержден к оплате';
      case 'paid-full': return 'Оплачен полностью';
      case 'paid-partial': return 'Частично оплачен';
      default: return 'Неизвестен';
    }
  };

  const handleCreateRegister = async () => {
    if (selectedRequests.length === 0) return;
    
    try {
      // Update status of selected requests to 'in-register' via API
      await Promise.all(selectedRequests.map(requestId => 
        PaymentRequestService.updateStatus(requestId, 'in-register', {
          comment: 'Включен в реестр на оплату'
        })
      ));
      
      // Notify parent component about updates
      if (onUpdateRequest) {
        selectedRequests.forEach(requestId => {
          // This would need to be updated with the actual updated request data
          // For now, we'll just trigger a refresh
        });
      }
      
      setSelectedRequests([]);
      setViewMode('existing');
      toast.success(`Создан реестр с ${selectedRequests.length} платежами на сумму ${totalAmount.toLocaleString()} ₸`);
    } catch (error) {
      console.error('Error creating register:', error);
      toast.error('Ошибка создания реестра');
    }
  };

  const handleExportExcel = () => {
    alert('Экспорт реестра в формате Excel');
  };

  const handleExportPDF = () => {
    alert('Экспорт реестра в формате PDF');
  };

  const handleDownloadDocuments = () => {
    const payingCompanies = [...new Set(registerRequests.map(r => r.payingCompany).filter(Boolean))];
    alert(`Скачивание документов-оснований в разрезе оплачивающих компаний: ${payingCompanies.join(', ')}`);
  };

  const updatePaymentData = (requestId: string, field: string, value: any) => {
    setPaymentData(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value
      }
    }));
  };

  const getPaymentData = (requestId: string) => {
    const baseData = paymentData[requestId] || {
      actualAmount: 0,
      status: 'paid-full',
      comment: '',
      executionDate: new Date().toISOString().split('T')[0]
    };
    
    // If no actual amount set, use the request amount as default
    if (baseData.actualAmount === 0) {
      const request = registerRequests.find(r => r.id === requestId);
      baseData.actualAmount = request?.amount || 0;
    }
    
    return baseData;
  };

  const determinePaymentStatus = (originalAmount: number, actualAmount: number) => {
    if (actualAmount === originalAmount) {
      return 'paid-full';
    } else if (actualAmount > 0 && actualAmount < originalAmount) {
      return 'paid-partial';
    } else {
      return 'declined';
    }
  };

  const handleProcessPayment = (requestId: string) => {
    const request = registerRequests.find(r => r.id === requestId);
    if (!request || !onUpdateRequest) return;

    const paymentInfo = getPaymentData(requestId);
    
    // Automatically determine status based on amount
    const determinedStatus = paymentInfo.actualAmount === 0 ? 'declined' : 
                            determinePaymentStatus(request.amount, paymentInfo.actualAmount);

    const updatedRequest = {
      ...request,
      status: determinedStatus as any,
      paymentExecution: {
        actualAmount: paymentInfo.actualAmount,
        executionDate: paymentInfo.executionDate,
        executionComment: paymentInfo.comment,
        exchangeRate: 1
      }
    };

    onUpdateRequest(updatedRequest);
    
    // Remove from payment data as it's processed
    setPaymentData(prev => {
      const newData = { ...prev };
      delete newData[requestId];
      return newData;
    });

    // Show success message
    const statusMessage = determinedStatus === 'paid-full' ? 'оплаченным полностью' :
                         determinedStatus === 'paid-partial' ? 'частично оплаченным' : 
                         'отклоненным';
    toast.success(`Платеж ${request.docNumber} отмечен как ${statusMessage}`);
  };

  const handleBulkProcess = () => {
    if (!onUpdateRequest) return;
    
    const processableRequests = registerRequests.filter(r => 
      ['in-register', 'approved-for-payment'].includes(r.status) && 
      paymentData[r.id]
    );

    processableRequests.forEach(request => {
      const paymentInfo = getPaymentData(request.id);
      const determinedStatus = paymentInfo.actualAmount === 0 ? 'declined' : 
                              determinePaymentStatus(request.amount, paymentInfo.actualAmount);

      const updatedRequest = {
        ...request,
        status: determinedStatus as any,
        paymentExecution: {
          actualAmount: paymentInfo.actualAmount,
          executionDate: paymentInfo.executionDate,
          executionComment: paymentInfo.comment,
          exchangeRate: 1
        }
      };

      onUpdateRequest(updatedRequest);
    });

    // Clear all payment data
    setPaymentData({});
    
    toast.success(`Успешно обработано ${processableRequests.length} платежей`);
  };

  // Group requests by paying company for better organization
  const requestsByCompany = registerRequests.reduce((acc, request) => {
    const company = request.payingCompany || 'Не указано';
    if (!acc[company]) acc[company] = [];
    acc[company].push(request);
    return acc;
  }, {} as Record<string, typeof registerRequests>);

  const processableCount = registerRequests.filter(r => 
    ['in-register', 'approved-for-payment'].includes(r.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Реестры платежей</h2>
          <p className="text-muted-foreground">Управление реестрами для отправки в банк</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'create' ? 'default' : 'outline'}
            onClick={() => setViewMode('create')}
          >
            Создать реестр
          </Button>
          <Button 
            variant={viewMode === 'existing' ? 'default' : 'outline'}
            onClick={() => setViewMode('existing')}
          >
            Текущий реестр ({registerRequests.length})
          </Button>
          {processableCount > 0 && (
            <Button 
              variant={viewMode === 'process' ? 'default' : 'outline'}
              onClick={() => setViewMode('process')}
              className="bg-green-600 hover:bg-green-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Обработать платежи ({processableCount})
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'create' && (
        <>
          {/* Creation Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Выбрано заявок</p>
                    <p className="text-2xl font-semibold">{selectedRequests.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Общая сумма</p>
                    <p className="text-2xl font-semibold">{totalAmount.toLocaleString()} ₸</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Реестр от</p>
                    <p className="text-lg font-semibold">{new Date().toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Утвержденные заявки для включения в реестр ({availableRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableRequests.map(request => {
                  const isSelected = selectedRequests.includes(request.id);
                  const priority = getPriorityInfo(request.priority);
                  
                  return (
                    <div
                      key={request.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleRequest(request.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{request.docNumber}</h4>
                            <Badge variant="outline">{request.payingCompany}</Badge>
                            <Badge variant="outline">{request.dueDate}</Badge>
                            {priority && (
                              <Badge 
                                style={{ 
                                  backgroundColor: `${
                                    priority.color === 'red' ? '#fef2f2' :
                                    priority.color === 'orange' ? '#fff7ed' :
                                    priority.color === 'yellow' ? '#fefce8' :
                                    priority.color === 'green' ? '#f0fdf4' :
                                    '#f9fafb'
                                  }`,
                                  color: `${
                                    priority.color === 'red' ? '#b91c1c' :
                                    priority.color === 'orange' ? '#c2410c' :
                                    priority.color === 'yellow' ? '#a16207' :
                                    priority.color === 'green' ? '#166534' :
                                    '#374151'
                                  }`
                                }}
                              >
                                {priority.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getCounterpartyName(request.counterpartyId)} - {request.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Сумма: <strong>{request.amount.toLocaleString()} {request.currency}</strong></span>
                            <span>Срок: {request.dueDate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`w-4 h-4 rounded border-2 ${
                            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {availableRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Нет утвержденных заявок для включения в реестр</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onBack}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateRegister}
              disabled={selectedRequests.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Создать реестр ({selectedRequests.length})
            </Button>
          </div>
        </>
      )}

      {viewMode === 'existing' && (
        <>
          {/* Register Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Всего платежей</p>
                    <p className="text-2xl font-semibold">{registerRequests.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Общая сумма</p>
                    <p className="text-2xl font-semibold">{registerTotalAmount.toLocaleString()} ₸</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Компаний</p>
                    <p className="text-2xl font-semibold">{Object.keys(requestsByCompany).length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Обновлен</p>
                    <p className="text-lg font-semibold">{new Date().toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Экспорт и документы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleExportExcel} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать Excel
                </Button>
                <Button onClick={handleExportPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать PDF
                </Button>
                <Button onClick={handleDownloadDocuments} variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Документы-основания
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Register Contents by Company */}
          <div className="space-y-4">
            {Object.entries(requestsByCompany).map(([company, requests]) => (
              <Card key={company}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {company} ({requests.length} платежей)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {requests.map(request => {
                      const priority = getPriorityInfo(request.priority);
                      
                      return (
                        <div key={request.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{request.docNumber}</h4>
                                <Badge className={getStatusColor(request.status)}>
                                  {getStatusLabel(request.status)}
                                </Badge>
                                <Badge variant="outline">{request.dueDate}</Badge>
                                {priority && (
                                  <Badge 
                                    style={{ 
                                      backgroundColor: `${
                                        priority.color === 'red' ? '#fef2f2' :
                                        priority.color === 'orange' ? '#fff7ed' :
                                        priority.color === 'yellow' ? '#fefce8' :
                                        priority.color === 'green' ? '#f0fdf4' :
                                        '#f9fafb'
                                      }`,
                                      color: `${
                                        priority.color === 'red' ? '#b91c1c' :
                                        priority.color === 'orange' ? '#c2410c' :
                                        priority.color === 'yellow' ? '#a16207' :
                                        priority.color === 'green' ? '#166534' :
                                        '#374151'
                                      }`
                                    }}
                                  >
                                    {priority.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {getCounterpartyName(request.counterpartyId)} - {request.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Сумма: <strong>{request.amount.toLocaleString()} {request.currency}</strong></span>
                                <span>Срок: {request.dueDate}</span>
                                {request.paymentExecution?.actualAmount && (
                                  <span>Оплачено: <strong>{request.paymentExecution.actualAmount.toLocaleString()} ₸</strong></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {registerRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>Реестр пуст. Создайте новый реестр, добавив утвержденные заявки.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {viewMode === 'process' && (
        <>
          {/* Payment Processing Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Обработка платежей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Инструкция:</strong>
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Укажите фактическую сумму оплаты для каждой заявки</li>
                  <li>Если сумма равна заявленной - статус будет "Оплачено полностью"</li>
                  <li>Если сумма меньше заявленной - статус будет "Оплачено частично"</li>
                  <li>Если сумма равна 0 - статус будет "Отклонено"</li>
                  <li>Добавьте комментарий при необходимости</li>
                </ul>
              </div>

              <div className="space-y-4">
                {registerRequests
                  .filter(request => ['in-register', 'approved-for-payment'].includes(request.status))
                  .map(request => {
                    const currentPaymentData = getPaymentData(request.id);
                    const priority = getPriorityInfo(request.priority);
                    const futureStatus = currentPaymentData.actualAmount === 0 ? 'declined' : 
                                       determinePaymentStatus(request.amount, currentPaymentData.actualAmount);
                    
                    return (
                      <Card key={request.id} className="border-l-4 border-l-orange-400">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {/* Request Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{request.docNumber}</h4>
                                  <Badge variant="outline">{request.payingCompany}</Badge>
                                  <Badge variant="outline">{request.dueDate}</Badge>
                                  {priority && (
                                    <Badge 
                                      style={{ 
                                        backgroundColor: `${
                                          priority.color === 'red' ? '#fef2f2' :
                                          priority.color === 'orange' ? '#fff7ed' :
                                          priority.color === 'yellow' ? '#fefce8' :
                                          priority.color === 'green' ? '#f0fdf4' :
                                          '#f9fafb'
                                        }`,
                                        color: `${
                                          priority.color === 'red' ? '#b91c1c' :
                                          priority.color === 'orange' ? '#c2410c' :
                                          priority.color === 'yellow' ? '#a16207' :
                                          priority.color === 'green' ? '#166534' :
                                          '#374151'
                                        }`
                                      }}
                                    >
                                      {priority.label}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {getCounterpartyName(request.counterpartyId)} - {request.description}
                                </p>
                                <div className="text-sm">
                                  <span>Заявленная сумма: <strong>{request.amount.toLocaleString()} {request.currency}</strong></span>
                                </div>
                              </div>
                              
                              {/* Status Preview */}
                              <div className="text-right">
                                <Badge 
                                  className={
                                    futureStatus === 'paid-full' ? 'bg-green-100 text-green-800' :
                                    futureStatus === 'paid-partial' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }
                                >
                                  {futureStatus === 'paid-full' ? 'Оплачено полностью' :
                                   futureStatus === 'paid-partial' ? 'Частично оплачено' :
                                   'Отклонено'}
                                </Badge>
                              </div>
                            </div>

                            {/* Payment Processing Form */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                              <div className="space-y-2">
                                <Label>Фактическая сумма оплаты *</Label>
                                <Input
                                  type="number"
                                  value={currentPaymentData.actualAmount}
                                  onChange={(e) => updatePaymentData(request.id, 'actualAmount', Number(e.target.value))}
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Дата оплаты *</Label>
                                <Input
                                  type="date"
                                  value={currentPaymentData.executionDate}
                                  onChange={(e) => updatePaymentData(request.id, 'executionDate', e.target.value)}
                                />
                              </div>
                              
                              <div className="space-y-2 md:col-span-2">
                                <Label>Комментарий</Label>
                                <Textarea
                                  value={currentPaymentData.comment}
                                  onChange={(e) => updatePaymentData(request.id, 'comment', e.target.value)}
                                  placeholder="Комментарий к оплате"
                                  rows={2}
                                />
                              </div>
                            </div>

                            {/* Individual Process Button */}
                            <div className="flex justify-end">
                              <Button 
                                onClick={() => handleProcessPayment(request.id)}
                                disabled={!currentPaymentData.actualAmount && futureStatus !== 'declined'}
                                variant={futureStatus === 'declined' ? 'destructive' : 'default'}
                              >
                                {futureStatus === 'paid-full' && <CheckCircle className="h-4 w-4 mr-2" />}
                                {futureStatus === 'paid-partial' && <Clock className="h-4 w-4 mr-2" />}
                                {futureStatus === 'declined' && <XCircle className="h-4 w-4 mr-2" />}
                                
                                {futureStatus === 'paid-full' ? 'Отметить как оплаченный полностью' :
                                 futureStatus === 'paid-partial' ? 'Отметить как частично оплаченный' :
                                 'Отклонить платеж'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* Bulk Actions */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  К обработке: {processableCount} платежей
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setViewMode('existing')}>
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleBulkProcess}
                    disabled={Object.keys(paymentData).length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Обработать все заполненные ({Object.keys(paymentData).length})
                  </Button>
                </div>
              </div>

              {processableCount === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Все платежи в реестре уже обработаны</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}