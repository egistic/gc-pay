import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users, BookOpen, Settings, Activity, Database, Shield } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium">Администрирование системы</h2>
        <p className="text-muted-foreground">Управление пользователями, справочниками и настройками системы</p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 за последний месяц
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Справочники</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 обновлены сегодня
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
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Работает
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Время работы: 99.9%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Badge variant="outline">125 записей</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Контрагенты</span>
              <Badge variant="outline">89 записей</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Договоры</span>
              <Badge variant="outline">45 записей</Badge>
            </div>
            <Button 
              onClick={() => onNavigate('dictionaries')} 
              className="w-full"
            >
              Управлять справочниками
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Назначения регистраторов
            </CardTitle>
            <CardDescription>
              Назначение регистраторов для обработки заявок по статьям расходов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Активных назначений</span>
              <Badge variant="outline">8</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Регистраторов</span>
              <Badge variant="outline">4</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Покрытие статей</span>
              <Badge variant="outline">95%</Badge>
            </div>
            <Button 
              onClick={() => onNavigate('registrar-assignments')} 
              className="w-full"
            >
              Управлять назначениями
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Маршрутизация распорядителей
            </CardTitle>
            <CardDescription>
              Настройка маршрутов утверждения для распорядителей
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Активных маршрутов</span>
              <Badge variant="outline">3</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Распорядителей</span>
              <Badge variant="outline">6</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Покрытие статей</span>
              <Badge variant="outline">100%</Badge>
            </div>
            <Button 
              onClick={() => onNavigate('distributor-routing')} 
              className="w-full"
            >
              Управлять маршрутизацией
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Системные настройки
            </CardTitle>
            <CardDescription>
              Конфигурация системы, безопасность и мониторинг
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Уведомления</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">Включены</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Бэкапы</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">Автоматические</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Аудит</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">Активен</Badge>
            </div>
            <Button 
              onClick={() => onNavigate('admin')} 
              className="w-full"
            >
              Системные настройки
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Последние действия</CardTitle>
          <CardDescription>Системная активность за последние 24 часа</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Обновлен справочник контрагентов</span>
              <span className="text-xs text-muted-foreground ml-auto">2 часа назад</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Добавлен новый регистратор</span>
              <span className="text-xs text-muted-foreground ml-auto">4 часа назад</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm">Изменен маршрут утверждения</span>
              <span className="text-xs text-muted-foreground ml-auto">6 часов назад</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Создана резервная копия системы</span>
              <span className="text-xs text-muted-foreground ml-auto">8 часов назад</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}