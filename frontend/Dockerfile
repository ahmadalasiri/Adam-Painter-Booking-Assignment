# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including serve for production
RUN npm ci && npm install -g serve

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build application
RUN npm run build

# Expose port
EXPOSE 80

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "80"]

