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
  onLogout?: () => void;
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
  onLogout
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
              <DropdownMenuItem onClick={onLogout}>
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}