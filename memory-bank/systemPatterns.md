# SYSTEM PATTERNS: GrainChain Spends Architecture

## Project Overview
**System:** GrainChain Spends - Trading Company Automation System  
**Architecture:** Fullstack Web Application  
**Pattern:** Microservices-oriented Monolith with Modular Frontend  
**Status:** Production-Ready with Enhanced Features  

## Architectural Patterns

### 1. Frontend Architecture Pattern
**Pattern:** Component-Based Architecture with Service Layer
**Framework:** React 18 + TypeScript + Vite
**State Management:** Context API + Custom Hooks
**Styling:** TailwindCSS + Radix UI

#### Component Hierarchy
```
App
├── Layout Components
│   ├── Navigation
│   ├── Header
│   └── Sidebar
├── Feature Components
│   ├── Payment Requests
│   ├── User Management
│   ├── Dictionary Management
│   └── Statistics Dashboard
└── Shared Components
    ├── Forms
    ├── Tables
    ├── Modals
    └── UI Elements
```

#### Service Layer Pattern
```typescript
// Modular Service Architecture
services/
├── httpClient.ts              // Base HTTP client
├── paymentRequestService.ts   // Payment request operations
├── dictionaryApiService.ts    // Dictionary data operations
├── paymentRegisterService.ts  // Payment register operations
├── userService.ts            // User management operations
├── fileService.ts            // File operations
├── distributorService.ts     // Distributor routing
├── statisticsService.ts      // Statistics and metrics
└── index.ts                  // Service exports
```

### 2. Backend Architecture Pattern
**Pattern:** Modular Monolith with Domain-Driven Design
**Framework:** FastAPI + SQLAlchemy + PostgreSQL
**Structure:** Domain-based modules with shared core

#### Module Structure
```
app/
├── core/                     // Shared core functionality
│   ├── config.py            // Configuration management
│   ├── database.py          // Database connection
│   ├── security.py          // Security utilities
│   └── auth.py              // Authentication
├── modules/                  // Domain modules
│   ├── users/               // User management
│   ├── requests/            // Payment requests
│   ├── dictionaries/        // Reference data
│   ├── registry/            // Payment registry
│   ├── files/               // File management
│   └── auth/                // Authentication
└── common/                   // Shared utilities
    └── enums.py             // Common enumerations
```

#### API Design Pattern
```python
# RESTful API with consistent patterns
@router.get("/{id}", response_model=ModelOut)
async def get_item(id: UUID, db: Session = Depends(get_db)):
    # Standard CRUD operations
    pass

@router.post("", response_model=ModelOut, status_code=201)
async def create_item(payload: ModelCreate, db: Session = Depends(get_db)):
    # Create operations with validation
    pass

@router.put("/{id}", response_model=ModelOut)
async def update_item(id: UUID, payload: ModelUpdate, db: Session = Depends(get_db)):
    # Update operations with validation
    pass
```

### 3. Database Architecture Pattern
**Pattern:** Relational Database with Domain-Driven Design
**Database:** PostgreSQL with SQLAlchemy ORM
**Migrations:** Alembic for version control

#### Entity Relationship Pattern
```sql
-- Core entities with proper relationships
Users (1) ←→ (N) UserRoles (N) ←→ (1) Roles
Users (1) ←→ (N) PaymentRequests
PaymentRequests (1) ←→ (N) PaymentRequestLines
PaymentRequests (1) ←→ (N) PaymentAllocations
```

#### Data Access Pattern
```python
# Repository pattern with SQLAlchemy
class PaymentRequestRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, id: UUID) -> Optional[PaymentRequest]:
        return self.db.query(PaymentRequest).filter(PaymentRequest.id == id).first()
    
    def get_by_status(self, status: str) -> List[PaymentRequest]:
        return self.db.query(PaymentRequest).filter(PaymentRequest.status == status).all()
```

### 4. Security Architecture Pattern
**Pattern:** JWT-based Authentication with Role-Based Access Control
**Authentication:** JWT tokens with refresh mechanism
**Authorization:** Role-based permissions

#### Authentication Flow
```
1. User Login → JWT Token Generation
2. Token Storage → Secure HTTP-only cookies
3. Request Authentication → Token validation
4. Role Authorization → Permission checking
5. Token Refresh → Automatic token renewal
```

#### Security Layers
```python
# Multi-layer security implementation
1. Rate Limiting (Redis-based)
2. Input Validation (Pydantic models)
3. SQL Injection Prevention (SQLAlchemy ORM)
4. XSS Protection (Security headers)
5. CSRF Protection (Token-based)
6. Authentication (JWT tokens)
7. Authorization (Role-based access)
```

### 5. Caching Architecture Pattern
**Pattern:** Multi-layer Caching Strategy
**Cache:** Redis for session and application cache
**Strategy:** Cache-aside pattern with TTL

#### Caching Layers
```
1. Browser Cache (Static assets)
2. CDN Cache (Global content delivery)
3. Application Cache (Redis)
4. Database Cache (Query result caching)
5. HTTP Cache (API response caching)
```

#### Cache Implementation
```python
# Cache manager with TTL and invalidation
class CacheManager:
    @staticmethod
    def get(key: str) -> Optional[Any]:
        # Get from Redis with fallback
        pass
    
    @staticmethod
    def set(key: str, value: Any, expire: int = 3600) -> bool:
        # Set in Redis with TTL
        pass
    
    @staticmethod
    def invalidate_pattern(pattern: str) -> bool:
        # Invalidate cache by pattern
        pass
```

### 6. Monitoring Architecture Pattern
**Pattern:** Observability with Metrics, Logs, and Traces
**Metrics:** Prometheus for metrics collection
**Logging:** Structured JSON logging
**Tracing:** OpenTelemetry for distributed tracing

#### Monitoring Stack
```
Application → Prometheus → Grafana → Alerting
Application → Structured Logs → ELK Stack → Analysis
Application → OpenTelemetry → Jaeger → Tracing
```

#### Health Check Pattern
```python
# Comprehensive health checks
@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@router.get("/health/detailed")
async def detailed_health_check():
    # Check database, Redis, external services
    return health_status
```

## Design Patterns

### 1. Frontend Patterns

#### Component Pattern
```typescript
// Reusable component with props and state
interface ComponentProps {
  data: DataType;
  onAction: (action: ActionType) => void;
  loading?: boolean;
}

const Component: React.FC<ComponentProps> = ({ data, onAction, loading }) => {
  const [state, setState] = useState<StateType>(initialState);
  
  return (
    <div className="component-container">
      {/* Component implementation */}
    </div>
  );
};
```

#### Service Pattern
```typescript
// Service class with static methods
export class PaymentRequestService {
  static async getAll(filters?: FilterType): Promise<PaymentRequest[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    
    const endpoint = `${API_CONFIG.endpoints.getPaymentRequests}?${queryParams}`;
    return httpClient.get<PaymentRequest[]>(endpoint);
  }
}
```

#### Hook Pattern
```typescript
// Custom hook for data fetching
export const usePaymentRequests = (filters?: FilterType) => {
  const [data, setData] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await PaymentRequestService.getAll(filters);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);
  
  return { data, loading, error };
};
```

### 2. Backend Patterns

#### Repository Pattern
```python
# Repository for data access
class PaymentRequestRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, data: PaymentRequestCreate) -> PaymentRequest:
        db_item = PaymentRequest(**data.dict())
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item
    
    def get_by_id(self, id: UUID) -> Optional[PaymentRequest]:
        return self.db.query(PaymentRequest).filter(PaymentRequest.id == id).first()
```

#### Service Pattern
```python
# Service layer for business logic
class PaymentRequestService:
    def __init__(self, repository: PaymentRequestRepository):
        self.repository = repository
    
    def create_request(self, data: PaymentRequestCreate) -> PaymentRequest:
        # Business logic validation
        if not self._validate_request(data):
            raise ValidationError("Invalid request data")
        
        return self.repository.create(data)
    
    def _validate_request(self, data: PaymentRequestCreate) -> bool:
        # Validation logic
        return True
```

#### Dependency Injection Pattern
```python
# FastAPI dependency injection
def get_payment_request_repository(db: Session = Depends(get_db)) -> PaymentRequestRepository:
    return PaymentRequestRepository(db)

def get_payment_request_service(
    repository: PaymentRequestRepository = Depends(get_payment_request_repository)
) -> PaymentRequestService:
    return PaymentRequestService(repository)

@router.post("", response_model=PaymentRequestOut)
async def create_request(
    payload: PaymentRequestCreate,
    service: PaymentRequestService = Depends(get_payment_request_service)
):
    return service.create_request(payload)
```

### 3. Data Patterns

#### Entity Pattern
```python
# SQLAlchemy entity with relationships
class PaymentRequest(Base):
    __tablename__ = "payment_requests"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(50), unique=True)
    created_by_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    counterparty_id: Mapped[UUID] = mapped_column(ForeignKey("counterparties.id"))
    status: Mapped[str] = mapped_column(String(50))
    
    # Relationships
    created_by: Mapped["User"] = relationship("User", back_populates="payment_requests")
    counterparty: Mapped["Counterparty"] = relationship("Counterparty")
    lines: Mapped[List["PaymentRequestLine"]] = relationship("PaymentRequestLine", back_populates="request")
```

#### DTO Pattern
```python
# Pydantic models for data transfer
class PaymentRequestCreate(BaseModel):
    counterparty_id: UUID
    title: str
    currency_code: str
    due_date: date
    lines: List[PaymentRequestLineCreate]

class PaymentRequestOut(BaseModel):
    id: UUID
    number: str
    title: str
    status: str
    created_at: datetime
    created_by: UserOut
    
    class Config:
        from_attributes = True
```

## Integration Patterns

### 1. API Integration Pattern
**Pattern:** RESTful API with consistent error handling
**Communication:** HTTP/HTTPS with JSON payloads
**Authentication:** JWT Bearer tokens

#### Request/Response Pattern
```typescript
// Consistent API request pattern
const response = await httpClient.post<ResponseType>('/api/v1/endpoint', {
  data: requestData
});

// Consistent error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error.status === 401) {
    // Handle unauthorized
    AuthService.logout();
    redirectToLogin();
  } else if (error.status === 429) {
    // Handle rate limiting
    showRateLimitMessage();
  } else {
    // Handle general errors
    showErrorMessage(error.message);
  }
}
```

### 2. State Management Pattern
**Pattern:** Context API with custom hooks
**State:** Centralized state management
**Updates:** Immutable state updates

#### Context Pattern
```typescript
// Context for global state
interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

### 3. Error Handling Pattern
**Pattern:** Centralized error handling with user feedback
**Strategy:** Graceful degradation with fallbacks

#### Error Boundary Pattern
```typescript
// React error boundary for error handling
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

## Performance Patterns

### 1. Frontend Performance
**Strategy:** Code splitting, lazy loading, and caching
**Optimization:** Bundle optimization and resource optimization

#### Code Splitting Pattern
```typescript
// Lazy loading for route components
const PaymentRequests = lazy(() => import('./components/PaymentRequests'));
const UserManagement = lazy(() => import('./components/UserManagement'));

// Suspense wrapper for lazy components
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/requests" element={<PaymentRequests />} />
    <Route path="/users" element={<UserManagement />} />
  </Routes>
</Suspense>
```

### 2. Backend Performance
**Strategy:** Database optimization, caching, and async processing
**Optimization:** Query optimization and connection pooling

#### Async Processing Pattern
```python
# Async endpoint for better performance
@router.get("/statistics")
async def get_statistics(
    role: Optional[str] = None,
    db: Session = Depends(get_db)
) -> StatisticsResponse:
    # Async database operations
    stats = await asyncio.gather(
        get_request_count(db, role),
        get_approval_rate(db, role),
        get_processing_time(db, role)
    )
    
    return StatisticsResponse(
        total_requests=stats[0],
        approval_rate=stats[1],
        avg_processing_time=stats[2]
    )
```

## Security Patterns

### 1. Authentication Pattern
**Strategy:** JWT-based authentication with refresh tokens
**Security:** Secure token storage and validation

#### JWT Implementation Pattern
```python
# JWT token generation and validation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None
```

### 2. Authorization Pattern
**Strategy:** Role-based access control (RBAC)
**Implementation:** Permission-based endpoint protection

#### RBAC Implementation Pattern
```python
# Role-based access control
def require_role(required_role: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = get_current_user()
            if not has_role(current_user, required_role):
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions"
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator

@router.post("/approve/{request_id}")
@require_role("distributor")
async def approve_request(request_id: UUID):
    # Only distributors can approve requests
    pass
```

## Deployment Patterns

### 1. Containerization Pattern
**Strategy:** Docker containers with multi-stage builds
**Orchestration:** Docker Compose for development, Kubernetes for production

#### Dockerfile Pattern
```dockerfile
# Multi-stage build for frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. CI/CD Pattern
**Strategy:** GitHub Actions with automated testing and deployment
**Pipeline:** Build → Test → Security Scan → Deploy

#### GitHub Actions Pattern
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run security scan
        run: npm audit
```

## Monitoring Patterns

### 1. Metrics Pattern
**Strategy:** Prometheus metrics with Grafana dashboards
**Collection:** Application metrics and business metrics

#### Metrics Implementation Pattern
```python
# Prometheus metrics collection
from prometheus_client import Counter, Histogram, Gauge

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')

# Middleware for metrics collection
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

### 2. Logging Pattern
**Strategy:** Structured JSON logging with correlation IDs
**Collection:** Centralized logging with ELK stack

#### Structured Logging Pattern
```python
# Structured logging implementation
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if hasattr(record, 'extra'):
            log_entry.update(record.extra)
        
        return json.dumps(log_entry)
```

## Quality Patterns

### 1. Testing Pattern
**Strategy:** Comprehensive testing with unit, integration, and e2e tests
**Coverage:** >90% code coverage target

#### Test Structure Pattern
```python
# Test structure with fixtures
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def client():
    # Test client setup
    pass

@pytest.fixture
def db_session():
    # Test database session
    pass

def test_create_payment_request(client, db_session):
    # Test implementation
    response = client.post("/api/v1/requests", json=request_data)
    assert response.status_code == 201
    assert response.json()["title"] == request_data["title"]
```

### 2. Code Quality Pattern
**Strategy:** Automated code quality checks with linting and formatting
**Tools:** ESLint, Prettier, Black, Flake8, MyPy

#### Quality Check Pattern
```json
// package.json scripts for quality checks
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

## Conclusion

The GrainChain Spends system implements a comprehensive set of architectural and design patterns that ensure:

- **Scalability:** Modular architecture that can scale horizontally
- **Maintainability:** Clean code with separation of concerns
- **Security:** Multi-layer security with authentication and authorization
- **Performance:** Optimized performance with caching and async processing
- **Reliability:** Comprehensive error handling and monitoring
- **Quality:** High code quality with automated testing and quality checks

These patterns provide a solid foundation for a production-ready system that can handle the demands of a trading company's expense management and payment processing workflow.
