# Pideci Management Panel

## Overview

A restaurant management system designed for pide (Turkish flatbread) restaurants. The application tracks sales, expenses, stock inventory, and generates reports for business analytics. Built with a modern tech stack featuring React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

The system provides real-time business metrics including total sales, expenses, net profit calculations, and critical stock alerts. It features a clean, productivity-focused interface inspired by modern design systems like Linear and Notion.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Session Management & Historical Data Protection (Latest):**
- Removed manual "New Day" button - sessions now only created automatically at midnight Turkish time
- Implemented read-only protection for past sessions:
  - Frontend detects past sessions by comparing session date to today's date
  - All create/edit/delete UI controls disabled when viewing historical sessions
  - Backend POST endpoints validate active session date = today before allowing creation
  - Backend DELETE endpoints verify both session date and record ownership before deletion
  - Visual warning banner shown when viewing read-only historical data
- Users can view but not modify sales and expenses from previous days

**Stock Management System:**
- Added manual product-to-stock item linking (preference-based, not automatic)
- Products page includes dropdown to select which stock item (if any) each product uses
- When a sale is made, stock automatically decreases from the linked stock item
- Products can be set to "Stok kullanmıyor" (no stock) to opt out of stock tracking
- Stock deduction logic uses ID-based lookup (updateStockQuantityById) for reliability
- Improved from name-based to ID-based deduction for better performance and robustness

**Stock Alert & Notification System:**
- Added alert threshold field to stock items - users can set custom low-stock thresholds
- Real-time notification panel in header shows items below alert threshold
- Bell icon with badge count displays number of low stock alerts
- Notification panel auto-refreshes every 30 seconds
- Stock page shows visual warnings when items fall below threshold
- GET /api/stock/alerts endpoint filters stock items requiring attention

**Table & Order Management System (Latest):**
- Restaurant table management for tracking active orders before finalizing as sales
- Users can add/delete restaurant tables with custom names
- Each table can have one active order at a time
- Order dialog allows adding products to active orders with category filtering
- Real-time order total calculation as items are added/removed
- **Two-step order completion workflow:**
  - Step 1: "Siparişi Tamamla" (Complete Order) - Marks order as ready/completed, stays visible on table
  - Step 2: "Hesabı Kapat" (Close Bill) - Finalizes payment, creates sale, clears table
- Active orders: Can add/remove items, appear in kitchen display
- Completed orders: Read-only (no add/delete), removed from kitchen, show "Hazır" badge
- Orders can be cancelled (with confirmation) at any stage
- Table cards show status: "Boş" (empty), "Aktif Sipariş" (active), or "Tamamlandı" (completed with badge)
- Tables with active orders cannot be deleted (protection)
- Cache invalidation ensures UI stays synchronized after all order operations
- Stock automatically deducted when order items are added

**Kitchen Display System:**
- Real-time kitchen display showing active table orders (only orders being prepared, not completed)
- Orders categorized by age: "Yeni Siparişler" (< 2 minutes) and "Devam Eden Siparişler" (>= 2 minutes)
- New orders highlighted with red border, "YENİ" badge, and pulse animation
- **Multi-device support:** Kitchen display auto-refreshes every 2 seconds to show orders from other devices
- **Immediate updates on same device:** Kitchen refreshes instantly when local orders change (via cache invalidation)
- Each order card displays: table name, elapsed time, order items with quantities, and total
- Orders automatically disappear from kitchen when marked as "completed" (food is ready)
- Helps kitchen staff track incoming orders and prepare meals efficiently
- GET /api/kitchen/active-orders endpoint returns only active orders with table and item details

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
- Page components in `/pages` (Dashboard, NewSales, Products, Expenses, Stock, Reports, Orders, KitchenDisplay)
- Reusable UI components in `/components` (DashboardStats, DataTable, DateFilter, StockAlertNotifications, forms)
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
- **Business Sessions:** id, date (unique date), isActive (boolean), createdAt (timestamp)
  - Automatically created at midnight Turkish time
  - Only one session can be active at a time
  - Sessions are read-only once the date has passed
- **Products:** id, name, price (decimal), categoryId (FK, optional), stockItemId (FK, optional)
  - Manual stock item linking: Users choose which stock item (if any) each product uses
  - When a product is sold, stock decreases from the linked stock item
- **Sales:** id, sessionId (FK), date (timestamp), total (decimal)
- **Sale Items:** id, saleId (FK), productId (FK), productName, quantity, price, total
- **Expenses:** id, sessionId (FK), date (timestamp), category, amount (decimal)
- **Stock:** id, name (unique), quantity (integer), alertThreshold (integer, optional)
  - Alert threshold triggers low-stock notifications when quantity falls below threshold
- **Categories:** id, name (unique)
- **Restaurant Tables:** id, name (unique), createdAt (timestamp)
  - Physical restaurant tables that can have active orders
  - Cannot be deleted if they have an active order
- **Orders:** id, tableId (FK), status (active/completed), total (decimal), createdAt, updatedAt
  - One active order per table at a time
  - Automatically recalculates total when items are added/removed
- **Order Items:** id, orderId (FK), productId (FK), productName, quantity, price, total
  - Individual items within an order
  - Stock automatically deducted when items are added

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