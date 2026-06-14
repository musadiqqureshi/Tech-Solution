# Tech Solutions — Company Website

A modern, light-themed marketing site for **Tech Solutions**, built with Vite + React + Tailwind CSS and a signature "aura" gradient aesthetic.

- **CEO:** Muhammad Hassan Ajmal Hashmi
- **CFO:** Musaddiq Ahmed Qureshi
- **Services:** Software Development · Web Development · App Building · Content & Research Writing

## Local development

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build into /dist
npm run preview  # preview the production build
```

## Deploy to Vercel

This repo is Vercel-ready out of the box.

**Option A — Git import (recommended)**
1. Push this folder to a GitHub/GitLab repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Vite (Build: `npm run build`, Output: `dist`). Click **Deploy**.

**Option B — Vercel CLI**
```bash
npm i -g vercel
vercel        # follow prompts, then `vercel --prod`
```

## Editing content

All copy lives in [`src/data/content.js`](src/data/content.js) — services, stats, process steps, leadership team, and the "why us" points. Update text there without touching the components.

Contact email/phone are in `Contact.jsx` and `Footer.jsx`.

---

## Client Portal & AI Operations Assistant

The floating **Portal & AI** button opens a full client portal:

- **Client mode** — sign up / log in, create orders (with a live Development/Design/Hosting/Maintenance budget estimate), track status & spend, request meetings, view delivered project links, and chat with the AI assistant.
- **Admin mode** — revenue & profit analytics, approve/reject orders, mark projects delivered by pasting a **GitHub or Google Drive link**, confirm/cancel meetings, and view every client with lifetime spend.
- **AI assistant** — powered by **Google Gemini** (with a deterministic rule-based fallback). It scopes projects, estimates budgets, and drafts meetings, always asking for confirmation before creating a record.

### Architecture
- **Auth + database:** Supabase (Postgres + Row-Level Security). Clients only ever see their own rows; admins see all.
- **AI:** a single Vercel serverless function [`api/chat.js`](api/chat.js) that calls Gemini server-side (the key never reaches the browser).
- **Calendar:** simulated scheduling with conflict checks + one-click "Add to Google Calendar" links (no OAuth needed).

### One-time setup

1. **Supabase schema** — open your project's SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql). This creates `profiles`, `orders`, `meetings`, `messages`, the signup trigger, and all RLS policies.
2. **Environment variables** — copy `.env.example` to `.env.local` for local dev, and add the same in **Vercel → Project → Settings → Environment Variables** for production:

   | Variable | Where | Notes |
   |---|---|---|
   | `VITE_SUPABASE_URL` | frontend | your project URL |
   | `VITE_SUPABASE_ANON_KEY` | frontend | publishable/anon key — safe to expose, protected by RLS |
   | `SUPABASE_URL` | server | same URL (used by `/api/chat` to verify sessions) |
   | `SUPABASE_ANON_KEY` | server | same anon key |
   | `GEMINI_API_KEY` | **server only** | **never** prefix with `VITE_` — keeps it out of the browser bundle |

3. **Make yourself an admin** — sign up once in the portal, then run in Supabase SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

> ⚠️ **Secrets:** never commit real keys. `.env.local` is git-ignored. The Gemini key and any OAuth client secret belong only in environment variables. If a key is ever shared in plaintext, rotate it.

### Local note
The AI chat endpoint (`/api/chat`) is a Vercel serverless function — it runs on Vercel or via `vercel dev`, not under plain `vite dev`. Auth, dashboards, orders, and meetings work fully in `vite dev` (they talk directly to Supabase).
