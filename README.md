# Portfolio CMS

A full-stack personal portfolio website with a built-in content management system. The public-facing site is bilingual (English / Arabic with RTL support), theme-switchable, and fully driven by a MongoDB database. The admin dashboard lets you manage every section — projects, experience, skills, certifications, education, blog posts, and site settings — without touching code.

**Live demo:** [myportfolio-one-roan-25.vercel.app](https://myportfolio-one-roan-25.vercel.app/)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Database | MongoDB via Mongoose 8 |
| Styling | Tailwind CSS 3, shadcn/ui (Radix UI primitives) |
| Animation | Framer Motion 11 |
| Auth | JWT in HTTP-only cookie (jose), bcryptjs |
| File uploads | Vercel Blob (production) / local `public/uploads/` (dev) |
| Theme | next-themes (dark / light) |
| Icons | lucide-react |
| Deployment | Vercel |

---

## Key Features

- **Bilingual EN / AR** — every content field has English and Arabic variants; the UI switches between LTR and RTL layouts with a single toggle
- **CMS dashboard** — full CRUD for projects, work experience, skills, certifications, education, blog posts, profile, and site settings
- **Image & file uploads** — handled via Vercel Blob in production and the local filesystem in development
- **Dark / light theme** — persisted per-user and configurable from the admin panel
- **Skill category groups** — drag-and-drop ordering, grouped display on the public site
- **GitHub integration** — import public repos directly into the Projects section
- **Audit log** — admin actions are logged with timestamps
- **Responsive design** — mobile-first layout across all sections
- **ISR** — public portfolio page revalidates every hour (no full redeploys needed for content changes)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
git clone <repo-url>
cd MyPortfolio
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Random secret — generate with `openssl rand -base64 32` |
| `ADMIN_USERNAME` | Yes | Admin login username |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob token for file uploads |
| `NEXT_PUBLIC_APP_URL` | Production | Canonical public URL (e.g. `https://your-project.vercel.app`) |
| `GITHUB_TOKEN` | No | GitHub PAT for higher API rate limits on the GitHub import feature |
| `GITHUB_USERNAME` | No | GitHub username for the GitHub import feature |

### Run the Development Server

```bash
npm run dev
# http://localhost:3000
```

### Seed the Database (optional)

Inserts sample data for all sections (clears existing data first):

```bash
curl -X POST http://localhost:3000/api/seed
```

> Only works in development. Blocked in production.

---

## Project Structure

```
app/
  page.tsx                 # Public portfolio (server component, ISR)
  layout.tsx               # Root layout — fonts, providers
  globals.css              # CSS variables, dark/light tokens, utility classes
  admin/                   # CMS dashboard pages (client components)
  api/                     # REST API route handlers

components/
  sections/                # Public-facing portfolio sections (Hero, About, etc.)
  admin/                   # Admin UI components (Sidebar, FileUploadField, etc.)
  ui/                      # shadcn/ui base components
  Navbar.tsx
  Footer.tsx

contexts/
  LanguageContext.tsx       # EN/AR toggle, isRTL flag, t(en, ar) helper

lib/
  mongodb.ts               # Mongoose singleton
  auth.ts                  # JWT helpers (jose)
  apiAuth.ts               # requireAuth() for API route handlers
  utils.ts                 # cn(), slugify(), truncate(), formatDate()
  content/                 # Server-side data-access helpers

models/                    # Mongoose schemas
middleware.ts              # Edge JWT guard for /admin/**
types/                     # Shared TypeScript types
scripts/                   # One-off migration and admin utility scripts
```

---

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add all required environment variables in **Project Settings → Environment Variables**.
4. For file uploads, create a Blob store in **Storage → Blob** and copy the `BLOB_READ_WRITE_TOKEN` into your env vars.
5. Deploy — Vercel auto-detects Next.js and builds with zero configuration.

> Note: local filesystem uploads (`public/uploads/`) are not writable at runtime on Vercel. The upload route automatically uses Vercel Blob when the `VERCEL` environment variable is set.

---

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```
