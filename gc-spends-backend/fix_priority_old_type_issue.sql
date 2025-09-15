-- Fix priority_priority_old type issue on server
-- This script handles the case where paymentpriority was already renamed to payment_priority_old

-- Check current enum types
SELECT 'Current enum types:' as status;
SELECT typname as enum_name FROM pg_type WHERE typtype = 'e' ORDER BY typname;

-- Check if payment_priority_old exists and paymentpriority doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_priority_old') 
       AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentpriority') THEN
        -- Rename payment_priority_old back to paymentpriority
        ALTER TYPE payment_priority_old RENAME TO paymentpriority;
        RAISE NOTICE 'Renamed payment_priority_old back to paymentpriority';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentpriority') THEN
        -- Create paymentpriority if it doesn't exist
        CREATE TYPE paymentpriority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');
        RAISE NOTICE 'Created paymentpriority enum';
    ELSE
        RAISE NOTICE 'paymentpriority enum already exists';
    END IF;
END $$;

-- Verification
SELECT 'Priority enum fix completed successfully' as status;
SELECT 'Current enum types after fix:' as status;
SELECT typname as enum_name FROM pg_type WHERE typtype = 'e' ORDER BY typname;
