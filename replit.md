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