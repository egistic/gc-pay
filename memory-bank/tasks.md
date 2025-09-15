# Tasks

## Completed Tasks

- [x] [Level 1] Hide 'splited' status requests from EXECUTOR dashboard (Completed: 2025-01-27)
  - Task: Hide requests with 'splited' status from the recent requests list in ExecutorDashboard
  - Problem: EXECUTOR role was seeing original requests that had been split, which should be hidden
  - Solution: Added filtering logic to exclude requests with 'splited' status from the dashboard
  - Files modified:
    - `/home/zhandos/gp_latest/frontend/src/components/executor/ExecutorDashboard.tsx` - Added splited status filtering
  - Changes made:
    - Added filter to exclude requests with `r.status !== 'splited'` before applying other filters
    - Updated comment to clarify that all requests except splited are shown
    - Maintains existing filter functionality while hiding split original requests
  - Logic implemented:
    ```typescript
    // Hide requests with 'splited' status for EXECUTOR role
    filtered = filtered.filter(r => r.status !== 'splited');
    ```
  - Expected result:
    - EXECUTOR dashboard will not show original requests that have been split
    - Split requests (REQ-000XXX-01, REQ-000XXX-02) will still be visible if they have other statuses
    - All other filtering functionality remains unchanged
  - Frontend verification:
    - ✅ Frontend builds successfully
    - ✅ Splited status filtering added
    - ✅ No TypeScript compilation errors
  - Status: ✅ COMPLETED

- [x] [Level 1] Fix SubRegistrarAssignmentsList import error (Completed: 2025-01-27)
  - Task: Fix "The requested module does not provide an export named 'SubRegistrarRequestsList'" error
  - Problem: AppRouter.tsx was trying to import SubRegistrarRequestsList as a named export, but there were issues with the export structure
  - Solution: Changed to use default export for better compatibility and reliability
  - Files modified:
    - `/home/zhandos/gp_latest/frontend/src/components/sub-registrar/SubRegistrarAssignmentsList.tsx` - Added default export
    - `/home/zhandos/gp_latest/frontend/src/components/App/AppRouter.tsx` - Updated import to use default export
  - Changes made:
    - Added `export default SubRegistrarRequestsList;` to SubRegistrarAssignmentsList.tsx
    - Changed import from `{ SubRegistrarRequestsList as SubRegistrarAssignmentsList }` to `import SubRegistrarAssignmentsList from '../sub-registrar/SubRegistrarAssignmentsList'`
    - Kept named exports for backward compatibility
  - Expected result:
    - No more SyntaxError when loading the application
    - SubRegistrarAssignmentsList component loads correctly for SUB_REGISTRAR role
    - Application runs without import/export errors
    - Better compatibility with module resolution
  - Frontend verification:
    - ✅ Frontend builds successfully
    - ✅ No TypeScript compilation errors
    - ✅ Default export structure is more reliable
    - ✅ Development server restarted to clear cache
  - Status: ✅ COMPLETED

- [x] [Level 2] Fix split request visibility for sub-registrars (Completed: 2025-01-27)
  - Task: Ensure each split request is only visible to its assigned sub-registrar
  - Problem: After splitting a request into multiple parts with different sub-registrars assigned to each part, all sub-registrars can see all split requests instead of only their assigned ones
  - Root cause: The get_requests endpoint for SUB_REGISTRAR role only filters by status (CLASSIFIED) but doesn't check SubRegistrarAssignment table
  - Solution implemented:
    1. ✅ Updated backend get_requests endpoint to join with SubRegistrarAssignment table
    2. ✅ Added filtering by current user's sub-registrar assignments
    3. ✅ Verified split request creation logic properly assigns individual sub-registrars
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/app/modules/requests/router.py` - Updated get_requests function and all SUB_REGISTRAR filtering
  - Changes made:
    - Added SubRegistrarAssignment import to requests router
    - Updated get_requests function to join with SubRegistrarAssignment table
    - Added filtering by current user's sub-registrar assignments for SUB_REGISTRAR role
    - Updated statistics and dashboard functions with same filtering logic
    - Updated expense articles filtering for sub-registrars
  - Expected result:
    - Each sub-registrar only sees requests assigned to them
    - Split requests are properly distributed to their respective assigned sub-registrars
    - Original request visibility remains unchanged for other roles
  - Backend changes implemented:
    - ✅ Updated get_requests endpoint to join with SubRegistrarAssignment table
    - ✅ Added filtering by current user's sub-registrar assignments
    - ✅ Updated all SUB_REGISTRAR role filtering in statistics and dashboard functions
    - ✅ Updated expense articles filtering for sub-registrars
  - Frontend verification:
    - ✅ Frontend builds successfully
    - ✅ No TypeScript compilation errors
  - Status: ✅ COMPLETED

## Current Task

- [x] [Level 1] Fix Alembic migration enum conflict (Completed: 2025-01-27)
  - Task: Fix "type payment_request_status already exists" error in Alembic migration
  - Problem: Migration was trying to create enum types that already exist on server with different values (uppercase vs lowercase)
  - Root cause: Server has existing enums with uppercase values, but migration was trying to create new enums with lowercase values
  - Solution implemented:
    1. ✅ Updated migration to drop and recreate enum types with CASCADE
    2. ✅ Added proper mapping from existing uppercase values to new lowercase enum values
    3. ✅ Created standalone SQL script as backup option
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/ffe416ae00e8_phase_1_critical_data_integrity_enum_.py` - Updated migration logic
    - `/home/zhandos/gp_latest/gc-spends-backend/fix_enum_migration.sql` - Created standalone SQL script
  - Changes made:
    - Changed approach to drop existing enum types with CASCADE before creating new ones
    - Added comprehensive mapping from server's uppercase enum values to new lowercase values
    - Mapped all 18 payment_request_status values from server to appropriate new values
    - Mapped distribution_status, document_status, sub_registrar_assignment_status, and contract_type values
    - Created standalone SQL script with same logic for direct server execution
  - Expected result:
    - Migration will run successfully on server without enum conflicts
    - Existing data will be properly mapped from uppercase to lowercase enum values
    - All enum types will be created with consistent lowercase values
    - Database constraints and currency handling will be properly implemented
  - Status mapping:
    - DRAFT → draft
    - SUBMITTED → submitted  
    - CLASSIFIED/RETURNED → under_review
    - APPROVED/APPROVED_ON_BEHALF/TO_PAY/IN_REGISTER/APPROVED_FOR_PAYMENT → approved
    - PAID_FULL/PAID_PARTIAL/DISTRIBUTED/REPORT_PUBLISHED/EXPORT_LINKED → paid
    - REJECTED → rejected
    - CANCELLED/CLOSED/SPLITED → cancelled
  - Backend verification:
    - ✅ Migration file updated with DROP CASCADE approach
    - ✅ Comprehensive value mapping implemented
    - ✅ Standalone SQL script created as backup
    - ✅ All enum types handled (payment_request_status, distribution_status, document_status, sub_registrar_assignment_status, contract_type)
  - Status: ✅ COMPLETED
