import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  FileText, 
  AlertTriangle, 
  Calendar, 
  Building,
  Filter,
  X,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  XCircle
} from 'lucide-react';
import { PaymentRequest } from '../../types';

interface StatsCardData {
  id: string;
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  isClickable: boolean;
  filterType?: string;
  tooltip: string;
}

interface DistributorStatsCardsProps {
  filteredRequests: PaymentRequest[];
  currentFilter: string | null;
  onFilterClick: (filterType: string) => void;
}

export function DistributorStatsCards({ 

  // Get dictionary data
  filteredRequests, 
  currentFilter, 
  onFilterClick 
}: DistributorStatsCardsProps) {
  
  const calculateOverdueRequests = () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    return filteredRequests.filter(r => 
      r.status === 'classified' && new Date(r.createdAt) < fiveHoursAgo
    ).length;
  };

  const statsCards: StatsCardData[] = [
    {
      id: 'in-work',
      title: 'В работе',
      value: filteredRequests.filter(r => r.status === 'classified').length,
      icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      color: 'text-orange-500',
      isClickable: true,
      filterType: 'in-work',
      tooltip: 'Заявки, ожидающие рассмотрения распорядителем'
    },
    {
      id: 'returned-for-revision',
      title: 'Отправлен на доработку',
      value: filteredRequests.filter(r => r.status === 'returned').length,
      icon: <ArrowLeft className="h-4 w-4 text-blue-500" />,
      color: 'text-blue-500',
      isClickable: true,
      filterType: 'returned-for-revision',
      tooltip: 'Заявки, отправленные на доработку'
    },
    {
      id: 'approved-for-payment',
      title: 'Утвержден на оплату',
      value: filteredRequests.filter(r => ['approved', 'approved-on-behalf', 'in-register', 'approved-for-payment'].includes(r.status)).length,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      color: 'text-green-500',
      isClickable: true,
      filterType: 'approved-for-payment',
      tooltip: 'Заявки, утвержденные к оплате'
    },
    {
      id: 'approved-on-behalf',
      title: 'Согласован по поручению рук-ва',
      value: filteredRequests.filter(r => r.status === 'approved-on-behalf').length,
      icon: <CheckCircle className="h-4 w-4 text-purple-500" />,
      color: 'text-purple-500',
      isClickable: true,
      filterType: 'approved-on-behalf',
      tooltip: 'Заявки, согласованные по поручению руководства'
    },
    {
      id: 'paid',
      title: 'Оплачен',
      value: filteredRequests.filter(r => ['paid-full', 'paid-partial'].includes(r.status)).length,
      icon: <DollarSign className="h-4 w-4 text-green-600" />,
      color: 'text-green-600',
      isClickable: true,
      filterType: 'paid',
      tooltip: 'Оплаченные заявки'
    },
    {
      id: 'declined',
      title: 'Отклонен',
      value: filteredRequests.filter(r => r.status === 'declined').length,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      color: 'text-red-500',
      isClickable: true,
      filterType: 'declined',
      tooltip: 'Отклоненные заявки'
    }
  ];

  const handleCardClick = (card: StatsCardData) => {
    if (card.isClickable && card.filterType) {
      onFilterClick(card.filterType);
    }
  };

  const getCardClassName = (card: StatsCardData) => {
    const baseClasses = "transition-all duration-300 ease-out";
    
    if (card.isClickable) {
      const isActive = currentFilter === card.filterType;
      return `${baseClasses} cursor-pointer hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] ${
        isActive 
          ? 'ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5 border-primary/20' 
          : 'hover:bg-accent/30 hover:border-primary/30'
      }`;
    }
    
    return `${baseClasses} hover:shadow-md hover:scale-[1.01]`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Active filter indicator */}
        {currentFilter && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in-50 duration-300">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Активен фильтр: <strong>
                {statsCards.find(card => card.filterType === currentFilter)?.title}
              </strong>
            </span>
            <Badge variant="secondary" className="ml-2">
              {filteredRequests.length} заявок
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onFilterClick(currentFilter)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Сбросить фильтр</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsCards.map((card) => (
            <Tooltip key={card.id}>
              <TooltipTrigger asChild>
                <div>
                  <Card
                    className={getCardClassName(card)}
                    onClick={() => handleCardClick(card)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate leading-tight">
                            {card.title}
                          </p>
                          <p className="text-xl font-semibold mt-0.5">
                            {card.value.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status indicators */}
                      {currentFilter === card.filterType && (
                        <div className="mt-2 flex justify-end">
                          <Badge variant="default" size="sm" className="animate-pulse text-xs">
                            Активен
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{card.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}