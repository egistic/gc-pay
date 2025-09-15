# Рекомендации по разработке фронтенда - GC Spends System

## 🎯 Обзор

На основе анализа всех трех фаз реализации бэкенда (Phase 1: Critical Data Integrity, Phase 2: API Enhancement, Phase 3: Production Readiness), данный документ содержит детальные рекомендации по разработке фронтенда для системы управления платежами GC Spends.

---

## 📋 Содержание

1. [Загрузка файлов](#1-загрузка-файлов)
2. [Управление приоритетами](#2-управление-приоритетами)
3. [Системы мониторинга](#3-системы-мониторинга)
4. [Общие рекомендации по архитектуре](#4-общие-рекомендации-по-архитектуре)
5. [Технические требования](#5-технические-требования)

---

## 1. Загрузка файлов

### 1.1 Функциональность бэкенда

**Доступные API endpoints:**
- `POST /api/v1/file-management/upload/{request_id}` - Загрузка файла
- `GET /api/v1/file-management/files/{request_id}` - Список файлов запроса
- `GET /api/v1/file-management/files/info/{file_id}` - Информация о файле
- `DELETE /api/v1/file-management/files/{file_id}` - Удаление файла
- `POST /api/v1/file-management/validate` - Валидация файла без загрузки
- `GET /api/v1/file-management/validation-rules` - Правила валидации
- `GET /api/v1/file-management/statistics` - Статистика файлов

### 1.2 Рекомендации по UI/UX

#### 1.2.1 Компонент загрузки файлов

```typescript
interface FileUploadProps {
  requestId: string;
  fileType: 'document' | 'image' | 'archive';
  onUploadSuccess: (file: UploadedFile) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

interface UploadedFile {
  id: string;
  filename: string;
  mime_type: string;
  storage_path: string;
  file_type: string;
  uploaded_at: string;
}
```

**Ключевые особенности:**
- Drag & Drop интерфейс с визуальной обратной связью
- Предварительная валидация файлов перед загрузкой
- Прогресс-бар для каждого файла
- Поддержка множественной загрузки
- Превью для изображений и PDF
- Валидация размера и типа файла

#### 1.2.2 Валидация файлов

```typescript
interface FileValidationRules {
  document: {
    allowed_extensions: string[];
    max_size_mb: number;
    mime_types: string[];
  };
  image: {
    allowed_extensions: string[];
    max_size_mb: number;
    mime_types: string[];
  };
  archive: {
    allowed_extensions: string[];
    max_size_mb: number;
    mime_types: string[];
  };
}

// Функция валидации файла
async function validateFile(file: File, fileType: string): Promise<ValidationResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  
  const response = await fetch('/api/v1/file-management/validate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}
```

#### 1.2.3 Менеджер файлов

```typescript
interface FileManagerProps {
  requestId: string;
  files: UploadedFile[];
  onFileDelete: (fileId: string) => void;
  onFileDownload: (fileId: string) => void;
}

// Компонент списка файлов с возможностями:
// - Просмотр информации о файле
// - Скачивание файла
// - Удаление файла
// - Фильтрация по типу файла
// - Сортировка по дате загрузки
```

### 1.3 Технические требования

#### 1.3.1 Поддерживаемые типы файлов

**Документы:**
- PDF, DOC, DOCX, XLS, XLSX, TXT
- MIME типы: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Изображения:**
- JPG, JPEG, PNG, GIF, BMP
- MIME типы: `image/jpeg`, `image/png`, `image/gif`, `image/bmp`

**Архивы:**
- ZIP, RAR, 7Z
- MIME типы: `application/zip`, `application/x-rar-compressed`, `application/x-7z-compressed`

#### 1.3.2 Ограничения

- Максимальный размер файла: настраивается через API (по умолчанию 10MB)
- Максимальное количество файлов: 50 на запрос
- Валидация имен файлов: только латинские символы, цифры, точки, дефисы, подчеркивания

### 1.4 Примеры реализации

#### 1.4.1 React компонент загрузки

```tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  requestId: string;
  onUploadComplete: (files: UploadedFile[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ requestId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    for (const file of acceptedFiles) {
      try {
        // Валидация файла
        const validation = await validateFile(file, 'document');
        if (!validation.is_valid) {
          throw new Error(validation.error);
        }

        // Загрузка файла
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_type', 'document');

        const response = await fetch(`/api/v1/file-management/upload/${requestId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        });

        if (response.ok) {
          const uploadedFile = await response.json();
          uploadedFiles.push(uploadedFile);
        }
      } catch (error) {
        console.error('Ошибка загрузки файла:', error);
      }
    }

    setUploading(false);
    onUploadComplete(uploadedFiles);
  }, [requestId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  return (
    <div {...getRootProps()} className={`file-upload ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Перетащите файлы сюда...</p>
      ) : (
        <p>Перетащите файлы сюда или нажмите для выбора</p>
      )}
      
      {uploading && (
        <div className="upload-progress">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="progress-item">
              <span>{filename}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 2. Управление приоритетами

### 2.1 Функциональность бэкенда

**Доступные API endpoints:**
- `POST /api/v1/priority/rules` - Создание правила приоритета
- `GET /api/v1/priority/rules` - Список правил приоритета
- `PUT /api/v1/priority/rules/{rule_id}` - Обновление правила
- `DELETE /api/v1/priority/rules/{rule_id}` - Удаление правила
- `POST /api/v1/priority/calculate/{request_id}` - Расчет приоритета запроса
- `GET /api/v1/priority/statistics` - Статистика приоритетов
- `GET /api/v1/priority/escalation-check` - Проверка эскалации

### 2.2 Уровни приоритета

```typescript
enum PaymentPriority {
  LOW = 'low',           // Score < 5.0
  NORMAL = 'normal',     // Score 5.0 - 9.9
  HIGH = 'high',         // Score 10.0 - 14.9
  URGENT = 'urgent',     // Score 15.0 - 19.9
  CRITICAL = 'critical'  // Score ≥ 20.0
}

interface PriorityRule {
  id: string;
  name: string;
  description?: string;
  priority: PaymentPriority;
  conditions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PriorityCalculation {
  request_id: string;
  calculated_priority: PaymentPriority;
  priority_score: number;
  previous_priority?: PaymentPriority;
}
```

### 2.3 Рекомендации по UI/UX

#### 2.3.1 Визуализация приоритетов

```typescript
interface PriorityIndicatorProps {
  priority: PaymentPriority;
  score?: number;
  showScore?: boolean;
}

// Цветовая схема для приоритетов:
const priorityColors = {
  [PaymentPriority.LOW]: '#28a745',      // Зеленый
  [PaymentPriority.NORMAL]: '#17a2b8',   // Голубой
  [PaymentPriority.HIGH]: '#ffc107',     // Желтый
  [PaymentPriority.URGENT]: '#fd7e14',   // Оранжевый
  [PaymentPriority.CRITICAL]: '#dc3545'  // Красный
};

const priorityLabels = {
  [PaymentPriority.LOW]: 'Низкий',
  [PaymentPriority.NORMAL]: 'Обычный',
  [PaymentPriority.HIGH]: 'Высокий',
  [PaymentPriority.URGENT]: 'Срочный',
  [PaymentPriority.CRITICAL]: 'Критический'
};
```

#### 2.3.2 Компонент управления правилами приоритета

```tsx
interface PriorityRulesManagerProps {
  rules: PriorityRule[];
  onRuleCreate: (rule: Omit<PriorityRule, 'id' | 'created_at' | 'updated_at'>) => void;
  onRuleUpdate: (id: string, rule: Partial<PriorityRule>) => void;
  onRuleDelete: (id: string) => void;
}

export const PriorityRulesManager: React.FC<PriorityRulesManagerProps> = ({
  rules,
  onRuleCreate,
  onRuleUpdate,
  onRuleDelete
}) => {
  return (
    <div className="priority-rules-manager">
      <div className="rules-header">
        <h3>Правила приоритета</h3>
        <button onClick={() => setShowCreateModal(true)}>
          Создать правило
        </button>
      </div>
      
      <div className="rules-list">
        {rules.map(rule => (
          <PriorityRuleCard
            key={rule.id}
            rule={rule}
            onUpdate={onRuleUpdate}
            onDelete={onRuleDelete}
          />
        ))}
      </div>
    </div>
  );
};
```

#### 2.3.3 Компонент расчета приоритета

```tsx
interface PriorityCalculatorProps {
  requestId: string;
  onPriorityCalculated: (calculation: PriorityCalculation) => void;
}

export const PriorityCalculator: React.FC<PriorityCalculatorProps> = ({
  requestId,
  onPriorityCalculated
}) => {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<PriorityCalculation | null>(null);

  const calculatePriority = async () => {
    setCalculating(true);
    try {
      const response = await fetch(`/api/v1/priority/calculate/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const calculation = await response.json();
      setResult(calculation);
      onPriorityCalculated(calculation);
    } catch (error) {
      console.error('Ошибка расчета приоритета:', error);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="priority-calculator">
      <button 
        onClick={calculatePriority} 
        disabled={calculating}
        className="calculate-button"
      >
        {calculating ? 'Расчет...' : 'Рассчитать приоритет'}
      </button>
      
      {result && (
        <div className="calculation-result">
          <div className="priority-display">
            <span className={`priority-badge ${result.calculated_priority}`}>
              {priorityLabels[result.calculated_priority]}
            </span>
            <span className="priority-score">
              Оценка: {result.priority_score}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2.4 Дашборд приоритетов

```tsx
interface PriorityDashboardProps {
  statistics: PriorityStatistics;
  escalationRequired: EscalationItem[];
}

export const PriorityDashboard: React.FC<PriorityDashboardProps> = ({
  statistics,
  escalationRequired
}) => {
  return (
    <div className="priority-dashboard">
      <div className="dashboard-header">
        <h2>Управление приоритетами</h2>
      </div>
      
      <div className="dashboard-content">
        {/* Распределение приоритетов */}
        <div className="priority-distribution">
          <h3>Распределение приоритетов</h3>
          <PriorityDistributionChart data={statistics.priority_distribution} />
        </div>
        
        {/* Требующие эскалации */}
        <div className="escalation-section">
          <h3>Требующие эскалации ({escalationRequired.length})</h3>
          <EscalationList items={escalationRequired} />
        </div>
        
        {/* Статистика */}
        <div className="priority-stats">
          <h3>Статистика</h3>
          <PriorityStatsGrid stats={statistics} />
        </div>
      </div>
    </div>
  );
};
```

---

## 3. Системы мониторинга

### 3.1 Функциональность бэкенда

**Доступные API endpoints:**
- `GET /api/v1/monitoring/health` - Статус здоровья системы
- `GET /api/v1/monitoring/metrics/performance` - Метрики производительности
- `GET /api/v1/monitoring/metrics/system` - Системные метрики
- `GET /api/v1/monitoring/metrics/database` - Метрики базы данных
- `GET /api/v1/monitoring/metrics/combined` - Все метрики вместе
- `GET /api/v1/monitoring/alerts` - Список алертов
- `GET /api/v1/monitoring/alerts/active` - Активные алерты
- `GET /api/v1/monitoring/alerts/summary` - Сводка алертов
- `GET /api/v1/monitoring/dashboard` - Данные для дашборда

### 3.2 Типы метрик

```typescript
interface PerformanceMetrics {
  request_count: number;
  error_rate_percent: number;
  average_response_time_ms: number;
  uptime_seconds: number;
  database_queries_count: number;
  cache_hit_rate_percent: number;
}

interface SystemMetrics {
  cpu: {
    percent: number;
    cores: number;
  };
  memory: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  timestamp: string;
}

interface DatabaseMetrics {
  connection_pool: {
    active: number;
    idle: number;
    total: number;
  };
  database_size_mb: number;
  table_counts: Record<string, number>;
  active_connections: number;
}

interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  value: number;
  threshold: number;
}
```

### 3.3 Рекомендации по UI/UX

#### 3.3.1 Главный дашборд мониторинга

```tsx
interface MonitoringDashboardProps {
  combinedMetrics: CombinedMetrics;
  alerts: Alert[];
  systemStatus: SystemStatus;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  combinedMetrics,
  alerts,
  systemStatus
}) => {
  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-header">
        <h1>Мониторинг системы</h1>
        <div className={`status-indicator ${systemStatus.overall}`}>
          {systemStatus.overall === 'healthy' ? '✅' : '⚠️'}
          {systemStatus.overall}
        </div>
      </div>
      
      <div className="dashboard-grid">
        {/* Ключевые метрики */}
        <div className="key-metrics">
          <MetricCard
            title="Запросы в минуту"
            value={combinedMetrics.performance.request_count}
            trend="up"
          />
          <MetricCard
            title="Ошибки (%)"
            value={combinedMetrics.performance.error_rate_percent}
            trend="down"
            alert={combinedMetrics.performance.error_rate_percent > 5}
          />
          <MetricCard
            title="Время ответа (мс)"
            value={combinedMetrics.performance.average_response_time_ms}
            trend="down"
          />
          <MetricCard
            title="Uptime"
            value={formatUptime(combinedMetrics.performance.uptime_seconds)}
            trend="stable"
          />
        </div>
        
        {/* Графики производительности */}
        <div className="performance-charts">
          <PerformanceChart data={combinedMetrics.performance} />
        </div>
        
        {/* Системные ресурсы */}
        <div className="system-resources">
          <ResourceUsageChart
            cpu={combinedMetrics.system.cpu}
            memory={combinedMetrics.system.memory}
            disk={combinedMetrics.system.disk}
          />
        </div>
        
        {/* Алерты */}
        <div className="alerts-section">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
};
```

#### 3.3.2 Компонент алертов

```tsx
interface AlertsPanelProps {
  alerts: Alert[];
  onAlertAcknowledge: (alertId: string) => void;
  onAlertResolve: (alertId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAlertAcknowledge,
  onAlertResolve
}) => {
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const highAlerts = alerts.filter(alert => alert.severity === 'high');
  
  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <h3>Алерты</h3>
        <div className="alert-counts">
          <span className="critical-count">{criticalAlerts.length}</span>
          <span className="high-count">{highAlerts.length}</span>
        </div>
      </div>
      
      <div className="alerts-list">
        {alerts.map(alert => (
          <AlertItem
            key={alert.timestamp}
            alert={alert}
            onAcknowledge={() => onAlertAcknowledge(alert.timestamp)}
            onResolve={() => onAlertResolve(alert.timestamp)}
          />
        ))}
      </div>
    </div>
  );
};

interface AlertItemProps {
  alert: Alert;
  onAcknowledge: () => void;
  onResolve: () => void;
}

export const AlertItem: React.FC<AlertItemProps> = ({
  alert,
  onAcknowledge,
  onResolve
}) => {
  const severityClass = `alert-${alert.severity}`;
  
  return (
    <div className={`alert-item ${severityClass}`}>
      <div className="alert-content">
        <div className="alert-header">
          <span className="alert-type">{alert.type}</span>
          <span className="alert-severity">{alert.severity}</span>
          <span className="alert-time">{formatTime(alert.timestamp)}</span>
        </div>
        <div className="alert-message">{alert.message}</div>
        <div className="alert-value">
          Текущее значение: {alert.value} (порог: {alert.threshold})
        </div>
      </div>
      <div className="alert-actions">
        <button onClick={onAcknowledge}>Подтвердить</button>
        <button onClick={onResolve}>Решить</button>
      </div>
    </div>
  );
};
```

#### 3.3.3 Компонент метрик в реальном времени

```tsx
interface RealtimeMetricsProps {
  metrics: CombinedMetrics;
  refreshInterval?: number;
}

export const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({
  metrics,
  refreshInterval = 30000
}) => {
  const [currentMetrics, setCurrentMetrics] = useState(metrics);
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/v1/monitoring/metrics/combined', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const newMetrics = await response.json();
          setCurrentMetrics(newMetrics);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        setIsConnected(false);
        console.error('Ошибка получения метрик:', error);
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  return (
    <div className="realtime-metrics">
      <div className="connection-status">
        {isConnected ? '🟢' : '🔴'} 
        {isConnected ? 'Подключено' : 'Отключено'}
      </div>
      
      <div className="metrics-grid">
        <MetricGauge
          title="CPU"
          value={currentMetrics.system.cpu.percent}
          max={100}
          unit="%"
          color={getCpuColor(currentMetrics.system.cpu.percent)}
        />
        <MetricGauge
          title="Память"
          value={currentMetrics.system.memory.percent}
          max={100}
          unit="%"
          color={getMemoryColor(currentMetrics.system.memory.percent)}
        />
        <MetricGauge
          title="Диск"
          value={currentMetrics.system.disk.percent}
          max={100}
          unit="%"
          color={getDiskColor(currentMetrics.system.disk.percent)}
        />
      </div>
    </div>
  );
};
```

### 3.4 Настройки мониторинга

```tsx
interface MonitoringSettingsProps {
  thresholds: MonitoringThresholds;
  onThresholdsUpdate: (thresholds: MonitoringThresholds) => void;
}

interface MonitoringThresholds {
  error_rate_percent: number;
  response_time_ms: number;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
}

export const MonitoringSettings: React.FC<MonitoringSettingsProps> = ({
  thresholds,
  onThresholdsUpdate
}) => {
  const [localThresholds, setLocalThresholds] = useState(thresholds);
  
  const handleSave = () => {
    onThresholdsUpdate(localThresholds);
  };
  
  return (
    <div className="monitoring-settings">
      <h3>Настройки мониторинга</h3>
      
      <div className="thresholds-grid">
        <ThresholdInput
          label="Максимальный процент ошибок"
          value={localThresholds.error_rate_percent}
          onChange={(value) => setLocalThresholds(prev => ({ ...prev, error_rate_percent: value }))}
          unit="%"
          min={0}
          max={100}
        />
        
        <ThresholdInput
          label="Максимальное время ответа"
          value={localThresholds.response_time_ms}
          onChange={(value) => setLocalThresholds(prev => ({ ...prev, response_time_ms: value }))}
          unit="мс"
          min={100}
          max={10000}
        />
        
        <ThresholdInput
          label="Максимальная загрузка CPU"
          value={localThresholds.cpu_percent}
          onChange={(value) => setLocalThresholds(prev => ({ ...prev, cpu_percent: value }))}
          unit="%"
          min={50}
          max={100}
        />
        
        <ThresholdInput
          label="Максимальное использование памяти"
          value={localThresholds.memory_percent}
          onChange={(value) => setLocalThresholds(prev => ({ ...prev, memory_percent: value }))}
          unit="%"
          min={50}
          max={100}
        />
        
        <ThresholdInput
          label="Максимальное использование диска"
          value={localThresholds.disk_percent}
          onChange={(value) => setLocalThresholds(prev => ({ ...prev, disk_percent: value }))}
          unit="%"
          min={50}
          max={100}
        />
      </div>
      
      <div className="settings-actions">
        <button onClick={handleSave} className="save-button">
          Сохранить настройки
        </button>
        <button onClick={() => setLocalThresholds(thresholds)} className="reset-button">
          Сбросить
        </button>
      </div>
    </div>
  );
};
```

---

## 4. Общие рекомендации по архитектуре

### 4.1 Технологический стек

**Рекомендуемые технологии:**
- **Frontend Framework**: React 18+ с TypeScript
- **State Management**: Redux Toolkit или Zustand
- **UI Library**: Material-UI, Ant Design, или Chakra UI
- **Charts**: Chart.js, Recharts, или D3.js
- **HTTP Client**: Axios или Fetch API
- **File Upload**: react-dropzone
- **Date/Time**: date-fns или dayjs
- **Form Management**: React Hook Form с Yup валидацией

### 4.2 Структура проекта

```
src/
├── components/
│   ├── common/           # Общие компоненты
│   ├── file-management/  # Компоненты загрузки файлов
│   ├── priority/         # Компоненты управления приоритетами
│   ├── monitoring/       # Компоненты мониторинга
│   └── layout/          # Компоненты макета
├── pages/
│   ├── dashboard/       # Главная страница
│   ├── requests/        # Управление запросами
│   ├── files/          # Управление файлами
│   ├── priority/       # Управление приоритетами
│   └── monitoring/     # Мониторинг системы
├── services/
│   ├── api/            # API сервисы
│   ├── auth/           # Аутентификация
│   └── websocket/      # WebSocket соединения
├── hooks/
│   ├── useApi.ts       # Хук для API вызовов
│   ├── useAuth.ts      # Хук аутентификации
│   └── useWebSocket.ts # Хук WebSocket
├── utils/
│   ├── validation.ts   # Валидация
│   ├── formatting.ts   # Форматирование данных
│   └── constants.ts    # Константы
└── types/
    ├── api.ts          # Типы API
    ├── common.ts       # Общие типы
    └── components.ts   # Типы компонентов
```

### 4.3 API Service Layer

```typescript
// services/api/base.ts
class ApiService {
  private baseURL: string;
  private token: string | null = null;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  setToken(token: string) {
    this.token = token;
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// services/api/fileManagement.ts
export class FileManagementService {
  constructor(private api: ApiService) {}
  
  async uploadFile(requestId: string, file: File, fileType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    
    return this.api.request(`/file-management/upload/${requestId}`, {
      method: 'POST',
      body: formData,
      headers: {} // Не устанавливаем Content-Type для FormData
    });
  }
  
  async getFiles(requestId: string) {
    return this.api.get(`/file-management/files/${requestId}`);
  }
  
  async deleteFile(fileId: string) {
    return this.api.delete(`/file-management/files/${fileId}`);
  }
  
  async validateFile(file: File, fileType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    
    return this.api.request('/file-management/validate', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  }
}
```

### 4.4 State Management

```typescript
// store/slices/fileManagementSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface FileManagementState {
  files: UploadedFile[];
  loading: boolean;
  error: string | null;
  uploadProgress: Record<string, number>;
}

const initialState: FileManagementState = {
  files: [],
  loading: false,
  error: null,
  uploadProgress: {},
};

export const uploadFile = createAsyncThunk(
  'fileManagement/uploadFile',
  async ({ requestId, file, fileType }: UploadFileParams) => {
    const fileService = new FileManagementService(apiService);
    return fileService.uploadFile(requestId, file, fileType);
  }
);

export const loadFiles = createAsyncThunk(
  'fileManagement/loadFiles',
  async (requestId: string) => {
    const fileService = new FileManagementService(apiService);
    return fileService.getFiles(requestId);
  }
);

const fileManagementSlice = createSlice({
  name: 'fileManagement',
  initialState,
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress[action.payload.fileName] = action.payload.progress;
    },
    clearUploadProgress: (state) => {
      state.uploadProgress = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files.push(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка загрузки файла';
      })
      .addCase(loadFiles.fulfilled, (state, action) => {
        state.files = action.payload.files;
      });
  },
});

export const { setUploadProgress, clearUploadProgress } = fileManagementSlice.actions;
export default fileManagementSlice.reducer;
```

---

## 5. Технические требования

### 5.1 Браузерная поддержка

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### 5.2 Производительность

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

### 5.3 Безопасность

- **HTTPS**: Обязательно для всех соединений
- **CSP**: Content Security Policy для защиты от XSS
- **Token Storage**: Безопасное хранение JWT токенов
- **Input Validation**: Валидация всех пользовательских данных
- **File Upload Security**: Проверка типов и размеров файлов

### 5.4 Доступность (Accessibility)

- **WCAG 2.1 AA**: Соответствие стандартам доступности
- **Keyboard Navigation**: Полная поддержка навигации с клавиатуры
- **Screen Readers**: Поддержка скрин-ридеров
- **Color Contrast**: Минимальный контраст 4.5:1
- **Focus Management**: Правильное управление фокусом

### 5.5 Тестирование

```typescript
// tests/components/FileUpload.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '../FileUpload';

describe('FileUpload', () => {
  it('should upload files successfully', async () => {
    const mockOnUploadComplete = jest.fn();
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    render(<FileUpload requestId="test-id" onUploadComplete={mockOnUploadComplete} />);
    
    const input = screen.getByRole('button', { name: /выбрать файлы/i });
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalled();
    });
  });
  
  it('should validate file types', async () => {
    const mockOnUploadComplete = jest.fn();
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    render(<FileUpload requestId="test-id" onUploadComplete={mockOnUploadComplete} />);
    
    const input = screen.getByRole('button', { name: /выбрать файлы/i });
    fireEvent.change(input, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/неподдерживаемый тип файла/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 Заключение

Данные рекомендации основаны на полном анализе всех трех фаз реализации бэкенда системы GC Spends. Они обеспечивают:

1. **Полную интеграцию** с существующими API endpoints
2. **Современный UX/UI** для всех ключевых функций
3. **Масштабируемую архитектуру** для будущего развития
4. **Высокую производительность** и безопасность
5. **Соответствие стандартам** доступности и качества

Следование этим рекомендациям позволит создать фронтенд, который полностью использует возможности бэкенда и обеспечивает отличный пользовательский опыт.

---

*Документ создан на основе анализа Phase 1, Phase 2 и Phase 3 реализации бэкенда GC Spends System*
*Дата создания: Декабрь 2024*
