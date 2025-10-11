# Painter Booking System - Backend

NestJS backend with PostgreSQL and Drizzle ORM for the painter booking system.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Make sure PostgreSQL is running. Create a database:

```sql
CREATE DATABASE painter_booking;
```

### 3. Environment Configuration

The `.env` file should already be created with default values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/painter_booking
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3000
```

**Important**: Update the `DATABASE_URL` with your PostgreSQL credentials if different from defaults.

### 4. Run Database Migrations

Push the schema to the database:

```bash
npm run db:push
```

This will create all necessary tables (users, availability, bookings).

### 5. Start the Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user (painter or customer)
- `POST /auth/login` - Login and get JWT token
- `GET /auth/profile` - Get current user profile (protected)

### Availability (Painter only)

- `POST /availability` - Create availability slot
- `GET /availability/me` - Get painter's availability

### Bookings

- `POST /booking-request` - Request a booking (customer only)
- `GET /bookings/me` - Get customer's bookings (customer only)
- `GET /bookings/assigned` - Get assigned bookings (painter only)

## Database Schema

### Users

- id (UUID)
- email (unique)
- password (hashed)
- name
- role (painter | customer)
- createdAt

### Availability

- id (UUID)
- painterId (foreign key to users)
- startTime
- endTime
- createdAt

### Bookings

- id (UUID)
- customerId (foreign key to users)
- painterId (foreign key to users)
- startTime
- endTime
- status (confirmed | completed | cancelled)
- createdAt

## Features

### Smart Painter Assignment

When a customer requests a booking, the system:

1. Finds all painters with availability covering the requested time
2. Filters out painters with conflicting bookings
3. Selects the painter with the **most bookings** (most requested)
4. Creates the booking automatically

### Closest Available Slot Recommendation

If no painters are available for the requested time, the API returns:

- Up to 3 available slots after the requested time
- Up to 3 available slots before the requested time
- Each recommendation includes painter info and time details

## Database Management

### View Database with Drizzle Studio

```bash
npm run db:studio
```

This opens a visual database browser at `https://local.drizzle.studio`

### Generate New Migration

After changing the schema in `src/db/schema.ts`:

```bash
npm run db:generate
npm run db:push
```

## Development

### Run in Watch Mode

```bash
npm run start:dev
```

### Build for Production

```bash
npm run build
npm run start:prod
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
