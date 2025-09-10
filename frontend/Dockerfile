# Frontend Dockerfile for GrainChain Spends with Traefik
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Set production environment variables for build
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=https://gcback.openlayers.kz

# Build the application
RUN npm run build

# Production stage - using serve for static files
FROM node:18-alpine

# Install serve globally
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/build /app/build

# Copy serve configuration from builder stage
COPY --from=builder /app/serve.json /app/serve.json

# Set working directory
WORKDIR /app

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application with security headers
CMD ["serve", "-c", "serve.json", "-l", "3000"]
