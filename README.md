# 🎨 Painter Booking System

A full-stack web application that allows customers to request painting services and automatically assigns the most requested painters based on availability.

## 🚀 Tech Stack

### Backend

- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Relational database
- **Drizzle ORM** - TypeScript ORM
- **JWT** - Authentication (without Passport)
- **TypeScript** - Type safety

### Frontend

- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool

## 📋 Features

### Smart Painter Assignment

When a customer requests a booking, the system:

1. Finds all painters with availability covering the requested time
2. Filters out painters with conflicting bookings
3. **Selects the painter with the most bookings** (most requested painter)
4. Automatically creates and confirms the booking

### Bonus: Closest Available Slot Recommendations

If no painters are available, the system recommends:

- Up to 3 available slots after the requested time
- Up to 3 available slots before the requested time
- Each recommendation includes painter name and time details

### Authentication & Authorization

- Full JWT-based authentication
- Role-based access control (painter/customer)
- Secure password hashing with bcrypt
- Protected API endpoints

## 🏗️ Project Structure

```
🎨 Adam Painter Booking Assignment/
├── backend/                # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── availability/  # Painter availability module
│   │   ├── booking/       # Booking module
│   │   ├── db/            # Database schema and connection
│   │   └── main.ts        # Entry point
│   ├── drizzle/           # Database migrations
│   └── .env               # Environment variables
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── .env               # Environment variables
│
└── README.md              # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE painter_booking;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables (already created)
# Edit backend/.env if needed with your PostgreSQL credentials

# Run database migrations
npm run db:push

# Start the backend server
npm run start:dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to: `http://localhost:5173`

---

## 🐳 Docker Deployment (Alternative)

**Don't want to set up manually? Use Docker!**

### Quick Start with Docker

```bash
# Start everything (database + backend + frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**Access:**

- Frontend: http://localhost
- Backend API: http://localhost:3000
- Database runs internally

**For detailed Docker instructions, see:** [DOCKER.md](DOCKER.md)

---

## 📖 Usage Guide

### For Customers

1. **Register**: Sign up with email, password, name, and select "Customer" role
2. **Login**: Sign in with your credentials
3. **Request Booking**:
   - Select start date/time
   - Select end date/time
   - Submit request
4. **View Assignment**: System automatically assigns the most requested painter
5. **Check Bookings**: View all your bookings on the dashboard

### For Painters

1. **Register**: Sign up with email, password, name, and select "Painter" role
2. **Login**: Sign in with your credentials
3. **Add Availability**:
   - Select start date/time
   - Select end date/time
   - Submit availability
4. **View Availability**: See all your available time slots
5. **Check Bookings**: View all bookings assigned to you with customer details

## 🔑 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile (protected)

### Availability (Painter Only)

- `POST /availability` - Create availability slot
- `GET /availability/me` - Get painter's availability

### Bookings

- `POST /booking-request` - Request booking (customer only)
- `GET /bookings/me` - Get customer's bookings (customer only)
- `GET /bookings/assigned` - Get painter's assigned bookings (painter only)

## 💡 Implementation Highlights

### Painter Selection Algorithm

The system implements a sophisticated painter selection strategy:

```typescript
// 1. Find all painters with availability covering the requested time
// 2. Filter out painters with conflicting bookings
// 3. Count total bookings for each available painter
// 4. Select painter with the highest booking count (most requested)
// 5. Use ID for tie-breaking to ensure consistent selection
```

**Rationale**: Assigning the most requested painter ensures:

- Popular painters stay busy and satisfied
- Customers get experienced, proven painters
- Natural quality indicator through booking frequency
- Fair distribution over time as new painters build reputation

### Database Schema

**Users**

- Stores both painters and customers
- Role-based access control
- Secure password storage

**Availability**

- Painters define available time windows
- Validation prevents overlapping slots

**Bookings**

- Links customers and painters
- Tracks booking status
- Maintains booking history for selection algorithm

## 🧪 Testing the System

### Test Scenario

1. **Create 2 Painters**:

   - Painter A: Add availability 2025-10-15 10:00 - 18:00
   - Painter B: Add availability 2025-10-15 10:00 - 18:00

2. **Create 1 Customer**:

   - Request booking 2025-10-15 11:00 - 13:00
   - System assigns Painter A or B (both have 0 bookings)

3. **Create Another Customer**:

   - Request booking 2025-10-15 14:00 - 16:00
   - System assigns based on booking count

4. **Test No Availability**:
   - Request booking for time with no painter availability
   - Receive recommendations for closest available slots

## 📦 Production Deployment

### Backend

```bash
cd backend
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend
npm run build
# Serve the dist/ folder with any static file server
```

## 🔒 Security Features

- JWT tokens with configurable expiration
- Password hashing with bcrypt (10 rounds)
- Role-based access control
- Protected API endpoints
- CORS configuration
- Input validation with class-validator

## 🎨 UI/UX Features

- Modern gradient design with smooth animations
- Responsive layout (mobile-friendly)
- **Toast notification system** - Auto-dismissing, elegant notifications
- **Optimistic updates** - Instant feedback without page reloads
- **Smart refresh** - Manual refresh without full page reload
- Loading states with contextual messages
- Error handling with user feedback
- Success notifications
- **Clickable recommendations** - One-click booking from suggestions
- Color-coded status badges
- Smooth transitions and hover effects
- Form validation with visual feedback
- Empty state illustrations

**See [FRONTEND_IMPROVEMENTS.md](FRONTEND_IMPROVEMENTS.md) for detailed UX improvements**

## 📝 Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/painter_booking
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Backend won't start

- Ensure PostgreSQL is running
- Check database credentials in backend/.env
- Run `npm run db:push` to create tables

### Frontend won't connect to backend

- Ensure backend is running on port 3000
- Check VITE_API_URL in frontend/.env
- Clear browser cache and reload

### Database errors

- Verify PostgreSQL is running
- Check database exists: `painter_booking`
- Reset database: Drop and recreate, then run `npm run db:push`

## 📄 License

This project is part of the Adam Painter Booking Assignment.

## 👨‍💻 Development Notes

- Backend uses NestJS without Passport (custom JWT implementation)
- Smart painter assignment prioritizes most requested painters
- Bonus feature: Closest slot recommendations implemented
- Clean, modern UI with Tailwind CSS
- Full TypeScript coverage for type safety
- Role-based dashboards with different features
