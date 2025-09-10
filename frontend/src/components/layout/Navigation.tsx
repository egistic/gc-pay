import { useState, useEffect } from 'react';
import { UserRole } from '../../types';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { toast } from 'sonner@2.0.3';
import { useRoleStatistics } from '../../hooks/useStatistics';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  BookOpen, 
  Settings,
  Clock,
  CheckCircle,
  FolderX,
  AlertTriangle,
  Users
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  currentRole: UserRole;
  isCreatingRequest?: boolean;
  paymentRequests?: any[];
  onFilterChange?: (filter: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: string;
}

export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard', 
    icon: <LayoutDashboard className="h-4 w-4" />,
    roles: ['executor', 'registrar', 'distributor', 'treasurer', 'admin']
  },
  {
    id: 'requests',
    label: 'Заявки',
    icon: <FileText className="h-4 w-4" />,
    roles: ['executor', 'registrar', 'distributor', 'treasurer'],
    badge: '5'
  },
  {
    id: 'registers', 
    label: 'Реестры',
    icon: <Database className="h-4 w-4" />,
    roles: ['treasurer']
  },
  {
    id: 'unallocated',
    label: 'Реестр нераспределенных расходов',
    icon: <FolderX className="h-4 w-4" />,
    roles: ['distributor']
  },
  // Административные функции - только для админа
  {
    id: 'dictionaries',
    label: 'Справочники',
    icon: <BookOpen className="h-4 w-4" />,
    roles: ['admin']
  },
  {
    id: 'registrar-assignments',
    label: 'Назначения регистраторов',
    icon: <Users className="h-4 w-4" />,
    roles: ['admin']
  },
  {
    id: 'distributor-routing',
    label: 'Маршрутизация распорядителей',
    icon: <Users className="h-4 w-4" />,
    roles: ['admin']
  },
  {
    id: 'admin',
    label: 'Админка',
    icon: <Settings className="h-4 w-4" />,
    roles: ['admin']
  }
];

export function Navigation({ currentPage, onPageChange, currentRole, isCreatingRequest = false, paymentRequests = [], onFilterChange }: NavigationProps) {
  // Use the new statistics hook with caching and auto-refresh
  const { statistics, loading, error, refresh } = useRoleStatistics(currentRole, '3394830b-1b62-4db4-a6e4-fdf76b5033f5', {
    enableCache: true,
    autoRefresh: true,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  // Debug logging (temporarily disabled)
  // console.log('Navigation: Statistics data:', statistics);
  // console.log('Navigation: Loading:', loading);
  // console.log('Navigation: Error:', error);

  const allowedItems = navItems.filter(item => 
    item.roles.includes(currentRole)
  ).map(item => {
    // Add dynamic badges based on statistics
    let badge = item.badge;
    
    if (item.id === 'requests' && statistics) {
      if (currentRole === 'executor') {
        badge = (statistics.draftCount + statistics.submittedCount + statistics.classifiedCount + statistics.approvedCount + statistics.inRegistryCount).toString();
      } else if (currentRole === 'registrar') {
        badge = (statistics.submittedCount + statistics.classifiedCount).toString();
      } else if (currentRole === 'distributor') {
        badge = statistics.approvedCount.toString();
      } else if (currentRole === 'treasurer') {
        badge = statistics.inRegistryCount.toString();
      }
    }
    
    if (item.id === 'registers' && statistics) {
      badge = statistics.inRegistryCount.toString();
    }
    
    return { ...item, badge };
  });

  // Calculate real-time statistics based on role
  const getRoleStats = () => {
    if (loading || !statistics) {
      // Return default values while loading
      return {
        draft: 0,
        underReview: 0,
        returnedForRevision: 0,
        paid: 0,
        declined: 0,
        inWork: 0,
        registered: 0,
        overdue: 0
      };
    }
    
    // Debug logging (temporarily disabled)
    // console.log('Navigation getRoleStats: statistics:', statistics);
    // console.log('Navigation getRoleStats: currentRole:', currentRole);
    
    if (currentRole === 'executor') {
      return {
        draft: statistics.draftCount || 0,
        underReview: (statistics.submittedCount || 0) + (statistics.classifiedCount || 0) + (statistics.approvedCount || 0) + (statistics.inRegistryCount || 0),
        returnedForRevision: statistics.rejectedCount || 0,
        paid: 0, // Not tracked in current API
        declined: statistics.rejectedCount || 0
      };
    }

    if (currentRole === 'registrar') {
      return {
        inWork: statistics.submittedCount || 0,
        registered: statistics.classifiedCount || 0,
        overdue: statistics.overdue || 0,
        returnedForRevision: statistics.rejectedCount || 0,
        declined: statistics.rejectedCount || 0
      };
    }

    if (currentRole === 'distributor') {
      return {
        pendingApproval: statistics.approvedCount || 0,
        approved: statistics.approvedCount || 0,
        rejected: statistics.rejectedCount || 0
      };
    }

    if (currentRole === 'treasurer') {
      return {
        inRegistry: statistics.inRegistryCount || 0,
        totalAmount: (statistics.totalRequests || 0) * 1000, // Mock calculation
        overdue: statistics.overdue || 0
      };
    }

    // Default for other roles
    return {};
  };

  const roleStats = getRoleStats();

  const handlePageChange = (page: string) => {
    if (isCreatingRequest) {
      toast.warning('Завершите создание заявки или сохраните черновик перед переходом', {
        duration: 4000
      });
      return;
    }
    onPageChange(page);
  };

  const handleDraftsClick = () => {
    if (isCreatingRequest) {
      toast.warning('Завершите создание заявки или сохраните черновик перед переходом', {
        duration: 4000
      });
      return;
    }
    if (onFilterChange) {
      onFilterChange('drafts');
    }
    onPageChange('requests');
  };

  const handleRegistrarStatClick = (filter: string) => {
    if (isCreatingRequest) {
      toast.warning('Завершите создание заявки или сохраните черновик перед переходом', {
        duration: 4000
      });
      return;
    }
    if (onFilterChange) {
      onFilterChange(filter);
    }
    onPageChange('requests');
  };

  return (
    <nav className="w-full md:w-64 border-r bg-white p-4 overflow-y-auto">
      <div className="space-y-2">
        {allowedItems.map(item => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              item.id === 'unallocated' ? "h-auto py-2 min-h-[2.5rem]" : "h-10",
              currentPage === item.id && "bg-accent",
              isCreatingRequest && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handlePageChange(item.id)}
            disabled={isCreatingRequest}
          >
            {item.icon}
            <span className={item.id === 'unallocated' ? 'whitespace-normal break-words' : ''}>{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {item.badge}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Quick stats for current role */}
      <div className={cn("mt-8 p-3 bg-muted rounded-lg", isCreatingRequest && "opacity-50")}>
        <h4 className="font-medium mb-2">Быстрая статистика</h4>
        <div className="space-y-2 text-sm">
          {currentRole === 'executor' && (
            <>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                onClick={handleDraftsClick}
              >
                <Clock className="h-3 w-3 text-gray-500" />
                <span>{(roleStats as any).draft || 0} черновик</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>{(roleStats as any).underReview || 0} на рассмотрении</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span>{(roleStats as any).returnedForRevision || 0} возвращен на доработку</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{(roleStats as any).paid || 0} оплачен</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span>{(roleStats as any).declined || 0} отклонен</span>
              </div>
            </>
          )}
          {currentRole === 'registrar' && (
            <>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                onClick={() => handleRegistrarStatClick('newRequests')}
              >
                <Clock className="h-3 w-3 text-orange-500" />
                <span>{(roleStats as any).inWork || 0} в работе</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{(roleStats as any).registered || 0} зарегистрировано</span>
              </div>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                onClick={() => handleRegistrarStatClick('overdue')}
              >
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span>{(roleStats as any).overdue || 0} просрочено</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span>{(roleStats as any).returnedForRevision || 0} возвращено на доработку</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderX className="h-3 w-3 text-red-600" />
                <span>{(roleStats as any).declined || 0} отклонено</span>
              </div>
            </>
          )}
          {currentRole === 'distributor' && (
            <>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>1 в работе</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span>0 отправлен на доработку</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-blue-500" />
                <span>15 утвержден на оплату</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>25 оплачен</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderX className="h-3 w-3 text-red-600" />
                <span>0 отклонен</span>
              </div>
            </>
          )}
          {currentRole === 'treasurer' && (
            <>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>2 в работе</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span>1 отправлен на доработку</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-blue-500" />
                <span>5 включен в реестр на оплату</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>25 оплачен</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span>0 отклонен</span>
              </div>
            </>
          )}
          {currentRole === 'admin' && (
            <>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-blue-500" />
                <span>4 активных пользователя</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-green-500" />
                <span>12 справочников</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-3 w-3 text-gray-500" />
                <span>3 маршрута настроено</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Система работает</span>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}