import { PaymentRequestStatus } from '../../types';
import { Progress } from '../ui/progress';
import { CheckCircle, Circle, Clock, XCircle } from 'lucide-react';

interface StatusProgressProps {
  status: PaymentRequestStatus;
  className?: string;
}

const statusSteps: { status: PaymentRequestStatus; label: string }[] = [
  { status: 'draft', label: 'Черновик' },
  { status: 'submitted', label: 'Подана' },
  { status: 'classified', label: 'Классифицирована' },
  { status: 'approved', label: 'Утверждена' },
  { status: 'in-register', label: 'К оплате' },
  { status: 'paid-full', label: 'Оплачена' }
];

export function StatusProgress({ status, className }: StatusProgressProps) {
  const currentIndex = statusSteps.findIndex(step => step.status === status);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / statusSteps.length) * 100 : 0;

  const getStepIcon = (stepIndex: number, stepStatus: PaymentRequestStatus) => {
    if (status === 'declined' || status === 'returned' || status === 'rejected') {
      if (stepIndex <= currentIndex) {
        return <XCircle className="h-4 w-4 text-red-500" />;
      }
      return <Circle className="h-4 w-4 text-gray-300" />;
    }

    if (stepIndex < currentIndex) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (stepIndex === currentIndex) {
      return <Clock className="h-4 w-4 text-blue-500" />;
    } else {
      return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <div className="flex items-center justify-between text-sm">
        <span>Прогресс заявки</span>
        <span className="text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      
      <Progress 
        value={progress} 
        className={`h-2 ${status === 'declined' || status === 'returned' || status === 'rejected' ? '[&>div]:bg-red-500' : ''}`}
      />
      
      <div className="hidden md:flex items-center justify-between">
        {statusSteps.map((step, index) => (
          <div key={step.status} className="flex flex-col items-center gap-1">
            {getStepIcon(index, step.status)}
            <span className={`text-xs text-center max-w-16 ${
              index <= currentIndex ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}