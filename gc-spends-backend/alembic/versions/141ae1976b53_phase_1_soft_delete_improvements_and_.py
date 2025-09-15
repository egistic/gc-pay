"""Phase 1: Soft Delete Improvements and Active Views

Revision ID: 141ae1976b53
Revises: 9d343828e9b2
Create Date: 2025-09-14 10:24:55.479231

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '141ae1976b53'
down_revision = '9d343828e9b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Phase 1.8: Create Active Views for Soft Delete
    op.execute("""
        CREATE VIEW active_payment_requests AS
        SELECT * FROM payment_requests WHERE deleted = false;
    """)
    
    op.execute("""
        CREATE VIEW active_payment_request_lines AS
        SELECT prl.* FROM payment_request_lines prl
        JOIN active_payment_requests apr ON prl.request_id = apr.id;
    """)
    
    op.execute("""
        CREATE VIEW active_request_files AS
        SELECT rf.* FROM request_files rf
        JOIN active_payment_requests apr ON rf.request_id = apr.id;
    """)
    
    op.execute("""
        CREATE VIEW active_request_events AS
        SELECT re.* FROM request_events re
        JOIN active_payment_requests apr ON re.request_id = apr.id;
    """)
    
    # Phase 1.9: Add Soft Delete Constraints
    # Note: PostgreSQL doesn't support subqueries in check constraints
    # This constraint will be enforced at the application level
    # op.execute("""
    #     ALTER TABLE payment_requests 
    #     ADD CONSTRAINT chk_no_soft_delete_with_children 
    #     CHECK (
    #         deleted = false OR 
    #         NOT EXISTS (
    #             SELECT 1 FROM payment_request_lines 
    #             WHERE request_id = payment_requests.id AND deleted = false
    #         )
    #     );
    # """)
    
    # Phase 1.10: Add Split Group Constraints
    op.execute("""
        ALTER TABLE payment_requests 
        ADD CONSTRAINT chk_split_group_consistency 
        CHECK (
            (original_request_id IS NULL AND split_sequence IS NULL) OR
            (original_request_id IS NOT NULL AND split_sequence IS NOT NULL)
        );
    """)
    
    # Phase 1.11: Add Unique Constraint for Split Groups
    # Note: PostgreSQL partial unique constraints use different syntax
    op.execute("""
        CREATE UNIQUE INDEX uk_split_group_sequence 
        ON payment_requests (original_request_id, split_sequence) 
        WHERE original_request_id IS NOT NULL;
    """)
    
    # Phase 1.12: Add Document Requirements Constraints
    op.execute("""
        ALTER TABLE line_required_docs 
        ADD CONSTRAINT chk_file_required_when_provided 
        CHECK (is_provided = false OR file_id IS NOT NULL);
    """)
    
    # Phase 1.13: Add File Name Format Constraints
    # First, clean up existing file names to match the format
    op.execute("""
        UPDATE request_files 
        SET file_name = REGEXP_REPLACE(
            REGEXP_REPLACE(file_name, '[^a-zA-Z0-9._-]', '_', 'g'),
            '_+', '_', 'g'
        )
        WHERE file_name !~ '^[a-zA-Z0-9._-]+$';
    """)
    
    op.execute("""
        ALTER TABLE request_files 
        ADD CONSTRAINT chk_file_name_format 
        CHECK (file_name ~ '^[a-zA-Z0-9._-]+$');
    """)
    
    # Phase 1.14: Add MIME Type Validation
    op.execute("""
        ALTER TABLE request_files 
        ADD CONSTRAINT chk_mime_type_valid 
        CHECK (mime_type IN (
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ));
    """)


def downgrade() -> None:
    # Remove constraints
    op.execute("ALTER TABLE request_files DROP CONSTRAINT chk_mime_type_valid;")
    op.execute("ALTER TABLE request_files DROP CONSTRAINT chk_file_name_format;")
    op.execute("ALTER TABLE line_required_docs DROP CONSTRAINT chk_file_required_when_provided;")
    op.execute("DROP INDEX uk_split_group_sequence;")
    op.execute("ALTER TABLE payment_requests DROP CONSTRAINT chk_split_group_consistency;")
    # op.execute("ALTER TABLE payment_requests DROP CONSTRAINT chk_no_soft_delete_with_children;")
    
    # Drop views
    op.execute("DROP VIEW active_request_events;")
    op.execute("DROP VIEW active_request_files;")
    op.execute("DROP VIEW active_payment_request_lines;")
    op.execute("DROP VIEW active_payment_requests;")
