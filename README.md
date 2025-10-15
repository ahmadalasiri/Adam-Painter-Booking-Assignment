# 🎨 Painter Booking System

A full-stack web application that allows customers to request painting services and automatically assigns the most requested painters based on availability.

**🌐 Live Demo:** [https://adam.ahmadalasiri.info](https://adam.ahmadalasiri.info)

## 🚀 Tech Stack

### Backend

- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Relational database
- **Drizzle ORM** - TypeScript ORM
- **JWT** - Authentication
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
3. **Selects the best painter** using booking count as quality metric
4. Automatically creates and confirms the booking

### Bonus: Smart Recommendations Engine

If no painters are available, the system recommends alternative slots:

- **Bidirectional search**: Looks before AND after requested time
- **Configurable window**: Search up to N days (default: 7)
- **Quality filtering**: Only shows slots meeting minimum duration
- **Smart sorting**: Closest matches first, full-duration slots prioritized
- **Configurable limit**: Return top N recommendations (default: 10)

### Authentication & Authorization

- Full JWT-based authentication
- Role-based access control (painter/customer)
- Secure password hashing with bcrypt
- Protected API endpoints

## 🏗️ Project Structure

```
🎨 Adam Painter Booking Assignment/
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── auth/            # Authentication (JWT, guards, decorators)
│   │   ├── availability/    # Painter availability management
│   │   ├── booking/         # Booking & recommendation engine
│   │   ├── db/              # Database schema with indexes
│   │   └── main.ts          # Application entry point
│   ├── drizzle/             # Database migrations
│   └── Dockerfile           # Production container
│
├── frontend/                # React 19 + TypeScript
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth & Toast contexts
│   │   ├── pages/           # Dashboard pages
│   │   ├── services/        # API client (Axios)
│   │   └── types/           # TypeScript interfaces
│   └── Dockerfile           # Production container
│
├── docs/                    # Documentation
│   └── DOCKER.md            # Docker deployment guide
│
├── .env.example             # Environment template
├── docker-compose.yml       # Production deployment
└── README.md                # This file
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

The backend will run on `http://localhost:3001`

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
# 1. Create .env file (copy from example)
cp .env.example .env

# 2. Edit .env and change JWT_SECRET (important!)
nano .env

# 3. Start everything (database + backend + frontend)
docker-compose up -d

# 4. Run database migrations (first time only)
docker-compose exec backend npm run db:migrate

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```
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

### Painter Selection Algorithm ("Best Painter" Strategy)

The system implements a smart painter selection strategy using **booking count** as the quality metric:

```typescript
// 1. Find all painters with availability covering the requested time
// 2. Filter out painters with conflicting bookings
// 3. Count total bookings for each available painter
// 4. Select painter with the highest booking count (most experienced)
// 5. Use ID for tie-breaking to ensure consistent selection
```

**Why booking count as "best painter" criteria:**

- More bookings = more experience and proven track record
- Ensures experienced painters stay busy and satisfied
- Natural quality indicator that customers can trust
- Fair distribution: new painters build reputation over time
- Objective, measurable metric without bias

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

## 📝 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/painter_booking
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=painter_booking
POSTGRES_PORT=5432

# Server
PORT=3001
NODE_ENV=development
BACKEND_PORT=3001

# Authentication (⚠️ CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Recommendation Engine
RECOMMENDATION_WINDOW_DAYS=7          # Days to search before/after requested time
MIN_SLOT_DURATION_PERCENT=50          # Minimum slot size as % of requested
MIN_SLOT_DURATION_MINUTES=30          # Absolute minimum slot duration
MAX_RECOMMENDATIONS=10                 # Maximum alternative slots to return

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
```

## 🌐 Production Deployment

Deploying to Contabo VPS with:

- Docker & Docker Compose
- Nginx reverse proxy
- SSL certificates (Let's Encrypt)
- Domain configuration
- Production best practices
