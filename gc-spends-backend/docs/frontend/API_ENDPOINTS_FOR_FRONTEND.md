# GC Spends API - Complete Endpoints Reference for Frontend Development

## 📋 Overview

This document provides a comprehensive list of all API endpoints available for frontend development. The API is organized into logical modules with clear responsibilities.

## 🔐 Authentication

All API endpoints (except `/health`) require JWT authentication via `Authorization: Bearer <token>` header.

### Get Authentication Token
```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=your_password
```

### Get Current User Info
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

## 📊 API Statistics

- **Total Endpoints**: 36
- **Total Schemas**: 41
- **API Tags**: 21
- **OpenAPI Version**: 3.0.2

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

### 8. Registry (2 endpoints)

#### Payment Registry
- `GET /api/v1/registry` - Get payment registry
- `POST /api/v1/registry` - Add request to registry
- `GET /api/v1/registry/statistics` - Registry statistics

### 9. Distribution (1 endpoint)

#### Contract Management
- `GET /api/v1/distribution/contract-status/{counterparty_id}` - Check contract status

### 10. Sub-Registrar (2 endpoints)

#### Sub-Registrar Functions
- `GET /api/v1/sub-registrar/assignments` - Get assignments
- `GET /api/v1/sub-registrar/reports/{request_id}` - Get report

### 11. Distributor (2 endpoints)

#### Distributor Functions
- `GET /api/v1/distributor/requests` - Get distributor requests
- `GET /api/v1/distributor/requests/{request_id}` - Get specific request

### 12. Export Contracts (2 endpoints)

#### Contract Management
- `GET /api/v1/export-contracts` - List export contracts
- `GET /api/v1/export-contracts/{contract_id}` - Get specific contract

### 13. Admin (2 endpoints)

#### System Administration
- `GET /api/v1/admin/statistics` - System statistics
- `GET /api/v1/admin/activity-log` - Activity log

### 14. Priority Management (2 endpoints)

#### Priority Rules
- `GET /api/v1/priority/rules` - List priority rules
- `POST /api/v1/priority/rules` - Create priority rule

### 15. Monitoring (1 endpoint)

#### System Monitoring
- `GET /api/v1/monitoring/health` - System health check

### 16. Idempotency (1 endpoint)

#### Key Management
- `POST /api/v1/idempotency/generate-key` - Generate idempotency key

### 17. Health Check (1 endpoint)

#### System Status
- `GET /health` - Basic health check

## 🎯 Frontend Development Guidelines

### 1. Authentication Flow

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${email}&password=${password}`
  });
  return response.json();
};

// Get current user
const getCurrentUser = async (token) => {
  const response = await fetch('/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 2. Error Handling

All endpoints return consistent error responses:

```javascript
// Error response format
{
  "detail": "Error message"
}

// HTTP Status Codes
// 200 - Success
// 201 - Created
// 400 - Bad Request
// 401 - Unauthorized
// 403 - Forbidden
// 404 - Not Found
// 409 - Conflict
// 500 - Internal Server Error
```

### 3. Pagination

Many list endpoints support pagination:

```javascript
// Pagination parameters
const params = new URLSearchParams({
  skip: 0,      // Number of records to skip
  limit: 100,   // Maximum number of records
  page: 1       // Page number (some endpoints)
});
```

### 4. Filtering and Search

Many endpoints support filtering:

```javascript
// Common filter parameters
const filters = {
  search: 'search_term',           // Text search
  active_only: true,               // Show only active records
  status: 'active',                // Filter by status
  user_id: 'uuid',                 // Filter by user
  start_date: '2024-01-01',        // Date range start
  end_date: '2024-12-31'           // Date range end
};
```

### 5. File Upload

For file uploads, use multipart/form-data:

```javascript
// File upload
const uploadFile = async (file, requestId) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`/api/v1/file-management/upload/${requestId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

## 📱 Frontend Module Mapping

### User Management Module
- Authentication endpoints
- User CRUD operations
- Role management
- Position and department management

### Request Management Module
- Payment request CRUD
- Request statistics
- File attachments
- Request status management

### Dictionary Management Module
- Counterparties management
- Expense articles management
- Data import/export
- Audit history

### Registry Module
- Payment registry
- Registry statistics
- Request assignment

### Distribution Module
- Contract status checking
- Distributor requests
- Export contracts

### Admin Module
- System statistics
- Activity monitoring
- User management

### Monitoring Module
- System health
- Performance metrics
- Priority management

## 🔧 Development Tools

### Swagger UI
- **URL**: `http://localhost:8000/index.html`
- **Features**: Interactive API testing, documentation, code generation

### API Reference
- **URL**: `http://localhost:8000/api-reference.html`
- **Features**: Static documentation, examples, navigation

### OpenAPI JSON
- **URL**: `http://localhost:8000/openapi.json`
- **Features**: Machine-readable specification, SDK generation

## 📞 Support

- **Email**: support@gcspends.com
- **Team**: GC Spends Team
- **Documentation**: Complete Swagger documentation available
- **Version**: API v1.0.0

---

*This documentation is automatically generated from the OpenAPI specification*
