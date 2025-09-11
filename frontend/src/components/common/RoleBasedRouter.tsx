import React from 'react';
import { UserRole } from '../../types';
import { canAccessRoute, usePermissions } from '../../utils/permissions';

interface RoleBasedRouterProps {
  userRole: UserRole;
  currentPage: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedRouter: React.FC<RoleBasedRouterProps> = ({
  userRole,
  currentPage,
  children,
  fallback = (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-semibold mb-4">Доступ запрещен</h2>
      <p className="text-muted-foreground mb-4">
        У вас нет прав для доступа к этой странице
      </p>
      <p className="text-sm text-muted-foreground">
        Обратитесь к администратору для получения необходимых прав доступа
      </p>
    </div>
  )
}) => {
  const { canAccessRoute } = usePermissions(userRole);
  
  if (!canAccessRoute(currentPage)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Higher-order component for role-based route protection
export const withRoleProtection = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string[] = []
) => {
  return (props: P & { userRole: UserRole; currentPage: string }) => {
    const { userRole, currentPage, ...componentProps } = props;
    
    return (
      <RoleBasedRouter userRole={userRole} currentPage={currentPage}>
        <Component {...(componentProps as P)} />
      </RoleBasedRouter>
    );
  };
};

// Hook for checking if user can access a specific page
export const useRouteAccess = (userRole: UserRole, page: string) => {
  const { canAccessRoute } = usePermissions(userRole);
  return canAccessRoute(page);
};

// Component for conditional rendering based on permissions
interface ConditionalRenderProps {
  userRole: UserRole;
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  userRole,
  permission,
  children,
  fallback = null
}) => {
  const { canAccessRoute } = usePermissions(userRole);
  
  if (!canAccessRoute(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
