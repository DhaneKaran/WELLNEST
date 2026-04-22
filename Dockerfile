# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Declare the argument to receive the cache key from the build platform
ARG BUILDKIT_CACHE_KEY

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies, including devDependencies needed for the build
RUN npm ci

# Copy the rest of the application
COPY . .

# Create the cache directory for TypeScript build info
RUN mkdir -p .cache/tsbuildinfo

# Build the application with proper cache mounting
RUN --mount=type=cache,id=${BUILDKIT_CACHE_KEY}-next-cache,target=/app/.next/cache \
    --mount=type=cache,id=${BUILDKIT_CACHE_KEY}-node-modules-cache,target=/app/node_modules/.cache \
    --mount=type=cache,id=${BUILDKIT_CACHE_KEY}-tsbuildinfo-cache,target=/app/.cache/tsbuildinfo \
    npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 