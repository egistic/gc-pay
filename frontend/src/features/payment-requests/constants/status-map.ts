/**
 * Status mapping between frontend and backend
 * Provides bidirectional conversion for payment request statuses
 */

export const STATUS_MAP = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REGISTERED: 'classified',
  APPROVED: 'approved',
  APPROVED_ON_BEHALF: 'approved-on-behalf',
  TO_PAY: 'to-pay',
  IN_REGISTRY: 'in-register',
  APPROVED_FOR_PAYMENT: 'approved-for-payment',
  PAID_FULL: 'paid-full',
  PAID_PARTIAL: 'paid-partial',
  REJECTED: 'rejected',
  DECLINED: 'declined',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
} as const;

export type BackendStatus = keyof typeof STATUS_MAP;
export type FrontendStatus = typeof STATUS_MAP[BackendStatus];

/**
 * Convert backend status to frontend status
 */
export const toFrontendStatus = (backendStatus: string): FrontendStatus => {
  const mappedStatus = STATUS_MAP[backendStatus as BackendStatus];
  return mappedStatus || backendStatus.toLowerCase() as FrontendStatus;
};

/**
 * Convert frontend status to backend status
 */
export const toBackendStatus = (frontendStatus: FrontendStatus): BackendStatus | null => {
  const entry = Object.entries(STATUS_MAP).find(([_, value]) => value === frontendStatus);
  return entry ? (entry[0] as BackendStatus) : null;
};

/**
 * Get reviewer name based on status
 */
export const getReviewerByStatus = (status: FrontendStatus): string => {
  const reviewerMap: Record<FrontendStatus, string> = {
    'draft': 'Черновик',
    'submitted': 'На рассмотрении',
    'classified': 'Классифицировано',
    'approved': 'Одобрено',
    'approved-on-behalf': 'Одобрено от имени',
    'to-pay': 'К оплате',
    'in-register': 'В реестре',
    'approved-for-payment': 'Одобрено к оплате',
    'paid-full': 'Оплачено полностью',
    'paid-partial': 'Оплачено частично',
    'rejected': 'Отклонено',
    'declined': 'Отклонено',
    'returned': 'Возвращено',
    'cancelled': 'Отменено',
  };
  
  return reviewerMap[status] || 'Неизвестно';
};
