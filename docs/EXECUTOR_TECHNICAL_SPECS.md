# Технические спецификации роли "Исполнитель"

## Архитектура компонентов

### 1. ExecutorDashboard.tsx
```typescript
interface ExecutorDashboardProps {
  onViewRequest?: (id: string) => void;
  onCreateRequest?: () => void;
}

// Основные состояния
const [apiPaymentRequests, setApiPaymentRequests] = useState<PaymentRequest[]>([]);
const [statistics, setStatistics] = useState<any>(null);
const [isLoading, setIsLoading] = useState(false);
const [currentFilter, setCurrentFilter] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(1);
```

### 2. ExecutorRequestsList.tsx
```typescript
interface ExecutorRequestsListProps {
  onCreateRequest?: () => void;
  onViewRequest?: (id: string) => void;
}

// Фильтры
const [searchTerm, setSearchTerm] = useState('');
const [counterpartyFilter, setCounterpartyFilter] = useState('all');
const [statusFilter, setStatusFilter] = useState('all');
const [expenseFilter, setExpenseFilter] = useState('all');
```

### 3. RequestViewForm.tsx
```typescript
interface RequestViewFormProps {
  requestId: string;
  onCancel: () => void;
  onRequestUpdate?: (updatedRequest: PaymentRequest) => void;
}

// Справочники
const { items: counterparties } = useDictionaries('counterparties');
const { items: expenseitems } = useDictionaries('expense-articles');
const { items: vatRates } = useDictionaries('vat-rates');
```

## API Service Architecture

### PaymentRequestService.ts
```typescript
export class PaymentRequestService {
  // Основные CRUD операции
  static async getAll(filters?) - получение списка заявок
  static async getById(id) - получение заявки по ID
  static async create(request) - создание заявки
  static async update(id, request) - обновление заявки
  static async delete(id) - удаление заявки

  // Статусные операции
  static async submit(id, comment?) - подача заявки
  static async classify(id, comment?) - классификация
  static async approve(id, comment?) - утверждение
  static async addToRegistry(id, comment?) - добавление в реестр
  static async returnRequest(id, comment) - отклонение

  // Статистика и метрики
  static async getStatistics(role?, userId?) - статистика
  static async getDashboardMetrics(role, userId?) - метрики dashboard
  static async getOverdueRequests(role?, userId?) - просроченные заявки
  static async getRecentRequests(limit?, role?, userId?) - последние заявки

  // Вспомогательные методы
  private static mapBackendToFrontend(backendResponse) - маппинг данных
  private static mapFrontendToBackend(request) - маппинг данных
  private static mapBackendStatusToFrontend(backendStatus) - маппинг статусов
}
```

## Типы данных

### PaymentRequestStatus
```typescript
export type PaymentRequestStatus = 
  | 'draft' 
  | 'submitted' 
  | 'classified' 
  | 'allocated' 
  | 'returned' 
  | 'approved' 
  | 'approved-on-behalf'
  | 'to-pay'
  | 'in-register'
  | 'approved-for-payment'
  | 'paid-full'
  | 'paid-partial' 
  | 'declined'
  | 'rejected'
  | 'cancelled';
```

### PaymentRequest Interface
```typescript
interface PaymentRequest {
  id: string;
  requestNumber?: string;
  createdAt: string;
  updatedAt?: string;
  dueDate: string;
  counterpartyId: string;
  counterpartyCategory?: CounterpartyCategory;
  payingCompany?: PayingCompany;
  amount: number;
  amountWithVAT?: number;
  currency: Currency;
  vatRate?: VATRate;
  docNumber: string;
  docDate: string;
  docType?: DocumentType;
  docFileUrl?: string;
  fileName?: string;
  description: string;
  comment?: string;
  paymentPurpose?: 'individual' | 'deals';
  dealId?: string;
  expenseCategory: string;
  productService: string;
  volume: string;
  priceRate: string;
  period: string;
  status: PaymentRequestStatus;
  history: RequestHistoryItem[];
  createdBy: string;
  priority?: string;
  expenseSplits: ExpenseSplit[];
  paymentAllocations: PaymentAllocation[];
  paymentExecution?: PaymentExecution;
  attachments: FileAttachment[];
}
```

## Справочники

### Counterparty
```typescript
interface Counterparty {
  id: string;
  name: string;
  tax_id: string;
  category: 'Поставщик СХ' | 'Элеватор' | 'Поставщик Услуг' | 'Покупатель' | 'Партнер/БВУ';
  is_active: boolean;
}
```

### ExpenseArticle
```typescript
interface ExpenseArticle {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}
```

### VATRate
```typescript
interface VATRate {
  id: string;
  rate: number;
  name: string;
  is_active: boolean;
}
```

## Статусные переходы

### Workflow Engine
```typescript
const statusTransitions = {
  'DRAFT': ['SUBMITTED'],
  'SUBMITTED': ['REGISTERED', 'REJECTED'],
  'REGISTERED': ['APPROVED', 'REJECTED'],
  'APPROVED': ['IN_REGISTRY'],
  'IN_REGISTRY': ['CLOSED'],
  'REJECTED': ['DRAFT'],
  'CLOSED': []
};
```

### Status Progress Mapping
```typescript
const statusSteps = [
  { status: 'draft', label: 'Черновик' },
  { status: 'submitted', label: 'Подана' },
  { status: 'classified', label: 'Классифицирована' },
  { status: 'approved', label: 'Утверждена' },
  { status: 'in-register', label: 'К оплате' },
  { status: 'paid-full', label: 'Оплачена' }
];
```

## UI Components

### StatusBadge
```typescript
interface StatusBadgeProps {
  status: PaymentRequestStatus;
  className?: string;
  showTooltip?: boolean;
  responsible?: string;
  statusTime?: string;
}

const statusConfig: Record<PaymentRequestStatus, {
  label: string;
  variant: string;
  className: string;
}> = {
  draft: { label: 'Черновик', variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Новая', variant: 'secondary', className: 'bg-blue-100 text-blue-800' },
  // ... остальные статусы
};
```

### StatusProgress
```typescript
interface StatusProgressProps {
  status: PaymentRequestStatus;
  className?: string;
}

// Прогресс-бар с этапами обработки заявки
// Поддержка всех статусов включая rejected
// Цветовая индикация для отклоненных заявок
```

## Фильтрация и поиск

### Smart Filtering
```typescript
// Умная фильтрация - показ только используемых значений
const availableCounterparties = useMemo(() => {
  const userRequests = requests.filter(r => r.createdBy === userId);
  const counterpartyIds = [...new Set(userRequests.map(req => req.counterpartyId))];
  return counterparties.filter(cp => counterpartyIds.includes(cp.id));
}, [requests, counterparties]);

const availableExpenseItems = useMemo(() => {
  if (statistics?.expense_articles) {
    return statistics.expense_articles.map((article: any) => ({
      id: article.id,
      name: article.name,
      code: article.code
    }));
  }
  return [];
}, [statistics]);
```

### Search Implementation
```typescript
const filteredRequests = useMemo(() => {
  let filtered = [...requests];
  
  // Поиск по тексту
  if (searchTerm) {
    filtered = filtered.filter(r => 
      r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Фильтр по контрагенту
  if (counterpartyFilter !== 'all') {
    filtered = filtered.filter(r => r.counterpartyId === counterpartyFilter);
  }
  
  // Фильтр по статусу
  if (statusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === statusFilter);
  }
  
  return filtered;
}, [requests, searchTerm, counterpartyFilter, statusFilter]);
```

## Пагинация

### Pagination Logic
```typescript
const itemsPerPage = 5;
const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
```

## Обработка ошибок

### Error Handling
```typescript
const [error, setError] = useState<string | null>(null);

try {
  const data = await PaymentRequestService.getAll({ role: 'executor' });
  setApiPaymentRequests(data);
} catch (err) {
  console.error('Error loading data:', err);
  setError('Ошибка загрузки данных заявок');
  setApiPaymentRequests([]);
}
```

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
```

## Производительность

### Оптимизации
- **useMemo** для вычисляемых значений
- **useCallback** для функций
- **Ленивая загрузка** данных
- **Виртуализация** для больших списков
- **Debouncing** для поиска

### Кэширование
```typescript
// Кэширование справочников
const { items: counterparties } = useDictionaries('counterparties');

// Кэширование статистики
const [statistics, setStatistics] = useState<any>(null);
```

## Тестирование

### Unit Tests
```typescript
describe('PaymentRequestService', () => {
  test('should map backend status to frontend', () => {
    expect(mapBackendStatusToFrontend('DRAFT')).toBe('draft');
    expect(mapBackendStatusToFrontend('REJECTED')).toBe('rejected');
  });
});

describe('StatusProgress', () => {
  test('should show correct progress for draft status', () => {
    render(<StatusProgress status="draft" />);
    expect(screen.getByText('17%')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
describe('ExecutorDashboard Integration', () => {
  test('should load and display requests', async () => {
    render(<ExecutorDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Заявка REQ-000001')).toBeInTheDocument();
    });
  });
});
```

## Развертывание

### Environment Variables
```bash
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_USER_ID=3394830b-1b62-4db4-a6e4-fdf76b5033f5
REACT_APP_DEFAULT_COMPANY=KD
```

### Build Configuration
```json
{
  "scripts": {
    "start": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## Мониторинг

### Performance Metrics
- **Time to First Contentful Paint** < 1.5s
- **Time to Interactive** < 3s
- **Bundle Size** < 500KB gzipped
- **API Response Time** < 500ms

### Error Tracking
```typescript
// Error boundary для отлова ошибок
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Отправка в систему мониторинга
  }
}
```

## Безопасность

### Data Validation
```typescript
// Валидация на клиенте
const validateRequest = (request: PaymentRequest) => {
  if (!request.counterpartyId) throw new Error('Контрагент обязателен');
  if (!request.amount || request.amount <= 0) throw new Error('Сумма должна быть больше 0');
  if (!request.dueDate) throw new Error('Срок оплаты обязателен');
};
```

### Access Control
```typescript
// Проверка прав доступа
const canEditRequest = (request: PaymentRequest) => {
  return request.status === 'draft' && request.createdBy === currentUserId;
};
```

## Заключение

Техническая реализация роли "Исполнитель" обеспечивает:
- ✅ **Масштабируемость** - модульная архитектура
- ✅ **Производительность** - оптимизированные запросы и кэширование
- ✅ **Надежность** - обработка ошибок и валидация
- ✅ **Тестируемость** - покрытие unit и integration тестами
- ✅ **Безопасность** - валидация данных и контроль доступа
- ✅ **Поддерживаемость** - чистый код и документация

Система готова к продуктивному использованию и дальнейшему развитию.
