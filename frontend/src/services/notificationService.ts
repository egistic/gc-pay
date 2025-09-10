import { toast } from 'sonner';

export interface WorkflowNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  role: string;
  requestId?: string;
  actionRequired?: boolean;
}

export class NotificationService {
  private static notifications: WorkflowNotification[] = [];
  private static listeners: ((notifications: WorkflowNotification[]) => void)[] = [];

  /**
   * Add a new notification
   */
  static addNotification(notification: Omit<WorkflowNotification, 'id' | 'timestamp'>): void {
    const newNotification: WorkflowNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Show toast notification
    this.showToastNotification(newNotification);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  static getNotifications(): WorkflowNotification[] {
    return [...this.notifications];
  }

  /**
   * Get notifications for a specific role
   */
  static getNotificationsForRole(role: string): WorkflowNotification[] {
    return this.notifications.filter(n => n.role === role);
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      // Remove from notifications
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.notifyListeners();
    }
  }

  /**
   * Clear all notifications
   */
  static clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to notification changes
   */
  static subscribe(listener: (notifications: WorkflowNotification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  /**
   * Show toast notification
   */
  private static showToastNotification(notification: WorkflowNotification): void {
    const toastOptions = {
      duration: notification.type === 'error' ? 5000 : 3000,
      action: notification.actionRequired ? {
        label: 'Просмотреть',
        onClick: () => {
          // Navigate to request or show details
          console.log('Navigate to request:', notification.requestId);
        }
      } : undefined
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      default:
        toast.info(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
    }
  }

  /**
   * Workflow-specific notification methods
   */
  static notifyRequestDistributed(requestId: string, requestNumber: string): void {
    this.addNotification({
      type: 'success',
      title: 'Заявка распределена',
      message: `Заявка ${requestNumber} успешно распределена между суб-регистратором и распорядителем`,
      role: 'registrar',
      requestId
    });
  }

  static notifySubRegistrarAssigned(requestId: string, requestNumber: string): void {
    this.addNotification({
      type: 'info',
      title: 'Новое назначение',
      message: `Вам назначена заявка ${requestNumber} для обработки`,
      role: 'sub_registrar',
      requestId,
      actionRequired: true
    });
  }

  static notifyDistributorRequestCreated(requestId: string, requestNumber: string): void {
    this.addNotification({
      type: 'info',
      title: 'Новая заявка',
      message: `Получена заявка ${requestNumber} для обработки`,
      role: 'distributor',
      requestId,
      actionRequired: true
    });
  }

  static notifyReportPublished(requestId: string, requestNumber: string): void {
    this.addNotification({
      type: 'success',
      title: 'Отчёт опубликован',
      message: `Отчёт по заявке ${requestNumber} опубликован и обогатил данные для распорядителя`,
      role: 'sub_registrar',
      requestId
    });

    // Notify distributor about enriched data
    this.addNotification({
      type: 'info',
      title: 'Данные обогащены',
      message: `Заявка ${requestNumber} обогащена данными от суб-регистратора`,
      role: 'distributor',
      requestId,
      actionRequired: true
    });
  }

  static notifyExportContractLinked(requestId: string, requestNumber: string, contractNumber: string): void {
    this.addNotification({
      type: 'success',
      title: 'Контракт привязан',
      message: `Заявка ${requestNumber} привязана к экспортному контракту ${contractNumber}`,
      role: 'distributor',
      requestId
    });
  }

  static notifyWorkflowError(error: string, role: string): void {
    this.addNotification({
      type: 'error',
      title: 'Ошибка в процессе',
      message: error,
      role
    });
  }

  static notifyWorkflowProgress(step: string, role: string): void {
    this.addNotification({
      type: 'info',
      title: 'Прогресс',
      message: step,
      role
    });
  }
}
