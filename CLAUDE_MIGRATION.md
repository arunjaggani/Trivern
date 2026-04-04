# Trivern AI - Claude Code Migration Document
*Generated from exhaustive codebase analysis — 17 March 2026*

## 1. PROJECT OVERVIEW
- **Name:** Trivern AI - Revenue & Operations Infrastructure
- **Purpose:** A complete business operations platform operating as an AI Growth Consultant ("Zara"). It acts as a 24/7 autonomous receptionist that qualifies web/WhatsApp leads, schedules Google Calendar meetings automatically, syncs data to a PostgreSQL CRM, and manages follow-ups.
- **Target Users:** Service-based businesses (coaches, legal offices, consultants, clinics) adopting AI to eliminate operational friction and manual CRM data entry.
- **Current Completion Status:** ~85% complete. Core web, DB, and AI routing mechanisms are live.

## 2. COMPLETE TECH STACK
- **Frontend Framework:** Next.js `14.2.20` (App Router)
- **UI Libraries:** React `18.3.1`, Tailwind CSS `3.4.16`, Framer Motion `11.0.0`, Lucide React `0.460.0`
- **Database & ORM:** PostgreSQL (production on Hostinger) / SQLite (local dev `dev.db`), Prisma ORM `5.22.0`
- **Authentication:** NextAuth `4.24.13` with `bcryptjs`
- **API Integrations:** 
  - Google Calendar API (`googleapis` v171.4.0, Service Account auth)
  - Google Sheets API (Contact form proxy)
  - WhatsApp Business Cloud API (Meta)
  - OpenAI API (`openai` v6.25.0) heavily integrated into the Chatbot/AI logic.
- **Automation / Webhooks:** n8n (Local/VPS hosted)
- **Deployment Infrastructure:** PM2, NGINX, Ubuntu VPS, `deploy.sh` CI script.

## 3. DATABASE SCHEMA
Complete overview of `prisma/schema.prisma` models:
- `User`: Standard NextAuth model with `role` (ADMIN, MANAGER, STAFF) and `phone` (critical for identifying "Owner Mode" in WhatsApp).
- `Client`: Extensive CRM Lead object. Tracks `name`, `phone` (unique), `contact`, `businessType`, `decisionRole`. Includes a robust 5-pillar Lead Scoring Engine (`fitScore`, `painScore`, `intentScore`, `authorityScore`, `engagementScore`). Tracks `escalated` status for Founder follow-up.
- `Meeting`: Tracks scheduled calendar events linked to a `Client`. Includes `meetLink`, `calendarEventId`, `duration`, and post-meeting notes (`highlights`, `requirements`, `outcome`).
- `Conversation`: JSON storage of active chat arrays.
- `SiteConfig`: Key-value store for dynamic CMS (like `hero_title`, `services`).
- `BookingSettings`: Rules engine for availability (`startHour`, `endHour`, `bufferMinutes`, `maxPerDay`).
- `BlogPost`: Full markdown CMS for site content (`title`, `slug`, `content`, `published`).

## 4. ARCHITECTURE & SYSTEM DESIGN
- **High-level Architecture:** Next.js App Router serves as both the full-stack web UI and the central "Brain" API for N8N.
- **n8n Integration:** N8N acts entirely as a WhatsApp Webhook receiver and logic router. Instead of building business logic inside N8N nodes, N8N's AI Agent hits Next.js API Tool routes (`/api/n8n/get-available-slots`, `/api/n8n/save-lead`, `/api/n8n/emergency-cancel`). This centralizes all logic in TypeScript.
- **Zara AI Chatbot Architecture:** 
  - Defined heavily by `Zara_System_Prompt_v3.md`.
  - Distinguishes inherently between generic leads (Sales Mode) and Admin/Owner phones (Owner Mode).
  - Web chatbot relies on a custom Markdown renderer checking for `wa.me` links to generate dynamic WhatsApp transfer buttons safely.
- **WhatsApp Integration Flow.** (Two paths):
  - *Web Drop-off:* Next.js outputs a "Magic Link" (`wa.me`) pushing pre-filled URL encoded booking details to the client's WhatsApp app, bypassing outbound Meta Business API restrictions cleanly.
  - *Direct WhatsApp:* Nn8n workflow receives incoming text, triggers AI Agent node with Trivern Tool calls.

## 5. IMPLEMENTED FEATURES
Overview of `/app/dashboard/*` architecture:
- **Dashboard/Automation:** `agents` (Bot tracking), `booking-engine` (Logic configs), `calendar` (Master view), `emergency` (Over-ride switches), `logs` (API trails), `workflows` (Webhook health).
- **CRM:** `analytics` (Lead scoring graphs), `bookings` (Scheduled meets), `contacts` (Raw DB), `conversations` (Chat histories), `intelligence` (AI summaries), `leads` (Active pipelines), `pipeline` (Kanban).
- **Employee Management (`/dashboard/employee`):** Sandboxed view restricted by NextAuth middleware for STAFF roles.
- **Settings:** `integrations` (OAuth tokens), `notifications`, `profile`, `security`, `team`, `zara` (Prompt editor hooks).
- **Site (`/dashboard/site`):** CMS controlling the public static landing page text via `SiteConfig`.
- **Login/Auth (`/auth` & `middleware.ts`):** NextAuth credential provider, blocking `/dashboard` to unauthenticated sessions and `/dashboard/settings` to non-admins.

## 6. N8N WORKFLOWS
Located in `/n8n/`:
- `fix_workflow_v7.py` & `fix_workflow_v8.py`: Crucial Python architecture scripts. Because N8N's JSON schema is complex, these scripts programmatically inject the Next.js API endpoint URLs (`https://trivern.tech/api/n8n/...`) and the `Zara_System_Prompt` into raw exported N8N JSON files before they are re-imported into production. This is technically superior to modifying massive JSON trees by hand.
- `trivern-workflow-v3/v5/v7/v8-fixed.json`: The compiled historic and active N8N AI Agent workflows. They receive WhatsApp messages, initialize an OpenAI assistant, and execute up to 7 parallel Next.js API tools securely.
- `WhatsApp_Template_Sender_Workflow.json`: A standard webhook node that dispatches official Meta utility templates. (Currently bypassed natively by the Next.js web application via the Magic Link workaround to prevent Meta shadow-bans on +91 numbers).

## 7. KEY API INTEGRATIONS
- **Google Calendar API:** Authenticated via Service Account (`GOOGLE_PRIVATE_KEY` + `GOOGLE_CLIENT_EMAIL`). Uses `/lib/google-auth.ts`. Used heavily by `/api/chat/book-web`, pushing raw event inserts and returning Google Meet conference strings.
- **Google Sheets API:** Functional redundancy proxy for `/api/submit-contact`, pushing landing page form data directly to a master spreadsheet.
- **WhatsApp Business Cloud API:** Managed heavily by n8n nodes natively, and via `/lib/whatsapp.ts` for direct template pushing.
- **OpenAI:** Powers the `app/api/chat` streaming response endpoint for the frontend Zara widget.

## 8. CRITICAL IMPLEMENTATION DETAILS
- **Authentication Flow:** Leverages `NextAuth` Credentials. The magic happens in `middleware.ts`, checking `token.role`. Employees get sandboxed out of `settings/` and `automation/`.
- **Database Connection:** `prisma/schema.prisma` natively.
- **Environment Structure:** Relies on strict Google Private Key whitespace formatting in `.env`.
- **Error Handling Patterns:** All `/app/api/n8n/*` routes return strictly defined `{ success: boolean, message: string, data?: any }` to allow N8N HTTP nodes to gracefully map outputs without crashing the AI workflow.

## 9. CODING STANDARDS & PATTERNS
- **TypeScript:** Strict typing inside `/lib/types.ts`.
- **Component conventions:** Server components by default. Client components only where explicit interactivity is required (e.g., `ZaraChat.tsx` utilizing `"use client"`).
- **File Naming:** React components = `PascalCase.tsx`. API routes = `app/api/[folder]/route.ts`. Helper utilities = `kebab-case.ts`.
- **Safety Over-rides:** Widespread use of graceful degradation (e.g., if Calendar API fails, standard fallback URL `FALLBACK_MEET_LINK` is used immediately to preserve booking UX).

## 10. CONFIGURATION FILES
- `.env.local`: Tracks all master keys. (`NEXTAUTH_SECRET`, DB URL, Service Account Email/Private Key, WhataApp Tokens, Fallback URLs).
- `next.config.js`: Default export, no complex turbopack or rewrite rules.
- `tailwind.config.ts`: Native React framework utilizing root HSL CSS variables (`--primary`, `--background`) to govern Shadcn-UI style themes.
- `middleware.ts`: NextAuth routing barrier protecting `/dashboard/*`.
- `deploy.sh` / `ecosystem.config.js`: Production PM2 spin-up wrappers mapped to `npm run build`.

## 11. CURRENT STATE & NEXT STEPS
- **Fully Complete:** Zara Web Chatbot UI, Google Calendar Engine, Database Schema, Authentication, Next.js API Tool routes for n8n.
- **Partially Implemented:** The Dashboard UI visualizations. The folders exist `/app/dashboard/crm` but require heavy frontend graphing and data table connections to the Prisma backend.
- **Known Quirks:** The N8N WhatsApp Template webhook is explicitly disabled in `app/api/chat/book-web/route.ts` due to Meta dropping outbound messages for unverified Indian business numbers. The *Magic Link* logic generates a click-through URL instead.
- **Immediate Next Steps (Priority 1):** Building the Voice Receptionist / Phone AI integration (e.g., Twilio/Vapi).
- **Features Planned:** Connecting the Prisma Database metrics directly to the `/dashboard/crm/analytics` charts.

## 12. DEPLOYMENT & TESTING
- **Run Locally:** `npm run dev` (starts on `:3000`). SQLite is used locally.
- **Run Locally (n8n):** Start N8N locally pointing to `:5678` so local webhook tests hit correctly.
- **Deployment:** Executed on an Ubuntu VPS using PM2.
  `cd Trivern && rm -rf .next && npm run build && pm2 restart trivern`
- NGINX is configured mapping domain configs strictly to `localhost:3000`.

## 13. DEPENDENCIES & SETUP
- **Prerequisites:** `Node.js 18+`, `PostgreSQL` (hostinger), `pm2`.
- **Setup:**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   # For local testing, ensure dev.db is created
   ```
- **Configuration Validation:** Ensure `.env.local` accurately models `.env.example`. Test the connection by hitting the web chatbot and running a dummy booking loop observing real-time DB commits in Prisma Studio (`npx prisma studio`).
