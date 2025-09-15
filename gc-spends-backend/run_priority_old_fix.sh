#!/bin/bash

echo "🔧 Fixing priority_priority_old type issue on server..."

# Run the priority old type fix SQL script
echo "📋 Applying paymentpriority enum fix..."
psql -h localhost -U kads_user -d grainchain -f fix_priority_old_type_issue.sql

if [ $? -eq 0 ]; then
    echo "✅ Priority old type fix applied successfully."
    echo "🚀 Now you can run the Alembic migration:"
    echo "   alembic upgrade head"
else
    echo "❌ Priority old type fix failed."
    exit 1
fi
