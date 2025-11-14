# DB Luxury Cars - Car Rental Website

A full-stack car rental website built with Next.js frontend and Node.js/Express backend, featuring comprehensive vehicle management, booking system, and admin panel.

## Features

### Frontend
- **Homepage** with hero section and featured vehicles
- **Vehicle Listing** with filters (category, location, dates, price)
- **Vehicle Detail Pages** with booking form
- **Multi-step Booking Flow** with date selection, extras, and customer information
- **Booking Confirmation** page
- **Admin Dashboard** with statistics and management tools
- **Responsive Design** matching luxury car rental aesthetic

### Backend API
- **Vehicle Management** - CRUD operations for vehicles and subunits
- **Booking System** - Create, view, and manage bookings
- **Availability Checking** - Real-time availability validation
- **Pricing Calculation** - Dynamic pricing with seasonal rates
- **Coupon System** - Discount code validation and application
- **Admin Authentication** - JWT-based admin login
- **Statistics & Reports** - Dashboard analytics

### Database
- PostgreSQL database (`dbcars_db`)
- Comprehensive schema with vehicles, bookings, customers, locations, extras, coupons
- Vehicle subunits for individual car tracking
- Damage logging system
- Availability notes

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Database Setup

1. Create PostgreSQL database:
```bash
createdb dbcars_db
```

2. Run migrations:
```bash
psql -d dbcars_db -f database/migrations/001_initial_schema.sql
```

3. (Optional) Seed sample data:
```bash
psql -d dbcars_db -f database/seed.sql
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dbcars_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3001
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

4. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Default Admin Credentials

After running the seed script, you can login with:
- Email: `admin@dbcars.com`
- Password: `admin123`

**Note**: Change the password in production! The seed script creates a user with a placeholder password hash.

## Project Structure

```
DBCars/
├── frontend/              # Next.js frontend application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   └── lib/              # API client and utilities
├── backend/              # Express backend API
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth middleware
│   │   └── config/      # Database config
│   └── package.json
└── database/             # Database files
    ├── migrations/       # SQL migration files
    └── seed.sql         # Sample data
```

## API Endpoints

### Public Endpoints
- `GET /api/vehicles` - List vehicles with filters
- `GET /api/vehicles/:id` - Get vehicle details
- `GET /api/vehicles/:id/availability` - Check availability
- `GET /api/locations` - List locations
- `GET /api/extras` - List extras
- `GET /api/coupons/:code` - Validate coupon
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:bookingNumber` - Get booking details

### Admin Endpoints (Protected)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/statistics` - Dashboard statistics
- `GET /api/admin/bookings` - List all bookings
- `PUT /api/admin/bookings/:id` - Update booking status
- `GET /api/admin/vehicles` - List all vehicles
- `POST /api/admin/vehicles` - Create vehicle
- `PUT /api/admin/vehicles/:id` - Update vehicle
- `DELETE /api/admin/vehicles/:id` - Delete vehicle
- `GET /api/admin/availability` - Availability overview
- `POST /api/admin/damage-logs` - Log vehicle damage

## Features Not Yet Implemented

- Email notifications (Phase 6)
- Damage logging UI in admin panel (backend endpoint exists)
- Image upload functionality
- Multi-language support
- Payment integration (intentionally excluded per requirements)

## Development Notes

- The frontend uses client-side data fetching for dynamic content
- Admin routes are protected by JWT authentication
- Booking system includes real-time availability checking
- Pricing supports daily, weekly, monthly, and hourly rates
- Seasonal pricing and location-based pricing can be configured via pricing_rules table

## License

This project is proprietary software for DB Luxury Cars.

