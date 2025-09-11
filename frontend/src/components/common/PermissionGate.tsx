import React from 'react';
import { UserRole } from '../../types';
import { Permission, canShowUIElement, usePermissions } from '../../utils/permissions';

interface PermissionGateProps {
  userRole: UserRole;
  permission?: Permission;
  uiElement?: keyof typeof import('../../utils/permissions').UI_PERMISSIONS;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
  permissions?: Permission[];
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  userRole,
  permission,
  uiElement,
  children,
  fallback = null,
  requireAll = false,
  permissions = []
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canShowUIElement } = usePermissions(userRole);
  
  let hasAccess = false;
  
  if (uiElement) {
    hasAccess = canShowUIElement(uiElement);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    hasAccess = true; // No restrictions
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Specialized components for common use cases
interface ButtonPermissionGateProps extends PermissionGateProps {
  disabled?: boolean;
  className?: string;
}

export const ButtonPermissionGate: React.FC<ButtonPermissionGateProps> = ({
  userRole,
  permission,
  uiElement,
  children,
  fallback = null,
  disabled = false,
  className = '',
  requireAll = false,
  permissions = []
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canShowUIElement } = usePermissions(userRole);
  
  let hasAccess = false;
  
  if (uiElement) {
    hasAccess = canShowUIElement(uiElement);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    hasAccess = true; // No restrictions
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={className} style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {children}
    </div>
  );
};

// Component for hiding/showing entire sections
interface SectionPermissionGateProps extends PermissionGateProps {
  className?: string;
}

export const SectionPermissionGate: React.FC<SectionPermissionGateProps> = ({
  userRole,
  permission,
  uiElement,
  children,
  fallback = null,
  className = '',
  requireAll = false,
  permissions = []
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canShowUIElement } = usePermissions(userRole);
  
  let hasAccess = false;
  
  if (uiElement) {
    hasAccess = canShowUIElement(uiElement);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    hasAccess = true; // No restrictions
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <div className={className}>{children}</div>;
};

// Hook for conditional rendering in custom components
export const usePermissionGate = (userRole: UserRole) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canShowUIElement } = usePermissions(userRole);
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canShowUIElement,
    renderIf: (condition: boolean, children: React.ReactNode, fallback: React.ReactNode = null) => 
      condition ? children : fallback,
    renderIfPermission: (permission: Permission, children: React.ReactNode, fallback: React.ReactNode = null) =>
      hasPermission(permission) ? children : fallback,
    renderIfUIElement: (uiElement: keyof typeof import('../../utils/permissions').UI_PERMISSIONS, children: React.ReactNode, fallback: React.ReactNode = null) =>
      canShowUIElement(uiElement) ? children : fallback,
  };
};
