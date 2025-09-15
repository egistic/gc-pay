# GC Spends Frontend Development Guide

## 🚀 Quick Start

### 1. Start Documentation Server
```bash
# Start the API documentation server
python3 docs/swagger/serve.py

# The server will start on port 8001
# Access documentation at: http://localhost:8001
```

### 2. Access Documentation
- **🔧 Interactive Swagger UI**: http://localhost:8001/index.html
- **📚 Static API Reference**: http://localhost:8001/api-reference.html  
- **⚡ Quick Reference**: http://localhost:8001/quick-reference.html
- **📄 OpenAPI JSON**: http://localhost:8001/openapi.json

### 3. API Base URL
- **Development**: http://localhost:8000/api/v1/
- **Production**: https://gcback.openlayers.kz/api/v1/

## 📋 Complete API Overview

### API Statistics
- **Total Endpoints**: 36
- **Total Schemas**: 41
- **API Tags**: 21
- **Authentication**: JWT Bearer Token

### All 36 API Endpoints

#### 🔐 Authentication & Users (7 endpoints)
1. `POST /api/v1/auth/login` - User login
2. `GET /api/v1/auth/me` - Get current user info
3. `GET /api/v1/users` - List all users
4. `POST /api/v1/users` - Create user (Admin only)
5. `GET /api/v1/users/{user_id}` - Get user details
6. `PUT /api/v1/users/{user_id}` - Update user
7. `DELETE /api/v1/users/{user_id}` - Delete user

#### 👥 Roles & Permissions (5 endpoints)
8. `GET /api/v1/roles` - List all roles
9. `POST /api/v1/roles` - Create role (Admin only)
10. `GET /api/v1/roles/{role_id}` - Get role details
11. `PUT /api/v1/roles/{role_id}` - Update role
12. `DELETE /api/v1/roles/{role_id}` - Delete role

#### 🏢 Positions & Departments (4 endpoints)
13. `GET /api/v1/positions/departments` - List departments
14. `POST /api/v1/positions/departments` - Create department (Admin only)
15. `GET /api/v1/positions` - List positions
16. `POST /api/v1/positions` - Create position (Admin only)

#### 📝 Expense Article Roles (2 endpoints)
17. `GET /api/v1/expense-article-roles/articles/{article_id}/assignments` - Get role assignments
18. `POST /api/v1/expense-article-roles/assignments` - Create role assignment

#### 💳 Payment Requests (3 endpoints)
19. `GET /api/v1/requests` - List payment requests
20. `POST /api/v1/requests` - Create payment request
21. `GET /api/v1/requests/statistics` - Get request statistics

#### 📚 Dictionaries (7 endpoints)
22. `GET /api/v1/dictionaries/counterparties` - List counterparties
23. `POST /api/v1/dictionaries/counterparties` - Create counterparty
24. `GET /api/v1/dictionaries/counterparties/statistics` - Counterparties statistics
25. `GET /api/v1/dictionaries/expense-articles` - List expense articles
26. `POST /api/v1/dictionaries/expense-articles` - Create expense article
27. `GET /api/v1/dictionaries/audit/history/{dictionary_type}` - Get audit history
28. `GET /api/v1/dictionaries/audit/statistics/{dictionary_type}` - Get audit statistics

#### 📁 Files Management (2 endpoints)
29. `POST /api/v1/files/upload` - Upload file
30. `POST /api/v1/file-management/upload/{request_id}` - Advanced file upload

#### 📋 Registry (3 endpoints)
31. `GET /api/v1/registry` - Get payment registry
32. `POST /api/v1/registry` - Add request to registry
33. `GET /api/v1/registry/statistics` - Registry statistics

#### 💰 Distribution (3 endpoints)
34. `GET /api/v1/distribution/contract-status/{counterparty_id}` - Check contract status
35. `GET /api/v1/distributor/requests` - Get distributor requests
36. `GET /api/v1/distributor/requests/{request_id}` - Get specific request

#### 📄 Export Contracts (2 endpoints)
37. `GET /api/v1/export-contracts` - List export contracts
38. `GET /api/v1/export-contracts/{contract_id}` - Get specific contract

#### 📊 Sub-Registrar (2 endpoints)
39. `GET /api/v1/sub-registrar/assignments` - Get assignments
40. `GET /api/v1/sub-registrar/reports/{request_id}` - Get report

#### ⚙️ Admin (2 endpoints)
41. `GET /api/v1/admin/statistics` - System statistics
42. `GET /api/v1/admin/activity-log` - Activity log

#### ⭐ Priority Management (2 endpoints)
43. `GET /api/v1/priority/rules` - List priority rules
44. `POST /api/v1/priority/rules` - Create priority rule

#### 📊 Monitoring (1 endpoint)
45. `GET /api/v1/monitoring/health` - System health check

#### 🔑 Idempotency (1 endpoint)
46. `POST /api/v1/idempotency/generate-key` - Generate idempotency key

#### ❤️ Health Check (1 endpoint)
47. `GET /health` - Basic health check

## 🛠️ Frontend Development Setup

### 1. Authentication Service
```javascript
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api/v1';
    this.token = localStorage.getItem('auth_token');
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${email}&password=${password}`
    });

    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem('auth_token', this.token);
    return data;
  }

  async getCurrentUser() {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) throw new Error('Failed to get user info');
    return await response.json();
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
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

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return await response.json();
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}
```

### 3. Service Examples

#### User Service
```javascript
class UserService extends APIService {
  async getUsers(params = {}) {
    return this.get('/users', params);
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }
}
```

#### Request Service
```javascript
class RequestService extends APIService {
  async getRequests(params = {}) {
    return this.get('/requests', params);
  }

  async createRequest(requestData) {
    return this.post('/requests', requestData);
  }

  async getRequestStatistics(params = {}) {
    return this.get('/requests/statistics', params);
  }
}
```

#### File Service
```javascript
class FileService extends APIService {
  async uploadFile(file, docType) {
    const formData = new FormData();
    formData.append('f', file);
    
    const response = await fetch(`${this.baseURL}/files/upload?doc_type=${docType}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });

    if (!response.ok) throw new Error('File upload failed');
    return await response.json();
  }

  async uploadRequestFile(requestId, file, fileType = 'document') {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/file-management/upload/${requestId}?file_type=${fileType}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });

    if (!response.ok) throw new Error('File upload failed');
    return await response.json();
  }
}
```

## 🚨 Error Handling

### HTTP Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **409** - Conflict
- **422** - Validation Error
- **500** - Server Error

### Error Response Format
```json
{
  "detail": "Error message description"
}
```

### Error Handling Example
```javascript
try {
  const result = await apiService.get('/users');
  console.log('Success:', result);
} catch (error) {
  if (error.message.includes('401')) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Show permission error
    alert('Access denied');
  } else {
    // Show generic error
    alert(`Error: ${error.message}`);
  }
}
```

## 📱 Frontend Module Organization

### 1. User Management Module
- Authentication endpoints
- User CRUD operations
- Role management
- Position and department management

### 2. Request Management Module
- Payment request CRUD
- Request statistics
- File attachments
- Status management

### 3. Dictionary Management Module
- Counterparties management
- Expense articles management
- Data import/export
- Audit history

### 4. File Management Module
- File upload and validation
- Document management
- File type validation
- Storage management

### 5. Registry Module
- Registry entries
- Payment tracking
- Registry statistics
- Request assignment

### 6. Distribution Module
- Contract status checking
- Distributor request management
- Export contract management
- Distribution workflow

### 7. Admin Module
- System monitoring
- Activity tracking
- Administrative functions
- System health

### 8. Monitoring Module
- System health monitoring
- Priority rule management
- Performance metrics
- Alert management

## 🔧 Development Tools

### Interactive Documentation
- **Swagger UI**: http://localhost:8001/index.html
  - Test API endpoints directly
  - View request/response examples
  - Generate code snippets
  - Test authentication

### Static Documentation
- **API Reference**: http://localhost:8001/api-reference.html
  - Complete endpoint documentation
  - Schema definitions
  - Examples and descriptions

### Quick Reference
- **Quick Reference**: http://localhost:8001/quick-reference.html
  - Visual endpoint browser
  - Module organization
  - Quick access to all endpoints

### Machine-Readable
- **OpenAPI JSON**: http://localhost:8001/openapi.json
  - Complete API specification
  - SDK generation
  - Tool integration

## 📞 Support

- **Email**: support@gcspends.com
- **Team**: GC Spends Team
- **Documentation**: Complete Swagger documentation available
- **Version**: API v1.0.0
- **License**: MIT

## 🎯 Next Steps

1. **Start Documentation Server**: `python3 docs/swagger/serve.py`
2. **Access Documentation**: http://localhost:8001/index.html
3. **Review API Endpoints**: Use Quick Reference for overview
4. **Test API**: Use Swagger UI for interactive testing
5. **Implement Frontend**: Use provided service classes and examples

---

*This guide provides everything needed for frontend development with the GC Spends API.*
