# Stage 1: Build the React + Vite application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for optimal layer caching
COPY package*.json ./
RUN npm install

# Copy application source files
COPY . .

# Build static production bundle into /app/dist
RUN npm run build

# Stage 2: Serve production build with Nginx on port 3000
FROM nginx:stable-alpine AS runner

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
