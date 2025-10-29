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

## Recent Changes (October 29, 2025)

### Removed: Calendar Sync Feature
- **Action**: Completely removed the Calendar Sync feature from the application
- **Reason**: User requested removal of Microsoft Outlook calendar synchronization integration
- **Files Deleted**:
  - `client/src/components/CalendarSync.tsx` - Calendar sync UI component
  - `client/src/pages/CalendarSyncDemo.tsx` - Demo page for calendar sync
- **Files Modified**:
  - `client/src/App.tsx` - Removed calendar sync routes and imports
  - `client/src/components/Layout.tsx` - Removed calendar sync navigation menu item
  - `server/routes.ts` - Removed all `/api/calendar-sync` API endpoints
  - `server/storage.ts` - Removed calendar sync storage methods and interface definitions
- **Database**: The `calendar_sync` table remains in the database schema but is no longer used by the application
- **Note**: Replit's Outlook connector integration was dismissed - manual Microsoft Graph API integration was not implemented

## Recent Changes (October 28, 2025)

### Added: "Clear All" Button for Notifications
- **Feature**: Users can now clear all notifications at once with a single click
- **Implementation**:
  1. **Backend**:
     - Added `deleteAllNotifications(userId)` method to storage interface
     - Created DELETE `/api/notifications` endpoint that removes all notifications for the current user
     - Endpoint secured with authentication - only deletes user's own notifications
  2. **Frontend** (`NotificationDropdown.tsx`):
     - Added "Clear All" button next to "Mark all read" button in notifications dropdown
     - Button appears only when user has notifications
     - Styled in red with trash icon to indicate destructive action
     - Shows success toast when notifications are cleared
     - Added proper loading states during deletion
  3. **Security**:
     - Server-side authorization ensures users can only delete their own notifications
     - Uses same authentication middleware as other notification endpoints
- **Files Modified**:
  - `server/storage.ts` (added deleteAllNotifications method)
  - `server/routes.ts` (added DELETE /api/notifications endpoint)
  - `client/src/components/NotificationDropdown.tsx` (added Clear All button and mutation)
- **User Experience**:
  - "Clear All" button displays with trash icon for easy identification
  - Confirmation via toast notification when notifications are cleared
  - Notification dropdown automatically refreshes to show empty state
  - Efficient cleanup of notification history with single click

### Fixed: Bookings Not Appearing After Login/Logout
- **Issue**: After logging out and logging back in, bookings weren't visible in the Room Scheduler even though they were saved in the database
- **Root Cause**: TanStack Query was using cached data instead of fetching fresh data from the server when the user returned
- **Fix**: Added `refetchOnMount: 'always'` to both rooms and bookings queries in CalendarView component
- **Files Modified**: `client/src/components/CalendarView.tsx`
- **User Experience**: Room Scheduler now always displays up-to-date booking information, even after logout/login

### Fixed: Participant Auto-Fill Dropdown from User Management
- **Issue**: 
  1. Non-admin users couldn't see the user list when booking rooms because the `/api/users` endpoint required admin access
  2. Calendar scheduler (CalendarView) was using old LDAP search input instead of the modern ParticipantSelector component
  3. When typing in participant field, no dropdown appeared with user suggestions
- **Fix**: 
  1. Removed admin-only restriction from GET `/api/users` endpoint
  2. Replaced LDAP search inputs with ParticipantSelector component in CalendarView
  3. Removed all LDAP-related state variables and functions for participants
- **How It Works Now**:
  - **Click "Select from user list..."** button to see dropdown with all users
  - Users are displayed with their full names and email addresses
  - **Search feature** - Type to filter users by name or email
  - **Multi-select** - Select multiple participants from the dropdown
  - Selected participants show with their names (not just emails) as badges
  - Can still manually add external email addresses not in the system
- **Files Modified**: 
  - `server/routes.ts` (removed admin restriction from user list endpoint)
  - `client/src/components/CalendarView.tsx` (replaced LDAP input with ParticipantSelector)
- **User Experience**:
  - All booking forms now use the same modern dropdown selector
  - All authenticated users can see the complete user directory when adding meeting participants
  - Participant names auto-fill from the User Management list
  - No more LDAP configuration needed for basic participant selection
  - Admin restrictions remain for creating, editing, and deleting users

### Configured: Default Email Settings
- **SMTP Configuration**: Default email settings have been configured in the database for sending notifications
- **Settings**:
  - SMTP Host: mail.lightfinance.com
  - SMTP Port: 465 (secure)
  - SMTP Username: no_reply@lightfinance.com
  - From Email: no_reply@lightfinance.com
  - From Name: Meeting Room Booking System
  - Notifications: All email features enabled (booking notifications, reminders, password reset)
- **Functionality**:
  - Booking notifications with ICS calendar invites sent to participants
  - Password reset emails for users
  - Meeting reminders before scheduled times
- **Security**: SMTP credentials stored in database (consider moving to environment variables for production)
- **Access**: Email settings can be viewed and modified by admins in the admin panel

## Recent Changes (October 27, 2025)

### Added: Click-to-Edit Meeting Functionality in Calendar View
- **Feature**: Meeting organizers can now click directly on their booked meeting time frames in the calendar to open the edit dialog
- **Implementation**:
  1. **Calendar Click Handler** (`CalendarView.tsx`):
     - Added `handleEditBooking()` function that checks if current user is the meeting organizer
     - Uses `currentUser.id === booking.userId` to verify ownership
     - Shows "Unauthorized" toast if non-organizer tries to edit
     - Properly handles recurring booking IDs using modulo operator (`booking.id % 100000`)
  2. **Edit Modal Dialog**:
     - Comprehensive form with all booking fields: title, room, dates, description, participants, repeat options, reminders
     - Real-time room availability checking that excludes the current booking being edited
     - Form pre-populated with existing booking data
     - Uses React Hook Form with Zod validation
  3. **Update Mutation**:
     - PUT request to `/api/bookings/:id` with updated booking data
     - Invalidates bookings cache on success
     - Shows success/error toast notifications
  4. **Critical Bug Fix**:
     - Fixed recurring booking ID normalization from `Math.floor(booking.id / 100000)` to `booking.id % 100000`
     - Previous logic caused edits to target wrong booking records (e.g., virtual ID 100045 → 1 instead of 45)
     - Now correctly extracts actual booking ID: 100045 % 100000 = 45, 200045 % 100000 = 45
- **Security**:
  - Authorization enforced - only organizers can edit their meetings
  - Booking ID validation prevents editing unrelated bookings
- **Files Modified**:
  - `client/src/components/CalendarView.tsx` (edit functionality, modal, form handling)
- **User Experience**:
  - Organizers: Click on any of their booked meetings to edit details
  - Non-organizers: See "Unauthorized" toast if they try to edit someone else's meeting
  - Edit modal shows all booking details with real-time room availability feedback
  - Changes saved with single click on "Update Booking" button

### Added: Comprehensive Privacy Controls for Meeting Details
- **Feature**: Meeting organizers and participants see full meeting details (title, description, participants), while non-participants only see limited information (organizer, time, "Booked")
- **Implementation**:
  1. **Backend Privacy Enforcement** (`server/routes.ts`):
     - Updated `/api/bookings` endpoint to filter sensitive data server-side before sending to client
     - For each booking, checks if current user is organizer or participant
     - Uses case-insensitive email comparison (toLowerCase + trim) for robust participant matching
     - Returns full details (title, description, participants) only to authorized users
     - Returns redacted data ("Booked" title, null description, empty participants array) to non-participants
     - Organizer name/email remains visible to all for transparency
  2. **Frontend Display Logic** (`CalendarView.tsx`):
     - Added `canSeeFullDetails()` function to check authorization with case-insensitive email matching
     - Added `getBookingDisplayInfo()` to format display based on authorization
     - Participants/organizer see: Full meeting title, description, participant list, organizer name, meeting time
     - Non-participants see: "Booked", organizer name, meeting time
- **Security**: 
  - Privacy enforced server-side - sensitive data never sent to unauthorized clients
  - Network panel shows redacted data for non-participants
  - Email matching normalized (trim + lowercase) to prevent false negatives
- **Files Modified**:
  - `server/routes.ts` (backend privacy filtering)
  - `client/src/components/CalendarView.tsx` (frontend display logic)
- **User Experience**:
  - Organizers and participants see complete meeting information
  - Non-participants can see when rooms are booked and who organized it, but not the meeting subject or attendees
  - Privacy respected while maintaining calendar availability transparency

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