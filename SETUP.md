# 🚀 Complete Setup Guide

This guide will walk you through setting up the Painter Booking System from scratch.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js) or **yarn**
- A code editor (VS Code recommended)
- A terminal/command prompt

### Verify Prerequisites

```bash
node --version   # Should show v18.x or higher
npm --version    # Should show 8.x or higher
psql --version   # Should show PostgreSQL 14.x or higher
```

## 📦 Installation Steps

### Step 1: Database Setup

#### Option A: Using psql Command Line

```bash
# Start PostgreSQL service (if not running)
# Windows: It usually starts automatically
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE painter_booking;

# Verify it was created
\l

# Exit psql
\q
```

#### Option B: Using pgAdmin

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Enter database name: `painter_booking`
5. Click "Save"

### Step 2: Clone/Download Project

If you received this as a zip file, extract it. If from git:

```bash
git clone <repository-url>
cd "🎨 Adam Painter Booking Assignment"
```

### Step 3: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install all dependencies (takes ~1-2 minutes)
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Windows PowerShell
New-Item .env

# macOS/Linux
touch .env
```

Add the following content to `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/painter_booking
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3000
```

**Important**: Replace `postgres:postgres` with your actual PostgreSQL username and password if different.

#### Setup Database Schema

```bash
# Push the schema to your database
npm run db:push
```

You should see output indicating tables were created successfully.

#### Start Backend Server

```bash
npm run start:dev
```

**Expected output:**
```
🚀 Application is running on: http://localhost:3000
```

Keep this terminal window open. The backend is now running!

### Step 4: Frontend Setup

Open a **NEW terminal window** (keep the backend running):

```bash
# Navigate to frontend directory from project root
cd frontend

# Install all dependencies
npm install
```

#### Configure Frontend Environment

Create a `.env` file in the `frontend` directory:

```bash
# Windows PowerShell
New-Item .env

# macOS/Linux
touch .env
```

Add the following content to `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

#### Start Frontend Dev Server

```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 5: Verify Installation

1. Open your browser and go to: **http://localhost:5173**
2. You should see the Painter Booking System home page
3. Click "Get Started" to create your first account

## ✅ Quick Test

### Test as a Painter

1. Click "Get Started" or "Register"
2. Fill in:
   - Name: **John Painter**
   - Email: **john@painter.com**
   - Password: **password123**
   - Role: **Painter**
3. Click "Create Account"
4. You should be redirected to the Painter Dashboard
5. Add availability:
   - Select tomorrow's date and time (e.g., 10:00 AM)
   - Select end time (e.g., 6:00 PM)
   - Click "Add Availability"
6. You should see the availability slot appear

### Test as a Customer

1. Open a **new incognito/private browser window**
2. Go to: **http://localhost:5173**
3. Click "Register"
4. Fill in:
   - Name: **Jane Customer**
   - Email: **jane@customer.com**
   - Password: **password123**
   - Role: **Customer**
5. Click "Create Account"
6. Request a booking:
   - Select a time within the painter's availability
   - Click "Request Booking"
7. You should see: **"Booking confirmed! You've been assigned painter: John Painter"**

### Verify Both Sides

- **Customer Dashboard**: Should show the booking with painter's name
- **Painter Dashboard** (first window): Should show the booking with customer's details

## 🔧 Troubleshooting

### Backend Won't Start

#### Error: "Connection refused" or "Database error"

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   Get-Service -Name postgresql*
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check database exists:
   ```bash
   psql -U postgres -l | grep painter_booking
   ```

3. Verify credentials in `backend/.env`:
   - Check username and password match your PostgreSQL setup
   - Common default: `postgres:postgres`

#### Error: "relation 'users' does not exist"

**Solution:**
```bash
cd backend
npm run db:push
```

### Frontend Won't Connect

#### Error: Network errors or "Failed to fetch"

**Solution:**
1. Ensure backend is running on port 3000
2. Check `frontend/.env` has correct URL:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
3. Clear browser cache:
   - Press `Ctrl+Shift+Delete` (Windows/Linux)
   - Press `Cmd+Shift+Delete` (macOS)
   - Clear cache and reload

### Port Already in Use

#### Backend (port 3000)

**Find and kill the process:**

Windows PowerShell:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

macOS/Linux:
```bash
lsof -ti:3000 | xargs kill -9
```

Or change the port in `backend/.env`:
```env
PORT=3001
```

#### Frontend (port 5173)

Vite will automatically try the next available port (5174, 5175, etc.)

### Dependencies Installation Fails

#### Error: "npm ERR! peer dependencies"

**Solution:**
```bash
npm install --legacy-peer-deps
```

#### Error: Network timeout

**Solution:**
```bash
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install
```

## 🐳 Alternative: Docker Setup

If you prefer Docker, you can run everything in containers:

```bash
# Development mode (with hot-reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production mode
docker-compose up
```

See [DOCKER.md](DOCKER.md) for detailed Docker instructions.

## 📊 Additional Tools

### View Database with Drizzle Studio

```bash
cd backend
npm run db:studio
```

Opens at: `https://local.drizzle.studio`

### API Testing with HTTP Files

If you use VS Code:

1. Install "REST Client" extension
2. Open `backend/http/workflow.http`
3. Click "Send Request" above each request

See [backend/http/README.md](backend/http/README.md) for details.

## 📖 Next Steps

After successful setup:

1. **Read the [QUICKSTART.md](QUICKSTART.md)** - 5-minute guide to using the system
2. **Check [TESTING_GUIDE.md](TESTING_GUIDE.md)** - Comprehensive testing scenarios
3. **Review [README.md](README.md)** - Full project documentation
4. **Explore [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md)** - Technical deep dive

## 🆘 Still Having Issues?

1. **Check all terminal outputs** for specific error messages
2. **Review the troubleshooting section** above
3. **Verify prerequisites** are correctly installed
4. **Check PostgreSQL credentials** match between setup and `.env`
5. **Ensure ports 3000 and 5173** are not blocked by firewall

## 🎉 Success!

If you can:
- ✅ Register as painter
- ✅ Add availability
- ✅ Register as customer
- ✅ Request booking
- ✅ See booking on both dashboards

**Congratulations! Your Painter Booking System is fully operational!** 🎨

---

**Need help?** Check the main README.md or review the code comments for detailed explanations.

