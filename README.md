# Smart Hotel Management System - Frontend

A modern, role-based hotel management system frontend built with Next.js 16, TypeScript, and Tailwind CSS. Provides intuitive interfaces for guests, receptionists, housekeeping staff, and administrators to manage hotel operations efficiently.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [User Roles & Features](#user-roles--features)
5. [Key Frontend Features](#key-frontend-features)
6. [Getting Started](#getting-started)
7. [Project Structure](#project-structure)
8. [Environment Configuration](#environment-configuration)

---

## Overview

The Smart Hotel Management System frontend provides a comprehensive user interface for all aspects of hotel management. Built with Next.js App Router, it delivers fast, server-rendered pages with role-based access control and real-time data synchronization with the backend API.

### Design Principles

- **Role-Based UI**: Dynamic interface that adapts to user permissions
- **Responsive Design**: Mobile-first approach for all device sizes
- **Modern UX**: Clean, intuitive interface using shadcn/ui components
- **Type Safety**: Full TypeScript implementation for reliability
- **Performance**: Optimized with Next.js 16 features (server components, caching)

---

## Features

### Currently Implemented

The frontend application currently supports the following features:

#### Authentication & Account Management
- Secure login with email and password
- Guest self-registration
- Password reset via OTP email verification
- JWT token-based session management
- Role-based route protection and redirects
- Profile management (name, password updates)

#### Multi-Hotel/Branch Support
- Hotel selection and switching (for admins)
- Hotel management interface (create, update, view, delete hotels)
- Hotel-specific data filtering and operations

#### Room Management (Admin)
- Browse and search rooms
- Create rooms with details (number, type, price, capacity, amenities)
- Upload multiple room images (1-4 images per room)
- Update room information and status
- Delete rooms (with validation for active bookings)
- Room status management (available, unavailable, maintenance)
- Public room browsing with filters (type, price range, availability)

#### Booking Management
- Guest booking creation with date selection
- Walk-in customer booking (for staff)
- Booking for existing guests (for staff)
- View bookings with pagination and filters
- Booking status tracking (pending, confirmed, checkedin, completed, cancelled)
- Booking cancellation with role-based restrictions
- Booking history and search
- Email notifications for confirmations and cancellations

#### Operations Hub (Receptionist/Admin)
- Kanban-style operational view with columns:
  - Arrivals today
  - In-house guests
  - Departures today
  - Completed bookings
- Staff-assisted check-in with ID verification
- Staff-managed checkout with invoice generation
- Real-time booking status updates
- Hotel-based filtering (multi-hotel operations)
- Today's operational KPIs

#### Service Requests
- Guest service request creation (multiple service types)
- Service types: housekeeping, room service, maintenance, laundry, spa, gym access, massage, yoga, transport, etc.
- Service catalog with hotel-specific pricing
- Request status tracking (pending, in_progress, completed)
- Housekeeping staff workflow (view, accept, complete requests)
- Assignment-based request visibility
- Duplicate request prevention
- Date-based request restrictions (only during active stay)
- Service catalog management (admin)

#### Invoice Management
- Automatic invoice generation at checkout
- Invoice viewing and details
- PDF invoice download
- Invoice email delivery
- Room charges and service charges breakdown
- Tax calculation and payment tracking
- Invoice search by booking or invoice number

#### Staff Roster Management
- Staff shift viewing (my roster page for staff)
- Admin roster management (create, update, delete shifts)
- Shift types: morning, afternoon, evening, night
- Date-based roster filtering
- Staff workload visibility

#### User Management (Admin)
- View all users with pagination
- Filter by role and status
- Create new users (all roles: guest, receptionist, housekeeping, admin)
- Update user details (name, role)
- Activate/deactivate user accounts
- User statistics dashboard

#### Guest Management
- View guest list (admin and receptionist)
- Guest details and booking history
- Search and filter guests
- Read-only access for receptionists

#### Dashboards & Reports
- Role-specific dashboards with relevant KPIs
- Guest Dashboard: bookings summary, active service requests
- Receptionist Dashboard: check-ins/check-outs, pending bookings, room availability, charts
- Housekeeping Dashboard: assigned tasks, pending requests, completed tasks
- Admin Dashboard: comprehensive system overview, user stats, occupancy metrics, trends
- Interactive charts (pie charts, bar charts)
- Real-time data updates
- Date range filtering

#### UI/UX Features
- Responsive design (mobile-first)
- Dark theme with modern aesthetics
- Toast notifications
- Loading states and skeletons
- Form validation
- Confirmation dialogs
- Image upload with preview
- Data tables with sorting and pagination

### Features Not Yet Implemented

The following core modules are planned for future development but are not currently implemented in the frontend:

#### Shared Facilities Management
The system does not yet provide user interfaces for managing shared hotel facilities such as:
- Banquet halls and event spaces
- Conference and meeting rooms
- Swimming pool
- Gym and fitness center
- Restaurant and dining areas
- Spa and wellness facilities

#### Facility Booking & Allocation
The system does not provide interfaces for:
- Browsing and viewing available facilities
- Booking shared facilities (by guests or event organizers)
- Facility calendar and availability checking
- Facility reservation management
- Facility-specific pricing and packages
- Capacity management for events and group bookings

**Note**: The current system includes service request functionality where guests can request services like "gym access" or "spa services". These are individual service requests handled by staff. This is different from a dedicated facility management module where facilities would be treated as bookable resources with their own schedules, capacity limits, and allocation systems.

---

## Technology Stack

### Core Framework

- **Next.js 16**: React framework with App Router
- **React 19**: Latest React with Server Components
- **TypeScript**: Type-safe development

### UI & Styling

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible component library
- **Recharts**: Data visualization and charts
- **Lucide Icons**: Icon library

### State & Data Management

- **React Hook Form**: Form handling and validation
- **Axios**: HTTP client for API communication
- **Context API**: Authentication and global state

### Additional Tools

- **EdgeStore**: Image upload and management
- **date-fns**: Date manipulation and formatting
- **Sonner**: Toast notifications

---

## User Roles & Features

### Guest

**Access**: Browse rooms, manage bookings, request services

**Features**:

- Browse available rooms with filters.
- Create bookings for selected dates.
- View booking history.
- Cancel pending bookings (before staff confirmation).
- Create service requests after check-in date.
- View service request status.
- Update profile settings.

**Restrictions**:

- Cannot cancel confirmed bookings
- Cannot create duplicate pending service requests
- Cannot create service requests before check-in date

---

### Receptionist

**Access**: Manage bookings, view guests and service requests, access reports

**Features**:

- View and manage all bookings
- Create bookings for guests or walk-in customers
- Confirm or cancel bookings
- View guest list (read-only)
- View all service requests
- View assigned housekeeping staff details
- Access booking and room reports
- Update profile settings

**Restrictions**:

- Cannot manage users
- Cannot create or modify rooms
- Cannot update service request status

---

### Housekeeping

**Access**: Manage assigned service requests

**Features**:

- View service requests assigned to housekeeping role
- Accept unassigned housekeeping requests
- Update status of own assigned requests (pending → in_progress → completed)
- View room information for assigned tasks
- Update profile settings

**Restrictions**:

- Cannot see maintenance or room_service requests
- Cannot view requests assigned to other housekeeping staff
- Cannot access booking management
- Cannot access guest or user management

---

### Administrator

**Access**: Full system access

**Features**:

- Manage all users (create, update, activate/deactivate)
- Manage rooms (create, update, delete)
- View and manage all bookings
- View and manage all service requests
- Update any service request status
- View comprehensive reports and analytics
- Update profile settings

---

## Key Frontend Features

### 1. Authentication

**Pages**: Login, Sign Up, Forgot Password

**Features**:

- Secure login with email and password
- Guest registration (self-signup)
- Password reset via OTP email verification
- JWT token management (HttpOnly cookies)
- Automatic session persistence
- Role-based redirect after login

---

### 2. Room Browsing

**Page**: `/rooms`

**Features**:

- Public access (no authentication required)
- Filter by room type, status, price range
- View room details, images, amenities
- Real-time availability checking

---

### 3. Booking Management

**Pages**: `/book` (public), `/dashboard/bookings` (authenticated)

#### Booking Flow

1. **Guest Booking**:

   - Select room and dates
   - System validates availability
   - Booking created with `pending` status
   - Confirmation email sent automatically

2. **Staff Booking** (Receptionist/Admin):
   - Book for existing guest (select from guest list)
   - Book for walk-in customer (enter customer details)
   - Can confirm booking immediately

#### Booking Status Lifecycle

- **pending**: Booking created, awaiting staff confirmation
- **confirmed**: Staff confirmed booking
- **cancelled**: Booking cancelled

#### Active Stay Determination

- Active stays determined by `checkInDate` and `checkOutDate`
- No explicit check-in or check-out action in frontend
- System automatically considers booking active between these dates

#### Cancellation Rules

- **Guests**:

  - Can cancel only `pending` bookings
  - Cannot cancel `confirmed` bookings
  - Must contact hotel directly for confirmed booking changes

- **Receptionist/Admin**:
  - Can cancel any booking (pending or confirmed)

**Features**:

- View all bookings with pagination and filters
- Search by guest, room, or date range
- Booking details with room and guest information
- Cancellation emails sent automatically

---

### 4. Service Requests

**Pages**: `/dashboard/my-requests` (Guest), `/dashboard/service-requests` (Receptionist/Housekeeping/Admin)

#### Service Types

- `housekeeping`: Room cleaning
- `room_service`: Food/beverage delivery
- `maintenance`: Repair and maintenance requests

#### Guest Service Request Flow

1. **Prerequisites**:

   - Must have an active booking
   - Current date must be on or after check-in date

2. **Creation Validation**:

   - Cannot create duplicate pending requests of same service type for same booking
   - Can create new request only after previous one is completed

3. **Tracking**:
   - View all own service requests
   - See status updates in real-time
   - View assigned staff details (if assigned)

#### Housekeeping Workflow

1. **View Available Requests**:

   - See all housekeeping service requests (housekeeping + room_service types)
   - Unassigned requests displayed with "Accept" button
   - Cannot see maintenance requests

2. **Accept Request**:

   - Update status from `pending` to `in_progress`
   - Request automatically assigned to logged-in housekeeping staff
   - Other housekeeping staff can no longer see or accept it

3. **Complete Request**:
   - Update status from `in_progress` to `completed`
   - Only assigned staff member can update status

#### Admin/Receptionist View

- View all service requests (all types: housekeeping, room_service, maintenance)
- See assigned staff member details
- Admin can update any request status
- Receptionist has read-only access

**Service Request Assignment**:

- `housekeeping` and `room_service` → assigned to housekeeping role
- `maintenance` → assigned to maintenance role (not handled by housekeeping)
- Housekeeping staff see only housekeeping-related requests
- Maintenance requests visible only to Admin/Receptionist

---

### 5. Dashboards

**Page**: `/dashboard`

#### Role-Based Dashboards

Each role has a customized dashboard with relevant KPIs and charts:

**Guest Dashboard**:

- My bookings summary (upcoming, past)
- Active service requests
- Quick actions (browse rooms, create service request)

**Receptionist Dashboard**:

- Today's check-ins and check-outs
- Pending bookings requiring confirmation
- Service requests overview
- Room availability summary
- Booking status charts
- Service request status charts

**Housekeeping Dashboard**:

- Assigned requests summary
- Pending tasks (unassigned requests)
- In-progress tasks
- Completed tasks (today)
- Personal workload metrics
- Only shows logged-in user's assigned tasks

**Admin Dashboard**:

- Comprehensive system overview
- User statistics
- Room occupancy metrics
- Booking trends
- Service request distribution
- All KPIs and charts

#### Dashboard Features

- Real-time data updates
- Interactive charts (pie charts, bar charts)
- Predefined chart colors using global CSS variables
- KPI cards with key metrics
- Action cards for quick navigation
- Date range filters for historical data

---

### 6. Room Management

**Page**: `/dashboard/rooms` (Admin only)

**Features**:

- Create new rooms with images (1-4 images)
- Update room details (number, type, price, capacity, status)
- Delete rooms (if no active bookings)
- Image upload via EdgeStore
- Room status management (available, unavailable, maintenance)
- Pagination and search

---

### 7. Guest Management

**Page**: `/dashboard/guests`

#### Admin Access

- View all users with guest role
- View guest details
- Filter and search guests
- View guest booking history

#### Receptionist Access

- View-only access to guest list
- View guest details
- Cannot modify guest information

**Walk-in Guests**:

- Walk-in bookings use `customerDetails` field
- Walk-in customers are not created as system users
- Contact information stored with booking only

---

### 8. User Management

**Page**: `/dashboard/users` (Admin only)

**Features**:

- View all users with pagination
- Filter by role and status
- View user details
- Create new users (all roles)
- Update user information (name, role)
- Activate/deactivate user accounts
- User statistics (total, active, by role)

**Restrictions**:

- Only Admin can access user management
- Cannot delete users (only deactivate)

---

### 9. Profile Settings

**Page**: `/dashboard/profile`

**Features**:

- View profile information
- Update name
- Change password (separate form)

**Restrictions**:

- Email is read-only (cannot be changed)
- Role is read-only (only Admin can change via User Management)
- Users can only update their own profile

---

### 10. Reports

**Dashboard Integration**:

- Reports embedded in dashboards
- Role-specific report access
- Real-time data visualization

**Report Types**:

- Booking summary (total, by status)
- Room overview (total, by status, by type)
- Service request overview (total, by status, by assigned role)

**Access**:

- Admin: Full access to all reports
- Receptionist: Access to booking and room reports
- Guest/Housekeeping: No direct report access (see own dashboard metrics)

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running (see backend README)

### Installation

1. Navigate to frontend directory:

```bash
cd hms-frontend
```

2. Install dependencies:

```bash
npm install
```

### Configuration

Create a `.env.local` file in the root of the frontend project:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# EdgeStore (for image uploads)
EDGE_STORE_ACCESS_KEY=edgestore-access-key
EDGE_STORE_SECRET_KEY=edgestore-secret-key
```

### Running the Application

#### Development Mode

```bash
npm run dev
```

Application runs on `http://localhost:3000`

#### Production Build

```bash
npm run build
npm start
```

### First-Time Setup

1. Ensure backend is running and admin user is created
2. Start frontend development server
3. Navigate to `http://localhost:3000`
4. Login with admin credentials:
   - Email: `admin@hotel.com`
   - Password: `admin123456`
5. Create additional users as needed

---

## Project Structure

```
hms-frontend/
├── public/                      # Static assets
│   ├── icons/                   # Navigation and UI icons
│   └── images/                  # Application images
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/             # Authentication pages
│   │   │   ├── login/
│   │   │   ├── sign-up/
│   │   │   └── forgot-password/
│   │   ├── (root)/             # Public pages
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── rooms/
│   │   │   ├── book/
│   │   │   └── about/
│   │   └── dashboard/          # Protected dashboard pages
│   │       ├── page.tsx        # Dashboard home
│   │       ├── bookings/
│   │       ├── my-requests/
│   │       ├── service-requests/
│   │       ├── rooms/
│   │       ├── guests/
│   │       ├── users/
│   │       └── profile/
│   ├── components/              # React components
│   │   ├── charts/             # Chart components (KPI, Bar, Pie)
│   │   ├── common/             # Shared components
│   │   ├── forms/              # Form input components
│   │   ├── page-components/    # Page-specific components
│   │   ├── providers/          # Context providers
│   │   └── ui/                 # shadcn/ui components
│   ├── constants/               # Application constants
│   ├── contexts/                # React contexts (Auth)
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   │   ├── api.ts              # Axios instance and interceptors
│   │   ├── auth/               # Permission definitions
│   │   ├── dashboardLinks.ts   # Navigation configuration
│   │   └── utils.ts            # Helper functions
│   ├── services/                # API service layer
│   │   ├── authService.ts
│   │   ├── bookingService.ts
│   │   ├── roomService.ts
│   │   ├── serviceRequestService.ts
│   │   ├── adminUserService.ts
│   │   └── reportService.ts
│   └── types/                   # TypeScript type definitions
│       └── global.d.ts          # Global type declarations
├── .env.local                   # Environment variables (not committed)
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

---

## Environment Configuration


### Required Environment Variables

Create `.env.local` file with:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# EdgeStore Configuration (for image uploads)
EDGE_STORE_ACCESS_KEY=your-access-key
EDGE_STORE_SECRET_KEY=your-secret-key
```

### Environment Notes

- `NEXT_PUBLIC_` prefix makes variables accessible in browser
- Never commit `.env.local` to version control
- Use different values for development and production
- Backend API URL should match your backend server configuration

---

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

---

## Key Dependencies

### Core

- `next`: ^16.1.1
- `react`: ^19.0.0
- `typescript`: ^5

### UI & Styling

- `tailwindcss`: ^3.4.17
- `@radix-ui/*`: Various (shadcn/ui components)
- `recharts`: ^2.15.0
- `lucide-react`: ^0.469.0

### Forms & Validation

- `react-hook-form`: ^7.54.2
- `zod`: (for validation schemas)

### API & State

- `axios`: ^1.7.9
- `@edgestore/react`: ^0.2.2

### Date Handling

- `date-fns`: ^4.1.0

### Notifications

- `sonner`: ^1.7.3

---

## Support

For questions or issues:

- Check backend API is running correctly
- Review browser console for error messages
- Verify environment variables are set correctly
- Check network requests in browser DevTools

---
-------------------------------------------------------

_Last Updated: December 27, 2025_
