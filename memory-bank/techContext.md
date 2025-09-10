# TECH CONTEXT: GrainChain Spends Technology Stack

## Project Overview
**System:** GrainChain Spends - Trading Company Automation System  
**Technology Stack:** Modern Fullstack Web Application  
**Architecture:** Microservices-oriented Monolith with Modular Frontend  
**Status:** Production-Ready with Enhanced Features  

## Technology Stack

### Frontend Technology Stack
**Framework:** React 18.2.0
**Language:** TypeScript 5.0+
**Build Tool:** Vite 4.0+
**Styling:** TailwindCSS 3.0+ + Radix UI
**State Management:** Context API + Custom Hooks
**HTTP Client:** Fetch API with custom wrapper
**Testing:** Jest + React Testing Library
**Code Quality:** ESLint + Prettier

#### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@radix-ui/react-*": "^1.0.0",
    "tailwindcss": "^3.2.0",
    "lucide-react": "^0.263.0",
    "date-fns": "^2.29.0",
    "clsx": "^1.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0",
    "@vitejs/plugin-react": "^3.0.0",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^13.0.0"
  }
}
```

### Backend Technology Stack
**Framework:** FastAPI 0.115.0
**Language:** Python 3.11+
**Database:** PostgreSQL 13+
**ORM:** SQLAlchemy 2.0+
**Migrations:** Alembic 1.13+
**Authentication:** JWT (python-jose)
**Password Hashing:** Passlib with bcrypt
**Validation:** Pydantic 2.8+
**Testing:** Pytest + FastAPI TestClient

#### Backend Dependencies
```txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.8.2
pydantic-settings==2.4.0
SQLAlchemy==2.0.36
alembic==1.13.2
psycopg[binary]==3.2.1
python-jose==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
email-validator==2.2.0
pandas==2.2.2
openpyxl==3.1.5
```

### Database Technology Stack
**Database:** PostgreSQL 13+
**Connection Pooling:** SQLAlchemy QueuePool
**Migrations:** Alembic with version control
**Backup:** pg_dump with automated scheduling
**Monitoring:** PostgreSQL statistics and logs

#### Database Configuration
```python
# Database connection configuration
DATABASE_URL = "postgresql://user:password@localhost:5432/gcspends"
POOL_SIZE = 20
MAX_OVERFLOW = 30
POOL_PRE_PING = True
POOL_RECYCLE = 3600
```

### Caching Technology Stack
**Cache:** Redis 6.0+
**Pattern:** Cache-aside with TTL
**Use Cases:** Session storage, API response caching, rate limiting
**Configuration:** Redis cluster for high availability

#### Redis Configuration
```python
# Redis configuration
REDIS_URL = "redis://localhost:6379/0"
CACHE_TTL = 3600  # 1 hour
SESSION_TTL = 86400  # 24 hours
RATE_LIMIT_TTL = 60  # 1 minute
```

### Monitoring Technology Stack
**Metrics:** Prometheus + Grafana
**Logging:** Structured JSON logging
**Tracing:** OpenTelemetry + Jaeger
**Health Checks:** Custom health check endpoints
**Alerting:** Prometheus AlertManager

#### Monitoring Configuration
```python
# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')
```

### Deployment Technology Stack
**Containerization:** Docker + Docker Compose
**Orchestration:** Kubernetes (production)
**Reverse Proxy:** Nginx
**SSL/TLS:** Let's Encrypt certificates
**CI/CD:** GitHub Actions
**Environment:** Development, Staging, Production

#### Docker Configuration
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

## Development Environment

### Local Development Setup
**Operating System:** Linux Ubuntu 24.04
**Node.js:** v18.0+
**Python:** v3.11+
**PostgreSQL:** v13+
**Redis:** v6.0+
**Git:** v2.30+

#### Development Commands
```bash
# Frontend development
cd frontend
npm install
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linting

# Backend development
cd gc-spends-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Start development server (port 8000)
pytest                          # Run tests
alembic upgrade head           # Run database migrations
```

### Development Tools
**IDE:** VS Code with extensions
**Version Control:** Git with feature branch workflow
**Package Management:** npm (frontend), pip (backend)
**Database Management:** pgAdmin, DBeaver
**API Testing:** Postman, Insomnia
**Code Quality:** ESLint, Prettier, Black, Flake8

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.pylint",
    "ms-python.black-formatter",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

## Production Environment

### Production Infrastructure
**Cloud Provider:** AWS/Azure/GCP
**Compute:** Container instances or Kubernetes clusters
**Database:** Managed PostgreSQL service
**Cache:** Managed Redis service
**Storage:** Object storage for files
**CDN:** CloudFront/CloudFlare for static assets
**Monitoring:** CloudWatch/Application Insights

#### Production Configuration
```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gcspends-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gcspends-backend
  template:
    metadata:
      labels:
        app: gcspends-backend
    spec:
      containers:
      - name: backend
        image: gcspends/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

### Production Monitoring
**Application Metrics:** Prometheus + Grafana
**Infrastructure Metrics:** Cloud provider monitoring
**Log Aggregation:** ELK Stack or cloud logging
**Error Tracking:** Sentry or similar service
**Uptime Monitoring:** Pingdom or similar service

#### Monitoring Configuration
```yaml
# Prometheus configuration
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gcspends-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

## Security Technology Stack

### Authentication & Authorization
**Authentication:** JWT tokens with refresh mechanism
**Password Hashing:** bcrypt with salt rounds
**Session Management:** Secure HTTP-only cookies
**Authorization:** Role-based access control (RBAC)
**Rate Limiting:** Redis-based rate limiting

#### Security Configuration
```python
# JWT configuration
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
BCRYPT_ROUNDS = 12
```

### Security Headers
**HSTS:** HTTP Strict Transport Security
**CSP:** Content Security Policy
**X-Frame-Options:** Clickjacking protection
**X-XSS-Protection:** XSS protection
**Referrer-Policy:** Referrer information control

#### Security Headers Configuration
```python
# Security headers middleware
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response
```

## Performance Technology Stack

### Frontend Performance
**Bundle Optimization:** Vite with code splitting
**Lazy Loading:** React.lazy() for route components
**Caching:** Browser caching with service workers
**Compression:** Gzip compression for static assets
**CDN:** Content delivery network for global distribution

#### Frontend Performance Configuration
```typescript
// Vite configuration for performance
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-*'],
          utils: ['date-fns', 'clsx']
        }
      }
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
```

### Backend Performance
**Async Processing:** FastAPI with async/await
**Database Optimization:** Connection pooling and query optimization
**Caching:** Redis for application and database caching
**Compression:** Gzip compression for API responses
**Load Balancing:** Nginx load balancer

#### Backend Performance Configuration
```python
# Database connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Redis caching
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=0,
    decode_responses=True
)
```

## Testing Technology Stack

### Frontend Testing
**Unit Testing:** Jest with React Testing Library
**Integration Testing:** Jest with custom test utilities
**E2E Testing:** Playwright or Cypress
**Visual Testing:** Storybook with Chromatic
**Performance Testing:** Lighthouse CI

#### Frontend Testing Configuration
```javascript
// Jest configuration
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Backend Testing
**Unit Testing:** Pytest with fixtures
**Integration Testing:** FastAPI TestClient
**Database Testing:** Test database with transactions
**API Testing:** Automated API endpoint testing
**Performance Testing:** Locust or similar tool

#### Backend Testing Configuration
```python
# Pytest configuration
@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///./test.db")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
```

## Quality Assurance Technology Stack

### Code Quality
**Linting:** ESLint (frontend), Flake8 (backend)
**Formatting:** Prettier (frontend), Black (backend)
**Type Checking:** TypeScript (frontend), MyPy (backend)
**Security Scanning:** npm audit, safety
**Dependency Management:** Renovate or Dependabot

#### Quality Configuration
```json
// ESLint configuration
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

### CI/CD Pipeline
**Version Control:** Git with GitHub
**CI/CD:** GitHub Actions
**Build:** Automated build and test
**Deployment:** Automated deployment to staging and production
**Quality Gates:** Automated quality checks

#### CI/CD Configuration
```yaml
# GitHub Actions workflow
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
      - name: Run linting
        run: npm run lint
      - name: Build application
        run: npm run build
```

## Data Management Technology Stack

### Database Management
**Primary Database:** PostgreSQL 13+
**Backup:** pg_dump with automated scheduling
**Migrations:** Alembic with version control
**Monitoring:** PostgreSQL statistics and logs
**Optimization:** Query analysis and indexing

#### Database Management Configuration
```python
# Alembic configuration
# alembic.ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql://user:password@localhost:5432/gcspends

# Migration script
def upgrade():
    op.create_table('payment_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('number', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
```

### File Management
**Storage:** Local file system (development), Object storage (production)
**Upload:** Multipart form uploads
**Processing:** File validation and processing
**Security:** File type validation and virus scanning
**Backup:** Automated file backup

#### File Management Configuration
```python
# File upload configuration
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
UPLOAD_FOLDER = 'uploads'

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Process file upload
    pass
```

## Integration Technology Stack

### API Integration
**Protocol:** HTTP/HTTPS with RESTful design
**Format:** JSON for request/response
**Authentication:** JWT Bearer tokens
**Versioning:** URL versioning (/api/v1/)
**Documentation:** OpenAPI/Swagger

#### API Integration Configuration
```python
# FastAPI application configuration
app = FastAPI(
    title="GC Spends API",
    description="Trading Company Automation System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# API versioning
api = FastAPI()
app.mount("/api/v1", api)
```

### External Integrations
**Payment Gateways:** Stripe, PayPal (planned)
**Email Service:** SendGrid, AWS SES (planned)
**SMS Service:** Twilio (planned)
**Document Processing:** PDF generation, Excel export
**Reporting:** Chart.js, D3.js for data visualization

#### External Integration Configuration
```python
# External service configuration
class ExternalServiceConfig:
    STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
```

## Conclusion

The GrainChain Spends system uses a modern, production-ready technology stack that provides:

- **Scalability:** Modern frameworks and tools that can scale horizontally
- **Performance:** Optimized performance with caching and async processing
- **Security:** Comprehensive security measures with authentication and authorization
- **Maintainability:** Clean code with proper testing and quality assurance
- **Reliability:** Robust error handling and monitoring
- **Developer Experience:** Modern development tools and practices

This technology stack ensures the system can handle the demands of a trading company's expense management and payment processing workflow while maintaining high performance, security, and reliability standards.
