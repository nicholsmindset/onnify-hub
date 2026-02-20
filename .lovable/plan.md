

# ONNIFY WORKS — Internal CMS & Deliverables Management Tool

## What We're Building
A standalone internal operations hub for ONNIFY WORKS to manage clients, deliverables, invoices, and team tasks across Singapore, Indonesia, and the USA — replacing scattered spreadsheets with one clean web app.

---

## Module 1: Client Registry
- Central database of all active and prospective clients
- Fields: Client ID (auto-generated with market prefix like OW-SG-001), Company Name, Market (SG/ID/US), Industry, Plan Tier (Starter/Growth/Pro), GoHighLevel Sub-Account URL, Status (Prospect → Onboarding → Active → Churned), Primary Contact, Contract Dates, Monthly Value
- Table view with search, sort, and filter by market/status/industry
- Add/edit client form with validation
- **Client 360 View**: Clicking a client shows all their related deliverables, invoices, and tasks in one page

## Module 2: Deliverables Tracker
- Every client deliverable is logged, assigned, and tracked
- Fields: auto-generated ID, linked client, service type (SEO/Voice AI/CRM/Paid Media/Content/Automation/Strategy), deliverable name, description, assigned to (Robert/Lina/Freelancer), priority, status (Not Started → In Progress → Review → Delivered → Approved), due date, delivery date, file link, client approved flag
- **Kanban board view** by status (drag & drop)
- **Calendar view** by due date
- Filters by market, service type, and assignee
- Visual indicators for overdue items (red highlight)

## Module 3: Invoice & Revenue Tracker
- Simple financial tracking per client per month
- Fields: auto-generated invoice ID (INV-2026-001), linked client, month, amount, currency (SGD/USD/IDR), services billed, invoice file link, status (Draft → Sent → Paid → Overdue), payment date
- Table view with filters by status, client, and month
- Revenue summary showing monthly totals by market

## Module 4: Team Task Board
- Internal task management for Robert, Lina, and freelancers
- Fields: auto-generated task ID, task name, optional linked client, optional linked deliverable, assigned to, category (Admin/Strategy/Content/Tech/Sales/Ops), status (To Do → In Progress → Done → Blocked), due date, notes
- **Kanban board view** by status
- Filter by assignee and category
- "Due this week" quick filter

## Home Dashboard
- Total active clients by market (SG / ID / US)
- Deliverables due this week (count + list)
- Overdue items highlighted in red
- Revenue this month (SGD equivalent)
- Tasks assigned to each team member
- Quick-access links to each module

## Navigation & Layout
- Sidebar navigation with icons for: Dashboard, Clients, Deliverables, Invoices, Tasks
- Market filter (SG/ID/US/All) accessible globally
- Responsive design for desktop and mobile
- Clean, professional dark/light UI with ONNIFY branding

## Database (Lovable Cloud / Supabase)
- Tables: clients, deliverables, invoices, tasks
- Relationships: clients → deliverables, clients → invoices, clients → tasks, deliverables → tasks
- Auto-generated IDs with market-prefixed format

## What's Deferred (Future Phases)
- User authentication and role-based access
- Email notifications and automation workflows
- Content Pipeline module
- GoHighLevel Pipeline Sync module
- Client Reporting Dashboard module
- Client portal for external access

