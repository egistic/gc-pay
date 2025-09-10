import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  useRoleStatistics, 
  useDashboardMetrics, 
  useRegistryStatistics,
  useAllRoleStatistics,
  useStatisticsComparison 
} from '../../hooks/useStatistics';
import { StatisticsUtils } from '../../services/statisticsService';
import { UserRole } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  BarChart3, 
  PieChart, 
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

interface StatisticsDashboardProps {
  currentRole: UserRole;
  userId?: string;
}

export function StatisticsDashboard({ currentRole, userId }: StatisticsDashboardProps) {
  const { statistics, loading, error, refresh, lastUpdated } = useRoleStatistics(currentRole, userId, {
    enableCache: true,
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  const { metrics, loading: metricsLoading } = useDashboardMetrics(currentRole, userId, {
    enableCache: true,
    autoRefresh: true,
    refreshInterval: 60000
  });

  const { statistics: registryStats, loading: registryLoading } = useRegistryStatistics({
    enableCache: true,
    autoRefresh: true,
    refreshInterval: 120000 // 2 minutes
  });

  const { comparison, loading: comparisonLoading } = useStatisticsComparison(currentRole, userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-red-500 mb-2">Ошибка загрузки статистики</p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'classified': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_registry': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновики';
      case 'submitted': return 'На рассмотрении';
      case 'classified': return 'Классифицированы';
      case 'approved': return 'Утверждены';
      case 'in_registry': return 'В реестре';
      case 'rejected': return 'Отклонены';
      case 'overdue': return 'Просрочены';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Статистика</h2>
          <p className="text-muted-foreground">
            Роль: {currentRole} • Обновлено: {lastUpdated?.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statistics && Object.entries(statistics).map(([key, value]) => {
          if (key === 'formatted' || typeof value !== 'number') return null;
          
          const change = comparison?.change?.[key] || 0;
          const isPositive = change > 0;
          const isNegative = change < 0;
          
          return (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{getStatusLabel(key)}</p>
                    <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {change !== 0 && (
                      <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(change).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(key)}>
                  {getStatusLabel(key)}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dashboard Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Метрики дашборда
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Общая сумма</p>
                <p className="text-xl font-semibold">
                  {metrics.total_amount?.toLocaleString() || '0'} {metrics.currency || 'KZT'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Недавние заявки</p>
                <p className="text-xl font-semibold">
                  {metrics.recent_requests?.length || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Роль</p>
                <Badge className="bg-primary text-primary-foreground">
                  {metrics.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registry Statistics */}
      {registryStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Статистика реестра
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Всего записей</p>
                <p className="text-xl font-semibold">
                  {registryStats.total_entries?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Общая сумма</p>
                <p className="text-xl font-semibold">
                  {registryStats.total_amount?.toLocaleString() || '0'} {registryStats.currency || 'KZT'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Просрочено</p>
                <p className="text-xl font-semibold text-red-600">
                  {registryStats.overdue_count?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">К оплате сегодня</p>
                <p className="text-xl font-semibold text-orange-600">
                  {registryStats.due_today_count?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Производительность системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-muted-foreground">Время обновления</p>
              <p className="text-lg font-semibold">
                {lastUpdated ? `${Math.round((Date.now() - lastUpdated.getTime()) / 1000)}с назад` : 'Неизвестно'}
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">Статус кэша</p>
              <p className="text-lg font-semibold text-green-600">Активен</p>
            </div>
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm text-muted-foreground">Автообновление</p>
              <p className="text-lg font-semibold text-blue-600">Включено</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Chart */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Сравнение с предыдущим периодом
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(comparison.change).map(([key, change]) => {
                if (key === 'formatted') return null;
                const isPositive = change > 0;
                const isNegative = change < 0;
                
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{getStatusLabel(key)}</p>
                      <p className="text-sm text-muted-foreground">
                        Текущее: {comparison.current[key]} • Предыдущее: {comparison.previous[key]}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
                      <span className={`font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StatisticsDashboard;
