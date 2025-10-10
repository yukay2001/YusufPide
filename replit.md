# Pideci Management Panel

## Overview

A restaurant management system designed for pide (Turkish flatbread) restaurants. The application tracks sales, expenses, stock inventory, and generates reports for business analytics. Built with a modern tech stack featuring React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

The system provides real-time business metrics including total sales, expenses, net profit calculations, and critical stock alerts. It features a clean, productivity-focused interface inspired by modern design systems like Linear and Notion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)

**State Management & Data Fetching:**
- TanStack Query (React Query) for server state management and caching
- Custom query client with automatic refetching disabled (staleTime: Infinity)
- Optimistic updates pattern for mutations with query invalidation

**UI Components & Styling:**
- Shadcn UI component library with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom theme system supporting light/dark modes stored in localStorage
- Design guidelines emphasize clarity, efficiency, and data legibility

**Component Structure:**
- Page components in `/pages` (Dashboard, NewSales, Products, Expenses, Stock, Reports)
- Reusable UI components in `/components` (DashboardStats, DataTable, DateFilter, forms)
- Shared utilities in `/lib` (queryClient, utils for className merging)

**Key Design Patterns:**
- Compound component pattern for complex UI (dialogs, dropdowns, forms)
- Hook-based architecture for shared logic (use-toast, use-mobile)
- Form validation with React Hook Form and Zod resolvers

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for type-safe API routes
- ESM module system (type: "module" in package.json)
- Custom logging middleware tracking request duration and response data

**API Design:**
- RESTful API endpoints under `/api` prefix
- Resource-based routing (products, sales, expenses, stock)
- Zod schemas for runtime validation of request payloads
- Error handling with appropriate HTTP status codes

**Route Structure:**
- GET `/api/products` - Fetch all products
- POST `/api/products` - Create new product
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product
- Similar patterns for sales, expenses, and stock endpoints

**Middleware Stack:**
- JSON body parsing with express.json()
- URL-encoded form parsing
- Request/response logging for API routes
- Error handling middleware with status code extraction

**Development Features:**
- Vite integration for HMR in development
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)
- Automatic database seeding on server start

### Data Storage & Persistence

**Database:**
- PostgreSQL as the primary database
- Neon serverless PostgreSQL adapter (@neondatabase/serverless)
- Connection via DATABASE_URL environment variable

**ORM & Schema Management:**
- Drizzle ORM for type-safe database operations
- Schema definition in `/shared/schema.ts` with automatic TypeScript types
- Drizzle Kit for migrations and schema synchronization
- Zod schemas generated from Drizzle schemas for validation

**Data Models:**
- **Products:** id, name, price (decimal), category (optional)
- **Sales:** id, date (timestamp), total (decimal)
- **Sale Items:** id, saleId (FK), productId (FK), productName, quantity, price, total
- **Expenses:** id, date (timestamp), category, amount (decimal)
- **Stock:** id, name (unique), quantity (integer)

**Storage Implementation:**
- In-memory storage (MemStorage class) as fallback/development mode
- Interface-based storage design (IStorage) for easy swapping
- UUID generation for primary keys using PostgreSQL gen_random_uuid()

**Data Seeding:**
- Initial product catalog seeded on first run
- 12 pre-configured products (pide varieties, cantık, beverages)
- Seed data includes Turkish menu items with Turkish Lira pricing

### External Dependencies

**UI & Component Libraries:**
- Radix UI primitives (dialogs, dropdowns, popovers, etc.)
- Shadcn UI configuration via components.json
- Lucide React for icon set
- Class Variance Authority (CVA) for component variants
- cmdk for command palette functionality

**Form & Validation:**
- React Hook Form for form state management
- Zod for schema validation
- @hookform/resolvers for Zod integration
- drizzle-zod for automatic schema generation

**Date & Time:**
- date-fns for date manipulation and formatting

**Database & ORM:**
- @neondatabase/serverless for PostgreSQL connection
- Drizzle ORM (drizzle-orm) for queries
- Drizzle Kit (drizzle-kit) for migrations

**Development Tools:**
- tsx for TypeScript execution
- esbuild for production bundling
- Replit-specific Vite plugins for development experience

**Styling:**
- Tailwind CSS with PostCSS
- Autoprefixer for CSS compatibility
- Custom color system with CSS variables for theming

**Build Configuration:**
- TypeScript with strict mode enabled
- Path aliases (@/, @shared/, @assets/) for clean imports
- Vite configuration with custom root and output directories
- Separate client and server build processes