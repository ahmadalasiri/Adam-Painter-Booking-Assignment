# 🚀 Quick Start Guide

Get the Painter Booking System up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] PostgreSQL v14+ installed and running
- [ ] Git installed
- [ ] A terminal/command prompt

## Step-by-Step Setup

### 1. Database Setup (2 minutes)

Open PostgreSQL and create the database:

```sql
CREATE DATABASE painter_booking;
```

Or using psql command line:

```bash
psql -U postgres
CREATE DATABASE painter_booking;
\q
```

### 2. Backend Setup (2 minutes)

```bash
# Navigate to backend directory
cd backend

# Install dependencies (this will take ~1 minute)
npm install

# Update database credentials if needed
# Edit backend/.env and change the DATABASE_URL if your PostgreSQL uses different credentials

# Push database schema
npm run db:push

# Start the backend server
npm run start:dev
```

✅ Backend should now be running at `http://localhost:3000`

You should see output like:

```
🚀 Application is running on: http://localhost:3000
```

### 3. Frontend Setup (1 minute)

Open a **NEW terminal** window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

✅ Frontend should now be running at `http://localhost:5173`

You should see output like:

```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 4. Open the Application

Visit `http://localhost:5173` in your web browser.

## Quick Test Workflow

### Test as a Painter

1. **Register**: Click "Get Started" → Fill form:
   - Name: "John Painter"
   - Email: "john@painter.com"
   - Password: "password123"
   - Role: **Painter**
2. **Add Availability**:

   - Select a future date and time (e.g., tomorrow 10:00 AM)
   - Select end time (e.g., tomorrow 6:00 PM)
   - Click "Add Availability"

3. **Wait for bookings**: Leave this tab open

### Test as a Customer

1. Open a **new incognito/private window** (or different browser)

2. **Register**: Go to `http://localhost:5173` → Click "Get Started":

   - Name: "Jane Customer"
   - Email: "jane@customer.com"
   - Password: "password123"
   - Role: **Customer**

3. **Request Booking**:

   - Select a time within the painter's availability
   - Click "Request Booking"
   - You should see: "Booking confirmed! You've been assigned painter: John Painter"

4. **Check Results**:
   - Customer sees the booking with painter details
   - Switch back to painter tab
   - Painter sees the assigned booking with customer details

### Test No Availability (Bonus Feature)

1. As customer, try to book a time when no painter is available
2. You'll see an error with **recommended alternative time slots**

### Test Most Requested Painter

1. Register a second painter (use incognito window)
2. Add availability for both painters at the same time
3. Create a booking - one painter gets assigned
4. Create another booking - the system assigns based on booking count

## Common Issues & Solutions

### ❌ Backend won't start

**Error**: "Connection refused" or "Database error"

**Solution**:

- Ensure PostgreSQL is running
- Check database name: `painter_booking` exists
- Verify credentials in `backend/.env`

### ❌ Frontend can't connect to backend

**Error**: Network errors or CORS errors

**Solution**:

- Ensure backend is running on port 3000
- Check `frontend/.env` has `VITE_API_URL=http://localhost:3000`
- Clear browser cache and reload

### ❌ Database schema errors

**Solution**:

```bash
cd backend
npm run db:push
```

### ❌ Port already in use

**Backend (port 3000)**:

- Find and kill the process using port 3000
- Or change `PORT` in `backend/.env`

**Frontend (port 5173)**:

- Vite will automatically use the next available port
- Or specify a different port in `vite.config.ts`

## What to Try Next

### Explore the Features

✅ **Smart Assignment**: Create multiple painters and see how bookings are assigned to the most requested

✅ **Recommendations**: Try booking unavailable slots to get suggestions

✅ **Validation**: Try overlapping availability slots (should be rejected)

✅ **Role Protection**: Try accessing painter routes as a customer (should be blocked)

### View the Database

```bash
cd backend
npm run db:studio
```

Opens Drizzle Studio at `https://local.drizzle.studio` to visually browse your database.

## Development Tips

### Hot Reload

Both backend and frontend have hot reload enabled:

- Edit any `.ts` or `.tsx` file
- Changes apply automatically
- No need to restart servers

### API Testing

Use tools like:

- **Postman**: Import endpoints from API docs
- **curl**: Test endpoints from command line
- **Browser DevTools**: Network tab to inspect requests

Example curl request:

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","role":"customer"}'
```

### Logs

- **Backend logs**: Check the terminal where you ran `npm run start:dev`
- **Frontend logs**: Check browser console (F12)

## Next Steps

- Read the full [README.md](README.md) for architecture details
- Check [backend/README.md](backend/README.md) for API documentation
- Check [frontend/README.md](frontend/README.md) for frontend details
- Explore the implementation of the smart painter assignment algorithm

## Need Help?

- Check the main README.md for troubleshooting
- Review the code comments in source files
- Check console logs for detailed error messages

---

**Total Setup Time**: ~5 minutes  
**Tech Stack**: NestJS + React + TypeScript + PostgreSQL + Tailwind  
**Authentication**: JWT (without Passport)  
**Smart Feature**: Most requested painter assignment  
**Bonus Feature**: Closest available slot recommendations
