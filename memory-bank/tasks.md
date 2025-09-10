# Task: GC Spends/Registry Flow - Role Separation Implementation

## Description
Implement the new GC Spends/Registry Flow with clear role separation between CHIEF_REGISTRAR (Главный регистратор) and REGISTRAR (Простой регистратор). This implementation focuses on creating a streamlined workflow where CHIEF_REGISTRAR handles distribution and assignment, while REGISTRAR manages closing documents.

## Complexity
Level: 3
Type: Intermediate Feature Implementation

## Technology Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS + Radix UI
- Backend: FastAPI + SQLAlchemy + PostgreSQL + Alembic
- Database: PostgreSQL with existing schema
- Authentication: JWT-based (existing infrastructure)
- File Management: Existing file upload system
- API Integration: RESTful API with existing endpoints

## Technology Validation Checkpoints
- [x] Project initialization command verified (npm run dev)
- [x] Required dependencies identified and installed
- [x] Build configuration validated (Vite + TypeScript)
- [x] Hello world verification completed
- [x] Test build passes successfully
- [x] Database connection verified
- [x] API endpoints functional
- [x] Existing role system analyzed
- [x] Current distribution flow understood

## Status
- [x] System analysis complete
- [x] Current architecture reviewed
- [x] Role separation requirements defined
- [x] Planning complete
- [x] Backend API modifications
- [x] Frontend component updates
- [x] Role-based access control implementation
- [x] Mock data identification complete
- [x] Remove mock data from registrar/sub-registrar dashboards
- [x] Backend API integration for responsible registrar filtering
- [x] Frontend API integration for SubRegistrarDashboard
- [x] Frontend API integration for Dashboard component
- [ ] Closing documents functionality
- [ ] Testing and validation

## Implementation Plan

### Phase 1: Backend API Modifications (Week 1)

#### 1.1 Users Service Enhancements
- [x] **Add CHIEF_REGISTRAR role support**
  - Verify CHIEF_REGISTRAR role exists in enums (✅ already exists)
  - Update user filtering endpoints to support CHIEF_REGISTRAR
  - Add role-based user listing: `GET /users?role=CHIEF_REGISTRAR`
  - Add role-based user listing: `GET /users?role=REGISTRAR`

#### 1.2 Payment Requests API Updates
- [x] **Add responsible registrar assignment**
  - Add `responsible_registrar_id` field to PaymentRequest model
  - Update request schemas to include responsible registrar
  - Modify distribution endpoint to accept responsible registrar assignment
  - Add validation for registrar role assignment

#### 1.3 Distribution API (NEW)
- [x] **Create distribution module**
  - Create `app/modules/distribution/` module
  - Add ExpenseSplit model for expense distribution
  - Add Contract model for contract status checking
  - Add SUB_REGISTRAR role to enums
  - Create distribution endpoints:
    - `GET /distribution/contract-status/{counterparty_id}` - Check contract status
    - `GET /distribution/sub-registrars` - Get SUB_REGISTRAR users
    - `POST /distribution/classify` - Classify and assign request
    - `POST /distribution/return` - Return request to executor
    - `GET /distribution/expense-splits/{request_id}` - Get expense splits

#### 1.4 Closing Documents API
- [ ] **Create closing documents module**
  - Create `app/modules/closing_documents/` module
  - Add ClosingDocument model with fields:
    - `request_id` (UUID, ForeignKey)
    - `document_type` (String) - АВР, Другое, Инвойс, УПД, ЭСФ, АО
    - `document_number` (String)
    - `document_date` (Date)
    - `amount_without_vat` (Numeric)
    - `vat_amount` (Numeric)
    - `original_documents_status` (String) - Не получены/Получены в полном объёме/Частично получены
    - `created_by_user_id` (UUID, ForeignKey)
    - `created_at` (DateTime)
  - Add file attachments for closing documents
  - Create CRUD endpoints for closing documents

#### 1.4 Role-Based Access Control
- [ ] **Implement role-based permissions**
  - Add authentication middleware for role checking
  - Restrict distribution actions to CHIEF_REGISTRAR only
  - Restrict closing documents actions to REGISTRAR only
  - Add role validation for all relevant endpoints

### Phase 2: Frontend Component Updates (Week 2)

#### 2.1 Role System Updates
- [x] **Update role definitions**
  - Add `SUB_REGISTRAR` to UserRole type
  - Update navigation items to include CHIEF_REGISTRAR
  - Add role-specific UI components and permissions

#### 2.2 CHIEF_REGISTRAR Components
- [x] **Distribution Interface Enhancements**
  - Update distribution form to include responsible registrar selection
  - Add autocomplete for SUB_REGISTRAR users
  - Enhance contract checking display (green/red status)
  - Add responsible registrar assignment field
  - Update distribution workflow to require registrar assignment
  - Add contract status display with green/red indicators
  - Integrate with new distribution API endpoints

#### 2.3 REGISTRAR Components
- [ ] **Closing Documents Interface**
  - Create `ClosingDocumentsForm` component
  - Add document type selection (АВР, Другое, Инвойс, УПД, ЭСФ, АО)
  - Add document number and date fields
  - Add amount fields (without VAT, VAT amount)
  - Add original documents status selection
  - Integrate with existing file upload component
  - Add closing documents display in request details

#### 2.4 Request Information Updates
- [ ] **Update RequestInformationCard**
  - Add responsible registrar display
  - Add closing documents section
  - Show document status and attachments
  - Update role-based visibility

### Phase 3: Workflow Integration (Week 3)

#### 3.1 Workflow State Management
- [ ] **Update request status flow**
  - Add new status: `DISTRIBUTED` (after CHIEF_REGISTRAR actions)
  - Add new status: `CLOSED` (after REGISTRAR actions)
  - Update status transitions and validations
  - Add role-based status restrictions

#### 3.2 Dashboard Updates
- [ ] **Role-specific dashboards**
  - Update CHIEF_REGISTRAR dashboard for distribution tasks
  - Update REGISTRAR dashboard for closing document tasks
  - Add task counters and status indicators
  - Update statistics and metrics

#### 3.3 Navigation and Routing
- [ ] **Update navigation structure**
  - Add CHIEF_REGISTRAR specific navigation items
  - Update REGISTRAR navigation for closing documents
  - Add role-based route protection
  - Update breadcrumbs and page titles

### Phase 4: Testing and Validation (Week 4)

#### 4.1 Backend Testing
- [ ] **API endpoint testing**
  - Test role-based access control
  - Test closing documents CRUD operations
  - Test responsible registrar assignment
  - Test workflow state transitions

#### 4.2 Frontend Testing
- [ ] **Component testing**
  - Test role-based component rendering
  - Test form validations and submissions
  - Test file upload integration
  - Test workflow navigation

#### 4.3 Integration Testing
- [ ] **End-to-end workflow testing**
  - Test complete CHIEF_REGISTRAR workflow
  - Test complete REGISTRAR workflow
  - Test role switching and permissions
  - Test data consistency across roles

## Dependencies
- Existing user management system
- Current payment request models and APIs
- Existing file upload system
- Current role-based authentication
- Database schema and migrations
- Frontend component library

## Challenges & Mitigations

### Challenge 1: Role Transition Complexity
**Risk:** Complex role transitions may confuse users
**Mitigation:** Clear UI indicators and workflow guidance

### Challenge 2: Data Consistency
**Risk:** Role separation may lead to data inconsistencies
**Mitigation:** Implement proper validation and state management

### Challenge 3: Backward Compatibility
**Risk:** Changes may break existing functionality
**Mitigation:** Gradual rollout with feature flags

### Challenge 4: User Experience
**Risk:** New workflow may be confusing for users
**Mitigation:** Comprehensive user training and documentation

## Acceptance Criteria

### CHIEF_REGISTRAR Functionality
- [ ] Can distribute payment requests
- [ ] Can assign responsible registrar
- [ ] Can view contract status (green/red indicators)
- [ ] Can cancel requests with comments
- [ ] Can only access distribution-related functions

### REGISTRAR Functionality
- [ ] Can view distributed requests
- [ ] Can add closing documents
- [ ] Can upload document files
- [ ] Can set document status
- [ ] Can only access closing document functions

### System Integration
- [ ] Role-based access control working
- [ ] Workflow state transitions functional
- [ ] File upload integration working
- [ ] Data consistency maintained
- [ ] UI/UX intuitive and clear

### Testing
- [ ] All API endpoints tested
- [ ] All components tested
- [ ] End-to-end workflows tested
- [ ] Role permissions validated
- [ ] Performance requirements met

## File Structure Changes

### New Files to Create
```
# Backend Closing Documents
app/modules/closing_documents/
├── __init__.py
├── models.py
├── schemas.py
├── crud.py
└── routes.py

# Frontend Closing Documents
src/components/closing-documents/
├── ClosingDocumentsForm.tsx
├── ClosingDocumentsList.tsx
├── DocumentTypeSelector.tsx
└── DocumentStatusSelector.tsx

# Frontend Role Components
src/components/chief-registrar/
├── DistributionForm.tsx
├── ResponsibleRegistrarSelector.tsx
└── ContractStatusDisplay.tsx

src/components/registrar/
├── ClosingDocumentsDashboard.tsx
├── ClosingDocumentsWorkflow.tsx
└── DocumentUploadForm.tsx
```

### Files to Modify
- `app/models.py` - Add ClosingDocument model
- `app/modules/requests/schemas.py` - Add responsible registrar fields
- `app/modules/requests/router.py` - Add responsible registrar assignment
- `app/modules/users/router.py` - Add role-based filtering
- `src/types/index.ts` - Add CHIEF_REGISTRAR role and closing document types
- `src/components/layout/Navigation.tsx` - Add CHIEF_REGISTRAR navigation
- `src/components/common/RequestInformationCard.tsx` - Add closing documents section
- `src/components/App/AppRouter.tsx` - Add new routes and role protection

## Database Schema Changes

### New Tables
```sql
-- Closing Documents Table
CREATE TABLE closing_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES payment_requests(id),
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    document_date DATE,
    amount_without_vat NUMERIC(15,2),
    vat_amount NUMERIC(15,2),
    original_documents_status VARCHAR(50),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Closing Document Files Table
CREATE TABLE closing_document_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_document_id UUID NOT NULL REFERENCES closing_documents(id),
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    storage_path VARCHAR(500),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modified Tables
```sql
-- Add responsible registrar to payment requests
ALTER TABLE payment_requests 
ADD COLUMN responsible_registrar_id UUID REFERENCES users(id);

-- Add index for performance
CREATE INDEX idx_payment_requests_responsible_registrar 
ON payment_requests(responsible_registrar_id);
```

## Risk Assessment
- **High Risk**: Role transition complexity, data consistency
- **Medium Risk**: User experience, backward compatibility
- **Low Risk**: API modifications, component updates

## Success Metrics
- **Functionality**: 100% role-based access control
- **User Experience**: Intuitive workflow for both roles
- **Performance**: <200ms API response time
- **Quality**: >90% test coverage
- **Data Integrity**: 100% data consistency across roles

## Next Steps
1. Begin backend API modifications
2. Create closing documents module
3. Update frontend role system
4. Implement role-based components
5. Add comprehensive testing
6. Deploy and validate functionality

## Migration Strategy
1. **Phase 1**: Backend changes with backward compatibility
2. **Phase 2**: Frontend updates with feature flags
3. **Phase 3**: Gradual rollout to users
4. **Phase 4**: Full deployment and monitoring

## User Training Requirements
- CHIEF_REGISTRAR workflow training
- REGISTRAR workflow training
- Role transition guidance
- New feature documentation
- Troubleshooting guides
```