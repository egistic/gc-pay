# GC Spends API Documentation

## 📋 Обзор

Полная документация API для системы управления расходами и платежами GC Spends.

## 🚀 Быстрый запуск

### 1. Локальный сервер документации

```bash
# Запуск сервера документации
python3 docs/swagger/serve.py

# Или с кастомным портом
python3 docs/swagger/serve.py 8080
```

### 2. Прямое открытие в браузере

Откройте файл `docs/swagger/index.html` в любом современном браузере.

## 📚 Доступная документация

### 1. Swagger UI (`index.html`)
- **URL**: http://localhost:8001/index.html
- **Описание**: Интерактивная документация с возможностью тестирования API
- **Особенности**:
  - Автоматическое обновление при изменении OpenAPI JSON
  - Возможность отправки тестовых запросов
  - Подсветка синтаксиса
  - Поиск по endpoints

### 2. API Reference (`api-reference.html`)
- **URL**: http://localhost:8001/api-reference.html
- **Описание**: Статическая справочная документация
- **Особенности**:
  - Удобная навигация
  - Подробные примеры
  - Мобильная адаптация
  - Быстрый поиск

### 3. OpenAPI JSON (`openapi.json`)
- **URL**: http://localhost:8001/openapi.json
- **Описание**: Машиночитаемая спецификация API
- **Использование**:
  - Генерация клиентских SDK
  - Интеграция с инструментами разработки
  - Валидация API

## 🔧 Настройка и разработка

### Обновление документации

1. **Обновление OpenAPI спецификации**:
   ```bash
   # Обновите openapi.json
   cp openapi.json docs/swagger/
   ```

2. **Добавление новых endpoints**:
   - Добавьте endpoint в соответствующий router
   - Обновите OpenAPI спецификацию
   - Документация обновится автоматически

### Кастомизация

#### Изменение стилей Swagger UI

Отредактируйте CSS в `index.html`:

```css
.swagger-ui .topbar {
    background-color: #your-color;
}
```

#### Добавление новых разделов

Добавьте новые секции в `api-reference.html`:

```html
<div class="section" id="new-section">
    <div class="section-header">Новый раздел</div>
    <div class="section-content">
        <!-- Содержимое -->
    </div>
</div>
```

## 📊 Статистика API

- **Всего endpoints**: 20
- **Всего schemas**: 25
- **Модулей**: 12
- **Тегов**: 17
- **Размер спецификации**: ~63KB

## 🏗️ Архитектура документации

```
docs/swagger/
├── index.html              # Swagger UI (интерактивная документация)
├── api-reference.html      # Статическая справочная документация
├── openapi.json           # OpenAPI 3.0.2 спецификация
├── serve.py               # HTTP сервер для документации
├── README.md              # Инструкции по использованию
└── documentation.md       # Этот файл
```

## 🔐 Аутентификация в документации

### Swagger UI

1. Нажмите кнопку "Authorize" в правом верхнем углу
2. Введите JWT токен в формате: `Bearer your_token_here`
3. Нажмите "Authorize"

### Тестирование API

1. Выберите endpoint для тестирования
2. Нажмите "Try it out"
3. Заполните параметры запроса
4. Нажмите "Execute"

## 🌐 Развертывание

### Локальное развертывание

```bash
# Клонирование репозитория
git clone <repository-url>
cd gp_pay

# Запуск документации
python3 docs/swagger/serve.py
```

### Продакшн развертывание

1. **Nginx**:
   ```nginx
   server {
       listen 80;
       server_name api-docs.yourdomain.com;
       root /path/to/gp_pay/docs/swagger;
       index index.html;
   }
   ```

2. **Apache**:
   ```apache
   <VirtualHost *:80>
       ServerName api-docs.yourdomain.com
       DocumentRoot /path/to/gp_pay/docs/swagger
       DirectoryIndex index.html
   </VirtualHost>
   ```

3. **Docker**:
   ```dockerfile
   FROM nginx:alpine
   COPY docs/swagger /usr/share/nginx/html
   EXPOSE 80
   ```

## 📞 Поддержка

- **Email**: support@gcspends.com
- **Команда**: GC Spends Team
- **Лицензия**: MIT

## 🔄 Версионирование

- **API версия**: 1.0.0
- **OpenAPI версия**: 3.0.2
- **Документация версия**: 1.0.0

---

*Документация автоматически генерируется на основе OpenAPI спецификации*
