import React from 'react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Card, CardContent } from '../ui/card';
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
  PaymentRequestStatus, 
  DistributionStatus, 
  UserRole 
} from '../../types';

interface WorkflowStatusIndicatorProps {
  requestId: string;
  currentStatus: PaymentRequestStatus;
  distributionStatus: DistributionStatus;
  currentRole: UserRole;
  showProgress?: boolean;
  showSteps?: boolean;
  compact?: boolean;
}

export const WorkflowStatusIndicator: React.FC<WorkflowStatusIndicatorProps> = ({
  requestId,
  currentStatus,
  distributionStatus,
  currentRole,
  showProgress = true,
  showSteps = false,
  compact = false
}) => {
  const progress = WorkflowProgressService.getWorkflowProgress(
    requestId,
    currentStatus,
    distributionStatus
  );

  const getStatusColor = (status: PaymentRequestStatus) => {
    const colorMap: Record<PaymentRequestStatus, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'classified': 'bg-yellow-100 text-yellow-800',
      'allocated': 'bg-yellow-100 text-yellow-800',
      'returned': 'bg-red-100 text-red-800',
      'approved': 'bg-green-100 text-green-800',
      'approved-on-behalf': 'bg-green-100 text-green-800',
      'to-pay': 'bg-blue-100 text-blue-800',
      'in-register': 'bg-blue-100 text-blue-800',
      'approved-for-payment': 'bg-green-100 text-green-800',
      'distributed': 'bg-purple-100 text-purple-800',
      'report_published': 'bg-orange-100 text-orange-800',
      'export_linked': 'bg-green-100 text-green-800',
      'paid-full': 'bg-green-100 text-green-800',
      'paid-partial': 'bg-yellow-100 text-yellow-800',
      'declined': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };

    return colorMap[currentStatus] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: PaymentRequestStatus) => {
    const iconMap: Record<PaymentRequestStatus, React.ReactNode> = {
      'draft': <FileText className="h-3 w-3" />,
      'submitted': <ArrowRight className="h-3 w-3" />,
      'classified': <Users className="h-3 w-3" />,
      'allocated': <Users className="h-3 w-3" />,
      'returned': <AlertCircle className="h-3 w-3" />,
      'approved': <CheckCircle className="h-3 w-3" />,
      'approved-on-behalf': <CheckCircle className="h-3 w-3" />,
      'to-pay': <DollarSign className="h-3 w-3" />,
      'in-register': <FileText className="h-3 w-3" />,
      'approved-for-payment': <CheckCircle className="h-3 w-3" />,
      'distributed': <ArrowRight className="h-3 w-3" />,
      'report_published': <TrendingUp className="h-3 w-3" />,
      'export_linked': <CheckCircle className="h-3 w-3" />,
      'paid-full': <CheckCircle className="h-3 w-3" />,
      'paid-partial': <Clock className="h-3 w-3" />,
      'declined': <AlertCircle className="h-3 w-3" />,
      'rejected': <AlertCircle className="h-3 w-3" />,
      'cancelled': <AlertCircle className="h-3 w-3" />
    };

    return iconMap[currentStatus] || <FileText className="h-3 w-3" />;
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <div className="h-3 w-3 rounded-full border border-gray-300" />;
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

  const isCurrentRoleResponsible = progress.nextRole === currentRole;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${getStatusColor(currentStatus)} flex items-center gap-1`}>
          {getStatusIcon(currentStatus)}
          {currentStatus}
        </Badge>
        {isCurrentRoleResponsible && (
          <Badge variant="outline" className="text-xs">
            Ваша очередь
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(currentStatus)} flex items-center gap-1`}>
                {getStatusIcon(currentStatus)}
                {currentStatus}
              </Badge>
              {isCurrentRoleResponsible && (
                <Badge variant="outline" className="text-xs">
                  Ваша очередь
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {progress.completedSteps} из {progress.totalSteps} этапов
            </div>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Прогресс</span>
                <span>{WorkflowProgressService.getProgressPercentage(progress)}%</span>
              </div>
              <Progress 
                value={WorkflowProgressService.getProgressPercentage(progress)} 
                className="h-2"
              />
            </div>
          )}

          {/* Workflow Steps */}
          {showSteps && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Этапы процесса</h4>
              <div className="space-y-1">
                {progress.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2">
                    {getStepIcon(step)}
                    <span className={`text-xs ${getStepColor(step)}`}>
                      {step.name}
                    </span>
                    {step.role === currentRole && step.status === 'in-progress' && (
                      <Badge variant="outline" className="text-xs">
                        Ваша очередь
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              Следующий этап: {progress.nextRole || 'Завершено'}
            </div>
            <div>
              Осталось времени: {WorkflowProgressService.getEstimatedTimeRemaining(progress)}
            </div>
            {progress.isComplete && (
              <div className="text-green-600 font-medium">
                Процесс завершён
              </div>
            )}
          </div>

          {/* Bottlenecks */}
          {WorkflowProgressService.getWorkflowBottlenecks(progress).length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-orange-600">Возможные задержки:</h5>
              {WorkflowProgressService.getWorkflowBottlenecks(progress).map((bottleneck, index) => (
                <p key={index} className="text-xs text-orange-600">
                  • {bottleneck}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
