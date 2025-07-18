# Room Booking System

## Overview

This is a corporate room booking system built with React, Express, and PostgreSQL. It provides a comprehensive solution for managing meeting room reservations with role-based access control, calendar views, and administrative features.

## User Preferences

Preferred communication style: Simple, everyday language.
Authentication: Migrated from Replit Auth to custom email/password authentication with traditional login forms.
Default admin credentials: admin@company.com / admin123

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom email/password authentication with bcrypt
- **Session Management**: Express sessions with PostgreSQL storage
- **File Uploads**: Multer for handling attachments
- **API Design**: RESTful API with JSON responses

### Data Storage
- **Primary Database**: PostgreSQL via Replit environment
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Authentication System
- **Provider**: Custom email/password authentication with bcrypt password hashing
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Role-Based Access**: Three roles (admin, user, viewer) with different permissions
- **Security**: Secure password hashing with bcrypt and session management
- **Default Admin**: admin@company.com / admin123 (created automatically on startup)

### Database Schema
- **Users**: Profile information and role assignments
- **Rooms**: Room details, capacity, equipment, and availability
- **Bookings**: Reservation records with relationships to users and rooms
- **Audit Logs**: System activity tracking for compliance
- **Sessions**: Authentication session storage

### Core Features
- **Dashboard**: Statistics and overview with charts
- **Room Management**: CRUD operations for rooms (admin only)
- **Booking System**: Create, edit, and manage reservations
- **Calendar Views**: Weekly and monthly calendar displays
- **User Management**: Admin interface for user role management
- **Audit Logging**: Complete activity tracking

### File Management
- **Upload Support**: PDF, DOCX, PPT, JPG, PNG files
- **Storage**: Local filesystem with multer
- **File Validation**: Type and size restrictions (10MB limit)

## Data Flow

### Authentication Flow
1. User accesses application and sees custom login form
2. User enters email and password credentials
3. Server validates credentials against PostgreSQL user table with bcrypt
4. Successful authentication creates session with PostgreSQL storage
5. Role-based access control applied based on user role

### Booking Flow
1. User selects room and time slot
2. System checks for conflicts
3. Form validation with Zod schemas
4. Database transaction creates booking record
5. Audit log entry created
6. Real-time UI updates via TanStack Query

### Admin Operations
1. Role verification middleware
2. CRUD operations on rooms/users
3. Audit trail creation
4. Cache invalidation for affected queries

## External Dependencies

### Database
- **Replit PostgreSQL**: Managed PostgreSQL hosting
- **Connection**: Standard PostgreSQL connection pooling

### Authentication
- **Custom Authentication**: Email/password with bcrypt hashing
- **Session Store**: PostgreSQL session persistence

### UI Components
- **Radix UI**: Headless UI primitives
- **Lucide Icons**: Icon library
- **date-fns**: Date manipulation utilities

### Development Tools
- **Vite**: Build tool with HMR
- **Replit Integration**: Development banner and cartographer
- **TypeScript**: Type safety throughout the stack

## Deployment Strategy

### Development Environment
- **Server**: Express with Vite middleware
- **Database**: Replit PostgreSQL with environment variables
- **Authentication**: Custom email/password authentication
- **Asset Serving**: Vite dev server for client assets

### Production Build
- **Client**: Vite build to `/dist/public`
- **Server**: ESBuild bundle to `/dist/index.js`
- **Database**: Production PostgreSQL connection
- **Static Assets**: Express static serving from build output

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: `SESSION_SECRET` for session management
- **Domain**: `REPLIT_DOMAINS` for CORS configuration

### Session Management
- **Storage**: PostgreSQL table with TTL
- **Security**: HTTP-only cookies with secure flags
- **Lifecycle**: 7-day session expiration

The system follows a traditional three-tier architecture with clear separation between presentation, business logic, and data persistence layers. The choice of PostgreSQL with Drizzle provides type safety while maintaining flexibility for complex queries. The custom authentication system provides enterprise-grade security with bcrypt password hashing and session management.

## Recent Changes

### July 18, 2025 - Room Availability System Enhanced During Migration
- Verified and enhanced the existing room availability checking system during Replit migration
- Fixed bug in checkBookingConflict method (excludeBookingId logic corrected from eq to ne)
- Confirmed server-side conflict checking in booking creation endpoint prevents double bookings
- Real-time availability checking in frontend shows green/red indicators for room availability
- System automatically disables unavailable rooms in dropdown when dates/times are selected
- Both BookingForm and AdvancedBookingForm properly implement availability checking
- Backend conflict detection prevents overlapping bookings with proper time range validation

### July 18, 2025 - Booking Conflict Prevention System Implementation
- Added comprehensive room availability checking system to prevent double bookings
- Implemented real-time availability endpoint `/api/rooms/availability` that checks conflicts
- Enhanced booking form with automatic availability checking when dates/times are selected
- Updated room selection to use dropdown format with availability indicators
- Unavailable rooms are disabled in the dropdown and marked with red indicators
- Available rooms show green indicators for clear user feedback
- Added client-side validation to prevent booking unavailable rooms
- System now properly prevents overlapping bookings while maintaining user-friendly interface

### July 18, 2025 - Administration Tab Enhancement
- Added "Administration" tab to profile settings dialog for easier admin access
- Admin users now see three tabs: Profile, Password, and Admin in settings
- Admin tab provides quick access to all administrative tools with descriptions
- Enhanced user experience by making admin functions more accessible
- Maintained role-based access control - only admins see the administration tab

### July 18, 2025 - Migration to Replit Environment Completed
- Successfully migrated project from Replit Agent to Replit environment
- Provisioned PostgreSQL database and deployed schema with Drizzle
- Fixed login form field mismatch (userId → email) to match backend expectations
- Verified all core features working: login, dashboard, room/booking management
- Application running successfully on port 5000 with custom email/password authentication
- All dependencies installed and configured properly
- Default admin user created: admin@company.com / admin123
- Project is now fully functional and ready for development

### July 18, 2025 - Room Availability & Conflict Prevention System
- Enhanced room booking conflict prevention system with improved server-side validation
- Fixed bug in checkBookingConflict method where excludeBookingId logic was inverted
- Added comprehensive booking conflict checking on both frontend and backend
- Implemented real-time room availability checking when users select date/time
- Room selection now shows availability status with color indicators (green/red)
- Unavailable rooms are automatically disabled in the dropdown selection
- Enhanced error messages for better user experience when conflicts are detected
- System successfully prevents double bookings with user-friendly feedback
- Backend validation provides additional safety layer against race conditions
- All booking forms now include pre-submission availability validation

### July 18, 2025 - Complete Email Functionality Implementation
- Fixed email settings display issue by adding useEffect to reset form when data loads
- Resolved authentication bug in custom auth (email vs userId parameter mismatch)
- Implemented comprehensive password reset email functionality with nodemailer
- Fixed SMTP configuration bugs (smtpUser → smtpUsername, createTransporter → createTransport)
- Removed duplicate route handlers that were preventing email sending
- Successfully configured and tested email delivery using mail.lightfinance.com:465
- Added password reset page component with token validation
- Enhanced error handling and debugging for email operations
- Email settings now persist properly across login sessions
- Password reset emails are being sent successfully to users

### July 18, 2025 - Enhanced Audit Log System with Detailed Views
- Implemented comprehensive audit logging system with detailed modal views
- Added Details button to each audit log entry for full information display
- Enhanced audit log display with user names, emails, roles, and avatars
- Created detailed modal showing complete log information including timestamps, user details, and full JSON data
- Implemented real-time navigation tracking for all user interactions
- Added comprehensive filtering options for audit logs (action types, resource types, entry limits)
- Fixed audit log API to properly return data with user information joined from database
- System now captures and displays every user interaction including page navigation and CRUD operations

### July 18, 2025 - Migration to Replit Environment and UI Updates
- Successfully completed migration from Replit Agent to Replit environment
- All packages installed and PostgreSQL database provisioned and configured
- Database schema deployed using Drizzle with all required tables created
- Application now running successfully on port 5000 with full functionality
- Default admin user created and verified: admin@company.com / admin123
- Updated login page to remove descriptive text and add Light Finance logo
- All core features confirmed working: authentication, dashboard, room booking
- Fixed calendar sync demo page routing issue for proper layout display
- Project is now fully functional and ready for continued development