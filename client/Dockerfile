# Use Node.js LTS as base image
FROM node:20-bullseye-slim as build

WORKDIR /app

# Accept build arguments
ARG VITE_COMPOSIO_API_KEY
ARG VITE_API_BASE_URL

# Set environment variables from build args
ENV VITE_COMPOSIO_API_KEY=$VITE_COMPOSIO_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]