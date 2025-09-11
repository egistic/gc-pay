import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { User, LogOut, Building2, Briefcase, Mail, Phone, Calendar } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'EXECUTOR':
        return 'bg-blue-100 text-blue-800';
      case 'REGISTRAR':
        return 'bg-green-100 text-green-800';
      case 'SUB_REGISTRAR':
        return 'bg-yellow-100 text-yellow-800';
      case 'DISTRIBUTOR':
        return 'bg-purple-100 text-purple-800';
      case 'TREASURER':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Администратор';
      case 'EXECUTOR':
        return 'Исполнитель';
      case 'REGISTRAR':
        return 'Регистратор';
      case 'SUB_REGISTRAR':
        return 'Суб-регистратор';
      case 'DISTRIBUTOR':
        return 'Распорядитель';
      case 'TREASURER':
        return 'Казначей';
      default:
        return role;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Профиль пользователя
            </CardTitle>
            <CardDescription>
              Информация о текущем пользователе
            </CardDescription>
          </div>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Основная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Полное имя</p>
                <p className="font-medium">{user.full_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            
            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Статус</p>
                <p className="font-medium text-green-600">
                  {user.is_active ? 'Активен' : 'Неактивен'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Position and Department */}
        {(user.position || user.department) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Должность и отдел</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.position && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Должность</p>
                    <p className="font-medium">{user.position.name}</p>
                    {user.position.code && (
                      <p className="text-xs text-gray-400">Код: {user.position.code}</p>
                    )}
                  </div>
                </div>
              )}
              
              {user.department && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Отдел</p>
                    <p className="font-medium">{user.department.name}</p>
                    {user.department.code && (
                      <p className="text-xs text-gray-400">Код: {user.department.code}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Roles */}
        {user.roles && user.roles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Роли</h3>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role, index) => (
                <Badge
                  key={index}
                  className={getRoleBadgeColor(role)}
                >
                  {getRoleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Current Role */}
        {user.currentRole && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Текущая роль</h3>
            <Badge className={getRoleBadgeColor(user.currentRole)}>
              {getRoleLabel(user.currentRole)}
            </Badge>
          </div>
        )}

        {/* Timestamps */}
        {(user.created_at || user.updated_at) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Информация о создании</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.created_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Создан</p>
                    <p className="font-medium">
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              )}
              
              {user.updated_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Обновлен</p>
                    <p className="font-medium">
                      {new Date(user.updated_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
