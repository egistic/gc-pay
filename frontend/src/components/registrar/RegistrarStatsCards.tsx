import React from 'react';
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
  X 
} from 'lucide-react';
import { PaymentRequest } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatting';

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

interface RegistrarStatsCardsProps {
  filteredRequests: PaymentRequest[];
  currentFilter: string | null;
  onFilterClick: (filterType: string) => void;
}

export function RegistrarStatsCards({ 
  filteredRequests, 
  currentFilter, 
  onFilterClick 
}: RegistrarStatsCardsProps) {
  
  const calculateOverdueRequests = () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    return filteredRequests.filter(r => 
      r.status === 'submitted' && new Date(r.createdAt) < fiveHoursAgo
    ).length;
  };

  const statsCards: StatsCardData[] = [
    {
      id: 'in-work',
      title: 'В работе',
      value: filteredRequests.filter(r => r.status === 'submitted').length,
      icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      color: 'text-orange-500',
      isClickable: true,
      filterType: 'in-work',
      tooltip: 'Заявки, ожидающие классификации регистратором'
    },
    {
      id: 'registered',
      title: 'Зарегистрировано',
      value: filteredRequests.filter(r => r.status === 'classified').length,
      icon: <FileText className="h-4 w-4 text-green-500" />,
      color: 'text-green-500',
      isClickable: true,
      filterType: 'registered',
      tooltip: 'Заявки, успешно классифицированные и переданные распорядителю'
    },
    {
      id: 'overdue',
      title: 'Просрочено',
      value: calculateOverdueRequests(),
      icon: <Calendar className="h-4 w-4 text-red-500" />,
      color: 'text-red-500',
      isClickable: true,
      filterType: 'overdue',
      tooltip: 'Заявки, поданные более 5 часов назад и еще не обработанные'
    },
    {
      id: 'returned',
      title: 'Возвращено на доработку',
      value: filteredRequests.filter(r => r.status === 'returned').length,
      icon: <Building className="h-4 w-4 text-blue-500" />,
      color: 'text-blue-500',
      isClickable: true,
      filterType: 'returned',
      tooltip: 'Заявки, возвращенные на доработку исполнителю'
    },
    {
      id: 'declined',
      title: 'Отклонено',
      value: filteredRequests.filter(r => r.status === 'declined').length,
      icon: <FileText className="h-4 w-4 text-red-600" />,
      color: 'text-red-600',
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statsCards.map((card) => (
            <Tooltip key={card.id}>
              <TooltipTrigger asChild>
                <div>
                  <Card
                    className={getCardClassName(card)}
                    onClick={() => handleCardClick(card)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground truncate">
                            {card.title}
                          </p>
                          <p className="text-2xl font-semibold mt-1">
                            {card.value.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status indicators */}
                      <div className="mt-3 flex items-center justify-between">
                        {!card.isClickable && (
                          <span className="text-xs text-muted-foreground">
                            Информационная плитка
                          </span>
                        )}
                        
                        {currentFilter === card.filterType && (
                          <Badge variant="default" size="sm" className="animate-pulse">
                            Активен
                          </Badge>
                        )}
                      </div>
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