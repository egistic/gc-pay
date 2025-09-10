import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { UserRole } from '../../types';
import { ChevronDown, User, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  userName: string;
  apiMode?: 'mock' | 'api';
  onToggleApiMode?: (useMockData: boolean) => void;
  onNavigate?: (page: string) => void;
}

const roleLabels: Record<UserRole, string> = {
  executor: 'Исполнитель',
  registrar: 'Регистратор',
  sub_registrar: 'Суб-Регистратор',
  distributor: 'Распорядитель',
  treasurer: 'Казначей',
  admin: 'Администратор'
};

const roleColors: Record<UserRole, string> = {
  executor: 'bg-blue-100 text-blue-800',
  registrar: 'bg-green-100 text-green-800',
  sub_registrar: 'bg-emerald-100 text-emerald-800',
  distributor: 'bg-purple-100 text-purple-800', 
  treasurer: 'bg-orange-100 text-orange-800',
  admin: 'bg-red-100 text-red-800'
};

export function Header({ 
  currentRole, 
  onRoleChange, 
  userName, 
  apiMode = 'mock',
  onToggleApiMode,
  onNavigate
}: HeaderProps) {
  const [notificationCount] = useState(3);

  return (
    <header className="border-b bg-white px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium">ГрейнПей</h1>
          <Badge className={`${roleColors[currentRole]} border-0`}>
            {roleLabels[currentRole]}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Переключить роль
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(roleLabels) as UserRole[]).map(role => (
                <DropdownMenuItem 
                  key={role}
                  onClick={() => onRoleChange(role)}
                  className={currentRole === role ? 'bg-accent' : ''}
                >
                  <Badge className={`${roleColors[role]} border-0 mr-2`} variant="secondary">
                    {roleLabels[role]}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* API Mode Toggle */}
          {onToggleApiMode && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground hidden md:inline">Режим:</span>
              <button
                onClick={() => onToggleApiMode(apiMode === 'api')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  apiMode === 'mock' 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={apiMode === 'mock' ? 'Используются mock данные' : 'Используется реальное API'}
              >
                {apiMode === 'mock' ? 'MOCK' : 'API'}
              </button>
            </div>
          )}

          {/* Test API Button */}
            {onNavigate && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onNavigate('test-api')}
                  className="text-xs"
                >
                  🔗 Test API
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onNavigate('test-dictionary-api')}
                  className="text-xs"
                >
                  📚 Test Dictionary API
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onNavigate('integration-test')}
                  className="text-xs"
                >
                  🧪 Integration Test
                </Button>
              </>
            )}

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                {notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{userName}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuItem>
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}