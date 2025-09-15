import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { PaymentRequestStatus } from '../../types';

interface StatusBadgeProps {
  status: PaymentRequestStatus;
  className?: string;
  showTooltip?: boolean;
  responsible?: string;
  statusTime?: string;
}

const statusConfig: Record<PaymentRequestStatus, { label: string; variant: string; className: string }> = {
  draft: {
    label: 'Черновик',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800'
  },
  submitted: {
    label: 'Новая',
    variant: 'secondary', 
    className: 'bg-blue-100 text-blue-800'
  },
  classified: {
    label: 'Классифицирована',
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-800'
  },
  distributed: {
    label: 'Распределена',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-800'
  },
  returned: {
    label: 'Возвращена',
    variant: 'secondary',
    className: 'bg-orange-100 text-orange-800'
  },
  approved: {
    label: 'Утверждена',
    variant: 'secondary',
    className: 'bg-green-100 text-green-800'
  },
  'approved-on-behalf': {
    label: 'Согласована по поручению рук-ва',
    variant: 'secondary',
    className: 'bg-violet-100 text-violet-800'
  },
  'to-pay': {
    label: 'К оплате',
    variant: 'secondary',
    className: 'bg-indigo-100 text-indigo-800'
  },
  'in-register': {
    label: 'В реестре',
    variant: 'secondary',
    className: 'bg-cyan-100 text-cyan-800'
  },
  'approved-for-payment': {
    label: 'Утверждена к оплате',
    variant: 'secondary',
    className: 'bg-teal-100 text-teal-800'
  },
  'paid-full': {
    label: 'Оплачена полностью',
    variant: 'secondary',
    className: 'bg-emerald-100 text-emerald-800'
  },
  'paid-partial': {
    label: 'Оплачена частично',
    variant: 'secondary',
    className: 'bg-lime-100 text-lime-800'
  },
  declined: {
    label: 'Отклонена',
    variant: 'secondary',
    className: 'bg-red-100 text-red-800'
  },
  rejected: {
    label: 'Отклонена',
    variant: 'secondary',
    className: 'bg-red-100 text-red-800'
  },
  cancelled: {
    label: 'Аннулирована',
    variant: 'secondary',
    className: 'bg-slate-100 text-slate-800'
  }
};

export function StatusBadge({ status, className, showTooltip, responsible, statusTime }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  // Safety check - if config is undefined, return a default badge
  if (!config) {
    console.warn(`Unknown status: ${status}`);
    return (
      <Badge 
        variant="secondary"
        className={`bg-gray-100 text-gray-800 border-0 ${className || ''}`}
      >
        {status}
      </Badge>
    );
  }
  
  const badgeElement = (
    <Badge 
      variant={config.variant as any}
      className={`${config.className} border-0 ${className || ''}`}
    >
      {config.label}
    </Badge>
  );

  // Show tooltip only if requested (for executor role)
  if (showTooltip && responsible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              {badgeElement}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">Ответственный: {responsible}</div>
              <div>Статус: {config.label}</div>
              {statusTime && <div>Время: {statusTime}</div>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeElement;
}