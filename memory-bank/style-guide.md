# STYLE GUIDE: GrainChain Spends Development Standards

## Project Overview
**System:** GrainChain Spends - Trading Company Automation System  
**Purpose:** Comprehensive development standards and guidelines  
**Scope:** Frontend, Backend, Database, and Infrastructure  
**Status:** Production-Ready Standards  

## Code Style Standards

### Frontend Code Style (React + TypeScript)

#### Component Structure
```typescript
// Component file structure
import React, { useState, useEffect } from 'react';
import { ComponentProps } from '../types';

// Interface definitions
interface ComponentProps {
  data: DataType;
  onAction: (action: ActionType) => void;
  loading?: boolean;
  className?: string;
}

// Component implementation
const Component: React.FC<ComponentProps> = ({ 
  data, 
  onAction, 
  loading = false,
  className = ''
}) => {
  // State declarations
  const [state, setState] = useState<StateType>(initialState);
  
  // Effect hooks
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleAction = (action: ActionType) => {
    onAction(action);
  };
  
  // Render
  return (
    <div className={`component-container ${className}`}>
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

#### Naming Conventions
```typescript
// File naming: PascalCase for components
PaymentRequestForm.tsx
UserManagement.tsx
StatisticsDashboard.tsx

// Component naming: PascalCase
const PaymentRequestForm = () => {};

// Function naming: camelCase
const handleSubmit = () => {};
const fetchUserData = () => {};

// Variable naming: camelCase
const userData = {};
const isLoading = false;

// Constant naming: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8000';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Interface naming: PascalCase with descriptive suffix
interface PaymentRequestProps {}
interface UserData {}
interface ApiResponse {}
```

#### TypeScript Standards
```typescript
// Strict type definitions
interface PaymentRequest {
  id: string;
  number: string;
  title: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Generic types
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Union types
type UserRole = 'executor' | 'registrar' | 'distributor' | 'treasurer' | 'admin';

// Optional properties
interface ComponentProps {
  required: string;
  optional?: string;
  withDefault?: boolean;
}

// Function signatures
const processPaymentRequest = (
  request: PaymentRequest,
  action: 'approve' | 'reject'
): Promise<ApiResponse<PaymentRequest>> => {
  // Implementation
};
```

#### React Hooks Standards
```typescript
// Custom hook structure
export const usePaymentRequests = (filters?: FilterType) => {
  const [data, setData] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
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
  
  return { data, loading, error, refetch: fetchData };
};

// Context hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

### Backend Code Style (Python + FastAPI)

#### File Structure
```python
# Module file structure
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.models import PaymentRequest
from app.schemas import PaymentRequestCreate, PaymentRequestOut
from app.services import PaymentRequestService

# Router definition
router = APIRouter(prefix="/payment-requests", tags=["payment-requests"])

# Route handlers
@router.get("", response_model=List[PaymentRequestOut])
async def get_payment_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[PaymentRequestOut]:
    """Get list of payment requests with pagination."""
    return PaymentRequestService.get_all(db, skip=skip, limit=limit)

@router.post("", response_model=PaymentRequestOut, status_code=status.HTTP_201_CREATED)
async def create_payment_request(
    request: PaymentRequestCreate,
    db: Session = Depends(get_db)
) -> PaymentRequestOut:
    """Create a new payment request."""
    return PaymentRequestService.create(db, request)
```

#### Naming Conventions
```python
# File naming: snake_case
payment_request_service.py
user_management.py
statistics_dashboard.py

# Class naming: PascalCase
class PaymentRequestService:
    pass

class UserManagement:
    pass

# Function naming: snake_case
def get_payment_requests():
    pass

def create_user():
    pass

# Variable naming: snake_case
user_data = {}
is_loading = False
payment_requests = []

# Constant naming: UPPER_SNAKE_CASE
API_BASE_URL = "http://localhost:8000"
MAX_FILE_SIZE = 10 * 1024 * 1024

# Module naming: snake_case
payment_request_service
user_management
statistics_dashboard
```

#### Type Hints
```python
# Function type hints
def process_payment_request(
    request_id: uuid.UUID,
    action: str,
    user_id: uuid.UUID
) -> Dict[str, Any]:
    """Process payment request with type hints."""
    pass

# Class type hints
class PaymentRequestService:
    def __init__(self, db: Session) -> None:
        self.db = db
    
    def get_by_id(self, request_id: uuid.UUID) -> Optional[PaymentRequest]:
        """Get payment request by ID."""
        pass
    
    def create(self, data: PaymentRequestCreate) -> PaymentRequest:
        """Create new payment request."""
        pass

# Generic types
from typing import TypeVar, Generic

T = TypeVar('T')

class Repository(Generic[T]):
    def __init__(self, model: Type[T]) -> None:
        self.model = model
    
    def get_by_id(self, id: uuid.UUID) -> Optional[T]:
        pass
```

#### Error Handling
```python
# Custom exceptions
class PaymentRequestNotFoundError(Exception):
    """Raised when payment request is not found."""
    pass

class InsufficientPermissionsError(Exception):
    """Raised when user lacks required permissions."""
    pass

# Error handling in routes
@router.get("/{request_id}", response_model=PaymentRequestOut)
async def get_payment_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db)
) -> PaymentRequestOut:
    try:
        request = PaymentRequestService.get_by_id(db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment request not found"
            )
        return request
    except PaymentRequestNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
```

### Database Style Standards

#### Model Definitions
```python
# SQLAlchemy model structure
from __future__ import annotations

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class PaymentRequest(Base):
    __tablename__ = "payment_requests"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Required fields
    number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Optional fields
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    
    # Foreign keys
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), 
        nullable=False
    )
    counterparty_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("counterparties.id"), 
        nullable=False
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    created_by: Mapped["User"] = relationship("User", back_populates="payment_requests")
    counterparty: Mapped["Counterparty"] = relationship("Counterparty")
    lines: Mapped[List["PaymentRequestLine"]] = relationship(
        "PaymentRequestLine", 
        back_populates="request"
    )
```

#### Migration Standards
```python
# Alembic migration structure
"""Create payment requests table

Revision ID: 001_create_payment_requests
Revises: 
Create Date: 2025-01-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_create_payment_requests'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Create payment_requests table."""
    op.create_table(
        'payment_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('number', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('description', sa.String(1000), nullable=True),
        sa.Column('created_by_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('counterparty_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('number'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['counterparty_id'], ['counterparties.id'])
    )
    
    # Create indexes
    op.create_index('ix_payment_requests_status', 'payment_requests', ['status'])
    op.create_index('ix_payment_requests_created_at', 'payment_requests', ['created_at'])

def downgrade() -> None:
    """Drop payment_requests table."""
    op.drop_index('ix_payment_requests_created_at', table_name='payment_requests')
    op.drop_index('ix_payment_requests_status', table_name='payment_requests')
    op.drop_table('payment_requests')
```

## UI/UX Style Standards

### Design System
```css
/* Color palette */
:root {
  /* Primary colors */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  /* Secondary colors */
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-500: #64748b;
  --secondary-600: #475569;
  --secondary-700: #334155;
  
  /* Status colors */
  --success-500: #10b981;
  --warning-500: #f59e0b;
  --error-500: #ef4444;
  --info-500: #06b6d4;
  
  /* Neutral colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-900: #111827;
}

/* Typography */
.text-heading-1 {
  @apply text-4xl font-bold text-gray-900;
}

.text-heading-2 {
  @apply text-3xl font-semibold text-gray-900;
}

.text-heading-3 {
  @apply text-2xl font-semibold text-gray-900;
}

.text-body {
  @apply text-base text-gray-700;
}

.text-caption {
  @apply text-sm text-gray-500;
}
```

### Component Standards
```typescript
// Button component standards
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
};
```

### Layout Standards
```typescript
// Layout component standards
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Grid system
const Grid: React.FC<{ 
  cols: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}> = ({ cols, gap = 'md', children }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12'
  };
  
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };
  
  return (
    <div className={`grid ${gridClasses[cols]} ${gapClasses[gap]}`}>
      {children}
    </div>
  );
};
```

## API Style Standards

### RESTful API Design
```python
# API endpoint standards
@router.get("", response_model=List[PaymentRequestOut])
async def get_payment_requests(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
) -> List[PaymentRequestOut]:
    """Get list of payment requests with pagination and filtering."""
    pass

@router.get("/{request_id}", response_model=PaymentRequestOut)
async def get_payment_request(
    request_id: uuid.UUID = Path(..., description="Payment request ID"),
    db: Session = Depends(get_db)
) -> PaymentRequestOut:
    """Get payment request by ID."""
    pass

@router.post("", response_model=PaymentRequestOut, status_code=status.HTTP_201_CREATED)
async def create_payment_request(
    request: PaymentRequestCreate = Body(..., description="Payment request data"),
    db: Session = Depends(get_db)
) -> PaymentRequestOut:
    """Create a new payment request."""
    pass

@router.put("/{request_id}", response_model=PaymentRequestOut)
async def update_payment_request(
    request_id: uuid.UUID = Path(..., description="Payment request ID"),
    request: PaymentRequestUpdate = Body(..., description="Updated payment request data"),
    db: Session = Depends(get_db)
) -> PaymentRequestOut:
    """Update payment request by ID."""
    pass

@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_request(
    request_id: uuid.UUID = Path(..., description="Payment request ID"),
    db: Session = Depends(get_db)
) -> None:
    """Delete payment request by ID."""
    pass
```

### Response Standards
```python
# Standard response format
class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

# Success response
{
    "success": true,
    "message": "Payment request created successfully",
    "data": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "number": "REQ-000001",
        "title": "Office Supplies",
        "status": "draft"
    }
}

# Error response
{
    "success": false,
    "message": "Validation error",
    "errors": [
        "Title is required",
        "Counterparty ID is invalid"
    ]
}
```

### Error Handling Standards
```python
# HTTP status codes
200 OK - Successful GET, PUT, PATCH
201 Created - Successful POST
204 No Content - Successful DELETE
400 Bad Request - Client error
401 Unauthorized - Authentication required
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
422 Unprocessable Entity - Validation error
500 Internal Server Error - Server error

# Error response format
class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
```

## Testing Style Standards

### Frontend Testing
```typescript
// Component testing standards
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentRequestForm } from './PaymentRequestForm';

describe('PaymentRequestForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });
  
  it('renders form fields correctly', () => {
    render(<PaymentRequestForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/counterparty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
  
  it('submits form with valid data', async () => {
    render(<PaymentRequestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Request' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Request',
        counterpartyId: expect.any(String)
      });
    });
  });
  
  it('shows validation errors for invalid data', async () => {
    render(<PaymentRequestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });
});
```

### Backend Testing
```python
# API testing standards
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

def test_get_payment_requests(client: TestClient, db_session: Session):
    """Test getting payment requests."""
    response = client.get("/api/v1/payment-requests")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_create_payment_request(client: TestClient, db_session: Session):
    """Test creating payment request."""
    request_data = {
        "title": "Test Request",
        "counterparty_id": "123e4567-e89b-12d3-a456-426614174000",
        "currency_code": "KZT",
        "due_date": "2025-12-31"
    }
    
    response = client.post("/api/v1/payment-requests", json=request_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == request_data["title"]
    assert "id" in data

def test_create_payment_request_validation_error(client: TestClient, db_session: Session):
    """Test validation error for invalid data."""
    request_data = {
        "title": "",  # Invalid: empty title
        "counterparty_id": "invalid-uuid"
    }
    
    response = client.post("/api/v1/payment-requests", json=request_data)
    
    assert response.status_code == 422
    data = response.json()
    assert "errors" in data
```

## Documentation Standards

### Code Documentation
```python
# Function documentation
def process_payment_request(
    request_id: uuid.UUID,
    action: str,
    user_id: uuid.UUID
) -> Dict[str, Any]:
    """
    Process payment request with specified action.
    
    Args:
        request_id: Unique identifier for the payment request
        action: Action to perform ('approve', 'reject', 'return')
        user_id: ID of the user performing the action
    
    Returns:
        Dictionary containing processing result and updated request data
    
    Raises:
        PaymentRequestNotFoundError: If request with given ID doesn't exist
        InsufficientPermissionsError: If user lacks required permissions
        ValidationError: If action is invalid or request state doesn't allow action
    
    Example:
        >>> result = process_payment_request(
        ...     request_id=uuid.uuid4(),
        ...     action='approve',
        ...     user_id=uuid.uuid4()
        ... )
        >>> print(result['status'])
        'approved'
    """
    pass
```

### API Documentation
```python
# API endpoint documentation
@router.post(
    "",
    response_model=PaymentRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create payment request",
    description="Create a new payment request with the provided data",
    response_description="The created payment request",
    responses={
        201: {
            "description": "Payment request created successfully",
            "model": PaymentRequestOut
        },
        422: {
            "description": "Validation error",
            "model": ValidationError
        }
    }
)
async def create_payment_request(
    request: PaymentRequestCreate = Body(
        ...,
        description="Payment request data",
        example={
            "title": "Office Supplies",
            "counterparty_id": "123e4567-e89b-12d3-a456-426614174000",
            "currency_code": "KZT",
            "due_date": "2025-12-31"
        }
    ),
    db: Session = Depends(get_db)
) -> PaymentRequestOut:
    """
    Create a new payment request.
    
    This endpoint creates a new payment request with the provided data.
    The request will be created in 'draft' status and can be modified
    until it is submitted for approval.
    """
    pass
```

## Performance Standards

### Frontend Performance
```typescript
// Performance optimization standards
// 1. Lazy loading for route components
const PaymentRequests = lazy(() => import('./PaymentRequests'));

// 2. Memoization for expensive calculations
const MemoizedComponent = memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// 3. Debounced search
const useDebouncedSearch = (searchTerm: string, delay: number = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  
  return debouncedTerm;
};
```

### Backend Performance
```python
# Performance optimization standards
# 1. Database query optimization
def get_payment_requests_optimized(db: Session, skip: int = 0, limit: int = 100):
    """Optimized query with proper joins and indexes."""
    return db.query(PaymentRequest)\
        .options(joinedload(PaymentRequest.created_by))\
        .options(joinedload(PaymentRequest.counterparty))\
        .offset(skip)\
        .limit(limit)\
        .all()

# 2. Caching with Redis
@cache(expire=300)  # 5 minutes
def get_statistics(role: str) -> Dict[str, Any]:
    """Cached statistics calculation."""
    pass

# 3. Async processing
async def process_payment_request_async(request_id: uuid.UUID):
    """Async processing for long-running operations."""
    pass
```

## Security Standards

### Input Validation
```python
# Input validation standards
from pydantic import BaseModel, validator, Field

class PaymentRequestCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Request title")
    counterparty_id: uuid.UUID = Field(..., description="Counterparty ID")
    currency_code: str = Field(..., regex="^[A-Z]{3}$", description="Currency code")
    due_date: date = Field(..., description="Due date")
    
    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
    
    @validator('due_date')
    def validate_due_date(cls, v):
        if v < date.today():
            raise ValueError('Due date cannot be in the past')
        return v
```

### Authentication Standards
```python
# Authentication standards
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
```

## Conclusion

This style guide ensures consistent, maintainable, and high-quality code across the GrainChain Spends system. By following these standards, the development team can:

- **Maintain Consistency:** Uniform code style across all components
- **Improve Readability:** Clear and understandable code structure
- **Enhance Maintainability:** Easy to modify and extend codebase
- **Ensure Quality:** High standards for testing and documentation
- **Promote Security:** Secure coding practices and validation
- **Optimize Performance:** Performance-focused development practices

These standards should be enforced through automated tools (ESLint, Prettier, Black, Flake8) and code review processes to ensure consistent application across the entire codebase.
