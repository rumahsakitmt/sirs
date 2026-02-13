# SIRS - Sistem Informasi Rumah Sakit

A comprehensive hospital information reporting system built with Next.js, Better Auth, and Drizzle ORM.

## Features

- **Multi-role Authentication** (Admin, Staff)
- **Dynamic Report Templates** - Create custom report formats with visual template builder
- **Room-based Access Control** - Staff can only access assigned departments
- **Daily & Monthly Reports** - Flexible reporting periods
- **Print-friendly Output** - Generate professional reports
- **Drag-and-drop Template Builder** - Easy visual template creation

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth
- **UI:** shadcn/ui, Tailwind CSS
- **Drag & Drop:** @dnd-kit

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (local or cloud)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd sirs
   bun install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your database credentials:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/sirs"
   BETTER_AUTH_SECRET="your-secret-key-min-32-characters-long"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

3. **Run database migrations**
   ```bash
   bun run db:migrate
   ```

4. **Seed the database with default templates**
   ```bash
   bun run db:seed
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Create an admin account**
   - Visit `http://localhost:3000/register`
   - Register a new account
   - Update the user's role to 'admin' in the database:
     ```sql
     UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
     ```

## Default Templates

The system comes with two pre-configured templates based on the images provided:

1. **LAPORAN SIRS RADIOLOGI** - Simple list format for radiology reports
2. **LAPORAN SIRS RAWAT INAP** - Complex matrix format for inpatient reports

## Template Builder

Admins can create new report templates using the visual template builder:

1. **Simple List** - For counting items (e.g., Radiology procedures)
   - Fixed columns: NO, Item, Value columns
   - Configurable row items
   - Support for multiple value columns

2. **Matrix/Grid** - For complex tables (e.g., Inpatient statistics)
   - Configurable rows (service types)
   - Column groups with nested sub-columns
   - Support for gender splits (P/L)

## User Roles

### Admin
- Create and manage report templates
- Manage rooms/departments
- Assign users to rooms
- View all reports
- Manage users

### Staff
- View assigned rooms
- Create and submit reports
- View own reports only
- Edit draft reports

## Project Structure

```
app/
├── (auth)/              # Authentication pages
│   ├── login/
│   └── register/
├── (dashboard)/         # Protected dashboard pages
│   ├── reports/         # Report management
│   ├── templates/       # Template builder
│   ├── rooms/           # Room management
│   ├── users/           # User management
│   └── settings/        # User settings
├── api/auth/            # Better Auth API routes
components/
├── template-builder/    # Template builder components
├── report-form/         # Report form components
└── dashboard/           # Dashboard layout components
lib/
├── actions.ts           # Server actions
├── auth.ts              # Better Auth configuration
├── db/                  # Database schema and config
│   ├── schema.ts
│   └── seed.ts
└── template-types.ts    # Template type definitions
```

## Database Schema

### Core Tables (Better Auth)
- `user` - User accounts with role field
- `session` - User sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens

### Application Tables
- `room` - Hospital departments/rooms
- `report_template` - Report template definitions
- `report` - Submitted reports
- `user_room` - User-to-room assignments

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Make sure to set up a PostgreSQL database (Vercel Postgres or external).

## License

MIT

## Support

For issues and feature requests, please use the GitHub issue tracker.
