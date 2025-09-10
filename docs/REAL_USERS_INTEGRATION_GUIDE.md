# Руководство по интеграции реальных пользователей

## Обзор

Этот документ описывает процесс интеграции реальных пользователей в систему GrainChain Spends, заменяя захардкоженные ID на динамическую аутентификацию и авторизацию.

## Текущее состояние

### Захардкоженные пользователи в коде

**Frontend:**
- `3394830b-1b62-4db4-a6e4-fdf76b5033f5` - основной исполнитель
- `6c626090-ab4a-44c2-a16d-01b73423557b` - Айгуль Нурланова

**Backend:**
- `8e1ff15d-79ea-48a6-ba30-59f64dcc9f6d` - регистратор

### Проблемы текущей реализации

1. **Отсутствие аутентификации** - нет системы входа/выхода
2. **Захардкоженные ID** - пользователи жестко прописаны в коде
3. **Нет контекста пользователя** - отсутствует глобальное состояние пользователя
4. **Отсутствие JWT токенов** - нет безопасной передачи данных о пользователе

## План интеграции

### Этап 1: Создание системы аутентификации

#### 1.1 Backend - JWT аутентификация

**Файлы для создания/изменения:**
- `gc-spends-backend/app/modules/auth/` - новый модуль аутентификации
- `gc-spends-backend/app/core/security.py` - JWT утилиты
- `gc-spends-backend/app/modules/users/` - управление пользователями

**Ключевые компоненты:**

```python
# app/modules/auth/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password, get_password_hash
from app.modules.users.user_service import UserService

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Аутентификация пользователя"""
    user = await UserService.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "roles": [role.role.code for role in user.user_roles]
        }
    }

@router.get("/me")
async def get_current_user(current_user: User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "roles": [role.role.code for role in current_user.user_roles]
    }
```

#### 1.2 Frontend - Контекст аутентификации

**Файлы для создания/изменения:**
- `frontend/src/context/AuthContext.tsx` - контекст аутентификации
- `frontend/src/hooks/useAuth.ts` - хук для работы с аутентификацией
- `frontend/src/services/authService.ts` - сервис аутентификации
- `frontend/src/components/auth/` - компоненты входа/регистрации

**Ключевые компоненты:**

```typescript
// context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('access_token', response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  // ... остальная логика
};
```

### Этап 2: Замена захардкоженных ID

#### 2.1 Создание хука для получения текущего пользователя

```typescript
// hooks/useCurrentUser.ts
export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};
```

#### 2.2 Обновление компонентов

**Файлы для изменения:**
- `frontend/src/components/executor/OptimizedCreateRequestForm.tsx`
- `frontend/src/components/layout/Navigation.tsx`
- `frontend/src/components/App/AppRouter.tsx`

**Пример замены:**

```typescript
// Было:
createdBy: '3394830b-1b62-4db4-a6e4-fdf76b5033f5',

// Стало:
const { user } = useCurrentUser();
createdBy: user?.id,
```

### Этап 3: Система ролей и разрешений

#### 3.1 Создание хука для проверки ролей

```typescript
// hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useCurrentUser();
  
  const hasRole = (role: string) => {
    return user?.roles?.includes(role) || false;
  };
  
  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => hasRole(role));
  };
  
  return { hasRole, hasAnyRole };
};
```

#### 3.2 Обновление роутинга

```typescript
// components/App/AppRouter.tsx
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  requiredRoles?: string[] 
}> = ({ children, requiredRoles }) => {
  const { isAuthenticated } = useAuth();
  const { hasAnyRole } = usePermissions();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

### Этап 4: Миграция данных

#### 4.1 SQL скрипт для обновления существующих данных

```sql
-- Обновить created_by в существующих заявках
UPDATE payment_requests 
SET created_by = '3394830b-1b62-4db4-a6e4-fdf76b5033f5'::uuid
WHERE created_by IS NULL;

-- Обновить user_id в статистике
UPDATE request_statistics 
SET user_id = '3394830b-1b62-4db4-a6e4-fdf76b5033f5'::uuid
WHERE user_id IS NULL;
```

#### 4.2 Скрипт миграции

```bash
#!/bin/bash
# migrate_to_real_users.sh

echo "Starting migration to real users..."

# 1. Backup current data
pg_dump $DATABASE_URL > backup_before_migration.sql

# 2. Run migration SQL
psql $DATABASE_URL -f migrate_user_data.sql

# 3. Verify migration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payment_requests WHERE created_by IS NOT NULL;"

echo "Migration completed!"
```

## Пошаговая реализация

### Шаг 1: Backend аутентификация

1. **Создать модуль аутентификации:**
   ```bash
   mkdir -p gc-spends-backend/app/modules/auth
   touch gc-spends-backend/app/modules/auth/__init__.py
   touch gc-spends-backend/app/modules/auth/auth_router.py
   touch gc-spends-backend/app/modules/auth/auth_service.py
   ```

2. **Обновить main.py:**
   ```python
   from app.modules.auth.auth_router import router as auth_router
   api.include_router(auth_router)
   ```

3. **Создать зависимости для JWT:**
   ```python
   # app/core/dependencies.py
   from fastapi import Depends, HTTPException, status
   from fastapi.security import OAuth2PasswordBearer
   from app.modules.users.user_service import UserService
   
   oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
   
   async def get_current_user(token: str = Depends(oauth2_scheme)):
       # Логика получения пользователя по JWT токену
       pass
   ```

### Шаг 2: Frontend аутентификация

1. **Создать контекст аутентификации:**
   ```bash
   mkdir -p frontend/src/context
   touch frontend/src/context/AuthContext.tsx
   ```

2. **Создать сервис аутентификации:**
   ```bash
   mkdir -p frontend/src/services/auth
   touch frontend/src/services/auth/authService.ts
   ```

3. **Обновить App.tsx:**
   ```typescript
   import { AuthProvider } from './context/AuthContext';
   
   function App() {
     return (
       <AuthProvider>
         <AppRouter />
       </AuthProvider>
     );
   }
   ```

### Шаг 3: Замена захардкоженных ID

1. **Найти все вхождения захардкоженных ID:**
   ```bash
   grep -r "3394830b-1b62-4db4-a6e4-fdf76b5033f5" frontend/src/
   grep -r "6c626090-ab4a-44c2-a16d-01b73423557b" frontend/src/
   ```

2. **Заменить на динамические значения:**
   - Использовать `useCurrentUser()` для получения ID пользователя
   - Добавить проверки на существование пользователя
   - Обработать случаи, когда пользователь не аутентифицирован

### Шаг 4: Тестирование

1. **Создать тестовых пользователей:**
   ```sql
   -- Создать тестовых пользователей с разными ролями
   INSERT INTO users (id, full_name, email, password_hash, is_active) VALUES
   ('test-executor-1', 'Test Executor', 'test-executor@example.com', '$2b$12$...', true),
   ('test-registrar-1', 'Test Registrar', 'test-registrar@example.com', '$2b$12$...', true);
   ```

2. **Создать тесты:**
   ```bash
   mkdir -p frontend/src/__tests__
   touch frontend/src/__tests__/auth.test.tsx
   ```

## Безопасность

### JWT токены
- Использовать короткое время жизни (15-30 минут)
- Реализовать refresh токены
- Добавить проверку отзыва токенов

### Пароли
- Минимальная длина: 8 символов
- Требовать сложность пароля
- Реализовать сброс пароля

### Роли и разрешения
- Проверять роли на каждом запросе
- Использовать middleware для проверки разрешений
- Логировать все действия пользователей

## Мониторинг и логирование

### Логи аутентификации
```python
# app/core/logging.py
import logging

auth_logger = logging.getLogger("auth")

def log_auth_event(event_type: str, user_id: str, details: dict = None):
    auth_logger.info(f"Auth event: {event_type}", extra={
        "user_id": user_id,
        "details": details or {}
    })
```

### Метрики
- Количество успешных/неуспешных входов
- Время сессии пользователей
- Попытки несанкционированного доступа

## Развертывание

### Переменные окружения
```bash
# Backend
JWT_SECRET=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
VITE_API_BASE_URL=https://gcback.openlayers.kz
VITE_APP_NAME=GrainChain Spends
```

### Миграция базы данных
```bash
# Создать миграцию для новых полей
alembic revision --autogenerate -m "Add auth fields"

# Применить миграцию
alembic upgrade head
```

## Обратная совместимость

### План миграции
1. **Фаза 1:** Добавить аутентификацию параллельно с существующей системой
2. **Фаза 2:** Постепенно заменять захардкоженные ID
3. **Фаза 3:** Полностью перейти на динамическую аутентификацию
4. **Фаза 4:** Удалить захардкоженные ID из кода

### Fallback механизмы
- Если пользователь не аутентифицирован, использовать дефолтного пользователя
- Логировать все случаи использования fallback
- Предупреждать администраторов о проблемах с аутентификацией

## Заключение

Интеграция реальных пользователей требует:
1. Создания полноценной системы аутентификации
2. Замены всех захардкоженных ID на динамические значения
3. Реализации системы ролей и разрешений
4. Тщательного тестирования и миграции данных

Этот процесс должен выполняться поэтапно с тщательным тестированием на каждом этапе.
