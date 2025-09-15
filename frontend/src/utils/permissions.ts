import React from 'react';
import { UserRole } from '../types';

// Permission constants
export const PERMISSIONS = {
  // Dashboard permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  VIEW_WORKFLOW_DASHBOARD: 'view_workflow_dashboard',
  
  // Request permissions
  VIEW_REQUESTS: 'view_requests',
  CREATE_REQUESTS: 'create_requests',
  EDIT_REQUESTS: 'edit_requests',
  DELETE_REQUESTS: 'delete_requests',
  APPROVE_REQUESTS: 'approve_requests',
  CLASSIFY_REQUESTS: 'classify_requests',
  DISTRIBUTE_REQUESTS: 'distribute_requests',
  RETURN_REQUESTS: 'return_requests',
  
  // User management permissions
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_USER_ROLES: 'manage_user_roles',
  
  // Role management permissions
  VIEW_ROLES: 'view_roles',
  CREATE_ROLES: 'create_roles',
  EDIT_ROLES: 'edit_roles',
  DELETE_ROLES: 'delete_roles',
  MANAGE_ROLE_PERMISSIONS: 'manage_role_permissions',
  
  // Dictionary management permissions
  VIEW_DICTIONARIES: 'view_dictionaries',
  MANAGE_DICTIONARIES: 'manage_dictionaries',
  MANAGE_EXPENSE_ARTICLES: 'manage_expense_articles',
  MANAGE_COUNTERPARTIES: 'manage_counterparties',
  
  // Expense article assignment permissions
  VIEW_EXPENSE_ARTICLE_ASSIGNMENTS: 'view_expense_article_assignments',
  MANAGE_EXPENSE_ARTICLE_ASSIGNMENTS: 'manage_expense_article_assignments',
  
  // Register permissions
  VIEW_REGISTERS: 'view_registers',
  CREATE_REGISTERS: 'create_registers',
  MANAGE_REGISTERS: 'manage_registers',
  
  // System permissions
  VIEW_SYSTEM_STATISTICS: 'view_system_statistics',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Workflow permissions
  VIEW_SUB_REGISTRAR_ASSIGNMENTS: 'view_sub_registrar_assignments',
  MANAGE_SUB_REGISTRAR_ASSIGNMENTS: 'manage_sub_registrar_assignments',
  VIEW_DISTRIBUTOR_WORKFLOW: 'view_distributor_workflow',
  MANAGE_DISTRIBUTOR_ROUTING: 'manage_distributor_routing',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access to everything
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_WORKFLOW_DASHBOARD,
    PERMISSIONS.VIEW_REQUESTS,
    PERMISSIONS.CREATE_REQUESTS,
    PERMISSIONS.EDIT_REQUESTS,
    PERMISSIONS.DELETE_REQUESTS,
    PERMISSIONS.APPROVE_REQUESTS,
    PERMISSIONS.CLASSIFY_REQUESTS,
    PERMISSIONS.DISTRIBUTE_REQUESTS,
    PERMISSIONS.RETURN_REQUESTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.MANAGE_USER_ROLES,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.CREATE_ROLES,
    PERMISSIONS.EDIT_ROLES,
    PERMISSIONS.DELETE_ROLES,
    PERMISSIONS.MANAGE_ROLE_PERMISSIONS,
    PERMISSIONS.VIEW_DICTIONARIES,
    PERMISSIONS.MANAGE_DICTIONARIES,
    PERMISSIONS.MANAGE_EXPENSE_ARTICLES,
    PERMISSIONS.MANAGE_COUNTERPARTIES,
    PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS,
    PERMISSIONS.MANAGE_EXPENSE_ARTICLE_ASSIGNMENTS,
    PERMISSIONS.VIEW_REGISTERS,
    PERMISSIONS.CREATE_REGISTERS,
    PERMISSIONS.MANAGE_REGISTERS,
    PERMISSIONS.VIEW_SYSTEM_STATISTICS,
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_SUB_REGISTRAR_ASSIGNMENTS,
    PERMISSIONS.MANAGE_SUB_REGISTRAR_ASSIGNMENTS,
    PERMISSIONS.VIEW_DISTRIBUTOR_WORKFLOW,
    PERMISSIONS.MANAGE_DISTRIBUTOR_ROUTING,
  ],
  
  EXECUTOR: [
    // Can create and view their own requests
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REQUESTS,
    PERMISSIONS.CREATE_REQUESTS,
    PERMISSIONS.EDIT_REQUESTS,
    PERMISSIONS.DELETE_REQUESTS,
    PERMISSIONS.VIEW_DICTIONARIES,
    PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS,
  ],
  
  REGISTRAR: [
    // Can classify and distribute requests
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_WORKFLOW_DASHBOARD,
    PERMISSIONS.VIEW_REQUESTS,
    PERMISSIONS.CLASSIFY_REQUESTS,
    PERMISSIONS.DISTRIBUTE_REQUESTS,
    PERMISSIONS.RETURN_REQUESTS,
    PERMISSIONS.VIEW_DICTIONARIES,
    PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS,
    PERMISSIONS.VIEW_SUB_REGISTRAR_ASSIGNMENTS,
    PERMISSIONS.MANAGE_SUB_REGISTRAR_ASSIGNMENTS,
  ],
  
  SUB_REGISTRAR: [
    // Can view assigned requests and create reports
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_WORKFLOW_DASHBOARD,
    PERMISSIONS.VIEW_REQUESTS,
    PERMISSIONS.CREATE_REQUESTS,
    PERMISSIONS.VIEW_DICTIONARIES,
    PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS,
    PERMISSIONS.VIEW_SUB_REGISTRAR_ASSIGNMENTS,
    PERMISSIONS.MANAGE_SUB_REGISTRAR_ASSIGNMENTS,
  ],
  
  DISTRIBUTOR: [
    // Can approve and manage distribution
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_WORKFLOW_DASHBOARD,
    PERMISSIONS.VIEW_REQUESTS,
    PERMISSIONS.APPROVE_REQUESTS,
    PERMISSIONS.DISTRIBUTE_REQUESTS,
    PERMISSIONS.VIEW_DICTIONARIES,
    PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS,
    PERMISSIONS.VIEW_DISTRIBUTOR_WORKFLOW,
    PERMISSIONS.MANAGE_DISTRIBUTOR_ROUTING,
  ],
  
  TREASURER: [
    // Can manage payment registers and final approvals
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REQUESTS,
    PERMISSIONS.APPROVE_REQUESTS,
    PERMISSIONS.VIEW_REGISTERS,
    PERMISSIONS.CREATE_REGISTERS,
    PERMISSIONS.MANAGE_REGISTERS,
    PERMISSIONS.VIEW_DICTIONARIES,
    PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS,
  ],
};

// Permission checking functions
export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Route access control
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  'dashboard': [PERMISSIONS.VIEW_DASHBOARD],
  'admin': [PERMISSIONS.VIEW_ADMIN_DASHBOARD],
  'requests': [PERMISSIONS.VIEW_REQUESTS],
  'user-management': [PERMISSIONS.VIEW_USERS],
  'role-management': [PERMISSIONS.VIEW_ROLES],
  'dictionaries': [PERMISSIONS.VIEW_DICTIONARIES],
  'expense-article-assignment': [PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS],
  'registers': [PERMISSIONS.VIEW_REGISTERS],
  'system-statistics': [PERMISSIONS.VIEW_SYSTEM_STATISTICS],
  'sub-registrar-assignments': [PERMISSIONS.VIEW_SUB_REGISTRAR_ASSIGNMENTS],
  'distributor-workflow': [PERMISSIONS.VIEW_DISTRIBUTOR_WORKFLOW],
  'distributor-routing': [PERMISSIONS.MANAGE_DISTRIBUTOR_ROUTING],
};

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  const requiredPermissions = ROUTE_PERMISSIONS[route] || [];
  
  if (requiredPermissions.length === 0) {
    return true; // No specific permissions required
  }
  
  return hasAnyPermission(userRole, requiredPermissions);
};

// UI component permissions
export const UI_PERMISSIONS = {
  // Navigation items
  SHOW_ADMIN_MENU: [PERMISSIONS.VIEW_ADMIN_DASHBOARD],
  SHOW_USER_MANAGEMENT: [PERMISSIONS.VIEW_USERS],
  SHOW_ROLE_MANAGEMENT: [PERMISSIONS.VIEW_ROLES],
  SHOW_DICTIONARIES: [PERMISSIONS.VIEW_DICTIONARIES],
  SHOW_EXPENSE_ARTICLE_ASSIGNMENTS: [PERMISSIONS.VIEW_EXPENSE_ARTICLE_ASSIGNMENTS],
  SHOW_REGISTERS: [PERMISSIONS.VIEW_REGISTERS],
  SHOW_SYSTEM_STATISTICS: [PERMISSIONS.VIEW_SYSTEM_STATISTICS],
  
  // Action buttons
  SHOW_CREATE_REQUEST_BUTTON: [PERMISSIONS.CREATE_REQUESTS],
  SHOW_EDIT_REQUEST_BUTTON: [PERMISSIONS.EDIT_REQUESTS],
  SHOW_DELETE_REQUEST_BUTTON: [PERMISSIONS.DELETE_REQUESTS],
  SHOW_APPROVE_REQUEST_BUTTON: [PERMISSIONS.APPROVE_REQUESTS],
  SHOW_CLASSIFY_REQUEST_BUTTON: [PERMISSIONS.CLASSIFY_REQUESTS],
  SHOW_DISTRIBUTE_REQUEST_BUTTON: [PERMISSIONS.DISTRIBUTE_REQUESTS],
  SHOW_RETURN_REQUEST_BUTTON: [PERMISSIONS.RETURN_REQUESTS],
  
  // Admin actions
  SHOW_CREATE_USER_BUTTON: [PERMISSIONS.CREATE_USERS],
  SHOW_EDIT_USER_BUTTON: [PERMISSIONS.EDIT_USERS],
  SHOW_DELETE_USER_BUTTON: [PERMISSIONS.DELETE_USERS],
  SHOW_MANAGE_USER_ROLES_BUTTON: [PERMISSIONS.MANAGE_USER_ROLES],
  SHOW_CREATE_ROLE_BUTTON: [PERMISSIONS.CREATE_ROLES],
  SHOW_EDIT_ROLE_BUTTON: [PERMISSIONS.EDIT_ROLES],
  SHOW_DELETE_ROLE_BUTTON: [PERMISSIONS.DELETE_ROLES],
  SHOW_MANAGE_ROLE_PERMISSIONS_BUTTON: [PERMISSIONS.MANAGE_ROLE_PERMISSIONS],
  
  // Dictionary actions
  SHOW_MANAGE_DICTIONARIES_BUTTON: [PERMISSIONS.MANAGE_DICTIONARIES],
  SHOW_MANAGE_EXPENSE_ARTICLES_BUTTON: [PERMISSIONS.MANAGE_EXPENSE_ARTICLES],
  SHOW_MANAGE_COUNTERPARTIES_BUTTON: [PERMISSIONS.MANAGE_COUNTERPARTIES],
  
  // Expense article assignment actions
  SHOW_MANAGE_EXPENSE_ARTICLE_ASSIGNMENTS_BUTTON: [PERMISSIONS.MANAGE_EXPENSE_ARTICLE_ASSIGNMENTS],
  
  // Register actions
  SHOW_CREATE_REGISTER_BUTTON: [PERMISSIONS.CREATE_REGISTERS],
  SHOW_MANAGE_REGISTERS_BUTTON: [PERMISSIONS.MANAGE_REGISTERS],
} as const;

export const canShowUIElement = (userRole: UserRole, uiElement: keyof typeof UI_PERMISSIONS): boolean => {
  const requiredPermissions = UI_PERMISSIONS[uiElement];
  return hasAnyPermission(userRole, requiredPermissions);
};

// Permission-based component wrapper
export interface PermissionGateProps {
  permission: Permission;
  userRole: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  userRole,
  children,
  fallback = null
}) => {
  return hasPermission(userRole, permission) ? children : fallback;
};

// Hook for permission checking
export const usePermissions = (userRole: UserRole) => {
  return {
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    canAccessRoute: (route: string) => canAccessRoute(userRole, route),
    canShowUIElement: (uiElement: keyof typeof UI_PERMISSIONS) => canShowUIElement(userRole, uiElement),
  };
};
