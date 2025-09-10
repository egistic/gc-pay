import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Users, 
  FileText, 
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  WorkflowProgressService, 
  WorkflowProgress, 
  WorkflowStep 
} from '../../services/workflowProgressService';
import { 
  NotificationService, 
  WorkflowNotification 
} from '../../services/notificationService';
import { 
  PaymentRequest, 
  PaymentRequestStatus, 
  DistributionStatus, 
  UserRole 
} from '../../types';

interface WorkflowDashboardProps {
  currentRole: UserRole;
  paymentRequests: PaymentRequest[];
  onViewRequest: (requestId: string) => void;
  onNavigate: (page: string) => void;
}

export const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({
  currentRole,
  paymentRequests,
  onViewRequest,
  onNavigate
}) => {
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [workflowProgress, setWorkflowProgress] = useState<Map<string, WorkflowProgress>>(new Map());

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = NotificationService.subscribe(setNotifications);
    
    // Load workflow progress for all requests
    loadWorkflowProgress();
    
    return unsubscribe;
  }, [paymentRequests]);

  const loadWorkflowProgress = () => {
    const progressMap = new Map<string, WorkflowProgress>();
    
    paymentRequests.forEach(request => {
      const progress = WorkflowProgressService.getWorkflowProgress(
        request.id,
        request.status as PaymentRequestStatus,
        (request as any).distributionStatus as DistributionStatus || 'pending'
      );
      progressMap.set(request.id, progress);
    });
    
    setWorkflowProgress(progressMap);
  };

  const getRoleSpecificRequests = () => {
    switch (currentRole) {
      case 'registrar':
        return paymentRequests.filter(req => 
          ['approved', 'approved-on-behalf', 'to-pay', 'in-register', 'approved-for-payment'].includes(req.status)
        );
      case 'sub_registrar':
        return paymentRequests.filter(req => 
          req.status === 'distributed'
        );
      case 'distributor':
        return paymentRequests.filter(req => 
          ['distributed', 'report_published', 'export_linked'].includes(req.status)
        );
      default:
        return paymentRequests;
    }
  };

  const getRoleSpecificStats = () => {
    const requests = getRoleSpecificRequests();
    const total = requests.length;
    
    switch (currentRole) {
      case 'registrar':
        return {
          total,
          pending: requests.filter(req => ['approved', 'approved-on-behalf', 'to-pay', 'in-register', 'approved-for-payment'].includes(req.status)).length,
          distributed: requests.filter(req => req.status === 'distributed').length,
          completed: requests.filter(req => ['report_published', 'export_linked'].includes(req.status)).length
        };
      case 'sub_registrar':
        return {
          total,
          pending: requests.filter(req => req.status === 'distributed').length,
          inProgress: requests.filter(req => req.status === 'distributed').length,
          completed: requests.filter(req => req.status === 'report_published').length
        };
      case 'distributor':
        return {
          total,
          pending: requests.filter(req => req.status === 'distributed').length,
          enriched: requests.filter(req => req.status === 'report_published').length,
          linked: requests.filter(req => req.status === 'export_linked').length
        };
      default:
        return { total, pending: 0, completed: 0 };
    }
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const stats = getRoleSpecificStats();
  const requests = getRoleSpecificRequests();

  return (
    <div className="space-y-6">
      {/* Role-specific header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {currentRole === 'registrar' && 'Рабочий стол регистратора'}
            {currentRole === 'sub_registrar' && 'Рабочий стол суб-регистратора'}
            {currentRole === 'distributor' && 'Рабочий стол распорядителя'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {currentRole === 'registrar' && 'Управление распределением заявок'}
            {currentRole === 'sub_registrar' && 'Обработка назначенных заявок'}
            {currentRole === 'distributor' && 'Обработка заявок и привязка контрактов'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onNavigate('requests')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Все заявки
          </Button>
          {currentRole === 'registrar' && (
            <Button
              onClick={() => onNavigate('registrar-distribution')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Распределить заявки
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего заявок</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {currentRole === 'registrar' && 'Ожидают распределения'}
                  {currentRole === 'sub_registrar' && 'Назначены'}
                  {currentRole === 'distributor' && 'Ожидают обработки'}
                </p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {currentRole === 'registrar' && 'Распределены'}
                  {currentRole === 'sub_registrar' && 'В работе'}
                  {currentRole === 'distributor' && 'Обогащены'}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {currentRole === 'registrar' && stats.distributed}
                  {currentRole === 'sub_registrar' && stats.inProgress}
                  {currentRole === 'distributor' && stats.enriched}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {currentRole === 'registrar' && 'Завершены'}
                  {currentRole === 'sub_registrar' && 'Завершены'}
                  {currentRole === 'distributor' && 'Привязаны'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {currentRole === 'registrar' && stats.completed}
                  {currentRole === 'sub_registrar' && stats.completed}
                  {currentRole === 'distributor' && stats.linked}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Последние заявки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.slice(0, 5).map((request) => {
                const progress = workflowProgress.get(request.id);
                if (!progress) return null;

                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewRequest(request.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{request.requestNumber || 'Без номера'}</h4>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.description || 'Без описания'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress 
                          value={WorkflowProgressService.getProgressPercentage(progress)} 
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {WorkflowProgressService.getProgressPercentage(progress)}%
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Этапы процесса
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.slice(0, 1).map((request) => {
                const progress = workflowProgress.get(request.id);
                if (!progress) return null;

                return (
                  <div key={request.id} className="space-y-2">
                    <h4 className="font-medium">{request.requestNumber || 'Без номера'}</h4>
                    <div className="space-y-2">
                      {progress.steps.slice(0, 5).map((step, index) => (
                        <div key={step.id} className="flex items-center gap-3">
                          {getStepIcon(step)}
                          <div className="flex-1">
                            <p className={`text-sm ${getStepColor(step)}`}>
                              {step.name}
                            </p>
                            {step.description && (
                              <p className="text-xs text-muted-foreground">
                                {step.description}
                              </p>
                            )}
                          </div>
                          {step.role === currentRole && step.status === 'in-progress' && (
                            <Badge variant="outline" className="text-xs">
                              Ваша очередь
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Уведомления
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <Alert key={notification.id}>
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => NotificationService.markAsRead(notification.id)}
                    >
                      Закрыть
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
