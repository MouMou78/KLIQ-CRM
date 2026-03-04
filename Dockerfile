# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy dependency files first for better layer caching
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the application (Vite frontend + esbuild server)
RUN pnpm build

# ─────────────────────────────────────────────
# Stage 2: Production
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create a non-root user for security
RUN addgroup -S kliq && adduser -S kliq -G kliq

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Set ownership to the non-root user
RUN chown -R kliq:kliq /app

# Switch to non-root user
USER kliq

# Expose the application port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check to verify the container is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the production server
CMD ["node", "dist/index.js"]
