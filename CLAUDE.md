# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

**First-time setup:**
```bash
npm install
# Copy .env.example to .env.local and fill in values
# Seed the DB: POST http://localhost:3000/api/seed  (dev only)
```

## Architecture

### Tech Stack
- **Next.js 15** App Router, TypeScript
- **MongoDB + Mongoose 8** — all content stored as documents
- **Tailwind CSS 3** with `darkMode: ['class']` for shadcn/ui compatibility
- **shadcn/ui** — manually implemented in `components/ui/` (no CLI available)
- **Framer Motion** — scroll-reveal animations and hover effects
- **next-themes** — dark/light toggle via `ThemeProvider`
- **Custom LanguageContext** — EN/AR toggle with `t(en, ar)` helper, persisted to localStorage
- **jose** — JWT in HTTP-only cookie `portfolio_admin_token` (Edge-compatible)

### Directory Layout

```
app/
  layout.tsx              # Root layout: Providers + Inter/Cairo fonts
  page.tsx                # Public portfolio (server component, ISR revalidate=3600)
  globals.css             # CSS variables (light/dark), .glass, .gradient-text utilities
  admin/
    AdminShell.tsx        # Client wrapper — sidebar only outside /admin/login
    layout.tsx            # Admin layout (delegates to AdminShell)
    login/page.tsx
    page.tsx              # Dashboard with stats
    profile/page.tsx      # Profile singleton (hero, about, contact, social)
    projects/page.tsx     # CRUD with tabbed form
    experience/page.tsx
    skills/page.tsx       # With level progress bars + category filter
    certifications/page.tsx
    education/page.tsx
    blog/page.tsx
    github/page.tsx       # Fetch GitHub repos and import as projects
    settings/page.tsx     # SEO, theme defaults, analytics, footer
    messages/page.tsx
  api/
    auth/{login,logout,me}/route.ts
    profile/route.ts            # GET + PUT singleton
    settings/route.ts           # GET + PUT singleton
    projects/route.ts + [id]/
    experience/route.ts + [id]/
    skills/route.ts + [id]/
    certifications/route.ts + [id]/
    education/route.ts + [id]/
    blog/route.ts + [id]/
    upload/route.ts             # File upload to public/uploads/
    github/route.ts             # Proxy to GitHub API
    contact/route.ts
    messages/route.ts
    seed/route.ts               # Dev-only: clears + re-seeds all data

components/
  Navbar.tsx              # Sticky with dark/light + language toggles
  Footer.tsx
  ScrollToTop.tsx
  SectionWrapper.tsx      # Framer Motion scroll-reveal wrapper
  sections/
    Hero.tsx              # DB-driven, animated
    About.tsx             # With stat cards
    Skills.tsx            # Tabbed by category + level progress bars
    Experience.tsx        # Timeline layout
    Projects.tsx          # Filterable card grid
    Certifications.tsx    # Featured + others
    EducationSection.tsx
    Contact.tsx           # With contact form
  providers/Providers.tsx # ThemeProvider + LanguageProvider + Toaster
  admin/Sidebar.tsx       # Navigation with grouped sections
  ui/                     # shadcn/ui components (button, card, badge, dialog, etc.)

contexts/
  LanguageContext.tsx     # language, toggleLanguage, isRTL, t(en, ar)
hooks/
  use-toast.ts            # Toast state manager
lib/
  mongodb.ts              # Mongoose singleton (exports default + named connectDB)
  auth.ts                 # createToken / verifyToken (jose)
  apiAuth.ts              # requireAuth() for route handlers
  utils.ts                # cn(), slugify(), truncate(), formatDate()
models/                   # Mongoose schemas
  Profile.ts              # Singleton — all hero/about/contact/social fields in EN+AR
  SiteSettings.ts         # Singleton — SEO, theme, sections, analytics
  Project.ts              # Expanded: slug, bilingual fields, category enum, tools[], links
  Experience.ts           # With AR fields, tools[], bulletsEn[], bulletsAr[]
  Skill.ts                # SkillCategory × SkillLevel with SKILL_LEVEL_VALUES map
  Certification.ts        # With nameAr, descriptionEn/Ar, badge, featured
  Education.ts            # New: degree/AR, institution/AR, dates, description/AR
  BlogPost.ts             # New: bilingual, slug, tags, published
  Message.ts              # Contact form submissions
middleware.ts             # Edge JWT guard — protects /admin/** except /admin/login
```

### Authentication Flow
- Credentials in `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
- Login → JWT in HTTP-only cookie `portfolio_admin_token` (7-day expiry)
- `middleware.ts` (Edge) guards `/admin/**`; API write routes call `requireAuth(req)` from `lib/apiAuth.ts`

### Bilingual Content Pattern
All content models store bilingual fields as `fieldEn` / `fieldAr`. The `LanguageProvider` wraps the app in a `<div dir="rtl/ltr">` and exposes `t(en, ar)` — components use this to render the appropriate string. Arabic font (Cairo) is applied via `[dir="rtl"]` CSS selector in `globals.css`.

### Singleton Documents (Profile, SiteSettings)
These use `findOneAndUpdate({}, data, { upsert: true, new: true })` to ensure only one document exists. GET routes create an empty document on first access.

### Public Portfolio Data Flow
`app/page.tsx` is a server component with ISR (`revalidate = 3600`). It calls `connectDB()` and queries models directly. Results serialized with `JSON.parse(JSON.stringify(...))` to strip Mongoose ObjectIds.

### Admin Pages
All client components. Fetch via `useEffect → REST API`. Forms use local state + modal pattern. Admin queries use `?admin=true` to bypass `visible: true` filters.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | `openssl rand -base64 32` |
| `ADMIN_USERNAME` | Yes | Admin login (default: `admin`) |
| `ADMIN_PASSWORD` | Yes | Admin password — change before deploying |
| `GITHUB_TOKEN` | No | GitHub personal access token for higher API rate limits |
| `GITHUB_USERNAME` | No | GitHub username for repo fetch (default: `hashemili`) |
| `NEXT_PUBLIC_APP_URL` | No | Public URL for absolute links |

## Key Patterns

- **Mongoose singleton**: `lib/mongodb.ts` caches on `global._mongooseCache`
- **Next.js 15 async params**: Always `const { id } = await params` in route handlers
- **ObjectId serialization**: `JSON.parse(JSON.stringify(result.lean()))` before passing to React
- **Import style**: `connectDB` exported as both default and named from `lib/mongodb.ts`
- **Skill levels**: `SKILL_LEVEL_VALUES` in `models/Skill.ts` maps level names to numeric % values
- **Project slugs**: Auto-generated via `slugify(titleEn)` if not provided

## Seeding

```bash
curl -X POST http://localhost:3000/api/seed
```

Clears and re-inserts: Profile, SiteSettings, Education, Experience, Skills (31), Certifications (4), Projects (5). Blocked in production.
