#!/bin/bash

# Quick Start Script (assumes Docker is installed)

set -e

echo "🎨 Starting Painter Booking System..."

# Create .env if needed
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        sed -i "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
        echo "✓ Created .env file"
    fi
fi

# Check if port 80 is in use
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠ Port 80 is already in use. Changing frontend port to 8080..."
    sed -i 's/FRONTEND_PORT=80/FRONTEND_PORT=8080/' .env
fi

# Stop existing
docker compose down 2>/dev/null || true

# Build and start
echo "Building images..."
docker compose build

echo "Starting services..."
docker compose up -d

echo "Waiting for database..."
sleep 5

echo "Running migrations..."
docker compose exec backend npm run db:migrate

echo ""
echo "✓ Application is running!"

# Check which port frontend is using
FRONTEND_PORT=$(grep FRONTEND_PORT .env | cut -d'=' -f2)
if [ "$FRONTEND_PORT" = "80" ]; then
    echo "  Frontend: http://localhost"
else
    echo "  Frontend: http://localhost:$FRONTEND_PORT"
fi
echo "  Backend:  http://localhost:3001"
echo ""
echo "View logs: docker compose logs -f"

