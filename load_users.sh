#!/bin/bash

# Script to load users and roles into the database
# This script should be run on the server after the containers are up

echo "Loading users and roles into the database..."

# Check if the backend container is running
if ! docker compose ps backend | grep -q "Up"; then
    echo "Error: Backend container is not running. Please start the containers first with: docker compose up -d"
    exit 1
fi

# Execute the SQL script
echo "Executing load_users_and_roles.sql..."
docker compose exec -T backend psql $DATABASE_URL -f - < load_users_and_roles.sql

if [ $? -eq 0 ]; then
    echo "✅ Users and roles loaded successfully!"
    echo ""
    echo "You can now login with any of these accounts:"
    echo ""
    echo "Main users (hardcoded in frontend):"
    echo "Email: executor@gcpay.kz (password: password123) - Main executor"
    echo "Email: aigul@gcpay.kz (password: password123) - Айгуль Нурланова"
    echo "Email: registrar@gcpay.kz (password: password123) - Main registrar"
    echo ""
    echo "Additional users:"
    echo "Email: subregistrar1@gcpay.kz (password: password123)"
    echo "Email: distributor1@gcpay.kz (password: password123)"
    echo "Email: treasurer1@gcpay.kz (password: password123)"
    echo "Email: admin1@gcpay.kz (password: password123)"
    echo ""
    echo "Test user (for development):"
    echo "Email: test@gcpay.kz"
    echo "Password: nx2lPmwLM0H60K3zx4jq"
    echo ""
    echo "⚠️  IMPORTANT: Change these passwords in production!"
else
    echo "❌ Error loading users and roles. Check the database connection and try again."
    exit 1
fi

# Create test user
echo "Creating test user..."
docker compose exec -T backend psql $DATABASE_URL -f - < create_test_user.sql

if [ $? -eq 0 ]; then
    echo "✅ Test user created successfully!"
    echo ""
    echo "Test user credentials:"
    echo "Email: test@gcpay.kz"
    echo "Password: nx2lPmwLM0H60K3zx4jq"
    echo ""
    echo "You can now use the test user for quick access to the system!"
else
    echo "❌ Error creating test user."
    exit 1
fi
