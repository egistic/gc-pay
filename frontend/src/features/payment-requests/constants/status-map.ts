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
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
  DISTRIBUTED: 'distributed',
  SPLITED: 'splited',
  REPORT_PUBLISHED: 'report_published',
  EXPORT_LINKED: 'export_linked',
  // Add lowercase mappings for backend compatibility
  draft: 'draft',
  submitted: 'submitted',
  classified: 'classified',
  approved: 'approved',
  'approved-on-behalf': 'approved-on-behalf',
  'to-pay': 'to-pay',
  'in-register': 'in-register',
  'approved-for-payment': 'approved-for-payment',
  'paid-full': 'paid-full',
  'paid-partial': 'paid-partial',
  rejected: 'rejected',
  returned: 'returned',
  cancelled: 'cancelled',
  distributed: 'distributed',
  splited: 'splited',
  report_published: 'report_published',
  export_linked: 'export_linked',
} as const;

export type BackendStatus = keyof typeof STATUS_MAP;
export type FrontendStatus = typeof STATUS_MAP[BackendStatus];

/**
 * Convert backend status to frontend status
 */
export const toFrontendStatus = (backendStatus: string): FrontendStatus => {
  const mappedStatus = STATUS_MAP[backendStatus as BackendStatus];
  if (mappedStatus) {
    return mappedStatus;
  }
  
  // Fallback: return the status as-is if it's already in the correct format
  return backendStatus as FrontendStatus;
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
    'returned': 'Возвращено',
    'cancelled': 'Отменено',
    'distributed': 'Распределено',
    'report_published': 'Отчет опубликован',
    'export_linked': 'Экспорт связан',
  };
  
  return reviewerMap[status] || 'Неизвестно';
};
