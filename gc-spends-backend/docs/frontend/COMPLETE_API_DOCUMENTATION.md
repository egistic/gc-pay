# GC Spends API - Complete Frontend Development Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Statistics](#api-statistics)
4. [Complete API Endpoints](#complete-api-endpoints)
5. [Frontend Development Guidelines](#frontend-development-guidelines)
6. [JavaScript Examples](#javascript-examples)
7. [Error Handling](#error-handling)
8. [Module Organization](#module-organization)
9. [Development Tools](#development-tools)
10. [Support](#support)

## 📋 Overview

This document provides a comprehensive, complete reference for all API endpoints available for frontend development. The GC Spends API is a complete system for managing expenses and payments with 36 endpoints across 17 modules.

### Key Features
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Granular permissions system
- **File Management** - Upload and manage documents
- **Audit Trail** - Complete change tracking
- **Import/Export** - Data management capabilities
- **Real-time Monitoring** - System health and performance
- **Priority Management** - Dynamic request prioritization

## 🔐 Authentication

All API endpoints (except `/health`) require JWT authentication via `Authorization: Bearer <token>` header.

### Authentication Flow

#### 1. Login
```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=your_password
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "full_name": "John Doe",
    "email": "user@example.com",
    "roles": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "code": "EXECUTOR",
        "name": "Executor",
        "is_primary": true
      }
    ]
  }
}
```

#### 2. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "full_name": "John Doe",
  "email": "user@example.com",
  "phone": "+1234567890",
  "is_active": true,
  "roles": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "code": "EXECUTOR",
      "name": "Executor",
      "is_primary": true
    }
  ]
}
```

## 📊 API Statistics

- **Total Endpoints**: 36
- **Total Schemas**: 41
- **API Tags**: 21
- **OpenAPI Version**: 3.0.2
- **Authentication**: JWT Bearer Token
- **Base URL**: `http://localhost:8000/api/v1/`

## 🔗 Complete API Endpoints

### 1. Authentication & Users (7 endpoints)

#### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user info

#### Users Management
- `GET /api/v1/users` - List all users
- `POST /api/v1/users` - Create user (Admin only)
- `GET /api/v1/users/{user_id}` - Get user details
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

### 2. Roles & Permissions (5 endpoints)

#### Roles Management
- `GET /api/v1/roles` - List all roles
- `POST /api/v1/roles` - Create role (Admin only)
- `GET /api/v1/roles/{role_id}` - Get role details
- `PUT /api/v1/roles/{role_id}` - Update role
- `DELETE /api/v1/roles/{role_id}` - Delete role

### 3. Positions & Departments (4 endpoints)

#### Departments
- `GET /api/v1/positions/departments` - List departments
- `POST /api/v1/positions/departments` - Create department (Admin only)

#### Positions
- `GET /api/v1/positions` - List positions
- `POST /api/v1/positions` - Create position (Admin only)

### 4. Expense Article Roles (2 endpoints)

#### Role Assignments
- `GET /api/v1/expense-article-roles/articles/{article_id}/assignments` - Get role assignments for article
- `POST /api/v1/expense-article-roles/assignments` - Create role assignment

### 5. Payment Requests (3 endpoints)

#### Request Management
- `GET /api/v1/requests` - List payment requests
- `POST /api/v1/requests` - Create payment request
- `GET /api/v1/requests/statistics` - Get request statistics

### 6. Dictionaries (7 endpoints)

#### Counterparties
- `GET /api/v1/dictionaries/counterparties` - List counterparties
- `POST /api/v1/dictionaries/counterparties` - Create counterparty
- `GET /api/v1/dictionaries/counterparties/statistics` - Counterparties statistics

#### Expense Articles
- `GET /api/v1/dictionaries/expense-articles` - List expense articles
- `POST /api/v1/dictionaries/expense-articles` - Create expense article

#### Audit
- `GET /api/v1/dictionaries/audit/history/{dictionary_type}` - Get audit history
- `GET /api/v1/dictionaries/audit/statistics/{dictionary_type}` - Get audit statistics

#### Import/Export
- `POST /api/v1/dictionaries/import-export/import/{dictionary_type}` - Import data
- `GET /api/v1/dictionaries/import-export/export/{dictionary_type}` - Export data

### 7. Files Management (2 endpoints)

#### File Operations
- `POST /api/v1/files/upload` - Upload file
- `POST /api/v1/file-management/upload/{request_id}` - Advanced file upload

### 8. Registry (3 endpoints)

#### Payment Registry
- `GET /api/v1/registry` - Get payment registry
- `POST /api/v1/registry` - Add request to registry
- `GET /api/v1/registry/statistics` - Registry statistics

### 9. Distribution (3 endpoints)

#### Contract Management
- `GET /api/v1/distribution/contract-status/{counterparty_id}` - Check contract status
- `GET /api/v1/distributor/requests` - Get distributor requests
- `GET /api/v1/distributor/requests/{request_id}` - Get specific request

### 10. Export Contracts (2 endpoints)

#### Contract Management
- `GET /api/v1/export-contracts` - List export contracts
- `GET /api/v1/export-contracts/{contract_id}` - Get specific contract

### 11. Sub-Registrar (2 endpoints)

#### Sub-Registrar Functions
- `GET /api/v1/sub-registrar/assignments` - Get assignments
- `GET /api/v1/sub-registrar/reports/{request_id}` - Get report

### 12. Admin (2 endpoints)

#### System Administration
- `GET /api/v1/admin/statistics` - System statistics
- `GET /api/v1/admin/activity-log` - Activity log

### 13. Priority Management (2 endpoints)

#### Priority Rules
- `GET /api/v1/priority/rules` - List priority rules
- `POST /api/v1/priority/rules` - Create priority rule

### 14. Monitoring (1 endpoint)

#### System Monitoring
- `GET /api/v1/monitoring/health` - System health check

### 15. Idempotency (1 endpoint)

#### Key Management
- `POST /api/v1/idempotency/generate-key` - Generate idempotency key

### 16. Health Check (1 endpoint)

#### System Status
- `GET /health` - Basic health check

## 🎯 Frontend Development Guidelines

### 1. Authentication Flow

```javascript
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api/v1';
    this.token = localStorage.getItem('auth_token');
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${email}&password=${password}`
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem('auth_token', this.token);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated() {
    return !!this.token;
  }
}
```

### 2. API Service Base Class

```javascript
class APIService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api/v1';
    this.token = localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}
```

### 3. User Management Service

```javascript
class UserService extends APIService {
  // Get all users
  async getUsers(params = {}) {
    return this.get('/users', params);
  }

  // Get user by ID
  async getUser(userId) {
    return this.get(`/users/${userId}`);
  }

  // Create user
  async createUser(userData) {
    return this.post('/users', userData);
  }

  // Update user
  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }

  // Delete user
  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }
}
```

### 4. Payment Requests Service

```javascript
class RequestService extends APIService {
  // Get payment requests
  async getRequests(params = {}) {
    return this.get('/requests', params);
  }

  // Create payment request
  async createRequest(requestData) {
    return this.post('/requests', requestData);
  }

  // Get request statistics
  async getRequestStatistics(params = {}) {
    return this.get('/requests/statistics', params);
  }

  // Submit request
  async submitRequest(requestId, comment = '') {
    return this.post(`/requests/${requestId}/submit`, { comment });
  }

  // Approve request
  async approveRequest(requestId, comment = '') {
    return this.post(`/requests/${requestId}/approve`, { comment });
  }

  // Reject request
  async rejectRequest(requestId, comment) {
    return this.post(`/requests/${requestId}/reject`, { comment });
  }
}
```

### 5. File Upload Service

```javascript
class FileService extends APIService {
  // Upload file
  async uploadFile(file, docType) {
    const formData = new FormData();
    formData.append('f', file);
    
    const response = await fetch(`${this.baseURL}/files/upload?doc_type=${docType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return await response.json();
  }

  // Advanced file upload for requests
  async uploadRequestFile(requestId, file, fileType = 'document') {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/file-management/upload/${requestId}?file_type=${fileType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return await response.json();
  }
}
```

### 6. Dictionary Service

```javascript
class DictionaryService extends APIService {
  // Counterparties
  async getCounterparties(params = {}) {
    return this.get('/dictionaries/counterparties', params);
  }

  async createCounterparty(counterpartyData) {
    return this.post('/dictionaries/counterparties', counterpartyData);
  }

  async getCounterpartiesStatistics() {
    return this.get('/dictionaries/counterparties/statistics');
  }

  // Expense Articles
  async getExpenseArticles(params = {}) {
    return this.get('/dictionaries/expense-articles', params);
  }

  async createExpenseArticle(articleData) {
    return this.post('/dictionaries/expense-articles', articleData);
  }

  // Import/Export
  async importData(dictionaryType, file, includeInactive = false) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/dictionaries/import-export/import/${dictionaryType}?include_inactive=${includeInactive}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Import failed');
    }

    return await response.json();
  }

  async exportData(dictionaryType, format = 'csv', includeInactive = false) {
    const response = await fetch(`${this.baseURL}/dictionaries/import-export/export/${dictionaryType}?format=${format}&include_inactive=${includeInactive}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}
```

## 🚨 Error Handling

### Error Response Format

All API endpoints return consistent error responses:

```json
{
  "detail": "Error message description"
}
```

### HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid or missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (resource already exists)
- **422** - Unprocessable Entity (validation failed)
- **500** - Internal Server Error

### Error Handling Example

```javascript
class ErrorHandler {
  static handle(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          this.redirectToLogin();
          break;
        case 403:
          // Forbidden - show permission error
          this.showPermissionError();
          break;
        case 404:
          // Not found - show not found error
          this.showNotFoundError();
          break;
        case 422:
          // Validation error - show field errors
          this.showValidationErrors(data.detail);
          break;
        default:
          // Generic error
          this.showGenericError(data.detail);
      }
    } else {
      // Network error
      this.showNetworkError();
    }
  }

  static redirectToLogin() {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }

  static showPermissionError() {
    alert('You do not have permission to perform this action');
  }

  static showNotFoundError() {
    alert('The requested resource was not found');
  }

  static showValidationErrors(errors) {
    // Display validation errors for each field
    errors.forEach(error => {
      console.error(`Field ${error.loc.join('.')}: ${error.msg}`);
    });
  }

  static showGenericError(message) {
    alert(`Error: ${message}`);
  }

  static showNetworkError() {
    alert('Network error. Please check your connection.');
  }
}
```

## 📱 Module Organization

### 1. User Management Module
**Endpoints**: Authentication, Users, Roles, Positions, Departments
**Purpose**: Manage users, roles, and organizational structure
**Key Features**:
- User authentication and authorization
- Role-based access control
- Department and position management
- User profile management

### 2. Request Management Module
**Endpoints**: Payment Requests, Statistics
**Purpose**: Handle payment request lifecycle
**Key Features**:
- Create and manage payment requests
- Request approval workflow
- Statistics and reporting
- Status tracking

### 3. Dictionary Management Module
**Endpoints**: Counterparties, Expense Articles, Audit, Import/Export
**Purpose**: Manage reference data
**Key Features**:
- Counterparty management
- Expense article management
- Data import/export
- Audit trail

### 4. File Management Module
**Endpoints**: File Upload, Advanced Upload
**Purpose**: Handle file operations
**Key Features**:
- File upload and validation
- Document management
- File type validation
- Storage management

### 5. Registry Module
**Endpoints**: Payment Registry, Statistics
**Purpose**: Manage payment registry
**Key Features**:
- Registry entries
- Payment tracking
- Registry statistics
- Request assignment

### 6. Distribution Module
**Endpoints**: Contract Status, Distributor Requests, Export Contracts
**Purpose**: Handle fund distribution
**Key Features**:
- Contract status checking
- Distributor request management
- Export contract management
- Distribution workflow

### 7. Admin Module
**Endpoints**: System Statistics, Activity Log
**Purpose**: System administration
**Key Features**:
- System monitoring
- Activity tracking
- Administrative functions
- System health

### 8. Monitoring Module
**Endpoints**: Health Check, Priority Rules
**Purpose**: System monitoring and priority management
**Key Features**:
- System health monitoring
- Priority rule management
- Performance metrics
- Alert management

## 🛠️ Development Tools

### Swagger UI
- **URL**: `http://localhost:8001/index.html`
- **Features**: 
  - Interactive API testing
  - Complete documentation
  - Code generation
  - Authentication testing

### API Reference
- **URL**: `http://localhost:8001/api-reference.html`
- **Features**: 
  - Static documentation
  - Examples and descriptions
  - Navigation and search

### Quick Reference
- **URL**: `http://localhost:8001/quick-reference.html`
- **Features**: 
  - Visual endpoint browser
  - Module organization
  - Quick access to all endpoints

### OpenAPI JSON
- **URL**: `http://localhost:8001/openapi.json`
- **Features**: 
  - Machine-readable specification
  - SDK generation
  - Tool integration

## 📞 Support

- **Email**: support@gcspends.com
- **Team**: GC Spends Team
- **Documentation**: Complete Swagger documentation available
- **Version**: API v1.0.0
- **License**: MIT

## 🔄 Getting Started

### 1. Start Documentation Server
```bash
python3 docs/swagger/serve.py
```

### 2. Access Documentation
- **Swagger UI**: http://localhost:8001/index.html
- **Quick Reference**: http://localhost:8001/quick-reference.html
- **API Reference**: http://localhost:8001/api-reference.html

### 3. Test API
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test authentication
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password"
```

### 4. Frontend Integration
```javascript
// Initialize services
const authService = new AuthService();
const apiService = new APIService();
const userService = new UserService();
const requestService = new RequestService();
const fileService = new FileService();
const dictionaryService = new DictionaryService();

// Use in your application
async function initializeApp() {
  try {
    const user = await authService.getCurrentUser();
    console.log('Current user:', user);
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}
```

---

*This documentation is automatically generated from the OpenAPI specification and provides complete coverage of all 36 API endpoints for frontend development.*
