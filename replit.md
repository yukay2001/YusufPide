# Pideci Management Panel

## Overview
The Pideci Management Panel is a restaurant management system specifically designed for pide (Turkish flatbread) restaurants. Its primary purpose is to streamline operations by tracking sales, expenses, and inventory. The system also generates comprehensive reports for business analytics, providing real-time metrics such as total sales, net profit, and critical stock alerts. It aims to offer a clean, efficient, and productivity-focused user experience inspired by modern design systems.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Frameworks & Build:** React 18 with TypeScript, Vite for build and development, Wouter for lightweight routing.
- **State Management & Data:** TanStack Query for server state management and caching, utilizing optimistic updates and query invalidation.
- **UI & Styling:** Shadcn UI components built on Radix UI primitives, styled with Tailwind CSS. Features a custom theme system supporting light/dark modes.
- **Design Principles:** Emphasizes clarity, efficiency, and data legibility.
- **Component Structure:** Organized into pages, reusable components, shared utilities, and context providers (e.g., `AuthContext` for authentication and permissions).
- **Key Design Patterns:** Compound component pattern for complex UI, hook-based architecture for shared logic, and form validation using React Hook Form with Zod.

### Backend Architecture
- **Server Framework:** Express.js with TypeScript for type-safe API routes, using ESM module system.
- **API Design:** RESTful API under `/api` prefix, with resource-based routing. Utilizes Zod schemas for runtime validation of request payloads and handles errors with appropriate HTTP status codes.
- **Middleware:** Includes JSON body parsing, URL-encoded form parsing, request/response logging, and comprehensive error handling.
- **Authentication & Authorization:** Session-based authentication via `express-session` and `passport.js` (local strategy). Implements custom Role-Based Access Control (RBAC) with `requireAuth` and `requireRole` middleware for endpoint protection. Passwords are hashed with bcrypt.

### Data Storage & Persistence
- **Database:** PostgreSQL, utilizing `@neondatabase/serverless` adapter.
- **ORM & Schema:** Drizzle ORM for type-safe database operations, with Drizzle Kit for migrations and schema synchronization. Zod schemas are generated from Drizzle schemas for validation.
- **Session Store:** Production-ready PostgreSQL session storage using `connect-pg-simple` for proper session management across multiple instances and deployments.
- **Data Models:**
    - **Business Sessions:** Manual day control via Start/End Day buttons. Initial session created on first run. No automatic time-based restrictions.
    - **Products:** Linkable to stock items, with automatic stock deduction on sale. Always editable regardless of active session.
    - **Sales & Sale Items:** Detailed tracking of transactions. Can be created/modified when an active session exists.
    - **Expenses:** Categorized expense tracking. Can be created/modified when an active session exists.
    - **Stock:** Quantity tracking with configurable alert thresholds and real-time notifications.
    - **Categories:** For organizing products and expenses.
    - **Restaurant Tables:** For managing active orders.
    - **Orders & Order Items:** Two-step completion workflow (complete order, close bill), real-time kitchen display integration, and automatic stock deduction.
    - **Roles & Permissions:** Flexible custom role creation with 10 granular permissions, controlling both UI navigation and API access.
    - **Users:** Assigned to roles, inheriting permissions, with secure password handling.
- **Data Seeding:** Initial product catalog, an admin user (`admin`/`admin123`), and an initial business session are created on first run.
- **Day Control:** Manual start/end day system. Users click "Gün Başlat" to start a new day and "Günü Kapat" to end the current day. Turkish timezone used for session naming.
- **Session Management:** Users can delete past sessions via "Günleri Yönet" button. Active sessions cannot be deleted (must be ended first). Deleting a session also removes all associated sales and expenses.

## External Dependencies

- **UI & Component Libraries:** Radix UI, Shadcn UI, Lucide React, Class Variance Authority (CVA), cmdk.
- **Form & Validation:** React Hook Form, Zod, @hookform/resolvers, drizzle-zod.
- **Date & Time:** date-fns.
- **Database & ORM:** @neondatabase/serverless, drizzle-orm, drizzle-kit.
- **Development Tools:** tsx, esbuild.
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer.