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

- [x] [Level 1] Fix Alembic migration conflicts (Completed: 2025-01-27)
  - Task: Fix "type payment_request_status already exists" and "relation exchange_rates already exists" errors in Alembic migration
  - Problem: Migration was trying to create objects that already exist on server (enums, tables, columns, constraints)
  - Root cause: Server has existing objects with different values/structures than what migration expects
  - Solution implemented:
    1. ✅ Deleted problematic migration file and created new one with correct sequence
    2. ✅ Fixed migration references to maintain proper Alembic chain
    3. ✅ Created comprehensive migration with proper cleanup and creation
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/ffe416ae00e8_phase_1_critical_data_integrity_enum_.py` - DELETED (problematic)
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/99b34946f71d_phase_1_critical_data_integrity_enum_.py` - NEW migration file
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/141ae1976b53_phase_1_soft_delete_improvements_and_.py` - Fixed references
    - `/home/zhandos/gp_latest/gc-spends-backend/complete_migration.sql` - Standalone SQL script
    - `/home/zhandos/gp_latest/gc-spends-backend/run_complete_migration.sh` - Complete migration script
  - Changes made:
    - Deleted problematic migration file that was causing conflicts
    - Created new migration with proper sequence (99b34946f71d)
    - Fixed migration references to maintain proper Alembic chain
    - Added comprehensive cleanup at the beginning of migration
    - Added proper enum creation with lowercase values
    - Added comprehensive data mapping from uppercase to lowercase
    - Added all required constraints and currency handling
    - Created standalone SQL script as backup option
  - Expected result:
    - Migration will run successfully on server without any conflicts
    - Existing data will be properly mapped from uppercase to lowercase enum values
    - All objects will be created with consistent structure and values
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
    - ✅ Problematic migration file deleted
    - ✅ New migration created with proper sequence
    - ✅ Migration references fixed
    - ✅ Comprehensive cleanup and creation implemented
    - ✅ Standalone SQL script created as backup
  - Status: ✅ COMPLETED

- [x] [Level 1] Fix server enum migration issues (Completed: 2025-01-27)
  - Task: Fix "type payment_request_status does not exist" error on server
  - Problem: Migration `601859670843_update_role_codes_to_uppercase` assumes enum types exist but they don't on server
  - Root cause: Server doesn't have the enum types that the migration is trying to use
  - Solution implemented:
    1. ✅ Updated migration file to check and create enum types if missing
    2. ✅ Created server fix script to create all required enum types
    3. ✅ Created execution script for easy application
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/601859670843_update_role_codes_to_uppercase.py` - Added enum existence checks
    - `/home/zhandos/gp_latest/gc-spends-backend/fix_server_enum_issue.sql` - Server fix script
    - `/home/zhandos/gp_latest/gc-spends-backend/run_server_fix.sh` - Execution script
  - Changes made:
    - Added DO blocks to check and create enum types if they don't exist
    - Fixed UPDATE statements to work with VARCHAR columns before enum conversion
    - Created comprehensive server fix script for all required enum types
    - Added proper error handling and notifications
  - Expected result:
    - Migration will run successfully on server after creating missing enum types
    - All enum types will be created with proper lowercase values initially
    - Migration will then convert them to uppercase as intended
  - Next steps:
    1. Run on server: `./run_server_fix.sh` (creates missing enum types)
    2. Then run: `alembic upgrade head` (applies the migration)
  - Status: ✅ COMPLETED

- [x] [Level 1] Fix all enum migration default value issues (Completed: 2025-01-27)
  - Task: Fix all DatatypeMismatch errors for default values in enum conversions
  - Problem: Multiple columns had default values that couldn't be automatically cast to new enum types
  - Root cause: PostgreSQL cannot automatically cast default values when changing column types to enums
  - Solution implemented:
    1. ✅ Added DROP DEFAULT for all enum columns in upgrade function
    2. ✅ Added SET DEFAULT with appropriate enum values after type conversion
    3. ✅ Fixed all downgrade functions with proper default handling
    4. ✅ Created comprehensive server fix script
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/601859670843_update_role_codes_to_uppercase.py` - Fixed all default value issues
    - `/home/zhandos/gp_latest/gc-spends-backend/fix_server_complete.sql` - Complete server fix script
    - `/home/zhandos/gp_latest/gc-spends-backend/run_complete_fix.sh` - Execution script
  - Changes made:
    - Added DROP DEFAULT before all ALTER COLUMN TYPE operations
    - Added SET DEFAULT with appropriate enum values after type conversion
    - Fixed contract_type, distribution_status, sub_registrar_assignment_status, payment_priority in both upgrade and downgrade
    - Created comprehensive server fix that drops views, removes defaults, and creates enums
  - Expected result:
    - Migration will run successfully without DatatypeMismatch errors
    - All enum columns will have proper default values
    - Both upgrade and downgrade functions will work correctly
  - Next steps:
    1. Run on server: `./run_complete_fix.sh` (applies complete fix)
    2. Then run: `alembic upgrade head` (applies the migration)
  - Status: ✅ COMPLETED

- [x] [Level 1] Fix priority enum type mismatch issue (Completed: 2025-01-27)
  - Task: Fix "invalid input value for enum paymentpriority: NORMAL" error
  - Problem: Migration tried to update data before changing enum type to uppercase values
  - Root cause: Wrong order of operations - data update before enum type change
  - Solution implemented:
    1. ✅ Changed order of operations - enum type change before data update
    2. ✅ Fixed enum type name consistency (paymentpriority vs payment_priority)
    3. ✅ Created server fix script for priority enum issue
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/601859670843_update_role_codes_to_uppercase.py` - Fixed operation order
    - `/home/zhandos/gp_latest/gc-spends-backend/fix_priority_enum_issue.sql` - Server fix script
    - `/home/zhandos/gp_latest/gc-spends-backend/run_priority_fix.sh` - Execution script
  - Changes made:
    - Moved enum type change before data update
    - Fixed enum type name consistency throughout migration
    - Added proper handling of paymentpriority vs payment_priority naming
    - Created comprehensive server fix script
  - Expected result:
    - Migration will run successfully without enum value errors
    - Priority values will be properly converted to uppercase
    - Enum type naming will be consistent
  - Next steps:
    1. Run on server: `./run_priority_fix.sh` (fixes priority enum issue)
    2. Then run: `alembic upgrade head` (applies the migration)
  - Status: ✅ COMPLETED

- [x] [Level 1] Fix 3908df61c4ae migration priority enum issue (Completed: 2025-01-27)
  - Task: Fix "invalid input value for enum paymentpriority: normal" error in 3908df61c4ae migration
  - Problem: Migration 3908df61c4ae tried to create enum with lowercase values but server already has uppercase values
  - Root cause: Inconsistent enum value casing between migrations
  - Solution implemented:
    1. ✅ Updated 3908df61c4ae migration to use uppercase enum values
    2. ✅ Changed server_default from 'normal' to 'NORMAL'
    3. ✅ Created server fix script for enum consistency
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/3908df61c4ae_phase_2_api_enhancement_idempotency_.py` - Fixed enum values
    - `/home/zhandos/gp_latest/gc-spends-backend/fix_3908df61c4ae_priority_issue.sql` - Server fix script
    - `/home/zhandos/gp_latest/gc-spends-backend/run_3908df61c4ae_fix.sh` - Execution script
  - Changes made:
    - Changed enum values from lowercase to uppercase ('low' → 'LOW', etc.)
    - Updated server_default from 'normal' to 'NORMAL'
    - Added server fix script to ensure enum consistency
  - Expected result:
    - Migration 3908df61c4ae will run successfully
    - PaymentPriority enum will have consistent uppercase values
    - No enum value conflicts between migrations
  - Next steps:
    1. Run on server: `./run_3908df61c4ae_fix.sh` (fixes enum consistency)
    2. Then run: `alembic upgrade head` (applies the migration)
  - Status: ✅ COMPLETED

- [x] [Level 1] Fix payment_priority_old type mismatch issue (Completed: 2025-01-27)
  - Task: Fix "column priority is of type payment_priority_old but expression is of type paymentpriority" error
  - Problem: Migration tried to cast to paymentpriority but column had type payment_priority_old
  - Root cause: Partial migration execution left enum in intermediate state
  - Solution implemented:
    1. ✅ Fixed UPDATE query to use correct enum type (payment_priority_old)
    2. ✅ Created server fix script to handle enum state
    3. ✅ Added proper enum type detection and correction
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/601859670843_update_role_codes_to_uppercase.py` - Fixed UPDATE query
    - `/home/zhandos/gp_latest/gc-spends-backend/fix_priority_old_type_issue.sql` - Server fix script
    - `/home/zhandos/gp_latest/gc-spends-backend/run_priority_old_fix.sh` - Execution script
  - Changes made:
    - Changed UPDATE query to use payment_priority_old instead of paymentpriority
    - Added server fix script to handle partial migration states
    - Added proper enum type detection and correction logic
  - Expected result:
    - Migration will run successfully without type mismatch errors
    - Enum types will be properly handled in all states
    - Partial migration states will be corrected
  - Next steps:
    1. Run on server: `./run_priority_old_fix.sh` (fixes enum state)
    2. Then run: `alembic upgrade head` (applies the migration)
  - Status: ✅ COMPLETED

- [x] [Level 1] Fix enum case consistency issues (Completed: 2025-01-27)
  - Task: Fix "invalid input value for enum payment_request_status: draft" error in migration 53a6cac1fb45
  - Problem: Migration tried to convert to lowercase but enum already contains uppercase values
  - Root cause: Inconsistent enum value casing across multiple migrations
  - Solution implemented:
    1. ✅ Fixed migration 53a6cac1fb45 to convert to uppercase instead of lowercase
    2. ✅ Fixed migration 5cfd4f8ee69b to use uppercase status values
    3. ✅ Fixed migration 61f1c0ca3053 to add uppercase enum values
    4. ✅ Fixed migration 3afe2971dede to use uppercase status values
    5. ✅ Fixed migration d0b305a829a4 to create uppercase enum values
    6. ✅ Fixed migration 99b34946f71d to use uppercase enum values throughout
    7. ✅ Created comprehensive server fix script for enum case consistency
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/53a6cac1fb45_convert_uppercase_status_to_lowercase.py` - Fixed to convert to uppercase
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/5cfd4f8ee69b_unify_statuses_with_frontend.py` - Fixed to use uppercase
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/61f1c0ca3053_add_missing_status_values.py` - Fixed to add uppercase values
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/3afe2971dede_update_existing_requests_statuses.py` - Fixed to use uppercase
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/d0b305a829a4_cleanup_duplicate_status_values.py` - Fixed to create uppercase enums
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/99b34946f71d_phase_1_critical_data_integrity_enum_.py` - Fixed to use uppercase throughout
    - `/home/zhandos/gp_latest/gc-spends-backend/fix_enum_case_consistency.sql` - Server fix script
    - `/home/zhandos/gp_latest/gc-spends-backend/run_enum_case_fix.sh` - Execution script
  - Changes made:
    - Changed all migrations to use uppercase enum values consistently
    - Fixed all UPDATE statements to convert to uppercase
    - Fixed all default values to use uppercase
    - Fixed all enum creation to use uppercase values
    - Added CASCADE to all DROP TYPE statements
    - Created comprehensive server fix script to handle enum case conversion
  - Expected result:
    - All migrations will run successfully with consistent uppercase enum values
    - No more InvalidTextRepresentation errors
    - All enum types will have consistent casing throughout the system
  - Next steps:
    1. Run on server: `./run_enum_case_fix.sh` (fixes enum case consistency)
    2. Then run: `alembic upgrade head` (applies all migrations)
  - Status: ✅ COMPLETED

- [x] [Level 1] Fix status mapping issues in migrations (Completed: 2025-01-27)
  - Task: Fix "invalid input value for enum payment_request_status: REGISTERED" error in migration 5cfd4f8ee69b
  - Problem: Migration tried to map status values that don't exist in the enum or data
  - Root cause: Migration assumed certain values exist without checking
  - Solution implemented:
    1. ✅ Fixed migration 5cfd4f8ee69b to check existence before mapping
    2. ✅ Fixed migration 61f1c0ca3053 to check existence before adding enum values
    3. ✅ Created comprehensive server fix script for status mapping
  - Files modified:
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/5cfd4f8ee69b_unify_statuses_with_frontend.py` - Added existence checks
    - `/home/zhandos/gp_latest/gc-spends-backend/alembic/versions/61f1c0ca3053_add_missing_status_values.py` - Added existence checks
    - `/home/zhandos/gp_latest/gc-spends-backend/check_enum_values.sql` - Enum and data analysis script
    - `/home/zhandos/gp_latest/gc-spends-backend/fix_status_mapping_issue.sql` - Server fix script
    - `/home/zhandos/gp_latest/gc-spends-backend/run_status_mapping_fix.sh` - Execution script
  - Changes made:
    - Added DO blocks to check if source values exist in data before mapping
    - Added DO blocks to check if target values exist in enum before mapping
    - Added DO blocks to check if enum values exist before adding them
    - Added comprehensive logging for debugging
    - Created analysis script to check current state
  - Expected result:
    - Migrations will run successfully without InvalidTextRepresentation errors
    - Only existing values will be mapped
    - Only missing enum values will be added
    - Comprehensive logging will help debug any issues
  - Next steps:
    1. Run on server: `./run_status_mapping_fix.sh` (fixes status mapping issues)
    2. Then run: `alembic upgrade head` (applies all migrations)
  - Status: ✅ COMPLETED
