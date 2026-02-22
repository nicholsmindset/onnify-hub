# OnnifyWorks CRM

A full-featured CRM system built for **OnnifyWorks Digital Marketing Agency** — managing clients, deliverables, invoices, tasks, content pipelines, and more across Singapore, Indonesia, and the US.

## Features

### Core CRM
- **Client Management** — Full CRUD with status tracking (Prospect, Onboarding, Active, Churned), plan tiers, contract dates, monthly value
- **Deliverables** — Kanban board with drag-and-drop status updates, service type tracking, priority levels, client approval workflow
- **Invoices** — Multi-currency (SGD, USD, IDR) invoice management with status tracking (Draft, Sent, Paid, Overdue)
- **Tasks** — Kanban board with drag-and-drop, category-based organization, client/deliverable linking
- **Content Pipeline** — 6-stage Kanban (Ideation → Draft → Review → Approved → Scheduled → Published) with content type and platform filters

### AI-Powered Features
- **AI Content Writer** — Generate blog posts, social media content, email campaigns, video scripts, case studies, and newsletters with tone control and quick prompt templates
- **AI Content Refiner** — Iteratively improve generated content with natural language instructions
- **AI Email Composer** — Draft client emails (Project Updates, Invoice Reminders, Deliverable Delivery, Onboarding Welcome, Upsell Proposals, etc.) with full client context injection

### Integrations
- **GoHighLevel Sync** — Connect and sync CRM data with GoHighLevel accounts
- **Notification Rules** — Configurable triggers for overdue deliverables, invoices, status changes, and upcoming due dates
- **Client Portal** — Grant clients secure portal access with email invitations and token-based authentication

### Administration
- **Dashboard** — KPI overview with key metrics
- **Reports** — Analytics and reporting
- **Portal Admin** — Manage client portal access, send/resend invitations
- **Role-Based Access** — Admin, Member, and Viewer roles via Supabase Auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| UI | shadcn/ui + Tailwind CSS + Radix UI |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| State | TanStack React Query |
| Routing | React Router v6 |
| AI | OpenRouter API (Claude Sonnet 4) |
| Drag & Drop | @dnd-kit |
| Forms | React Hook Form + Zod validation |
| Theming | next-themes (light/dark mode) |

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Setup

```bash
# Clone the repository
git clone https://github.com/nicholsmindset/onnify-hub.git
cd onnify-hub

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Edit `.env` with your credentials:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter AI (for AI content generation & email drafting)
VITE_OPENROUTER_API_KEY=your-openrouter-api-key
```

### Development

```bash
# Start dev server (runs on port 8080)
npm run dev

# Type check
npx tsc --noEmit

# Run tests (289 tests)
npx vitest run

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── ai/              # AI Content Writer, Email Composer
│   ├── forms/           # Client, Content, Deliverable, Invoice, Task forms
│   ├── layout/          # AppLayout, AppSidebar
│   └── ui/              # shadcn/ui components
├── contexts/            # AuthContext (Supabase Auth)
├── hooks/               # React Query hooks for all data operations
├── lib/                 # Supabase client, AI service, validations, utils
├── pages/               # All route pages
├── test/                # Test suite (289 tests)
└── types/               # TypeScript types + DB mapping functions
```

## Testing

The project includes a comprehensive test suite with **289 tests** across 20 test files:

| Category | Tests | Coverage |
|----------|-------|----------|
| Type Mapping Functions | 41 | All `map*()` and `to*Row()` functions |
| Validation Schemas | 89 | All 8 Zod schemas with valid/invalid/edge cases |
| Utility Functions | 9 | Helper utilities |
| Mock Data Integrity | 45 | Data structure validation |
| Custom Hooks | 62 | All 8 data hooks with Supabase mocking |
| Auth Context | 10 | Session management, role checking |
| Protected Route | 6 | Redirects, role-based access |
| Form Components | 26 | Rendering, defaults, loading, validation |

## License

Private — OnnifyWorks Digital Marketing Agency
