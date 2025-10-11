# 🎨 Getting Started with Painter Booking System

**Welcome!** This is your complete guide to running the Painter Booking System.

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Prerequisites

You need:
- **Node.js** (v18+) - https://nodejs.org/
- **PostgreSQL** (v14+) - https://www.postgresql.org/download/

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE painter_booking;

# Exit
\q
```

### Step 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file with:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/painter_booking
# JWT_SECRET=your-secret-key
# JWT_EXPIRES_IN=7d
# PORT=3000

# Setup database tables
npm run db:push

# Start backend
npm run start:dev
```

✅ Backend running at http://localhost:3000

### Step 4: Setup Frontend

**Open a NEW terminal:**

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with:
# VITE_API_URL=http://localhost:3000

# Start frontend
npm run dev
```

✅ Frontend running at http://localhost:5173

### Step 5: Test It!

1. Open browser: http://localhost:5173
2. Register as **Painter** (name: John, email: john@painter.com)
3. Add availability (tomorrow 10:00 - 18:00)
4. Open **incognito window**
5. Register as **Customer** (name: Jane, email: jane@customer.com)
6. Request booking (within painter's availability)
7. ✅ See confirmation!

## 📚 Full Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup with troubleshooting
- **[QUICKSTART.md](QUICKSTART.md)** - Quick reference guide
- **[README.md](README.md)** - Complete project overview
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing scenarios
- **[DOCKER.md](DOCKER.md)** - Docker deployment

## 🐳 Docker Alternative

Don't want to setup manually? Use Docker:

```bash
# Start everything
docker-compose up

# Access at:
# Frontend: http://localhost
# Backend: http://localhost:3000
```

## 🆘 Having Issues?

**PostgreSQL connection failed?**
- Check username/password in `backend/.env`
- Verify PostgreSQL is running
- Try: `postgres:postgres` or `postgres:YOUR_PASSWORD`

**Port already in use?**
- Change `PORT` in `backend/.env`
- Frontend auto-switches to next port

**Tables don't exist?**
- Run: `cd backend && npm run db:push`

**See [SETUP.md](SETUP.md) for more troubleshooting**

## ✨ Features You'll See

- 🎨 **Smart Painter Assignment** - Most requested painter gets assigned
- 📅 **Availability Management** - Painters control their schedule
- 🔖 **Instant Booking** - Automatic confirmation
- 💡 **Recommendations** - Get alternatives when unavailable
- 🔒 **Secure Auth** - JWT tokens, role-based access
- 📱 **Responsive Design** - Works on mobile

## 🎯 What to Test

1. **Painter Flow**: Register → Add availability → View bookings
2. **Customer Flow**: Register → Request booking → See confirmation
3. **Smart Assignment**: Create 2 painters, make bookings, see algorithm
4. **Recommendations**: Request unavailable slot, see suggestions

## 📖 Next Steps

After you get it running:

1. Check the **smart painter assignment** algorithm in action
2. Try the **bonus recommendations feature**
3. Explore the **API endpoints** using `backend/http/*.http` files
4. Review the **code architecture** in IMPLEMENTATION_NOTES.md

## 🎉 Ready?

```bash
# Terminal 1
cd backend && npm install && npm run db:push && npm run start:dev

# Terminal 2
cd frontend && npm install && npm run dev
```

**Then open:** http://localhost:5173

---

**Need Help?** See SETUP.md | QUICKSTART.md | README.md

**Status:** ✅ Production Ready | 🎨 Fully Implemented | 📦 Docker Available

