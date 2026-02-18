# SIRS - Sistem Informasi Rumah Sakit

A web application for hospitals to create, manage, and submit reports.

## What is this?

SIRS is a reporting system designed for hospitals. Staff use it to fill out daily/monthly reports, while admins manage templates, rooms, and users.

## Features

- **Multi-role system** - Admin and Staff access
- **Dynamic templates** - Drag-and-drop builder for report formats  
- **Room assignments** - Staff only see their assigned departments
- **Daily & Monthly reports** - Flexible reporting periods
- **Print-friendly** - Generate professional reports

## Tech Stack

- **Next.js 16** + TypeScript
- **PostgreSQL** + Drizzle ORM
- **Better Auth** - Session-based authentication
- **tRPC** + React Query - API layer
- **Tailwind CSS** + shadcn/ui

## Quick Start

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and auth secrets

# Run migrations
bun run db:migrate

# Seed database
bun run db:seed

# Start development
bun run dev
```

Visit `http://localhost:3000`

## Creating an Admin

1. Register at `/register`
2. Run in database:
   ```sql
   UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
   ```

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Dashboard, templates, rooms, users, all reports |
| **Staff** | Submit reports via main page, view assigned rooms only |

## Scripts

- `bun run dev` - Development server
- `bun run build` - Production build
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed default data

## License

MIT
