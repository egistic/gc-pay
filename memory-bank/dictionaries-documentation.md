# Документация по справочникам системы

## Обзор

Система использует следующие справочники для работы с заявками на оплату:

1. **Контрагенты** (`/api/v1/dictionaries/counterparties`)
2. **Статьи расходов** (`/api/v1/dictionaries/expense-articles`)
3. **Валюты** (`/api/v1/dictionaries/currencies`)
4. **Ставки НДС** (`/api/v1/dictionaries/vat-rates`)
5. **Приоритеты** (`/api/v1/dictionaries/priorities`)

## 1. Контрагенты (Counterparties)

### API Endpoint
```
GET /api/v1/dictionaries/counterparties
```

### Параметры запроса
- `active_only` (boolean, default: true) - только активные контрагенты
- `search` (string, optional) - поиск по названию или БИН/ИИН
- `category` (string, optional) - фильтр по категории

### Структура данных
```json
{
  "id": "uuid",
  "name": "string",           // Название контрагента
  "tax_id": "string|null",    // БИН/ИИН
  "category": "string|null",  // Категория
  "is_active": "boolean"      // Активность
}
```

### Категории контрагентов
- **Поставщик СХ** - поставщики сельскохозяйственной продукции
- **Элеватор** - элеваторы и хлебные базы
- **Поставщик Услуг** - поставщики различных услуг
- **Покупатель** - покупатели продукции
- **Партнер/БВУ** - партнеры и банковско-финансовые учреждения
- **Bulk** - массовые контрагенты
- **Test** - тестовые контрагенты

### Примеры использования
```javascript
// Получить всех активных контрагентов
const counterparties = await fetch('/api/v1/dictionaries/counterparties');

// Поиск по названию
const searchResults = await fetch('/api/v1/dictionaries/counterparties?search=Agrimer');

// Фильтр по категории
const elevators = await fetch('/api/v1/dictionaries/counterparties?category=Элеватор');
```

## 2. Статьи расходов (Expense Articles)

### API Endpoint
```
GET /api/v1/dictionaries/expense-articles
```

### Параметры запроса
- `active_only` (boolean, default: true) - только активные статьи
- `search` (string, optional) - поиск по названию или коду

### Структура данных
```json
{
  "id": "uuid",
  "code": "string",           // Код статьи расходов
  "name": "string",           // Название статьи расходов
  "description": "string|null", // Описание статьи
  "is_active": "boolean"      // Активность
}
```

### Основные статьи расходов

#### Базовые статьи (коды 001-010)
- **001** - Закупка зерна
- **002** - Транспортные услуги
- **003** - Складские услуги
- **004** - Техническое обслуживание
- **005** - Энергоресурсы
- **006** - Услуги связи
- **007** - Консультационные услуги
- **008** - Аренда
- **009** - Страхование
- **010** - Обучение персонала

#### Специализированные статьи (коды EA001-EA049)
- **EA001** - Закуп товара
- **EA002** - Приемка
- **EA003** - Сушка/Подработка
- **EA004** - Доставка
- **EA005** - Агентские по закупу
- **EA006** - Хранение (EXW)
- **EA007** - Недостача/аспирация (EXW)
- **EA008** - Услуги элеватора
- **EA009** - Оборудование ТС
- **EA010** - ЗПУ
- **EA011** - Декл. соот. (сертиф.)
- **EA012** - Фитосанитария (сертиф.)
- **EA013** - Происхождение (сертиф.)
- **EA014** - Таможенный сбор (сертиф.)
- **EA015** - Таможенный брокер (сертиф.)
- **EA016** - Доп. Сертификаты (сертиф.)
- **EA017** - Сюрвейер (инспекция)
- **EA018** - Сюрвейер (пробы)
- **EA019** - Сюрвейер (доп. анализы)
- **EA020** - Фумигация
- **EA021** - Командировочные расходы
- **EA022** - Доп. Расходы по погрузке
- **EA023** - Агентские (FCA)
- **EA024** - ЖД услуги (ПП)
- **EA025** - ЖД услуги (техПД)
- **EA026** - Штрафы по вагонам (ТЭО)
- **EA027** - Штраф неисп. ГУ
- **EA028** - Станционный простой
- **EA029** - Логистика ТЭО 1
- **EA030** - Логистика ТЭО 2
- **EA031** - Логистика ТЭО 3
- **EA032** - Агентские (логистика ТЭО)
- **EA033** - Штрафы по вагонам (CPT)
- **EA034** - Недостача/аспирация (CPT)
- **EA035** - Недостача/аспирация (FOB)
- **EA036** - Перевалка
- **EA037** - Экспедирование в терминале
- **EA038** - Доп. Расходы в терминале
- **EA039** - Сюрвейер в терминале
- **EA040** - Фрахт
- **EA041** - Страховка
- **EA042** - Недостача/аспирация (CIF)
- **EA043** - Доп. Расходы на выгрузке (CIF)
- **EA044** - Пошлина
- **EA045** - Брокерские
- **EA046** - Стоимость финансирования
- **EA047** - Услуги посредника-контрактодержателя
- **EA048** - Штраф за качество
- **EA049** - Штраф за сроки

#### Тестовые статьи
- **FE001** - Frontend Test Article
- **TEST001** - Тестовая статья расходов

### Примеры использования
```javascript
// Получить все активные статьи расходов
const articles = await fetch('/api/v1/dictionaries/expense-articles');

// Поиск по названию
const searchResults = await fetch('/api/v1/dictionaries/expense-articles?search=транспорт');

// Получить статью по коду
const specificArticle = await fetch('/api/v1/dictionaries/expense-articles?search=001');
```

## 3. Валюты (Currencies)

### API Endpoint
```
GET /api/v1/dictionaries/currencies
```

### Структура данных
```json
{
  "code": "string",    // Код валюты (ISO 4217)
  "scale": "integer"   // Количество знаков после запятой
}
```

### Поддерживаемые валюты
- **KZT** - Казахстанский тенге (scale: 2)
- **USD** - Доллар США (scale: 2)
- **EUR** - Евро (scale: 2)
- **RUB** - Российский рубль (scale: 2)

### Примеры использования
```javascript
// Получить все валюты
const currencies = await fetch('/api/v1/dictionaries/currencies');

// Получить конкретную валюту
const usd = await fetch('/api/v1/dictionaries/currencies/USD');
```

## 4. Ставки НДС (VAT Rates)

### API Endpoint
```
GET /api/v1/dictionaries/vat-rates
```

### Параметры запроса
- `active_only` (boolean, default: true) - только активные ставки
- `search` (string, optional) - поиск по названию

### Структура данных
```json
{
  "id": "uuid",
  "rate": "number",    // Ставка НДС (от 0 до 1)
  "name": "string",    // Название ставки
  "is_active": "boolean" // Активность
}
```

### Поддерживаемые ставки НДС
- **0%** - Нулевая ставка НДС
- **12%** - Стандартная ставка НДС (12%)
- **16%** - Повышенная ставка НДС (16%)
- **20%** - Максимальная ставка НДС (20%)

### Примеры использования
```javascript
// Получить все активные ставки НДС
const vatRates = await fetch('/api/v1/dictionaries/vat-rates');

// Поиск по названию
const zeroRate = await fetch('/api/v1/dictionaries/vat-rates?search=0%');
```

## 5. Приоритеты (Priorities)

### API Endpoint
```
GET /api/v1/dictionaries/priorities
```

### Структура данных
```json
{
  "id": "string",      // Идентификатор приоритета
  "name": "string",    // Название приоритета
  "rank": "integer",   // Ранг приоритета (1 = высший)
  "color": "string"    // Цвет для отображения (HEX)
}
```

### Поддерживаемые приоритеты
- **high** - Высокий (rank: 1, color: #ef4444)
- **medium** - Средний (rank: 2, color: #f59e0b)
- **low** - Низкий (rank: 3, color: #10b981)

### Примеры использования
```javascript
// Получить все приоритеты
const priorities = await fetch('/api/v1/dictionaries/priorities');
```

## Интеграция с ролями

### Для роли Исполнителя (Executor)

#### Доступные статьи расходов
Исполнитель видит только те статьи расходов, которые фактически используются в его заявках. Это обеспечивает релевантность и не загромождает интерфейс неиспользуемыми опциями.

#### Фильтрация по ролям
- **Статистика API** (`/api/v1/requests/statistics?role=executor&user_id={user_id}`) возвращает только статьи расходов, используемые в заявках исполнителя
- **Список заявок** (`/api/v1/requests/list?role=executor`) возвращает заявки, созданные исполнителями
- **Контрагенты** - только контрагенты, с которыми исполнитель работал
- **Статьи расходов** - только статьи, используемые в заявках исполнителя

#### Пример использования в компонентах
```typescript
// Загрузка данных для исполнителя
const [requests, statistics] = await Promise.all([
  PaymentRequestService.getAll({ role: 'executor' }),
  PaymentRequestService.getStatistics('executor', userId)
]);

// Получение только используемых статей расходов из статистики
const availableExpenseArticles = statistics.expense_articles || [];

// Получение контрагентов, с которыми работал исполнитель
const usedCounterparties = requests
  .map(r => r.counterpartyId)
  .filter((id, index, arr) => arr.indexOf(id) === index);
```

## Рекомендации по использованию

1. **Кэширование**: Справочники редко изменяются, рекомендуется кэшировать их данные
2. **Поиск**: Используйте параметр `search` для быстрого поиска по справочникам
3. **Фильтрация**: Используйте параметр `active_only=true` для получения только активных записей
4. **Валидация**: Всегда проверяйте существование записей перед использованием их ID
5. **Обновление**: Реализуйте механизм обновления справочников при изменении данных

## Обработка ошибок

```typescript
try {
  const articles = await DictionaryApiService.getExpenseArticles();
} catch (error) {
  if (error.status === 404) {
    console.error('Справочник не найден');
  } else if (error.status === 500) {
    console.error('Ошибка сервера');
  } else {
    console.error('Неизвестная ошибка:', error);
  }
}
```

## Обновление справочников

### Массовое создание
```typescript
const bulkData = {
  items: [
    { code: "NEW001", name: "Новая статья", description: "Описание" },
    // ... другие статьи
  ]
};

const result = await DictionaryApiService.bulkCreateExpenseArticles(bulkData);
```

### Импорт из файла
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('dictionary_type', 'expense-articles');

const result = await DictionaryApiService.importDictionary(formData);
```

### Экспорт в файл
```typescript
const file = await DictionaryApiService.exportDictionary('expense-articles', 'excel');
// Скачивание файла
```
