# Painter Booking System - Frontend

React + TypeScript + Tailwind CSS frontend for the painter booking system.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `http://localhost:3001`

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

The `.env` file should already be created. It contains:

```env
VITE_API_URL=http://localhost:3001
```

Update this if your backend is running on a different port.

### 3. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking

## Features

### Authentication

- **Register**: Users can sign up as either a painter or customer
- **Login**: Secure JWT-based authentication
- **Protected Routes**: Role-based access control

### For Customers

- **Request Bookings**: Select a time window for painting services
- **View Bookings**: See all upcoming and past bookings
- **Automatic Painter Assignment**: System finds the most requested painter
- **Recommendations**: Get alternative time slots if no painter is available

### For Painters

- **Manage Availability**: Add time slots when you're available to work
- **View Availability**: See all your scheduled availability
- **Assigned Bookings**: View all bookings assigned to you with customer details

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **date-fns** - Date formatting

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── context/           # React context providers
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── PainterDashboard.tsx
│   └── CustomerDashboard.tsx
├── services/          # API services
│   └── api.ts
├── types/             # TypeScript types
│   └── index.ts
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## User Flow

### Customer Journey

1. Register as a customer
2. Navigate to customer dashboard
3. Request a booking by selecting start and end time
4. System automatically assigns the most requested painter
5. View confirmed booking with painter details
6. If no painter is available, see recommended alternative time slots

### Painter Journey

1. Register as a painter
2. Navigate to painter dashboard
3. Add availability time slots
4. View all availability slots
5. Receive automatic booking assignments
6. View assigned bookings with customer details

## API Integration

The frontend communicates with the backend API using Axios. All authenticated requests include a JWT token in the Authorization header.

### API Endpoints Used

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `POST /availability` - Create availability (painter)
- `GET /availability/me` - Get painter availability
- `POST /booking-request` - Create booking (customer)
- `GET /bookings/me` - Get customer bookings
- `GET /bookings/assigned` - Get painter bookings

## Styling

The app uses Tailwind CSS with a modern, clean design:

- Gradient backgrounds
- Smooth transitions
- Responsive design (mobile-friendly)
- Color-coded status badges
- Form validation feedback
- Loading states

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.
