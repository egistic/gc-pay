import { 
  PaymentRequestStatus, 
  DistributionStatus, 
  DocumentStatus, 
  ReportStatus 
} from '../types';

export class WorkflowStateService {
  /**
   * Get the next valid statuses for a given current status
   */
  static getNextValidStatuses(currentStatus: PaymentRequestStatus): PaymentRequestStatus[] {
    const statusTransitions: Record<PaymentRequestStatus, PaymentRequestStatus[]> = {
      'draft': ['submitted'],
      'submitted': ['classified', 'returned'],
      'classified': ['allocated', 'returned'],
      'allocated': ['approved', 'returned'],
      'returned': ['submitted', 'draft'],
      'approved': ['approved-on-behalf', 'to-pay', 'distributed'],
      'approved-on-behalf': ['to-pay', 'distributed'],
      'to-pay': ['in-register', 'distributed'],
      'in-register': ['approved-for-payment', 'distributed'],
      'approved-for-payment': ['paid-full', 'paid-partial', 'distributed'],
      'distributed': ['report_published'],
      'report_published': ['export_linked'],
      'export_linked': ['paid-full', 'paid-partial'],
      'paid-full': [],
      'paid-partial': ['paid-full'],
      'declined': ['draft'],
      'rejected': ['draft'],
      'cancelled': []
    };

    return statusTransitions[currentStatus] || [];
  }

  /**
   * Check if a status transition is valid
   */
  static isValidTransition(fromStatus: PaymentRequestStatus, toStatus: PaymentRequestStatus): boolean {
    const validTransitions = this.getNextValidStatuses(fromStatus);
    return validTransitions.includes(toStatus);
  }

  /**
   * Get workflow stage based on status
   */
  static getWorkflowStage(status: PaymentRequestStatus): string {
    const stageMap: Record<PaymentRequestStatus, string> = {
      'draft': 'Создание',
      'submitted': 'Подача',
      'classified': 'Классификация',
      'allocated': 'Распределение',
      'returned': 'Возврат',
      'approved': 'Одобрение',
      'approved-on-behalf': 'Одобрение от имени',
      'to-pay': 'К оплате',
      'in-register': 'В реестре',
      'approved-for-payment': 'Одобрено к оплате',
      'distributed': 'Распределено',
      'report_published': 'Отчёт опубликован',
      'export_linked': 'Контракт привязан',
      'paid-full': 'Оплачено полностью',
      'paid-partial': 'Оплачено частично',
      'declined': 'Отклонено',
      'rejected': 'Отклонено',
      'cancelled': 'Отменено'
    };

    return stageMap[status] || 'Неизвестно';
  }

  /**
   * Get the role responsible for the current status
   */
  static getResponsibleRole(status: PaymentRequestStatus): string[] {
    const roleMap: Record<PaymentRequestStatus, string[]> = {
      'draft': ['executor'],
      'submitted': ['executor'],
      'classified': ['registrar'],
      'allocated': ['registrar'],
      'returned': ['registrar', 'distributor', 'treasurer'],
      'approved': ['distributor'],
      'approved-on-behalf': ['distributor'],
      'to-pay': ['distributor'],
      'in-register': ['registrar'],
      'approved-for-payment': ['treasurer'],
      'distributed': ['registrar'],
      'report_published': ['sub_registrar'],
      'export_linked': ['distributor'],
      'paid-full': ['treasurer'],
      'paid-partial': ['treasurer'],
      'declined': ['distributor', 'treasurer'],
      'rejected': ['distributor', 'treasurer'],
      'cancelled': ['executor', 'registrar', 'distributor', 'treasurer']
    };

    return roleMap[status] || [];
  }

  /**
   * Get distribution status from payment request status
   */
  static getDistributionStatus(paymentStatus: PaymentRequestStatus): DistributionStatus {
    const distributionMap: Record<PaymentRequestStatus, DistributionStatus> = {
      'draft': 'pending',
      'submitted': 'pending',
      'classified': 'pending',
      'allocated': 'pending',
      'returned': 'pending',
      'approved': 'pending',
      'approved-on-behalf': 'pending',
      'to-pay': 'pending',
      'in-register': 'pending',
      'approved-for-payment': 'pending',
      'distributed': 'distributed',
      'report_published': 'report_published',
      'export_linked': 'export_linked',
      'paid-full': 'export_linked',
      'paid-partial': 'export_linked',
      'declined': 'pending',
      'rejected': 'pending',
      'cancelled': 'pending'
    };

    return distributionMap[paymentStatus] || 'pending';
  }

  /**
   * Get status color for UI display
   */
  static getStatusColor(status: PaymentRequestStatus): string {
    const colorMap: Record<PaymentRequestStatus, string> = {
      'draft': 'gray',
      'submitted': 'blue',
      'classified': 'yellow',
      'allocated': 'yellow',
      'returned': 'red',
      'approved': 'green',
      'approved-on-behalf': 'green',
      'to-pay': 'blue',
      'in-register': 'blue',
      'approved-for-payment': 'green',
      'distributed': 'purple',
      'report_published': 'orange',
      'export_linked': 'green',
      'paid-full': 'green',
      'paid-partial': 'yellow',
      'declined': 'red',
      'rejected': 'red',
      'cancelled': 'gray'
    };

    return colorMap[status] || 'gray';
  }

  /**
   * Get document status priority for sorting
   */
  static getDocumentStatusPriority(status: DocumentStatus): number {
    const priorityMap: Record<DocumentStatus, number> = {
      'Не получены': 1,
      'Частично получены': 2,
      'Получены в полном объёме': 3
    };

    return priorityMap[status] || 0;
  }

  /**
   * Get report status priority for sorting
   */
  static getReportStatusPriority(status: ReportStatus): number {
    const priorityMap: Record<ReportStatus, number> = {
      'draft': 1,
      'published': 2
    };

    return priorityMap[status] || 0;
  }

  /**
   * Check if a request can be distributed
   */
  static canDistribute(status: PaymentRequestStatus): boolean {
    return ['approved', 'approved-on-behalf', 'to-pay', 'in-register', 'approved-for-payment'].includes(status);
  }

  /**
   * Check if a request can have report published
   */
  static canPublishReport(status: PaymentRequestStatus): boolean {
    return status === 'distributed';
  }

  /**
   * Check if a request can be linked to export contract
   */
  static canLinkExportContract(status: PaymentRequestStatus): boolean {
    return ['report_published', 'export_linked'].includes(status);
  }
}
