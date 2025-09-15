import React, { memo } from 'react';
import { Badge } from '../ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

/**
 * Props for the RequestStatus component
 */
export interface RequestStatusProps {
  /** The status string to display */
  status: string;
  /** Whether to show the status icon */
  showIcon?: boolean;
  /** Whether to show the status badge */
  showBadge?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A reusable component for displaying payment request status with icon and badge
 * 
 * @example
 * ```tsx
 * <RequestStatus status="classified" />
 * <RequestStatus status="pending" showIcon={false} />
 * <RequestStatus status="returned" className="text-red-500" />
 * ```
 */
export const RequestStatus: React.FC<RequestStatusProps> = memo(({ 
  status, 
  showIcon = true, 
  showBadge = true, 
  className = '' 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'classified':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'distributed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'returned':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'classified':
        return <Badge className="bg-blue-100 text-blue-800">Классифицирована</Badge>;
      case 'distributed':
        return <Badge className="bg-green-100 text-green-800">Распределена</Badge>;
      case 'returned':
        return <Badge className="bg-red-100 text-red-800">Возвращена</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Одобрена</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">В ожидании</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && getStatusIcon(status)}
      {showBadge && getStatusBadge(status)}
    </div>
  );
});

RequestStatus.displayName = 'RequestStatus';

// Export individual functions for backward compatibility
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'classified':
      return <CheckCircle className="w-4 h-4 text-blue-600" />;
    case 'distributed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'returned':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'approved':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-600" />;
    default:
      return <Clock className="w-4 h-4 text-gray-600" />;
  }
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'classified':
      return <Badge className="bg-blue-100 text-blue-800">Классифицирована</Badge>;
    case 'distributed':
      return <Badge className="bg-green-100 text-green-800">Распределена</Badge>;
    case 'returned':
      return <Badge className="bg-red-100 text-red-800">Возвращена</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 text-green-800">Одобрена</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800">В ожидании</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
};
