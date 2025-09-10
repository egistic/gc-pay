import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Eye,
  CheckCircle,
  DollarSign,
  Calendar,
  Banknote,
  FileText,
  ArrowRight,
  Activity,
  Target,
  Wallet
} from 'lucide-react';
import { PaymentRequest } from '../../types';
import { PaymentScheduleChart } from './PaymentScheduleChart';

interface OptimizedTreasurerDashboardProps {
  paymentRequests: PaymentRequest[];
  onFilterChange?: (filter: string | null) => void;
  currentFilter?: string | null;
  onViewRequest?: (id: string) => void;
}

export function OptimizedTreasurerDashboard({ 
  paymentRequests, 
  onFilterChange, 
  currentFilter,
  onViewRequest 
}: OptimizedTreasurerDashboardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Filter treasurer requests
  const treasurerRequests = paymentRequests.filter(r => 
    ['approved', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(r.status)
  );

  // Calculate metrics
  const newRequests = paymentRequests.filter(r => r.status === 'approved');
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const overdueRequests = newRequests.filter(r => new Date(r.createdAt) < fiveHoursAgo);
  const inRegister = paymentRequests.filter(r => r.status === 'in-register');
  const approvedForPayment = paymentRequests.filter(r => r.status === 'approved-for-payment');

  // Calculate totals by currency
  const currencyTotals = newRequests.reduce((acc, request) => {
    const currency = request.currency || 'KZT';
    if (!acc[currency]) {
      acc[currency] = { count: 0, amount: 0 };
    }
    acc[currency].count += 1;
    acc[currency].amount += request.amount;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  // Payment status breakdown
  const statusBreakdown = treasurerRequests.reduce((acc, request) => {
    const status = request.status;
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status] += 1;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (amount: number, currency: string) => {
    const symbols = {
      'KZT': '₸',
      'USD': '$',
      'EUR': '€',
      'RUB': '₽',
      'CNY': '¥'
    };
    return `${amount.toLocaleString()} ${symbols[currency] || currency}`;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'approved': 'Новые',
      'in-register': 'В реестре',
      'approved-for-payment': 'К оплате',
      'paid-full': 'Оплачено',
      'paid-partial': 'Частично оплачено',
      'declined': 'Отклонено',
      'returned': 'Возвращено'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'approved': 'bg-orange-100 text-orange-700',
      'in-register': 'bg-blue-100 text-blue-700',
      'approved-for-payment': 'bg-purple-100 text-purple-700',
      'paid-full': 'bg-green-100 text-green-700',
      'paid-partial': 'bg-yellow-100 text-yellow-700',
      'declined': 'bg-red-100 text-red-700',
      'returned': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleFilterClick = (filterType: string) => {
    if (onFilterChange) {
      const newFilter = currentFilter === filterType ? null : filterType;
      onFilterChange(newFilter);
    }
  };

  const urgentCount = overdueRequests.length;
  const readyForPayment = approvedForPayment.length;
  const inProgress = newRequests.length + inRegister.length;

  return (
    <div className="space-y-6">
      {/* Priority Actions Section */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Требует внимания
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Urgent Items */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                urgentCount > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
              } ${currentFilter === 'overdue' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleFilterClick('overdue')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${urgentCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="font-medium">Просрочено</span>
                </div>
                <Badge variant={urgentCount > 0 ? "destructive" : "default"}>
                  {urgentCount}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {urgentCount > 0 ? 'Свыше 5 часов без обработки' : 'Все в порядке'}
              </p>
            </div>

            {/* Ready for Payment */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                readyForPayment > 0 ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
              }`}
              onClick={() => handleFilterClick('approved-for-payment')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Готово к оплате</span>
                </div>
                <Badge variant={readyForPayment > 0 ? "secondary" : "outline"}>
                  {readyForPayment}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Утверждено и ожидает оплаты
              </p>
            </div>

            {/* In Progress */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                inProgress > 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
              } ${currentFilter === 'newRequests' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleFilterClick('newRequests')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">В работе</span>
                </div>
                <Badge variant={inProgress > 0 ? "secondary" : "outline"}>
                  {inProgress}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Требует рассмотрения казначеем
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button 
              size="sm" 
              onClick={() => handleFilterClick('newRequests')}
              disabled={newRequests.length === 0}
            >
              <Eye className="h-4 w-4 mr-1" />
              Обработать новые ({newRequests.length})
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setExpandedSection(expandedSection === 'register' ? null : 'register')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Создать реестр
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              Обзор ликвидности
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpandedSection(expandedSection === 'currencies' ? null : 'currencies')}
            >
              {expandedSection === 'currencies' ? 'Свернуть' : 'Развернуть'}
              <ArrowRight className={`h-4 w-4 ml-1 transition-transform ${expandedSection === 'currencies' ? 'rotate-90' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {expandedSection === 'currencies' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {['KZT', 'USD', 'EUR', 'RUB', 'CNY'].map(currency => {
                const data = currencyTotals[currency] || { count: 0, amount: 0 };
                return (
                  <div key={currency} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{currency}</span>
                      <Badge variant="outline">{data.count}</Badge>
                    </div>
                    <div className="text-lg font-semibold mb-1">
                      {formatCurrency(data.amount, currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">К обработке</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(currencyTotals).slice(0, 3).map(([currency, data]) => (
                <div key={currency} className="text-center">
                  <div className="text-sm text-muted-foreground">{currency}</div>
                  <div className="font-semibold">{formatCurrency(data.amount, currency)}</div>
                  <div className="text-xs text-muted-foreground">{data.count} заявок</div>
                </div>
              ))}
              {Object.keys(currencyTotals).length > 3 && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Еще</div>
                  <div className="font-semibold">+{Object.keys(currencyTotals).length - 3}</div>
                  <div className="text-xs text-muted-foreground">валют</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Status & Payment Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Статус workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const percentage = treasurerRequests.length > 0 ? (count / treasurerRequests.length) * 100 : 0;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(status)} variant="secondary">
                        {getStatusLabel(status)}
                      </Badge>
                      <span className="text-sm">{count}</span>
                    </div>
                    <div className="w-24">
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Всего заявок</span>
                <span className="font-medium">{treasurerRequests.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Schedule Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              График платежей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentScheduleChart />
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Показатели эффективности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((statusBreakdown['paid-full'] || 0) / Math.max(treasurerRequests.length, 1) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Успешно оплачено</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(((statusBreakdown['paid-full'] || 0) + (statusBreakdown['paid-partial'] || 0)) / Math.max(treasurerRequests.length, 1) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Общая оплата</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {overdueRequests.length > 0 ? '⚠️' : '✅'}
              </div>
              <div className="text-sm text-muted-foreground">SLA соблюдение</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {inRegister.length + approvedForPayment.length}
              </div>
              <div className="text-sm text-muted-foreground">Готово к оплате</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}