import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requireAll = false,
  fallback = <AccessDenied />
}) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AccessDenied message="Необходима авторизация" />;
  }

  if (requiredRoles.length > 0) {
    const hasAccess = requireAll 
      ? requiredRoles.every(role => hasRole(role))
      : hasAnyRole(requiredRoles);

    if (!hasAccess) {
      return fallback;
    }
  }

  return <>{children}</>;
};

const AccessDenied: React.FC<{ message?: string }> = ({ 
  message = "Доступ запрещен" 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{message}</h1>
        <p className="text-gray-600 mb-4">
          У вас нет прав для доступа к этой странице
        </p>
        <p className="text-sm text-gray-500">
          Обратитесь к администратору для получения необходимых прав доступа
        </p>
      </div>
    </div>
  );
};
