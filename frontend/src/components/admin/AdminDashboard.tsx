import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users, BookOpen, Settings, Activity, Database, Shield, BarChart3, UserPlus, ShieldCheck, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AdminService, SystemStatistics } from '../../services/adminService';
import { DictionaryService } from '../../services/dictionaries/dictionaryService';
import { DictionaryStatistics } from '../../types/dictionaries';
import { PermissionGate } from '../common/PermissionGate';
import { useAppState } from '../../context/AppStateContext';
import { PERMISSIONS } from '../../utils/permissions';
import { PositionManagement } from './PositionManagement';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

interface DashboardStats {
  systemStats: SystemStatistics | null;
  dictionaryStats: DictionaryStatistics | null;
  loading: boolean;
  error: string | null;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { state } = useAppState();
  const [stats, setStats] = useState<DashboardStats>({
    systemStats: null,
    dictionaryStats: null,
    loading: true,
    error: null
  });

  // Load statistics on component mount
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));
        
        // Load system statistics
        const systemStats = await AdminService.getSystemStatistics();
        
        // Load dictionary statistics (for expense-articles as main dictionary)
        const dictionaryService = DictionaryService.getInstance();
        const dictionaryStats = await dictionaryService.getStatistics('expense-articles');
        
        setStats({
          systemStats,
          dictionaryStats,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error loading statistics:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Ошибка загрузки статистики'
        }));
      }
    };

    loadStatistics();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium">Администрирование системы</h2>
        <p className="text-muted-foreground">Управление пользователями, справочниками и ролями</p>
        {stats.error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{stats.error}</p>
          </div>
        )}
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? '-' : stats.systemStats?.active_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.loading ? 'Данные загружаются...' : 
               `Всего пользователей: ${stats.systemStats?.total_users || 0}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Справочники</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? '-' : stats.dictionaryStats?.totalItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.loading ? 'Данные загружаются...' : 
               `Активных записей: ${stats.dictionaryStats?.activeItems || 0}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Система</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={
                  stats.loading ? "bg-gray-100 text-gray-800" :
                  stats.systemStats?.system_health === 'healthy' ? "bg-green-100 text-green-800" :
                  stats.systemStats?.system_health === 'warning' ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }
              >
                {stats.loading ? 'Загрузка...' :
                 stats.systemStats?.system_health === 'healthy' ? 'Работает' :
                 stats.systemStats?.system_health === 'warning' ? 'Предупреждение' :
                 'Ошибка'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.loading ? 'Проверка состояния...' : 'Система активна'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dictionaries - ACTIVE */}
        <PermissionGate 
          userRole={state.currentRole} 
          permission={PERMISSIONS.VIEW_DICTIONARIES}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Справочники
              </CardTitle>
              <CardDescription>
                Управление справочниками статей расходов, контрагентов и других данных
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Статьи расходов</span>
                <Badge variant="outline">
                  {stats.loading ? '-' : stats.dictionaryStats?.totalItems || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Активных записей</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats.loading ? '-' : stats.dictionaryStats?.activeItems || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Неактивных записей</span>
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  {stats.loading ? '-' : stats.dictionaryStats?.inactiveItems || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Обновлено недавно</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {stats.loading ? '-' : stats.dictionaryStats?.recentlyUpdated || 0}
                </Badge>
              </div>
              <Button 
                onClick={() => onNavigate('dictionaries')} 
                className="w-full"
              >
                Управлять справочниками
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>

        {/* User Management - ACTIVE */}
        <PermissionGate 
          userRole={state.currentRole} 
          permission={PERMISSIONS.VIEW_USERS}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Управление пользователями
              </CardTitle>
              <CardDescription>
                Создание, редактирование и управление пользователями системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Активных пользователей</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats.loading ? '-' : stats.systemStats?.active_users || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Всего пользователей</span>
                <Badge variant="outline">
                  {stats.loading ? '-' : stats.systemStats?.total_users || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Неактивных пользователей</span>
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  {stats.loading ? '-' : 
                   (stats.systemStats?.total_users || 0) - (stats.systemStats?.active_users || 0)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Всего ролей</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {stats.loading ? '-' : stats.systemStats?.total_roles || 0}
                </Badge>
              </div>
              <Button 
                onClick={() => onNavigate('user-management')} 
                className="w-full"
              >
                Управлять пользователями
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>

        {/* Role Management - ACTIVE */}
        <PermissionGate 
          userRole={state.currentRole} 
          permission={PERMISSIONS.VIEW_ROLES}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Управление ролями
              </CardTitle>
              <CardDescription>
                Создание и настройка ролей, управление правами доступа
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Всего ролей</span>
                <Badge variant="outline">
                  {stats.loading ? '-' : stats.systemStats?.total_roles || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Активных ролей</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats.loading ? '-' : stats.systemStats?.total_roles || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Пользователей с ролями</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {stats.loading ? '-' : stats.systemStats?.active_users || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Заявок в системе</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {stats.loading ? '-' : stats.systemStats?.total_requests || 0}
                </Badge>
              </div>
              <Button 
                onClick={() => onNavigate('role-management')} 
                className="w-full"
              >
                Управлять ролями
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>

        {/* Expense Article Assignments - ACTIVE */}
        <PermissionGate 
          userRole={state.currentRole} 
          permission={PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Назначения статей расходов
              </CardTitle>
              <CardDescription>
                Назначение пользователей к статьям расходов с ролями для контроля доступа
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Активных назначений</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {stats.loading ? '-' : '0'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Пользователей с назначениями</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats.loading ? '-' : '0'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Покрытие статей</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {stats.loading ? '-' : '0%'}
                </Badge>
              </div>
              <Button 
                onClick={() => onNavigate('expense-article-assignment')} 
                className="w-full"
              >
                Управлять назначениями
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>

        {/* Position Management - ACTIVE */}
        <PermissionGate 
          userRole={state.currentRole} 
          permission={PERMISSIONS.VIEW_USERS}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Позиции и департаменты
              </CardTitle>
              <CardDescription>
                Управление организационной структурой и назначениями пользователей
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Позиций</span>
                <Badge variant="outline">3</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Департаментов</span>
                <Badge variant="outline">3</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Назначений</span>
                <Badge variant="outline">6</Badge>
              </div>
              <Button 
                onClick={() => onNavigate('position-management')} 
                className="w-full"
              >
                Управлять позициями
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>

        {/* Distributor Routing - DISABLED */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Маршрутизация распорядителей
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Настройка маршрутов утверждения для распорядителей
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Активных маршрутов</span>
              <Badge variant="outline">-</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Распорядителей</span>
              <Badge variant="outline">-</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Покрытие статей</span>
              <Badge variant="outline">-</Badge>
            </div>
            <Button 
              disabled
              className="w-full"
            >
              Недоступно
            </Button>
          </CardContent>
        </Card>

        {/* System Statistics - DISABLED */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Статистика системы
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Мониторинг производительности и активности системы
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Состояние системы</span>
              <Badge variant="outline">-</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Время отклика</span>
              <Badge variant="outline">-</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Доступность</span>
              <Badge variant="outline">-</Badge>
            </div>
            <Button 
              disabled
              className="w-full"
            >
              Недоступно
            </Button>
          </CardContent>
        </Card>

        {/* System Settings - DISABLED */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Системные настройки
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Конфигурация системы, безопасность и мониторинг
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Уведомления</span>
              <Badge variant="outline">-</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Бэкапы</span>
              <Badge variant="outline">-</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Аудит</span>
              <Badge variant="outline">-</Badge>
            </div>
            <Button 
              disabled
              className="w-full"
            >
              Недоступно
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - REMOVED */}
      {/* Mock activity data has been removed */}
    </div>
  );
}