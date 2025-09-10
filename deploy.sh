#!/bin/bash

# GrainChain Spends Deployment Script
# This script deploys the application using Docker Compose

set -e

echo "🚀 Starting GrainChain Spends Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose and try again."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Creating from template..."
    cp .env.production .env.production.backup 2>/dev/null || true
    print_status "Please update .env.production with your production settings before running deployment."
fi

# Check if external network exists
print_status "Checking if external network 'fast_api_backend_merykey_internal' exists..."
if ! docker network ls | grep -q "fast_api_backend_merykey_internal"; then
    print_error "External network 'fast_api_backend_merykey_internal' not found."
    print_error "Please ensure the PostgreSQL container is running and the network exists."
    exit 1
fi

# Check if external PostgreSQL container is running
print_status "Checking if external PostgreSQL container 'fast_api_backend_postgres_1' is running..."
if ! docker ps | grep -q "fast_api_backend_postgres_1"; then
    print_error "External PostgreSQL container 'fast_api_backend_postgres_1' is not running."
    print_error "Please start the PostgreSQL container first."
    exit 1
fi

# Build and start services
print_status "Building and starting services..."

# Use docker-compose or docker compose based on availability
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Build images
print_status "Building Docker images..."
$COMPOSE_CMD build --no-cache

# Start services
print_status "Starting services..."
$COMPOSE_CMD up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check frontend
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Frontend is healthy"
else
    print_warning "⚠️  Frontend health check failed"
fi

# Check backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_status "✅ Backend is healthy"
else
    print_warning "⚠️  Backend health check failed"
fi

# Show running containers
print_status "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show service URLs
echo ""
print_status "🎉 Deployment completed!"
echo ""
print_status "Service URLs:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:8000"
echo "  API Documentation: http://localhost:8000/docs"
echo ""

# Show logs command
print_status "To view logs, run:"
echo "  $COMPOSE_CMD logs -f"
echo ""

# Show stop command
print_status "To stop services, run:"
echo "  $COMPOSE_CMD down"
echo ""

print_status "Deployment script completed successfully! 🚀"
