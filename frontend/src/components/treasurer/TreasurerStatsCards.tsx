// DEPRECATED: This file is no longer used. Please use OptimizedTreasurerDashboard.tsx instead.
import { 
  FileText, 
  AlertTriangle, 
  Clock,
  DollarSign 
} from 'lucide-react';
import { PaymentRequest } from '../../types';

interface TreasurerStatsCardsProps {
  paymentRequests: PaymentRequest[];
  onFilterChange?: (filter: string | null) => void;
  currentFilter?: string | null;
}

export function TreasurerStatsCards({ paymentRequests, onFilterChange, currentFilter }: TreasurerStatsCardsProps) {
  // Filter treasurer requests (received from distributor)
  const treasurerRequests = paymentRequests.filter(r => 
    ['approved', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'declined', 'returned'].includes(r.status)
  );

  // New requests (not reviewed by treasurer)
  const newRequests = paymentRequests.filter(r => r.status === 'approved');
  
  // Calculate overdue requests (not reviewed within 5 hours from distributor approval)
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const overdueRequests = newRequests.filter(r => {
    return new Date(r.createdAt) < fiveHoursAgo;
  });

  // Calculate pending amounts by currency
  const pendingRequestsByCurrency = newRequests.reduce((acc, request) => {
    const currency = request.currency || 'KZT';
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += request.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleFilterClick = (filterType: string) => {
    if (onFilterChange) {
      const newFilter = currentFilter === filterType ? null : filterType;
      onFilterChange(newFilter);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols = {
      'KZT': '₸',
      'USD': '$',
      'EUR': '€',
      'RUB': '₽',
      'CNY': '¥'
    };
    return `${amount.toLocaleString()} ${symbols[currency] || currency}`;
  };

  return (
    <div className="space-y-6">
      {/* Main stats cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentFilter === 'total' ? 'ring-2 ring-primary shadow-md' : ''
          }`}
          onClick={() => handleFilterClick('total')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasurerRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Заявок казначея
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentFilter === 'newRequests' ? 'ring-2 ring-primary shadow-md' : ''
          }`}
          onClick={() => handleFilterClick('newRequests')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Новые заявки</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Нерассмотренные
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentFilter === 'overdue' ? 'ring-2 ring-primary shadow-md' : ''
          }`}
          onClick={() => handleFilterClick('overdue')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просроченные</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Свыше 5 часов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currency breakdown cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {['KZT', 'USD', 'EUR', 'RUB', 'CNY'].map(currency => (
          <Card key={currency}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Нерассмотренные {currency}</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {formatCurrency(pendingRequestsByCurrency[currency] || 0, currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                К обработке
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}