import { PaymentRequestStatus, DistributionStatus } from '../types';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  role: string;
  timestamp?: Date;
  description?: string;
}

export interface WorkflowProgress {
  requestId: string;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  steps: WorkflowStep[];
  isComplete: boolean;
  canProceed: boolean;
  nextRole?: string;
}

export class WorkflowProgressService {
  /**
   * Get workflow progress for a request
   */
  static getWorkflowProgress(
    requestId: string, 
    currentStatus: PaymentRequestStatus, 
    distributionStatus: DistributionStatus
  ): WorkflowProgress {
    const steps = this.getWorkflowSteps();
    const currentStepIndex = this.getCurrentStepIndex(currentStatus, distributionStatus);
    
    return {
      requestId,
      currentStep: steps[currentStepIndex]?.id || 'unknown',
      totalSteps: steps.length,
      completedSteps: currentStepIndex,
      steps: steps.map((step, index) => ({
        ...step,
        status: this.getStepStatus(index, currentStepIndex, currentStatus, distributionStatus),
        timestamp: index < currentStepIndex ? new Date() : undefined
      })),
      isComplete: currentStepIndex >= steps.length - 1,
      canProceed: this.canProceedToNextStep(currentStatus, distributionStatus),
      nextRole: this.getNextRole(currentStatus, distributionStatus)
    };
  }

  /**
   * Get all workflow steps
   */
  private static getWorkflowSteps(): Omit<WorkflowStep, 'status' | 'timestamp'>[] {
    return [
      {
        id: 'request-creation',
        name: 'Создание заявки',
        role: 'EXECUTOR',
        description: 'Исполнитель создаёт заявку на оплату'
      },
      {
        id: 'request-submission',
        name: 'Подача заявки',
        role: 'EXECUTOR',
        description: 'Заявка отправлена на рассмотрение'
      },
      {
        id: 'request-classification',
        name: 'Классификация заявки',
        role: 'registrar',
        description: 'Регистратор классифицирует заявку по статьям расходов'
      },
      {
        id: 'request-approval',
        name: 'Одобрение заявки',
        role: 'distributor',
        description: 'Распорядитель одобряет заявку'
      },
      {
        id: 'request-distribution',
        name: 'Распределение заявки',
        role: 'registrar',
        description: 'Регистратор распределяет заявку между суб-регистратором и распорядителем'
      },
      {
        id: 'document-collection',
        name: 'Сбор документов',
        role: 'sub_registrar',
        description: 'Суб-регистратор собирает оригинальные документы'
      },
      {
        id: 'report-publication',
        name: 'Публикация отчёта',
        role: 'sub_registrar',
        description: 'Суб-регистратор публикует фактический отчёт'
      },
      {
        id: 'export-contract-linking',
        name: 'Привязка контракта',
        role: 'distributor',
        description: 'Распорядитель привязывает заявку к экспортному контракту'
      },
      {
        id: 'payment-processing',
        name: 'Обработка платежа',
        role: 'treasurer',
        description: 'Казначей обрабатывает платеж'
      },
      {
        id: 'payment-completion',
        name: 'Завершение платежа',
        role: 'treasurer',
        description: 'Платеж завершён'
      }
    ];
  }

  /**
   * Get current step index based on status
   */
  private static getCurrentStepIndex(currentStatus: PaymentRequestStatus, distributionStatus: DistributionStatus): number {
    const statusToStepMap: Record<PaymentRequestStatus, number> = {
      'draft': 0,
      'submitted': 1,
      'classified': 2,
      'allocated': 2,
      'returned': 1,
      'approved': 3,
      'approved-on-behalf': 3,
      'to-pay': 3,
      'in-register': 3,
      'approved-for-payment': 3,
      'distributed': 4,
      'report_published': 6,
      'export_linked': 7,
      'paid-full': 9,
      'paid-partial': 8,
      'declined': 1,
      'rejected': 1,
      'cancelled': 0
    };

    let stepIndex = statusToStepMap[currentStatus] || 0;

    // Adjust based on distribution status
    if (distributionStatus === 'distributed' && currentStatus === 'distributed') {
      stepIndex = 4; // Distribution step
    } else if (distributionStatus === 'report_published' && currentStatus === 'report_published') {
      stepIndex = 6; // Report publication step
    } else if (distributionStatus === 'export_linked' && currentStatus === 'export_linked') {
      stepIndex = 7; // Export contract linking step
    }

    return stepIndex;
  }

  /**
   * Get step status based on current progress
   */
  private static getStepStatus(
    stepIndex: number, 
    currentStepIndex: number, 
    currentStatus: PaymentRequestStatus, 
    distributionStatus: DistributionStatus
  ): 'pending' | 'in-progress' | 'completed' | 'error' {
    if (stepIndex < currentStepIndex) {
      return 'completed';
    } else if (stepIndex === currentStepIndex) {
      return 'in-progress';
    } else {
      return 'pending';
    }
  }

  /**
   * Check if workflow can proceed to next step
   */
  private static canProceedToNextStep(currentStatus: PaymentRequestStatus, distributionStatus: DistributionStatus): boolean {
    // Check if current status allows progression
    const canProceedStatuses: PaymentRequestStatus[] = [
      'submitted', 'classified', 'allocated', 'approved', 'approved-on-behalf', 
      'to-pay', 'in-register', 'approved-for-payment', 'distributed', 'report_published'
    ];

    return canProceedStatuses.includes(currentStatus);
  }

  /**
   * Get next role that should act
   */
  private static getNextRole(currentStatus: PaymentRequestStatus, distributionStatus: DistributionStatus): string | undefined {
    const roleMap: Record<PaymentRequestStatus, string> = {
      'draft': 'EXECUTOR',
      'submitted': 'registrar',
      'classified': 'distributor',
      'allocated': 'distributor',
      'returned': 'EXECUTOR',
      'approved': 'registrar',
      'approved-on-behalf': 'registrar',
      'to-pay': 'registrar',
      'in-register': 'registrar',
      'approved-for-payment': 'registrar',
      'distributed': 'sub_registrar',
      'report_published': 'distributor',
      'export_linked': 'treasurer',
      'paid-full': undefined,
      'paid-partial': 'treasurer',
      'declined': 'EXECUTOR',
      'rejected': 'EXECUTOR',
      'cancelled': undefined
    };

    return roleMap[currentStatus];
  }

  /**
   * Get workflow progress percentage
   */
  static getProgressPercentage(progress: WorkflowProgress): number {
    if (progress.totalSteps === 0) return 0;
    return Math.round((progress.completedSteps / progress.totalSteps) * 100);
  }

  /**
   * Get estimated time remaining
   */
  static getEstimatedTimeRemaining(progress: WorkflowProgress): string {
    const remainingSteps = progress.totalSteps - progress.completedSteps;
    
    // Rough estimates in hours
    const stepEstimates: Record<string, number> = {
      'request-creation': 0.5,
      'request-submission': 0.1,
      'request-classification': 2,
      'request-approval': 4,
      'request-distribution': 0.5,
      'document-collection': 24,
      'report-publication': 1,
      'export-contract-linking': 2,
      'payment-processing': 4,
      'payment-completion': 1
    };

    let totalHours = 0;
    for (let i = progress.completedSteps; i < progress.totalSteps; i++) {
      const step = progress.steps[i];
      if (step) {
        totalHours += stepEstimates[step.id] || 1;
      }
    }

    if (totalHours < 1) {
      return 'Менее часа';
    } else if (totalHours < 24) {
      return `Около ${Math.round(totalHours)} часов`;
    } else {
      const days = Math.round(totalHours / 24);
      return `Около ${days} дней`;
    }
  }

  /**
   * Get workflow bottlenecks
   */
  static getWorkflowBottlenecks(progress: WorkflowProgress): string[] {
    const bottlenecks: string[] = [];
    
    // Check for long-running steps
    const longRunningSteps = ['document-collection', 'request-approval'];
    const currentStep = progress.steps[progress.completedSteps];
    
    if (currentStep && longRunningSteps.includes(currentStep.id)) {
      bottlenecks.push(`Текущий этап "${currentStep.name}" может занять длительное время`);
    }

    // Check for pending steps that require external action
    const externalSteps = ['document-collection', 'export-contract-linking'];
    const pendingExternalSteps = progress.steps
      .slice(progress.completedSteps)
      .filter(step => externalSteps.includes(step.id));

    if (pendingExternalSteps.length > 0) {
      bottlenecks.push('Ожидаются внешние действия для завершения процесса');
    }

    return bottlenecks;
  }
}
