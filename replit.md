# Accounting Management System

## Overview

This is a full-stack accounting management application built with Express.js, React, and PostgreSQL. The system provides comprehensive accounting functionality including chart of accounts management, journal entries, invoicing, expense tracking, and financial reporting. It supports multi-tenancy with role-based access control and session-based authentication.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom IBM Carbon Design System colors
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with session middleware
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with bcrypt for password hashing
- **Validation**: Zod schemas shared between frontend and backend

## Key Components

### Database Schema
The system uses a comprehensive PostgreSQL schema with the following main entities:
- **Users**: User authentication and profile information
- **Companies**: Multi-tenant company management
- **Company Users**: Many-to-many relationship with role-based permissions
- **Accounts**: Chart of accounts with hierarchical structure
- **Journal Entries**: Double-entry bookkeeping transactions
- **Customers/Vendors**: Contact management
- **Invoices**: Invoice generation and tracking
- **Expenses**: Expense tracking and categorization

### Authentication & Authorization
- Session-based authentication using express-session
- Role-based access control (admin, accountant, user)
- Company-level permission system
- Middleware for route protection and company access validation

### API Structure
RESTful API endpoints organized by resource:
- `/api/auth/*` - Authentication endpoints
- `/api/companies/*` - Company management
- `/api/companies/:id/accounts/*` - Chart of accounts
- `/api/companies/:id/journal-entries/*` - Journal entries
- `/api/companies/:id/invoices/*` - Invoice management
- `/api/companies/:id/expenses/*` - Expense tracking

### Frontend Pages
- **Dashboard**: Overview with metrics and recent activity
- **Chart of Accounts**: Account management with type-based organization
- **Journal Entries**: Double-entry transaction recording
- **Invoices**: Invoice creation and management
- **Expenses**: Expense recording and categorization
- **Reports**: Financial reporting (P&L, Balance Sheet, etc.)

## Data Flow

1. **Authentication Flow**: User logs in → Session created → Company selection → API access granted
2. **Data Mutations**: Form submission → Client validation → API request → Database update → Cache invalidation
3. **Data Queries**: Component mount → TanStack Query → API request → Database query → Response caching
4. **Real-time Updates**: Optimistic updates for better UX, with error rollback

## External Dependencies

### Backend Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL driver for serverless environments
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **bcrypt**: Password hashing and comparison
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation integration
- **@radix-ui/***: Accessible UI components
- **wouter**: Lightweight routing library
- **date-fns**: Date manipulation utilities

### Development Dependencies
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first CSS framework
- **drizzle-kit**: Database migration tool

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Build Process
- **Development**: `npm run dev` - Runs backend with file watching
- **Production Build**: `npm run build` - Builds frontend and bundles backend
- **Production Start**: `npm run start` - Serves production bundle

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **Sessions**: Configurable session secret for production security
- **Build Optimization**: Separate client and server builds with proper asset handling

### Replit Configuration
- **Modules**: Node.js 20, web server, PostgreSQL 16
- **Ports**: Internal port 5000 mapped to external port 80
- **Auto-scaling**: Configured for autoscale deployment target

## Changelog

```
Changelog:
- June 17, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```