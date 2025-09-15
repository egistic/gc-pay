# GC Spends API - Detailed Examples for Frontend Development

## 📋 Table of Contents

1. [Authentication Examples](#authentication-examples)
2. [User Management Examples](#user-management-examples)
3. [Payment Requests Examples](#payment-requests-examples)
4. [Dictionary Management Examples](#dictionary-management-examples)
5. [File Management Examples](#file-management-examples)
6. [Registry Management Examples](#registry-management-examples)
7. [Distribution Examples](#distribution-examples)
8. [Admin Functions Examples](#admin-functions-examples)
9. [Monitoring Examples](#monitoring-examples)
10. [Error Handling Examples](#error-handling-examples)

## 🔐 Authentication Examples

### 1. Login Flow

```javascript
// Complete login implementation
async function loginUser(email, password) {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    
    // Store token and user info
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    
    return {
      success: true,
      token: data.access_token,
      user: data.user,
      expiresIn: data.expires_in
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage
const loginResult = await loginUser('user@example.com', 'password123');
if (loginResult.success) {
  console.log('Login successful:', loginResult.user);
} else {
  console.error('Login failed:', loginResult.error);
}
```

### 2. Get Current User

```javascript
async function getCurrentUser() {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return;
      }
      throw new Error('Failed to get user info');
    }

    return await response.json();
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
}
```

## 👥 User Management Examples

### 1. Get All Users

```javascript
async function getAllUsers(params = {}) {
  const token = localStorage.getItem('auth_token');
  
  const queryParams = new URLSearchParams({
    skip: params.skip || 0,
    limit: params.limit || 100,
    search: params.search || '',
    ...params
  });

  try {
    const response = await fetch(`http://localhost:8000/api/v1/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
}

// Usage with pagination
const users = await getAllUsers({
  skip: 0,
  limit: 50,
  search: 'john'
});
```

### 2. Create User

```javascript
async function createUser(userData) {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        full_name: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create user');
    }

    return await response.json();
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

// Usage
const newUser = await createUser({
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  password: 'securepassword123'
});
```

### 3. Update User

```javascript
async function updateUser(userId, userData) {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        full_name: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        is_active: userData.isActive
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update user');
    }

    return await response.json();
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
}
```

## 💳 Payment Requests Examples

### 1. Get Payment Requests

```javascript
async function getPaymentRequests(params = {}) {
  const token = localStorage.getItem('auth_token');
  
  const queryParams = new URLSearchParams({
    role: params.role || '',
    status: params.status || '',
    responsible_registrar_id: params.responsibleRegistrarId || '',
    skip: params.skip || 0,
    limit: params.limit || 100
  });

  try {
    const response = await fetch(`http://localhost:8000/api/v1/requests?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment requests');
    }

    return await response.json();
  } catch (error) {
    console.error('Get requests error:', error);
    throw error;
  }
}

// Usage with filters
const requests = await getPaymentRequests({
  role: 'EXECUTOR',
  status: 'draft',
  skip: 0,
  limit: 20
});
```

### 2. Create Payment Request

```javascript
async function createPaymentRequest(requestData) {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        counterparty_id: requestData.counterpartyId,
        title: requestData.title,
        currency_code: requestData.currencyCode,
        due_date: requestData.dueDate,
        expense_article_text: requestData.expenseArticleText,
        doc_number: requestData.docNumber,
        doc_date: requestData.docDate,
        doc_type: requestData.docType,
        paying_company: requestData.payingCompany,
        counterparty_category: requestData.counterpartyCategory,
        vat_rate: requestData.vatRate,
        product_service: requestData.productService,
        volume: requestData.volume,
        price_rate: requestData.priceRate,
        period: requestData.period,
        lines: requestData.lines.map(line => ({
          executor_position_id: line.executorPositionId,
          quantity: line.quantity,
          amount_net: line.amountNet,
          vat_rate_id: line.vatRateId,
          currency_code: line.currencyCode,
          note: line.note
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create payment request');
    }

    return await response.json();
  } catch (error) {
    console.error('Create request error:', error);
    throw error;
  }
}

// Usage
const newRequest = await createPaymentRequest({
  counterpartyId: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Office Supplies Purchase',
  currencyCode: 'USD',
  dueDate: '2024-12-31',
  expenseArticleText: 'Office expenses',
  docNumber: 'PO-2024-001',
  docDate: '2024-01-15',
  docType: 'Purchase Order',
  payingCompany: 'GC Spends Ltd',
  counterpartyCategory: 'Supplier',
  vatRate: '20%',
  productService: 'Office supplies',
  volume: '100 units',
  priceRate: '$10 per unit',
  period: 'Q1 2024',
  lines: [
    {
      executorPositionId: '123e4567-e89b-12d3-a456-426614174001',
      quantity: 100,
      amountNet: 1000.00,
      vatRateId: '123e4567-e89b-12d3-a456-426614174002',
      currencyCode: 'USD',
      note: 'Office supplies for Q1'
    }
  ]
});
```

### 3. Get Request Statistics

```javascript
async function getRequestStatistics(params = {}) {
  const token = localStorage.getItem('auth_token');
  
  const queryParams = new URLSearchParams({
    role: params.role || '',
    user_id: params.userId || ''
  });

  try {
    const response = await fetch(`http://localhost:8000/api/v1/requests/statistics?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch request statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Get statistics error:', error);
    throw error;
  }
}

// Usage
const stats = await getRequestStatistics({ role: 'EXECUTOR' });
console.log('Total requests:', stats.total_requests);
console.log('Draft requests:', stats.draft);
console.log('Approved requests:', stats.approved);
```

## 📚 Dictionary Management Examples

### 1. Get Counterparties

```javascript
async function getCounterparties(params = {}) {
  const token = localStorage.getItem('auth_token');
  
  const queryParams = new URLSearchParams({
    active_only: params.activeOnly !== false,
    search: params.search || '',
    skip: params.skip || 0,
    limit: params.limit || 100
  });

  try {
    const response = await fetch(`http://localhost:8000/api/v1/dictionaries/counterparties?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch counterparties');
    }

    return await response.json();
  } catch (error) {
    console.error('Get counterparties error:', error);
    throw error;
  }
}

// Usage
const counterparties = await getCounterparties({
  activeOnly: true,
  search: 'office',
  skip: 0,
  limit: 50
});
```

### 2. Create Counterparty

```javascript
async function createCounterparty(counterpartyData) {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/dictionaries/counterparties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: counterpartyData.name,
        inn: counterpartyData.inn,
        category: counterpartyData.category,
        is_active: counterpartyData.isActive !== false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create counterparty');
    }

    return await response.json();
  } catch (error) {
    console.error('Create counterparty error:', error);
    throw error;
  }
}

// Usage
const newCounterparty = await createCounterparty({
  name: 'Office Supplies Inc',
  inn: '1234567890',
  category: 'Supplier',
  isActive: true
});
```

### 3. Import Data

```javascript
async function importDictionaryData(dictionaryType, file, includeInactive = false) {
  const token = localStorage.getItem('auth_token');
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`http://localhost:8000/api/v1/dictionaries/import-export/import/${dictionaryType}?include_inactive=${includeInactive}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Import failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
}

// Usage
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
const result = await importDictionaryData('counterparties', file, false);
console.log('Import result:', result);
```

### 4. Export Data

```javascript
async function exportDictionaryData(dictionaryType, format = 'csv', includeInactive = false) {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(`http://localhost:8000/api/v1/dictionaries/import-export/export/${dictionaryType}?format=${format}&include_inactive=${includeInactive}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dictionaryType}_export.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

// Usage
await exportDictionaryData('counterparties', 'csv', false);
```

## 📁 File Management Examples

### 1. Upload File

```javascript
async function uploadFile(file, docType) {
  const token = localStorage.getItem('auth_token');
  
  const formData = new FormData();
  formData.append('f', file);
  
  try {
    const response = await fetch(`http://localhost:8000/api/v1/files/upload?doc_type=${docType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Usage
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
const result = await uploadFile(file, 'document');
console.log('Upload result:', result);
```

### 2. Advanced File Upload for Requests

```javascript
async function uploadRequestFile(requestId, file, fileType = 'document') {
  const token = localStorage.getItem('auth_token');
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`http://localhost:8000/api/v1/file-management/upload/${requestId}?file_type=${fileType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Usage with progress tracking
async function uploadWithProgress(requestId, file, onProgress) {
  const token = localStorage.getItem('auth_token');
  
  const formData = new FormData();
  formData.append('file', file);
  
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.open('POST', `http://localhost:8000/api/v1/file-management/upload/${requestId}?file_type=document`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

// Usage with progress
await uploadWithProgress('request-id', file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

## 📋 Registry Management Examples

### 1. Get Payment Registry

```javascript
async function getPaymentRegistry(params = {}) {
  const token = localStorage.getItem('auth_token');
  
  const queryParams = new URLSearchParams({
    status: params.status || '',
    skip: params.skip || 0,
    limit: params.limit || 100
  });

  try {
    const response = await fetch(`http://localhost:8000/api/v1/registry?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment registry');
    }

    return await response.json();
  } catch (error) {
    console.error('Get registry error:', error);
    throw error;
  }
}

// Usage
const registry = await getPaymentRegistry({
  status: 'in_registry',
  skip: 0,
  limit: 50
});
```

### 2. Add Request to Registry

```javascript
async function addRequestToRegistry(requestId, comment = '') {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/registry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        request_id: requestId,
        comment: comment
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add request to registry');
    }

    return await response.json();
  } catch (error) {
    console.error('Add to registry error:', error);
    throw error;
  }
}

// Usage
const result = await addRequestToRegistry('request-id', 'Added to registry for processing');
```

## 💰 Distribution Examples

### 1. Check Contract Status

```javascript
async function checkContractStatus(counterpartyId) {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(`http://localhost:8000/api/v1/distribution/contract-status/${counterpartyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Counterparty not found');
      }
      throw new Error('Failed to check contract status');
    }

    return await response.json();
  } catch (error) {
    console.error('Check contract status error:', error);
    throw error;
  }
}

// Usage
const contractStatus = await checkContractStatus('counterparty-id');
if (contractStatus.has_contract) {
  console.log('Contract found:', contractStatus.contract_number);
} else {
  console.log('No active contract found');
}
```

### 2. Get Distributor Requests

```javascript
async function getDistributorRequests(params = {}) {
  const token = localStorage.getItem('auth_token');
  
  const queryParams = new URLSearchParams({
    skip: params.skip || 0,
    limit: params.limit || 100
  });

  try {
    const response = await fetch(`http://localhost:8000/api/v1/distributor/requests?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch distributor requests');
    }

    return await response.json();
  } catch (error) {
    console.error('Get distributor requests error:', error);
    throw error;
  }
}
```

## ⚙️ Admin Functions Examples

### 1. Get System Statistics

```javascript
async function getSystemStatistics() {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/admin/statistics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch system statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Get statistics error:', error);
    throw error;
  }
}

// Usage
const stats = await getSystemStatistics();
console.log('Total users:', stats.total_users);
console.log('Active users:', stats.active_users);
console.log('Total requests:', stats.total_requests);
console.log('System health:', stats.system_health);
```

### 2. Get Activity Log

```javascript
async function getActivityLog(limit = 50) {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(`http://localhost:8000/api/v1/admin/activity-log?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity log');
    }

    return await response.json();
  } catch (error) {
    console.error('Get activity log error:', error);
    throw error;
  }
}

// Usage
const activities = await getActivityLog(100);
activities.forEach(activity => {
  console.log(`${activity.user_name}: ${activity.action} - ${activity.description}`);
});
```

## 📊 Monitoring Examples

### 1. Get System Health

```javascript
async function getSystemHealth() {
  try {
    const response = await fetch('http://localhost:8000/api/v1/monitoring/health');

    if (!response.ok) {
      throw new Error('Failed to fetch system health');
    }

    return await response.json();
  } catch (error) {
    console.error('Get health error:', error);
    throw error;
  }
}

// Usage
const health = await getSystemHealth();
console.log('System status:', health.status);
console.log('Application status:', health.application.status);
console.log('Database status:', health.database.status);
```

### 2. Get Priority Rules

```javascript
async function getPriorityRules(params = {}) {
  const token = localStorage.getItem('auth_token');
  
  const queryParams = new URLSearchParams({
    skip: params.skip || 0,
    limit: params.limit || 100,
    active_only: params.activeOnly || false
  });

  try {
    const response = await fetch(`http://localhost:8000/api/v1/priority/rules?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch priority rules');
    }

    return await response.json();
  } catch (error) {
    console.error('Get priority rules error:', error);
    throw error;
  }
}

// Usage
const rules = await getPriorityRules({ activeOnly: true });
rules.rules.forEach(rule => {
  console.log(`${rule.name}: ${rule.priority} priority`);
});
```

## 🚨 Error Handling Examples

### 1. Comprehensive Error Handler

```javascript
class APIErrorHandler {
  static handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return this.handleBadRequest(data, context);
        case 401:
          return this.handleUnauthorized(context);
        case 403:
          return this.handleForbidden(context);
        case 404:
          return this.handleNotFound(context);
        case 409:
          return this.handleConflict(data, context);
        case 422:
          return this.handleValidationError(data, context);
        case 500:
          return this.handleServerError(context);
        default:
          return this.handleGenericError(data, context);
      }
    } else if (error.request) {
      // Network error
      return this.handleNetworkError(context);
    } else {
      // Other error
      return this.handleUnknownError(error, context);
    }
  }

  static handleBadRequest(data, context) {
    const message = data.detail || 'Bad request';
    this.showError(`Bad Request in ${context}: ${message}`);
    return { type: 'bad_request', message };
  }

  static handleUnauthorized(context) {
    this.showError(`Unauthorized access in ${context}. Please login again.`);
    this.redirectToLogin();
    return { type: 'unauthorized', message: 'Please login again' };
  }

  static handleForbidden(context) {
    this.showError(`Access forbidden in ${context}. You don't have permission.`);
    return { type: 'forbidden', message: 'Access forbidden' };
  }

  static handleNotFound(context) {
    this.showError(`Resource not found in ${context}`);
    return { type: 'not_found', message: 'Resource not found' };
  }

  static handleConflict(data, context) {
    const message = data.detail || 'Resource already exists';
    this.showError(`Conflict in ${context}: ${message}`);
    return { type: 'conflict', message };
  }

  static handleValidationError(data, context) {
    const errors = data.detail || [];
    const errorMessages = errors.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
    this.showError(`Validation error in ${context}:\n${errorMessages}`);
    return { type: 'validation', message: errorMessages, errors };
  }

  static handleServerError(context) {
    this.showError(`Server error in ${context}. Please try again later.`);
    return { type: 'server_error', message: 'Server error' };
  }

  static handleNetworkError(context) {
    this.showError(`Network error in ${context}. Please check your connection.`);
    return { type: 'network_error', message: 'Network error' };
  }

  static handleGenericError(data, context) {
    const message = data.detail || 'Unknown error occurred';
    this.showError(`Error in ${context}: ${message}`);
    return { type: 'generic', message };
  }

  static handleUnknownError(error, context) {
    this.showError(`Unknown error in ${context}: ${error.message}`);
    return { type: 'unknown', message: error.message };
  }

  static showError(message) {
    // Custom error display logic
    alert(message);
    // Or use a toast notification library
    // toast.error(message);
  }

  static redirectToLogin() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    window.location.href = '/login';
  }
}

// Usage in API calls
try {
  const result = await createUser(userData);
  console.log('User created:', result);
} catch (error) {
  const errorInfo = APIErrorHandler.handleError(error, 'createUser');
  // Handle error based on type
  if (errorInfo.type === 'validation') {
    // Show field-specific errors
    errorInfo.errors.forEach(err => {
      console.error(`Field ${err.loc.join('.')}: ${err.msg}`);
    });
  }
}
```

### 2. Retry Logic for Failed Requests

```javascript
async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

// Usage
const result = await retryRequest(
  () => getPaymentRequests({ role: 'EXECUTOR' }),
  3,
  1000
);
```

---

*This document provides comprehensive examples for all API endpoints with real-world usage patterns and error handling strategies.*
