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
