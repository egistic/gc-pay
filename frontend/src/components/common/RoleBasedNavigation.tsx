import React from 'react';
import { UserRole } from '../../types';
import { PermissionGate, usePermissionGate } from './PermissionGate';
import { UI_PERMISSIONS } from '../../utils/permissions';

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
  uiElement: keyof typeof UI_PERMISSIONS;
  children?: NavigationItem[];
}

interface RoleBasedNavigationProps {
  userRole: UserRole;
  currentPage: string;
  onNavigate: (page: string) => void;
  className?: string;
}

// Define navigation structure
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Дашборд',
    path: 'dashboard',
    uiElement: 'SHOW_ADMIN_MENU', // This will be overridden for different roles
  },
  {
    id: 'requests',
    label: 'Заявки',
    path: 'requests',
    uiElement: 'SHOW_ADMIN_MENU', // This will be overridden for different roles
  },
  {
    id: 'admin',
    label: 'Администрирование',
    path: 'admin',
    uiElement: 'SHOW_ADMIN_MENU',
    children: [
      {
        id: 'user-management',
        label: 'Управление пользователями',
        path: 'user-management',
        uiElement: 'SHOW_USER_MANAGEMENT',
      },
      {
        id: 'role-management',
        label: 'Управление ролями',
        path: 'role-management',
        uiElement: 'SHOW_ROLE_MANAGEMENT',
      },
      {
        id: 'dictionaries',
        label: 'Справочники',
        path: 'dictionaries',
        uiElement: 'SHOW_DICTIONARIES',
      },
      {
        id: 'expense-article-assignment',
        label: 'Назначения статей расходов',
        path: 'expense-article-assignment',
        uiElement: 'SHOW_EXPENSE_ARTICLE_ASSIGNMENTS',
      },
      {
        id: 'system-statistics',
        label: 'Статистика системы',
        path: 'system-statistics',
        uiElement: 'SHOW_SYSTEM_STATISTICS',
      },
    ],
  },
  {
    id: 'workflow',
    label: 'Рабочие процессы',
    path: 'workflow',
    uiElement: 'SHOW_ADMIN_MENU', // This will be overridden for different roles
    children: [
      {
        id: 'sub-registrar-assignments',
        label: 'Назначения суб-регистраторов',
        path: 'sub-registrar-assignments',
        uiElement: 'SHOW_SUB_REGISTRAR_ASSIGNMENTS',
      },
      {
        id: 'distributor-workflow',
        label: 'Рабочий процесс распорядителя',
        path: 'distributor-workflow',
        uiElement: 'SHOW_DISTRIBUTOR_WORKFLOW',
      },
      {
        id: 'distributor-routing',
        label: 'Маршрутизация распорядителей',
        path: 'distributor-routing',
        uiElement: 'SHOW_DISTRIBUTOR_WORKFLOW',
      },
    ],
  },
  {
    id: 'registers',
    label: 'Реестры',
    path: 'registers',
    uiElement: 'SHOW_REGISTERS',
  },
];

// Role-specific navigation overrides
const ROLE_NAVIGATION_OVERRIDES: Record<UserRole, Partial<NavigationItem>[]> = {
  ADMIN: [],
  EXECUTOR: [
    {
      id: 'dashboard',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
    {
      id: 'requests',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
  ],
  REGISTRAR: [
    {
      id: 'dashboard',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
    {
      id: 'requests',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
  ],
  SUB_REGISTRAR: [
    {
      id: 'dashboard',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
    {
      id: 'requests',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
  ],
  DISTRIBUTOR: [
    {
      id: 'dashboard',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
    {
      id: 'requests',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
  ],
  TREASURER: [
    {
      id: 'dashboard',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
    {
      id: 'requests',
      uiElement: 'SHOW_ADMIN_MENU', // Will be overridden by permission check
    },
  ],
};

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  userRole,
  currentPage,
  onNavigate,
  className = ''
}) => {
  const { canShowUIElement } = usePermissionGate(userRole);

  // Filter navigation items based on permissions
  const getFilteredNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .map(item => {
        // Check if this item should be shown
        if (!canShowUIElement(item.uiElement)) {
          return null;
        }

        // Filter children if they exist
        const filteredChildren = item.children 
          ? getFilteredNavigationItems(item.children)
          : undefined;

        // Only include item if it has children or if it's a leaf node
        if (filteredChildren && filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        } else if (!item.children) {
          return item;
        }

        return null;
      })
      .filter((item): item is NavigationItem => item !== null);
  };

  const filteredItems = getFilteredNavigationItems(NAVIGATION_ITEMS);

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = currentPage === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const indentClass = level > 0 ? `ml-${level * 4}` : '';

    return (
      <div key={item.id} className={`${indentClass}`}>
        <button
          onClick={() => onNavigate(item.path)}
          className={`
            w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${isActive 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }
          `}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
        </button>
        
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={`space-y-1 ${className}`}>
      {filteredItems.map(item => renderNavigationItem(item))}
    </nav>
  );
};

// Hook for getting navigation items based on role
export const useRoleBasedNavigation = (userRole: UserRole) => {
  const { canShowUIElement } = usePermissionGate(userRole);

  const getAvailablePages = (): string[] => {
    const pages: string[] = [];
    
    const collectPages = (items: NavigationItem[]) => {
      items.forEach(item => {
        if (canShowUIElement(item.uiElement)) {
          pages.push(item.path);
          if (item.children) {
            collectPages(item.children);
          }
        }
      });
    };

    collectPages(NAVIGATION_ITEMS);
    return pages;
  };

  const canAccessPage = (page: string): boolean => {
    return getAvailablePages().includes(page);
  };

  return {
    getAvailablePages,
    canAccessPage,
    navigationItems: NAVIGATION_ITEMS,
  };
};
