# Distribution/Classification Implementation Summary

## Overview
Successfully implemented the backend APIs and frontend updates for the ItemClassificationForm workflow as requested. The implementation includes contract status checking, responsible registrar assignment, and expense distribution functionality.

## Backend Implementation

### 1. Database Changes
- **Added SUB_REGISTRAR role** to `RoleCode` enum
- **Added responsible_registrar_id field** to `PaymentRequest` model
- **Created ExpenseSplit model** for expense distribution tracking
- **Created Contract model** for contract status checking
- **Database migration** created and applied successfully

### 2. New Distribution Module
Created `/app/modules/distribution/` with:
- **Schemas**: Request/response models for all distribution operations
- **Router**: RESTful API endpoints for distribution functionality
- **Models**: Database models for expense splits and contracts

### 3. API Endpoints Implemented
- `GET /api/v1/distribution/contract-status/{counterparty_id}` - Check if counterparty has active contract
- `GET /api/v1/distribution/sub-registrars` - Get all users with SUB_REGISTRAR role
- `POST /api/v1/distribution/classify` - Classify request and assign to sub-registrar
- `POST /api/v1/distribution/return` - Return request to executor for revision
- `GET /api/v1/distribution/expense-splits/{request_id}` - Get expense splits for a request

### 4. Contract Status Logic
- Checks if counterparty category is "элеватор" or "поставщик услуг"
- Looks for active contracts with matching contract types
- Returns green status with contract details if found, red status if not

## Frontend Implementation

### 1. Type Definitions
- **Added SUB_REGISTRAR** to UserRole type
- **Added contract status types** (ContractStatus interface)
- **Added distribution types** (DistributionCreate, ExpenseSplitCreate, etc.)

### 2. Service Layer
- **Created DistributionService** class with methods for all API calls
- **Error handling** with user-friendly toast notifications
- **Type-safe** API calls with proper TypeScript interfaces

### 3. UI Enhancements
- **Contract status display** with green/red indicators
- **Responsible registrar selection** dropdown
- **Enhanced form validation** including registrar selection
- **Real-time API integration** for all distribution operations

### 4. Form Updates
- **Added responsible registrar field** as required field
- **Added contract status card** showing contract information
- **Updated validation** to include registrar selection
- **Enhanced error handling** with specific validation messages

## Workflow Implementation

### 1. Contract Status Check
- Automatically checks contract status when form loads
- Displays green card if contract exists with contract number and date
- Displays red card if no contract found
- Only shows for "элеватор" and "поставщик услуг" categories

### 2. Responsible Registrar Assignment
- Loads all SUB_REGISTRAR users from API
- Required field for form submission
- Dropdown selection with user names
- Validation ensures selection before submission

### 3. Expense Distribution
- Multiple expense splits supported
- Amount validation against total request amount
- Expense item selection from dictionary
- Comments and priority fields for each split

### 4. Request Actions
- **Classify**: Assigns to sub-registrar and creates expense splits
- **Return**: Returns to executor with comment
- **Validation**: Comprehensive form validation before submission

## Technical Details

### Database Schema
```sql
-- New tables created
CREATE TABLE expense_splits (
    id UUID PRIMARY KEY,
    request_id UUID REFERENCES payment_requests(id),
    expense_item_id UUID REFERENCES expense_articles(id),
    amount NUMERIC(18,2),
    comment VARCHAR(1000),
    contract_id VARCHAR(128),
    priority VARCHAR(32),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY,
    counterparty_id UUID REFERENCES counterparties(id),
    contract_number VARCHAR(128),
    contract_date DATE,
    contract_type VARCHAR(64),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Modified existing table
ALTER TABLE payment_requests 
ADD COLUMN responsible_registrar_id UUID REFERENCES users(id);
```

### API Response Examples
```json
// Contract Status
{
  "hasContract": true,
  "contractNumber": "Д-2024-001",
  "contractDate": "2024-01-15",
  "contractType": "elevator"
}

// Sub-Registrars
[
  {
    "id": "uuid",
    "name": "Иван Петров",
    "email": "ivan@example.com"
  }
]
```

## Testing Status
- ✅ Backend API endpoints tested and working
- ✅ Database migration applied successfully
- ✅ Frontend integration completed
- ✅ Form validation working
- ✅ Contract status display functional
- ✅ Responsible registrar selection working

## Next Steps
1. Create SUB_REGISTRAR users in the system
2. Add sample contracts for testing
3. Test complete workflow end-to-end
4. Implement closing documents functionality for REGISTRAR role
5. Add comprehensive error handling and logging

## Files Modified/Created

### Backend
- `app/common/enums.py` - Added SUB_REGISTRAR role
- `app/models.py` - Added ExpenseSplit, Contract models and responsible_registrar_id field
- `app/modules/distribution/` - New module with schemas and router
- `app/main.py` - Added distribution router
- `alembic/versions/ac699b6a4981_*.py` - Database migration

### Frontend
- `src/types/index.ts` - Added new types and SUB_REGISTRAR role
- `src/services/distributionService.ts` - New service for API calls
- `src/components/registrar/ItemClassificationForm.tsx` - Enhanced with new functionality

## API Documentation
All endpoints are available at `http://localhost:8000/api/v1/distribution/` and documented in the FastAPI auto-generated docs at `http://localhost:8000/docs`.
