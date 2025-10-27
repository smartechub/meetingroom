# Room Booking System

## Overview

This is a corporate room booking system built with React, Express, and PostgreSQL. It provides a comprehensive solution for managing meeting room reservations with role-based access control, calendar views, and administrative features. The project aims to offer a robust and user-friendly platform for efficient room management.

## Recent Setup (October 4, 2025)

This project was imported from GitHub and successfully configured for the Replit environment:
- PostgreSQL database provisioned and schema pushed successfully using `npm run db:push`
- Node.js 20 already installed with all dependencies
- Development workflow configured: `npm run dev` on port 5000
- Server properly configured with host 0.0.0.0 and Vite allowedHosts: true for Replit proxy
- Deployment configured for autoscale: build with `npm run build`, run with `npm run start`
- Default admin user and sample rooms created automatically on first run
- Application is fully functional and accessible at the preview URL

## Recent Changes (October 27, 2025)

### Fixed: Booked Time Slots Now Highlighted and Protected
- **Issue**: Already booked time slots in the calendar scheduler were not visually highlighted, and users could still click on them, only to receive a backend error after trying to book
- **Root Cause**: 
  1. Frontend didn't have logic to detect fully booked slots
  2. The `/api/bookings` endpoint only returned a user's own bookings for non-admin users, so they couldn't see other people's bookings
- **Fix Applied**:
  1. **Smart Slot Detection**: Created `isSlotFullyBooked()` function that:
     - Collects all bookings overlapping with the time slot
     - Clips booking intervals to slot boundaries
     - Merges overlapping intervals to avoid double-counting
     - Returns true if total coverage equals or exceeds the full hour
     - Handles single full-hour bookings, multiple consecutive bookings (e.g., 9:00-9:30 + 9:30-10:00), and any combination
  2. **Click Prevention**: Updated `handleSlotClick()` to:
     - Check if slot is fully booked before opening booking dialog
     - Show toast notification: "This time slot is already booked. Please choose a different time or room."
     - Prevent wasted user effort by blocking unavailable slots upfront
  3. **Visual Highlighting**: Booked slots now display with:
     - Gray background (vs white for available slots)
     - `cursor-not-allowed` cursor on hover
     - No hover effect to clearly indicate unavailability
  4. **API Fix**: Changed `/api/bookings` to return all bookings for all users (required for calendar visibility)
     - Edit/delete restrictions remain in place on their respective endpoints
     - Users can now see which slots are taken by others
- **Files Modified**:
  - `client/src/components/CalendarView.tsx` (slot detection, highlighting, click prevention)
  - `server/routes.ts` (API endpoint fix)
- **User Experience Now**:
  - Booked slots are clearly grayed out in the calendar
  - Clicking a booked slot shows immediate feedback via toast
  - Booking dialog never opens for unavailable times
  - Users can easily identify which slots are available at a glance

### Added: ParticipantSelector with User Suggestions
- **Feature**: Participants field in booking forms now auto-populates from registered users with dropdown selection
- **Implementation**:
  1. **ParticipantSelector Component**: Created reusable component with:
     - Multi-select dropdown showing all registered users from the database
     - Searchable/filterable user list with autocomplete
     - Manual email entry option for users not in the system
     - Selected participants displayed as removable badges
     - Proper loading and error state handling
  2. **Integration**: Added to both BookingForm and AdvancedBookingForm
  3. **Data Fetching**: Uses TanStack Query to fetch users from `/api/users` endpoint with proper error handling
- **Files Modified**:
  - `client/src/components/ParticipantSelector.tsx` (new component)
  - `client/src/components/BookingForm.tsx` (integrated ParticipantSelector)
  - `client/src/components/AdvancedBookingForm.tsx` (integrated ParticipantSelector)
- **User Experience**: 
  - Click dropdown to see all users with names and emails
  - Search/filter users by name or email
  - Select multiple users from dropdown
  - Manually add external participant emails not in the system
  - Remove participants by clicking X on badge

## Recent Changes (October 8, 2025)

### Fixed: Repeat Bookings Not Showing in Calendar/Scheduler
- **Issue**: When users selected daily, weekly, or custom repeat options and booked a room, the booking would be created but wouldn't show up in the calendar scheduler for the repeated dates
- **Root Cause**: 
  1. The backend was only creating ONE booking record with repeat settings stored, but the calendar expected multiple booking instances for each occurrence
  2. RadioGroup in BookingForm was not controlled (missing `value` prop)
  3. Custom days selection UI was completely missing from both forms
- **Fix Applied**:
  1. **Calendar Display Logic**: Added booking expansion logic in `CalendarView.tsx` that:
     - Automatically expands daily bookings to show on each day for 60 days
     - Expands weekly bookings to show on the same day of the week
     - Expands custom bookings to show only on selected weekdays
  2. **Form Controls**: 
     - Fixed RadioGroup to be controlled with `value={form.watch('repeatType')}`
     - Added custom days selection UI with clickable day buttons
     - Added validation when custom is selected but no days are chosen
  3. **Interface Updates**: Added `repeatType` and `customDays` to the Booking interface
- **Files Modified**:
  - `client/src/components/CalendarView.tsx` (booking expansion logic)
  - `client/src/components/BookingForm.tsx` (form controls)
  - `client/src/components/AdvancedBookingForm.tsx` (form controls)
- **How It Works Now**:
  - Daily: Booking appears every day for 60 days from start date
  - Weekly: Booking appears on the same weekday each week
  - Custom: Booking appears only on the specific days you select (e.g., Mon/Wed/Fri)

## User Preferences

Preferred communication style: Simple, everyday language.
Authentication: Custom email/password authentication with traditional login forms.
Default admin credentials: admin@company.com / admin123

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI primitives with shadcn/ui components, featuring responsive design and a mobile menu.
- **Styling**: Tailwind CSS with CSS variables for theming.
- **State Management**: TanStack Query for server state management.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.
- **Build Tool**: Vite.

### Backend
- **Runtime**: Node.js with Express server.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations, schema defined in `/shared/schema.ts`, and Drizzle Kit for migrations.
- **Authentication**: Custom email/password authentication using bcrypt for password hashing and Express sessions with PostgreSQL storage for session management.
- **File Uploads**: Multer for handling attachments (PDF, DOCX, PPT, JPG, PNG up to 10MB) stored locally.
- **API Design**: RESTful API with JSON responses.
- **Core Features**:
    - **Authentication System**: Role-based access (admin, user, viewer) with secure password hashing.
    - **Room Management**: CRUD operations for rooms (admin only), including automatic seeding of default rooms.
    - **Booking System**: Create, edit, and manage reservations with real-time availability checks, conflict prevention, and quick booking directly from the calendar.
    - **Calendar Views**: Weekly and monthly displays with improved alignment, prominent scrollbars, and automatic scrolling to office hours.
    - **User Management**: Admin interface for user role management.
    - **Audit Logging**: Comprehensive system activity tracking with detailed modal views for compliance.
    - **Email Functionality**: Integrated password reset and email delivery.

### Data Storage
- **Primary Database**: PostgreSQL via Replit environment, managed with Drizzle ORM.
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple`.

## External Dependencies

### Database
- **Replit PostgreSQL**: Managed PostgreSQL hosting.

### UI Components
- **Radix UI**: Headless UI primitives.
- **Lucide Icons**: Icon library.
- **date-fns**: Date manipulation utilities.

### Development Tools
- **Vite**: Build tool.
- **Replit Integration**: For development and deployment.
- **TypeScript**: For type safety.

### Other Integrations
- **Nodemailer**: For email functionality.
- **Bcrypt**: For password hashing.
- **Multer**: For file uploads.
- **connect-pg-simple**: For PostgreSQL session persistence.