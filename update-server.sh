#!/bin/bash

# This script is intended to be run on the server to update the application.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting server update process..."

# 1. Navigate to the project root directory
# Assuming the script is in the project root or a known location relative to it
PROJECT_ROOT="/home/zhandos/gp_latest" # Adjust this path if necessary
cd "$PROJECT_ROOT"

echo "Pulling latest changes from Git repository..."
# 2. Pull the latest changes from your Git repository
# Make sure your server has access to the repository and is configured for passwordless pull (e.g., SSH keys)
git pull origin main # Or your specific branch, e.g., 'git pull origin develop'

echo "Rebuilding and restarting Docker containers..."
# 3. Rebuild and restart the Docker containers using docker-compose
# The --build flag ensures that Dockerfiles are re-read and images are rebuilt
# The -d flag runs the containers in detached mode
docker compose up --build -d

echo "Running Alembic migrations for the backend..."
# 4. Run Alembic migrations for the backend
# This assumes your backend service in docker-compose.yml is named 'backend'
docker compose exec backend alembic upgrade head

echo "Server update process completed successfully!"
echo "You can check the logs with: docker compose logs -f"
