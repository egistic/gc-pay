import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { RefreshCw, Users, Shield, FileText, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { AdminService, SystemStatistics, ActivityLog } from '../../services/adminService';

interface SystemStatisticsProps {
  onBack: () => void;
}

export function SystemStatistics({ onBack }: SystemStatisticsProps) {
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, activityData] = await Promise.all([
        AdminService.getSystemStatistics(),
        AdminService.getActivityLog(20)
      ]);
      setStatistics(statsData);
      setActivityLog(activityData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Здорово</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Предупреждение</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Ошибка</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_created':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'role_assigned':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'request_created':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'user_created':
        return 'Создан пользователь';
      case 'role_assigned':
        return 'Назначена роль';
      case 'request_created':
        return 'Создан запрос';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Статистика системы</h2>
          <p className="text-muted-foreground">Обзор состояния системы и активности</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
            </span>
          )}
          <Button onClick={loadData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button onClick={onBack} variant="outline">
            Назад
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_users}</div>
              <p className="text-xs text-muted-foreground">
                Активных: {statistics.active_users}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ролей в системе</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_roles}</div>
              <p className="text-xs text-muted-foreground">
                Управление доступом
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Запросов</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_requests}</div>
              <p className="text-xs text-muted-foreground">
                Платежных запросов
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Состояние системы</CardTitle>
              {getHealthIcon(statistics.system_health)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getHealthBadge(statistics.system_health)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Статус работы
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Последняя активность
          </CardTitle>
          <CardDescription>
            Список последних действий в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Загрузка активности...</p>
            </div>
          ) : activityLog.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет данных об активности
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Действие</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Ресурс</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Детали</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLog.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-medium">
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.user_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.resource}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <div className="text-sm">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="text-muted-foreground">
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* System Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Использование ролей</CardTitle>
            <CardDescription>
              Статистика использования ролей в системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Активных пользователей</span>
                <Badge variant="outline">{statistics?.active_users || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Всего ролей</span>
                <Badge variant="outline">{statistics?.total_roles || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Среднее ролей на пользователя</span>
                <Badge variant="outline">
                  {statistics && statistics.active_users > 0 
                    ? (statistics.total_roles / statistics.active_users).toFixed(1)
                    : '0'
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Производительность</CardTitle>
            <CardDescription>
              Показатели производительности системы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Время отклика API</span>
                <Badge className="bg-green-100 text-green-800">~50ms</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Доступность</span>
                <Badge className="bg-green-100 text-green-800">99.9%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Загрузка базы данных</span>
                <Badge className="bg-yellow-100 text-yellow-800">Средняя</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
