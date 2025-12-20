# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080

# Install security tools and system updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user with minimal privileges
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (both production and dev) since server.js needs express-ws
RUN npm ci && \
    npm cache clean --force && \
    chown -R nodejs:nodejs /app

# Copy source code
COPY --chown=nodejs:nodejs . .

# Build the application (force output to docs folder)
RUN npm run build && \
    if [ -d "dist" ] && [ ! -d "docs" ]; then \
        mv dist docs; \
    fi

# Create logs directory with proper permissions before switching to non-root user
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]