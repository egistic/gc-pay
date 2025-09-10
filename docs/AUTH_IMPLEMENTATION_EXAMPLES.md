# Примеры реализации аутентификации

## Backend - FastAPI + JWT

### 1. Модуль аутентификации

```python
# app/modules/auth/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.modules.users.user_service import UserService
from app.modules.users.user_models import User

router = APIRouter(prefix="/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Аутентификация пользователя"""
    user = await UserService.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "roles": [user_role.role.code for user_role in user.user_roles]
        }
    }

@router.get("/me")
async def get_current_user(current_user: User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "roles": [user_role.role.code for user_role in current_user.user_roles]
    }

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Получить текущего пользователя из JWT токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await UserService.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exception
    
    return user
```

### 2. Сервис пользователей

```python
# app/modules/users/user_service.py
from sqlalchemy.orm import Session
from app.core.security import verify_password, get_password_hash
from app.modules.users.user_models import User
from app.modules.users.user_roles_models import UserRole

class UserService:
    @staticmethod
    async def authenticate_user(db: Session, email: str, password: str) -> User | None:
        """Аутентификация пользователя по email и паролю"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
    
    @staticmethod
    async def get_user_by_id(db: Session, user_id: str) -> User | None:
        """Получить пользователя по ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    async def get_user_roles(db: Session, user_id: str) -> list[str]:
        """Получить роли пользователя"""
        user_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
        return [user_role.role.code for user_role in user_roles]
```

### 3. Обновление main.py

```python
# app/main.py
from app.modules.auth.auth_router import router as auth_router

# Добавить роутер аутентификации
api.include_router(auth_router)
```

## Frontend - React + TypeScript

### 1. Контекст аутентификации

```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth/authService';

interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверить сохраненный токен при загрузке
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.getCurrentUser()
        .then(userData => setUser(userData))
        .catch(() => {
          localStorage.removeItem('access_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('access_token', response.access_token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. Сервис аутентификации

```typescript
// services/auth/authService.ts
import { httpClient } from '../httpClient';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    roles: string[];
  };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await httpClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await httpClient.get('/auth/me');
    return response.data;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
```

### 3. Хук для текущего пользователя

```typescript
// hooks/useCurrentUser.ts
import { useAuth } from '../context/AuthContext';

export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};
```

### 4. Хук для проверки ролей

```typescript
// hooks/usePermissions.ts
import { useCurrentUser } from './useCurrentUser';

export const usePermissions = () => {
  const user = useCurrentUser();
  
  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };
  
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };
  
  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  };
  
  return { 
    hasRole, 
    hasAnyRole, 
    hasAllRoles,
    userRoles: user?.roles || []
  };
};
```

### 5. Защищенный роут

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [],
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
```

### 6. Компонент входа

```typescript
// components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Неверный email или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
};
```

### 7. Обновление существующих компонентов

```typescript
// components/executor/OptimizedCreateRequestForm.tsx
// Заменить захардкоженный ID на динамический

// Было:
createdBy: '3394830b-1b62-4db4-a6e4-fdf76b5033f5',

// Стало:
const { user } = useCurrentUser();
createdBy: user?.id,
```

### 8. Обновление App.tsx

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './components/App/AppRouter';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Router>
  );
}

export default App;
```

## Миграция данных

### SQL скрипт для обновления существующих данных

```sql
-- migrate_to_auth_users.sql

-- Обновить created_by в существующих заявках
UPDATE payment_requests 
SET created_by = '3394830b-1b62-4db4-a6e4-fdf76b5033f5'::uuid
WHERE created_by IS NULL;

-- Обновить user_id в статистике
UPDATE request_statistics 
SET user_id = '3394830b-1b62-4db4-a6e4-fdf76b5033f5'::uuid
WHERE user_id IS NULL;

-- Добавить индексы для производительности
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_by ON payment_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
```

## Тестирование

### Unit тесты

```typescript
// __tests__/auth.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';

// Mock authService
jest.mock('../services/auth/authService', () => ({
  authService: {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

describe('AuthContext', () => {
  it('should login user successfully', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      access_token: 'mock-token',
      user: { id: '1', email: 'test@example.com', full_name: 'Test User', roles: ['executor'] }
    });
    
    // Test implementation
  });
});
```

## Развертывание

### Переменные окружения

```bash
# .env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Docker обновления

```dockerfile
# Dockerfile для backend
# Добавить переменные окружения для JWT
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_ALGORITHM=${JWT_ALGORITHM}
ENV JWT_ACCESS_TOKEN_EXPIRE_MINUTES=${JWT_ACCESS_TOKEN_EXPIRE_MINUTES}
```

Этот пример кода предоставляет полную основу для интеграции реальных пользователей в систему GrainChain Spends.
