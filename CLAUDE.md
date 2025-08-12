# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
KDS App - A standalone Next.js application for the Kitchen Display System, migrated from the monolithic POS dashboard. Features real-time order management, WebSocket updates, and PostgreSQL integration.

## Tech Stack
- **Next.js 15** with App Router and TypeScript
- **React 19** with Tailwind CSS
- **PostgreSQL** for data persistence
- **Socket.IO** for real-time updates
- **Vitest** for unit testing
- **Storybook** for component development
- **Playwright** for E2E testing

## Development Commands

### Quick Start
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test              # Unit tests with Vitest
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report

# Storybook
npm run storybook     # Component development

# E2E Testing
npm run e2e           # Run Playwright tests
npm run e2e:ui        # Playwright UI
```

### Build & Production
```bash
npm run build         # Production build
npm start            # Start production server
```

## Project Structure
```
kds-app/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/             # API routes
│   │   ├── kitchen/         # Kitchen display page
│   │   ├── pickup/          # Pickup display page
│   │   └── recall/          # Order recall page
│   ├── components/
│   │   └── KDS/            # KDS React components
│   ├── lib/                # Utilities and database
│   │   └── db.ts          # PostgreSQL connection
│   ├── types/              # TypeScript types
│   └── test/               # Test setup
├── e2e/                    # Playwright E2E tests
├── .storybook/            # Storybook configuration
└── schema.sql             # Database schema

```

## Database Schema

### Tables
- **kitchen_orders**: Main orders table with status tracking
- **kitchen_order_items**: Individual items within orders

### Key Features
- PostgreSQL LISTEN/NOTIFY for real-time updates
- Automatic timestamp updates via triggers
- Status enum: 'pending', 'ready', 'fulfilled'

## API Routes Structure

### Order Management
- `GET /api/kds-orders` - Fetch orders with filtering
- `POST /api/kds-order` - Create new kitchen order
- `POST /api/kds-orders/[id]/[status]` - Update order status
- `POST /api/kds-items/[id]/[status]` - Update item status

## Component Architecture

### KDS Components
- **KDSContainer**: Main container managing state and WebSocket
- **KDSOrderBlock**: Individual order display with interactions
- **KDSSummary**: Order summary footer (kitchen mode)

### Key Features
- Real-time updates via Socket.IO
- Optimistic UI updates
- Touch/click interactions for status changes
- Long-press to reverse status
- Keyboard shortcuts (double-tap number keys)

## Real-Time Updates

### WebSocket Events
- `kds_update`: Triggered on order/item changes
- PostgreSQL NOTIFY triggers Socket.IO broadcasts
- Automatic reconnection with exponential backoff

## State Management
- React hooks for local state
- Optimistic updates with server reconciliation
- Debounced fetching to prevent race conditions

## Testing Strategy

### Unit Tests (Vitest)
- Component testing with React Testing Library
- API route testing
- Database utility testing

### E2E Tests (Playwright)
- Order workflow testing
- Real-time update verification
- Multi-device testing (desktop/mobile)

### Component Development (Storybook)
- Interactive component development
- Visual regression testing
- Documentation generation

## Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host/db
NEXT_PUBLIC_WS_URL=ws://localhost:3000
SESSION_SECRET=xxx
```

## Migration Status
✅ **Completed:**
- Migrated KDS components from `/posdashboard/client/src/components/KDS`
- API routes converted from Express to Next.js API routes  
- SCSS styles converted to Tailwind CSS
- Real-time updates implemented via Server-Sent Events (SSE)
- Comprehensive testing setup (Vitest, Storybook, Playwright)
- PostgreSQL database integration with LISTEN/NOTIFY

🚧 **Remaining:**
- Authentication layer (NextAuth.js or similar)
- Production deployment configuration
- CI/CD pipeline setup

## Real-Time Architecture
- **Server-Sent Events (SSE)** instead of Socket.IO for broader compatibility
- **PostgreSQL LISTEN/NOTIFY** triggers automatic updates
- **Automatic reconnection** with exponential backoff
- **Toast notifications** for connection status