# Room Booking System

## Overview

This is a corporate room booking system built with React, Express, and PostgreSQL. It provides a comprehensive solution for managing meeting room reservations with role-based access control, calendar views, and administrative features.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Authentication**: Replit Auth with OIDC integration
- **Session Management**: Express sessions with PostgreSQL storage
- **File Uploads**: Multer for handling attachments
- **API Design**: RESTful API with JSON responses

### Data Storage
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Role-Based Access**: Three roles (admin, user, viewer) with different permissions
- **Security**: Secure password hashing and session management

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
1. User accesses application
2. Replit Auth redirects to OIDC provider
3. Successful authentication creates/updates user record
4. Session established with PostgreSQL storage
5. Role-based access control applied

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
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Connection**: WebSocket-based connection pooling

### Authentication
- **Replit Auth**: OIDC-based authentication service
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
- **Database**: Neon PostgreSQL with environment variables
- **Authentication**: Replit Auth with development domains
- **Asset Serving**: Vite dev server for client assets

### Production Build
- **Client**: Vite build to `/dist/public`
- **Server**: ESBuild bundle to `/dist/index.js`
- **Database**: Production PostgreSQL connection
- **Static Assets**: Express static serving from build output

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`
- **Domain**: `REPLIT_DOMAINS` for CORS configuration

### Session Management
- **Storage**: PostgreSQL table with TTL
- **Security**: HTTP-only cookies with secure flags
- **Lifecycle**: 7-day session expiration

The system follows a traditional three-tier architecture with clear separation between presentation, business logic, and data persistence layers. The choice of PostgreSQL with Drizzle provides type safety while maintaining flexibility for complex queries. The Replit Auth integration simplifies authentication while providing enterprise-grade security features.