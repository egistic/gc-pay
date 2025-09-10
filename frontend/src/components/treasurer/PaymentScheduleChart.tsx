import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { Calendar, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { PaymentRequest } from '../../types';
// Removed mock data import - using API only
import { format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, startOfDay, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

type PeriodType = 'week_days' | 'month_days' | 'quarter_decades' | 'halfyear_months';

interface PaymentScheduleChartProps {
  className?: string;
  paymentRequests?: PaymentRequest[];
}

interface ChartDataPoint {
  date: string;
  label: string;
  amount: number;
  overdue: number;
  count: number;
  overdueCount: number;
}

export function PaymentScheduleChart({ className, paymentRequests = [] }: PaymentScheduleChartProps) {

  // Get dictionary data
  const [periodType, setPeriodType] = useState<PeriodType>('week_days');
  const today = new Date();

  const periodOptions = [
    { value: 'week_days', label: 'Неделя по дням' },
    { value: 'month_days', label: 'Месяц по дням' },
    { value: 'quarter_decades', label: 'Квартал по декадам' },
    { value: 'halfyear_months', label: 'Полгода по месяцам' },
  ];

  // Filter relevant payment requests (approved and to-pay)
  const relevantRequests = useMemo(() => {
    return paymentRequests.filter(r => 
      ['approved', 'to-pay'].includes(r.status)
    );
  }, [paymentRequests]);

  // Generate chart data based on selected period
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];
    
    switch (periodType) {
      case 'week_days': {
        const startDate = startOfWeek(today, { weekStartsOn: 1 });
        for (let i = 0; i < 7; i++) {
          const date = addDays(startDate, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          const dayRequests = relevantRequests.filter(r => 
            isSameDay(parseISO(r.dueDate), date)
          );
          
          const overdueRequests = dayRequests.filter(r => 
            isAfter(today, parseISO(r.dueDate))
          );
          
          data.push({
            date: dateStr,
            label: format(date, 'EEE d', { locale: ru }),
            amount: dayRequests.reduce((sum, r) => sum + r.amount, 0),
            overdue: overdueRequests.reduce((sum, r) => sum + r.amount, 0),
            count: dayRequests.length,
            overdueCount: overdueRequests.length
          });
        }
        break;
      }
      
      case 'month_days': {
        const startDate = startOfMonth(today);
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        
        for (let i = 0; i < daysInMonth; i++) {
          const date = addDays(startDate, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          const dayRequests = relevantRequests.filter(r => 
            isSameDay(parseISO(r.dueDate), date)
          );
          
          const overdueRequests = dayRequests.filter(r => 
            isAfter(today, parseISO(r.dueDate))
          );
          
          data.push({
            date: dateStr,
            label: format(date, 'd', { locale: ru }),
            amount: dayRequests.reduce((sum, r) => sum + r.amount, 0),
            overdue: overdueRequests.reduce((sum, r) => sum + r.amount, 0),
            count: dayRequests.length,
            overdueCount: overdueRequests.length
          });
        }
        break;
      }
      
      case 'quarter_decades': {
        const startDate = startOfMonth(today);
        
        for (let i = 0; i < 9; i++) { // 3 months * 3 decades
          const month = Math.floor(i / 3);
          const decade = i % 3;
          const monthStart = addMonths(startDate, month);
          
          let decadeStart: Date;
          let decadeEnd: Date;
          let label: string;
          
          if (decade === 0) {
            decadeStart = monthStart;
            decadeEnd = addDays(monthStart, 9);
            label = `${format(monthStart, 'MMM', { locale: ru })} 1-10`;
          } else if (decade === 1) {
            decadeStart = addDays(monthStart, 10);
            decadeEnd = addDays(monthStart, 19);
            label = `${format(monthStart, 'MMM', { locale: ru })} 11-20`;
          } else {
            decadeStart = addDays(monthStart, 20);
            decadeEnd = addDays(addMonths(monthStart, 1), -1);
            label = `${format(monthStart, 'MMM', { locale: ru })} 21-${format(decadeEnd, 'd')}`;
          }
          
          const decadeRequests = relevantRequests.filter(r => {
            const dueDate = parseISO(r.dueDate);
            return dueDate >= decadeStart && dueDate <= decadeEnd;
          });
          
          const overdueRequests = decadeRequests.filter(r => 
            isAfter(today, parseISO(r.dueDate))
          );
          
          data.push({
            date: format(decadeStart, 'yyyy-MM-dd'),
            label,
            amount: decadeRequests.reduce((sum, r) => sum + r.amount, 0),
            overdue: overdueRequests.reduce((sum, r) => sum + r.amount, 0),
            count: decadeRequests.length,
            overdueCount: overdueRequests.length
          });
        }
        break;
      }
      
      case 'halfyear_months': {
        const startDate = startOfMonth(today);
        
        for (let i = 0; i < 6; i++) {
          const date = addMonths(startDate, i);
          const nextMonth = addMonths(date, 1);
          
          const monthRequests = relevantRequests.filter(r => {
            const dueDate = parseISO(r.dueDate);
            return dueDate >= date && dueDate < nextMonth;
          });
          
          const overdueRequests = monthRequests.filter(r => 
            isAfter(today, parseISO(r.dueDate))
          );
          
          data.push({
            date: format(date, 'yyyy-MM-dd'),
            label: format(date, 'MMM yyyy', { locale: ru }),
            amount: monthRequests.reduce((sum, r) => sum + r.amount, 0),
            overdue: overdueRequests.reduce((sum, r) => sum + r.amount, 0),
            count: monthRequests.length,
            overdueCount: overdueRequests.length
          });
        }
        break;
      }
    }
    
    return data;
  }, [periodType, relevantRequests, today]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const todayRequests = relevantRequests.filter(r => 
      isSameDay(parseISO(r.dueDate), today)
    );
    
    const overdueRequests = relevantRequests.filter(r => 
      isAfter(today, parseISO(r.dueDate))
    );
    
    return {
      todayAmount: todayRequests.reduce((sum, r) => sum + r.amount, 0),
      todayCount: todayRequests.length,
      overdueAmount: overdueRequests.reduce((sum, r) => sum + r.amount, 0),
      overdueCount: overdueRequests.length,
      totalAmount: relevantRequests.reduce((sum, r) => sum + r.amount, 0),
      totalCount: relevantRequests.length
    };
  }, [relevantRequests, today]);

  const formatAmount = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">К оплате сегодня</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayAmount.toLocaleString()} ₸</div>
            <p className="text-xs text-muted-foreground">
              {metrics.todayCount} заявок
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.overdueAmount.toLocaleString()} ₸</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overdueCount} заявок
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего к оплате</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAmount.toLocaleString()} ₸</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalCount} заявок
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Готовность</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalCount > 0 ? Math.round((metrics.todayCount / metrics.totalCount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              На сегодня
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>График платежей</CardTitle>
              <p className="text-sm text-muted-foreground">
                Суммы платежей по срокам выполнения
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={periodType} onValueChange={(value: PeriodType) => setPeriodType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  fontSize={12}
                  angle={periodType === 'month_days' ? -45 : 0}
                  textAnchor={periodType === 'month_days' ? 'end' : 'middle'}
                  height={periodType === 'month_days' ? 60 : 40}
                />
                <YAxis 
                  fontSize={12}
                  tickFormatter={formatAmount}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} ₸`,
                    name === 'amount' ? 'Сумма' : 'Просрочено'
                  ]}
                  labelFormatter={(label) => `Период: ${label}`}
                />
                <ReferenceLine 
                  x={format(today, periodType.includes('days') ? 'd' : 'MMM', { locale: ru })} 
                  stroke="#ef4444" 
                  strokeDasharray="2 2"
                  label="Сегодня"
                />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--chart-1))" 
                  name="amount"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="overdue" 
                  fill="#ef4444" 
                  name="overdue"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }}></div>
              <span className="text-sm">Запланировано</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm">Просрочено</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue payments list */}
      {metrics.overdueCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Просроченные платежи ({metrics.overdueCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relevantRequests
                .filter(r => isAfter(today, parseISO(r.dueDate)))
                .slice(0, 5)
                .map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium">{request.docNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Просрочено на {Math.ceil((today.getTime() - parseISO(request.dueDate).getTime()) / (1000 * 60 * 60 * 24))} дн.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{request.amount.toLocaleString()} ₸</p>
                      <Badge variant="destructive" className="text-xs">
                        {format(parseISO(request.dueDate), 'd MMM', { locale: ru })}
                      </Badge>
                    </div>
                  </div>
                ))}
              
              {metrics.overdueCount > 5 && (
                <div className="text-center py-2">
                  <Button variant="outline" size="sm">
                    Показать еще {metrics.overdueCount - 5} просроченных
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}