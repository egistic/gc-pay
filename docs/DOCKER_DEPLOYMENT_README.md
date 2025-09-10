# Docker Deployment Guide for GrainChain Spends

This guide explains how to deploy the GrainChain Spends application using Docker and Docker Compose.

## Prerequisites

- Docker installed and running
- Docker Compose installed
- External PostgreSQL container running (`fast_api_backend_postgres_1`)
- External network available (`fast_api_backend_merykey_internal`)

## Quick Start

### 1. Configure Environment

Copy the production environment template and update with your settings:

```bash
cp .env.production .env.production.local
# Edit .env.production.local with your actual domain and secrets
```

### 2. Deploy Application

Run the deployment script:

```bash
./deploy.sh
```

Or manually with Docker Compose:

```bash
docker compose up -d --build
```

## Architecture

The application consists of three main components:

### Frontend (React + Vite)
- **Container**: `gc_spends_frontend`
- **Port**: 80
- **Technology**: React, Vite, Nginx
- **Health Check**: `http://localhost/health`

### Backend (FastAPI)
- **Container**: `gc_spends_backend`
- **Port**: 8000
- **Technology**: FastAPI, Python 3.11
- **Health Check**: `http://localhost:8000/health`

### Database (PostgreSQL)
- **Container**: `fast_api_backend_postgres_1` (external)
- **Port**: 5432 (internal)
- **Technology**: PostgreSQL 16

## Configuration

### Environment Variables

Key environment variables for production:

```env
# Application
APP_ENV=production
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql+psycopg://kads_user:kads_password@fast_api_backend_postgres_1:5432/grainchain

# Security
JWT_SECRET=your_very_secure_jwt_secret_change_this_in_production
CORS_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]

# File Storage
FILE_STORAGE=local
FILE_UPLOAD_DIR=./storage
```

### CORS Configuration

The application uses environment-specific CORS origins:

- **Development**: Allows localhost origins
- **Production**: Restricts to specified domains

Update `CORS_ORIGINS` in your environment file with your actual domains.

## Docker Files

### Frontend Dockerfile
- Multi-stage build with Node.js and Nginx
- Optimized for production with Gzip compression
- Security headers configured
- Client-side routing support

### Backend Dockerfile
- Python 3.11 slim base image
- Non-root user for security
- Health check included
- Proxy headers support for reverse proxy

### Docker Compose
- Uses external PostgreSQL container
- Configures internal networking
- Health checks for all services
- Volume persistence for file storage

## Security Features

### Backend Security
- CORS middleware with environment-specific origins
- Trusted host middleware (production only)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Request ID tracking
- Process time monitoring
- GZip compression

### Frontend Security
- Nginx security headers
- Content Security Policy ready
- Static asset caching
- Health check endpoint

## Monitoring and Logs

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f frontend
docker compose logs -f backend
```

### Health Checks
```bash
# Frontend
curl http://localhost/health

# Backend
curl http://localhost:8000/health
```

### Container Status
```bash
docker ps
```

## Maintenance

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build
```

### Database Migrations
```bash
# Run migrations
docker compose exec backend alembic upgrade head
```

### Backup Database
```bash
# Create backup
docker exec fast_api_backend_postgres_1 pg_dump -U kads_user grainchain > backup.sql
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGINS` environment variable
   - Ensure frontend domain is included in allowed origins

2. **Database Connection Issues**
   - Verify PostgreSQL container is running
   - Check network connectivity
   - Validate database credentials

3. **Port Conflicts**
   - Ensure ports 80 and 8000 are available
   - Check for other services using these ports

4. **Permission Issues**
   - Check file permissions for storage volumes
   - Ensure Docker has proper permissions

### Debug Commands

```bash
# Check container logs
docker compose logs backend

# Access container shell
docker compose exec backend bash

# Check network connectivity
docker compose exec backend ping fast_api_backend_postgres_1

# Test database connection
docker compose exec backend python -c "from app.core.db import engine; print(engine.url)"
```

## Production Considerations

### Reverse Proxy
Consider using a reverse proxy (Nginx, Traefik) for:
- SSL/TLS termination
- Load balancing
- Rate limiting
- Additional security headers

### Monitoring
Implement monitoring for:
- Application performance
- Error rates
- Resource usage
- Security events

### Backup Strategy
- Regular database backups
- Application data backups
- Configuration backups
- Disaster recovery plan

## Scaling

### Horizontal Scaling
- Use multiple backend instances
- Implement load balancing
- Consider database read replicas

### Vertical Scaling
- Increase container resources
- Optimize application performance
- Database tuning

## Security Checklist

- [ ] Update default passwords
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Regular security updates
- [ ] Backup strategy
- [ ] Access controls
- [ ] Log monitoring

## Support

For issues and questions:
1. Check the logs first
2. Review this documentation
3. Check the CORS and middleware recommendations
4. Contact the development team

## Changelog

- **v1.0.0**: Initial Docker deployment setup
- Added multi-stage builds for optimization
- Implemented security middleware
- Added health checks and monitoring
- Configured external PostgreSQL integration
