# KDS App Setup Guide

## Node.js Version Issue

The current environment has Node.js 18.16.1, but Next.js 15 requires Node.js >= 18.18.0 or >= 20.0.0.

### Solution Options:

1. **Upgrade Node.js** (Recommended):
   ```bash
   # Using nvm (if installed)
   nvm install 20
   nvm use 20
   
   # Or install Node.js 20+ directly from nodejs.org
   ```

2. **Downgrade Next.js** (Alternative):
   ```bash
   npm install next@14
   ```

## Database Setup

1. Install PostgreSQL locally or use a remote instance
2. Create database: `createdb kds_db`  
3. Run schema: `psql kds_db < schema.sql`
4. Update `.env.local` with your database URL

## Development Workflow

Once Node.js version is resolved:

```bash
# Start development
npm run dev

# Run tests
npm test

# Component development
npm run storybook

# E2E testing
npm run e2e
```

## Project Status

✅ **Completed Setup:**
- Next.js app with TypeScript
- Tailwind CSS v3 configured
- Testing infrastructure (Vitest, Playwright, Storybook)
- Database schema and connection utilities
- TypeScript types and project structure

🚧 **Remaining Tasks:**
- Complete KDS component migration
- API routes implementation
- WebSocket server setup
- Authentication layer
- Component styling conversion

## Architecture

The app is designed as a standalone Next.js application with:
- App Router for modern React patterns
- PostgreSQL with real-time notifications
- Socket.IO for live updates
- Comprehensive testing setup
- Component-driven development with Storybook