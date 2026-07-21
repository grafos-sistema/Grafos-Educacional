# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine as runner

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .

# Copy next config
COPY --from=builder /app/next.config.ts ./

# Copy public folder
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
