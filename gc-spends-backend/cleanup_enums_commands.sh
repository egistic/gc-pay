#!/bin/bash

# Commands to clean up ENUM types before running migrations
# Run these commands in the database before running alembic upgrade head

echo "Cleaning up ENUM types..."

# For local development (using .venv)
echo "For local development:"
echo "psql -U kads_user -h 127.0.0.1 -d grainchain -c \"DROP TYPE IF EXISTS contract_type CASCADE;\""
echo "psql -U kads_user -h 127.0.0.1 -d grainchain -c \"DROP TYPE IF EXISTS distribution_status CASCADE;\""
echo "psql -U kads_user -h 127.0.0.1 -d grainchain -c \"DROP TYPE IF EXISTS document_status CASCADE;\""
echo "psql -U kads_user -h 127.0.0.1 -d grainchain -c \"DROP TYPE IF EXISTS payment_priority CASCADE;\""
echo "psql -U kads_user -h 127.0.0.1 -d grainchain -c \"DROP TYPE IF EXISTS payment_request_status CASCADE;\""
echo "psql -U kads_user -h 127.0.0.1 -d grainchain -c \"DROP TYPE IF EXISTS role_code CASCADE;\""
echo "psql -U kads_user -h 127.0.0.1 -d grainchain -c \"DROP TYPE IF EXISTS sub_registrar_assignment_status CASCADE;\""

echo ""
echo "For Docker environment:"
echo "docker exec -it merykey_api psql -U marykay_admin -h postgres -d grainchain -c \"DROP TYPE IF EXISTS contract_type CASCADE;\""
echo "docker exec -it merykey_api psql -U marykay_admin -h postgres -d grainchain -c \"DROP TYPE IF EXISTS distribution_status CASCADE;\""
echo "docker exec -it merykey_api psql -U marykay_admin -h postgres -d grainchain -c \"DROP TYPE IF EXISTS document_status CASCADE;\""
echo "docker exec -it merykey_api psql -U marykay_admin -h postgres -d grainchain -c \"DROP TYPE IF EXISTS payment_priority CASCADE;\""
echo "docker exec -it merykey_api psql -U marykay_admin -h postgres -d grainchain -c \"DROP TYPE IF EXISTS payment_request_status CASCADE;\""
echo "docker exec -it merykey_api psql -U marykay_admin -h postgres -d grainchain -c \"DROP TYPE IF EXISTS role_code CASCADE;\""
echo "docker exec -it merykey_api psql -U marykay_admin -h postgres -d grainchain -c \"DROP TYPE IF EXISTS sub_registrar_assignment_status CASCADE;\""

echo ""
echo "Or run the SQL file directly:"
echo "psql -U kads_user -h 127.0.0.1 -d grainchain -f cleanup_enums.sql"
echo "docker exec -i merykey_api psql -U marykay_admin -h postgres -d grainchain < cleanup_enums.sql"
