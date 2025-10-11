# 🐳 Docker Deployment Guide

Complete guide for running the Painter Booking System with Docker.

## 📋 Prerequisites

- Docker installed (v20.10+)
- Docker Compose installed (v2.0+)

**Check installation:**

```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start

### Start Everything

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access the application:**

- Frontend: http://localhost:80
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

## 📦 What's Included

The Docker Compose setup includes:

1. **PostgreSQL Database** (postgres:15-alpine)

   - Port: 5432
   - Database: `painter_booking`
   - User: `postgres`
   - Password: `postgres`

2. **Backend API** (NestJS)

   - Port: 3000
   - Auto-runs migrations on startup
   - Connected to PostgreSQL

3. **Frontend** (React + Nginx)
   - Port: 80
   - Production-optimized build
   - Nginx web server

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` to change environment variables:

```yaml
backend:
  environment:
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/painter_booking
    JWT_SECRET: change-this-in-production # ⚠️ Change this!
    JWT_EXPIRES_IN: 7d
    PORT: 3000
```

### Change Ports

To use different ports, edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8080:3000" # Host:Container

  frontend:
    ports:
      - "8000:80" # Host:Container
```

## 📝 Detailed Commands

### Build & Start

```bash
# Build images (first time or after code changes)
docker-compose build

# Start all services
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Build and start
docker-compose up --build
```

### Stop & Remove

```bash
# Stop services (keeps containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers, volumes, and images
docker-compose down -v --rmi all
```

### View Logs

```bash
# All services
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Service Management

```bash
# Restart a service
docker-compose restart backend

# Stop a specific service
docker-compose stop frontend

# Start a specific service
docker-compose start frontend

# Rebuild a specific service
docker-compose build backend
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# Run migrations manually
docker-compose exec backend npm run db:migrate

# View database
docker-compose exec backend npm run db:studio

# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d painter_booking

# Check backend health
docker-compose exec backend wget -qO- http://localhost:3000/auth/profile
```

### Database Operations

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres painter_booking > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres painter_booking < backup.sql

# Reset database (⚠️ DESTRUCTIVE)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npm run db:migrate
```

## 🔍 Troubleshooting

### Backend won't start

```bash
# Check backend logs
docker-compose logs backend

# Common issues:
# 1. Database not ready → Wait a few seconds, backend will retry
# 2. Migration failed → Check database connection

# Restart backend
docker-compose restart backend
```

### Database connection errors

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Should show:
# postgres | Up (healthy)

# Test database connection
docker-compose exec postgres pg_isready -U postgres
```

### Port already in use

```bash
# Find what's using the port
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Change ports in docker-compose.yml
```

### Frontend shows 404

```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend

# Check nginx logs
docker-compose logs frontend
```

### Clear everything and restart

```bash
# Nuclear option - removes everything
docker-compose down -v
docker system prune -a --volumes

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## 🌐 Production Deployment

### Update Environment Variables

1. Create `.env` file:

```env
# .env file for production
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-key-at-least-32-chars-long
DATABASE_URL=postgresql://postgres:your-secure-password@postgres:5432/painter_booking
```

2. Update `docker-compose.yml`:

```yaml
backend:
  environment:
    DATABASE_URL: ${DATABASE_URL}
    JWT_SECRET: ${JWT_SECRET}
    JWT_EXPIRES_IN: 7d
```

### Use Docker Compose Override

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data

  backend:
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
```

Run with:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Health Checks

Check if services are healthy:

```bash
# All services status
docker-compose ps

# Health check commands
docker-compose exec backend wget -qO- http://localhost:3000/auth/profile
docker-compose exec postgres pg_isready -U postgres

# Container resource usage
docker stats
```

## 🔄 Update & Redeploy

When you update code:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## 📈 Scaling

Run multiple backend instances:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Note: You'll need a load balancer (nginx, traefik) for this
```

## 🛡️ Security Best Practices

### Production Checklist

- [ ] Change default PostgreSQL password
- [ ] Use strong JWT secret (32+ characters)
- [ ] Don't expose PostgreSQL port to public
- [ ] Use HTTPS (add nginx with SSL)
- [ ] Keep images updated
- [ ] Use non-root users in containers
- [ ] Scan images for vulnerabilities

### Scan for Vulnerabilities

```bash
# Install trivy
# Scan images
docker scan painter-booking-backend
docker scan painter-booking-frontend
```

## 🔗 Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 💡 Tips

1. **Development vs Production**: Use `docker-compose.dev.yml` for dev, `docker-compose.prod.yml` for prod
2. **Volume mounts**: For development, mount source code as volume for hot reload
3. **Networks**: Services in the same compose file can communicate using service names
4. **Logs**: Always check logs when debugging: `docker-compose logs -f`
5. **Clean up**: Regularly run `docker system prune` to free disk space

## 🎯 Common Workflows

### Development Workflow

```bash
# Start with hot reload (if configured)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# View logs while developing
docker-compose logs -f backend
```

### Testing Workflow

```bash
# Start services
docker-compose up -d

# Run tests
docker-compose exec backend npm test

# Stop services
docker-compose down
```

### CI/CD Workflow

```bash
# In your CI/CD pipeline
docker-compose build
docker-compose run backend npm test
docker-compose push  # Push to registry
```

## 📞 Support

For issues related to:

- **Docker**: Check Docker logs and documentation
- **Application**: Check application logs in containers
- **Database**: Check PostgreSQL logs

---

**Quick Reference Card:**

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build

# Shell
docker-compose exec backend sh

# Database
docker-compose exec postgres psql -U postgres -d painter_booking
```

Happy Dockerizing! 🐳
