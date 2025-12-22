# Momentum - Photography Business Management

A Micro-SaaS platform designed specifically for Wedding and Portrait Photographers to streamline and centralize their post-booking administrative workflow.

## Features

- **Client Management**: Add, edit, and manage clients
- **Booking Management**: Create bookings with payment milestones
- **Contract Templates**: Create and manage contract templates with placeholders
- **Client Portal**: Secure token-based portal for clients to sign contracts and make payments
- **Payment Processing**: Stripe integration with 3.5% transaction fee
- **Email Notifications**: Automated notifications for contract signing and payments

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) with TypeScript
- **Database/Auth**: Supabase (PostgreSQL + Authentication)
- **Payments**: Stripe
- **UI**: Tailwind CSS + shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `NEXT_PUBLIC_APP_URL`: Your application URL (e.g., http://localhost:3000)

4. Set up the database:
   - Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
momentum/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── portal/            # Public client portal
│   └── api/               # API routes
├── components/               # React components
│   ├── auth/              # Authentication components
│   ├── bookings/          # Booking components
│   ├── clients/           # Client components
│   ├── contracts/         # Contract components
│   ├── dashboard/         # Dashboard components
│   ├── layout/            # Layout components
│   ├── portal/             # Portal components
│   └── ui/                # shadcn/ui components
├── contexts/              # React contexts
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase clients
│   ├── stripe/            # Stripe utilities
│   └── utils.ts           # General utilities
├── types/                 # TypeScript types
└── supabase/              # Database migrations
```

## Key Features

### Authentication
- Email/password authentication via Supabase
- Protected routes with middleware
- Automatic photographer profile creation on signup

### Client Management
- CRUD operations for clients
- Search and filter functionality
- Client detail pages with booking history

### Booking Management
- Create bookings with service type, date, and price
- Payment milestones builder (percentage or fixed amount)
- Contract template selection
- Automatic portal token generation

### Contract Templates
- Create and manage contract templates
- Support for placeholders: `{{client_name}}`, `{{event_date}}`, `{{total_price}}`, `{{service_type}}`
- Set default templates

### Client Portal
- Token-based secure access (no authentication required)
- Contract viewing and signing
- Payment milestone display and processing
- Timeline submission form

### Payment Processing
- Stripe integration
- 3.5% transaction fee automatically added
- Payment intent creation
- Webhook handling for payment confirmation

## Database Schema

The application uses the following main tables:
- `photographers`: Photographer profiles
- `clients`: Client information
- `bookings`: Booking records with payment milestones
- `contract_templates`: Contract templates

All tables have Row Level Security (RLS) policies to ensure data isolation.

## Security

- Row Level Security (RLS) on all database tables
- Protected API routes with session verification
- Secure portal token generation (UUID)
- Input validation and sanitization

## License

MIT





