# Portfolio-with-CMS Blueprint

A complete specification for rebuilding this portfolio + headless CMS system from scratch. Everything here is derived from reading the actual source code, not guessed.

---

## Table of Contents

1. [Stack & Setup](#1-stack--setup)
2. [Data Model](#2-data-model)
3. [Admin ↔ Public Pattern](#3-admin--public-pattern)
4. [Key Features to Replicate](#4-key-features-to-replicate)
5. [Build Order](#5-build-order)
6. [Master Prompt](#6-master-prompt)

---

## 1. Stack & Setup

### Framework & Language
- **Next.js 15** (App Router, `^15.1.0`) with **React 19**
- **TypeScript 5.7**
- No Pages Router — every route is under `app/`

### Styling
- **Tailwind CSS 3** (`^3.4.17`) with `darkMode: ['class']`
- shadcn/ui component primitives (Radix UI `@radix-ui/react-label`, `react-slot`, `react-toast`) — manually placed in `components/ui/`, **no CLI**
- **CSS custom properties** drive every colour token. Tailwind maps `background`, `foreground`, `primary`, `muted`, `border`, etc. to `hsl(var(--TOKEN))`. The variables are defined in `globals.css` under `:root` (light) and `.dark` (dark).
- **Framer Motion 11** for scroll-reveal and hover effects; wrapped in `<MotionConfig reducedMotion="user">`.
- **next-themes 0.4** for dark/light toggle via `attribute="class"` on `<html>`.
- Custom `LanguageContext` (EN/AR) wraps content in `<div dir="rtl/ltr">`.
- **Fonts**: Inter (`--font-inter`, latin) + Cairo (`--font-cairo`, arabic + latin) loaded via `next/font/google`.

### Utility CSS classes (globals.css)
| Class | Purpose |
|---|---|
| `.glass` | Frosted-glass card: `backdrop-filter: blur(14px)` + semi-transparent border |
| `.admin-surface` | Heavier glass for admin panels |
| `.admin-card` | Lift-on-hover card for admin grids |
| `.admin-control` | Input/select/textarea styling for all admin forms |
| `.admin-primary-btn` | Green action button |
| `.admin-secondary-btn` | Ghost action button |
| `.gradient-text` | Falls back to `hsl(var(--foreground))` — extend per brand |
| `.glow` / `.glow-sm` | Coloured box-shadow accent |
| `.shimmer` | Loading skeleton animation |
| `.themed-section` | Receives spacing variants from `data-section-spacing` attribute |

### Design Token System (Theme Presets)
The `ThemeSettings` document controls five presentation axes, all applied as HTML `data-*` attributes and CSS custom properties injected as inline `style` on `<html>`:

| Axis | Field | Values |
|---|---|---|
| Colour | `colorTheme` | `default` · `emerald-pro` · `blue-tech` · `purple-ai` · `cyan-data` · `amber-minimal` · `monochrome` · `neon-dark` |
| Border radius | `radius` | `soft` (0.75rem) · `rounded` (1rem) · `sharp` (0.5rem) |
| Card style | `cardStyle` | `premium` · `glass` · `minimal` |
| Typography scale | `typographyScale` | `compact` · `balanced` · `large` |
| Section spacing | `sectionSpacing` | `tight` · `normal` · `relaxed` |

Each colour preset defines a `light` and `dark` set of CSS HSL token values injected as `--theme-light-*` / `--theme-dark-*` CSS variables on `<html>`. The active mode's variables are then aliased to `--background`, `--primary`, etc. in `globals.css`.

### Database
- **MongoDB** via **Mongoose 8** (`^8.9.0`)
- Connection singleton cached on `global._mongooseCache` (survives hot reload in dev)
- All models use `(models.ModelName as Model<T>) || model<T>(...)` guard to prevent re-registration

### File Storage
- **Production**: Vercel Blob (`@vercel/blob ^2.4.0`) — `put()` / `list()` / `del()`
- **Development**: writes to `public/uploads/<subdir>/` on disk
- Detection: `if (process.env.VERCEL)` branch in `app/api/upload/route.ts` and `app/api/media/route.ts`

### Authentication
- **bcryptjs** (`^2.4.3`) hashes passwords (cost factor 12)
- **jose** (`^5.9.6`) signs/verifies HS256 JWTs (Edge-compatible — no Node.js crypto)
- Cookie name: `portfolio_admin_token`, HTTP-only, `sameSite: strict`, 7-day expiry
- Credentials stored in MongoDB `AdminCredential` collection (not env vars)

### Package summary
```json
"@dnd-kit/core": "^6.3.1",
"@dnd-kit/sortable": "^10.0.0",
"@dnd-kit/utilities": "^3.2.2",
"@vercel/blob": "^2.4.0",
"bcryptjs": "^2.4.3",
"framer-motion": "^11.15.0",
"jose": "^5.9.6",
"lucide-react": "^0.474.0",
"mongoose": "^8.9.0",
"next": "^15.1.0",
"next-themes": "^0.4.4",
"server-only": "^0.0.1",
"tailwind-merge": "^2.6.0",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1"
```

### Environment Variables

| Variable | Required | Where used | What it does |
|---|---|---|---|
| `MONGODB_URI` | **Yes** | `lib/mongodb.ts` | MongoDB Atlas (or local) connection string |
| `JWT_SECRET` | **Yes (prod)** | `lib/env.ts` → `lib/auth.ts` | Signs/verifies admin session JWTs. Generate: `openssl rand -base64 32`. Falls back to a hardcoded dev string if absent in development. |
| `NEXT_PUBLIC_APP_URL` | Recommended | `lib/seo.ts` | Canonical site URL used in metadata, OG images, sitemap, robots. Falls back to the hardcoded Vercel deploy URL. |
| `BLOB_READ_WRITE_TOKEN` | Vercel only | `@vercel/blob` (auto) | Auto-injected by Vercel when a Blob store is linked in Project Settings. Required for file uploads in production. |
| `GITHUB_USERNAME` | Optional | `app/api/github/route.ts` | GitHub username for the repo-import feature. Returns 400 if missing when the endpoint is called. |
| `GITHUB_TOKEN` | Optional | `app/api/github/route.ts` | Personal access token to raise GitHub API rate limit from 60 to 5000 req/hr. |

### First-time setup
```bash
npm install
cp .env.example .env.local   # fill MONGODB_URI + JWT_SECRET
npm run dev
# Create admin account in MongoDB manually (see Section 4 → Auth)
# Or POST http://localhost:3000/api/seed  (dev only, requires auth cookie)
```

---

## 2. Data Model

### Complete Model List
1. `Profile` — singleton
2. `SiteSettings` — singleton
3. `ThemeSettings` — singleton (keyed by `singletonKey: 'theme'`)
4. `AdminCredential`
5. `AuditLog`
6. `Project`
7. `CategoryGroup`
8. `SkillCategory`
9. `Skill`
10. `Experience`
11. `Education`
12. `Certification`
13. `Message`

---

### Profile *(singleton)*
One document per portfolio. All hero, about, contact, and social fields live here.

| Field | Type | Notes |
|---|---|---|
| `nameEn` / `nameAr` | String | Full name in both languages |
| `headlineEn` / `headlineAr` | String | Hero tagline |
| `titleEn` / `titleAr` | String | Job title |
| `subtitleEn` / `subtitleAr` | String | Secondary hero text |
| `profileImage` | String | URL |
| `profilePhotoPosition` | String | CSS object-position hint (`center`, `top`, etc.) |
| `showProfilePhoto` | Boolean | Toggle photo visibility |
| `cvFile` | String | URL to PDF CV |
| `summaryEn` / `summaryAr` | String | Short bio used in meta/SEO |
| `aboutEn` / `aboutAr` | String | Long about section body |
| `aboutImage` | String | URL |
| `email` / `phone` | String | Contact details |
| `locationEn` / `locationAr` | String | City, country |
| `github` / `linkedin` / `kaggle` / `whatsapp` / `twitter` | String | Social URLs |
| `ctaHireMeEn` / `ctaHireMeAr` | String | Button label |
| `ctaDownloadCvEn` / `ctaDownloadCvAr` | String | Button label |
| `availableForWork` | Boolean | Controls availability badge |
| `availabilityLabelEn` / `availabilityLabelAr` | String | Badge text |
| `highlightsEn` / `highlightsAr` | String[] | Bullet points in About section |

**Singleton pattern**: `Profile.findOneAndUpdate({}, data, { upsert: true, new: true })`

---

### SiteSettings *(singleton)*
Global SEO, section visibility/ordering, analytics, display mode.

| Field | Type | Notes |
|---|---|---|
| `siteTitleEn` / `siteTitleAr` | String | `<title>` tag |
| `defaultMetaTitleEn` / `defaultMetaTitleAr` | String | Full page title with role |
| `siteNameEn` / `siteNameAr` | String | OG site name |
| `defaultMetaDescriptionEn` / `defaultMetaDescriptionAr` | String | Meta description |
| `siteDescriptionEn` / `siteDescriptionAr` | String | Fallback description |
| `siteKeywords` | String[] | Global keyword array |
| `ogTitleEn` / `ogTitleAr` | String | Override OG title |
| `ogDescriptionEn` / `ogDescriptionAr` | String | Override OG description |
| `ogImage` | String | Custom OG image URL; falls back to `/opengraph-image` route |
| `favicon` | String | URL; applied to all icon types |
| `primaryColor` / `accentColor` | String | Legacy hex fields (replaced by ThemeSettings presets) |
| `defaultTheme` | `'dark'` \| `'light'` | Passed to ThemeProvider |
| `defaultLanguage` | `'en'` \| `'ar'` | Passed to LanguageProvider |
| `sections` | ISectionSetting[] | Array of `{ key, labelEn, labelAr, visible, order }` |
| `analytics.googleAnalyticsId` | String | GA4 measurement ID |
| `analytics.enabled` | Boolean | Injects gtag scripts when true |
| `maintenanceMode` | Boolean | Shows maintenance page instead of portfolio |
| `projectsDisplayMode` | `'selected'` \| `'grouped'` | Controls Projects section render mode |
| `footerTextEn` / `footerTextAr` | String | Copyright line |

**Section keys**: `hero` · `about` · `skills` · `experience` · `education` · `projects` · `certifications` · `contact`

---

### ThemeSettings *(singleton)*

| Field | Type | Enum values |
|---|---|---|
| `singletonKey` | String | Always `'theme'` (immutable, unique) |
| `colorTheme` | ColorThemePreset | `default` · `emerald-pro` · `blue-tech` · `purple-ai` · `cyan-data` · `amber-minimal` · `monochrome` · `neon-dark` |
| `radius` | RadiusPreset | `soft` · `rounded` · `sharp` |
| `cardStyle` | CardStylePreset | `premium` · `glass` · `minimal` |
| `typographyScale` | TypographyPreset | `compact` · `balanced` · `large` |
| `sectionSpacing` | SectionSpacingPreset | `tight` · `normal` · `relaxed` |

Applied by `buildThemeStyle(theme)` → inline `style` on `<html>` + `data-*` attributes for CSS selectors.

---

### AdminCredential

| Field | Type | Notes |
|---|---|---|
| `username` | String | Unique, trimmed |
| `passwordHash` | String | bcrypt hash (cost 12) |
| `failedLoginAttempts` | Number | Resets after successful login |
| `lastFailedLoginAt` | Date \| null | Used for 10-min rolling window |
| `lockUntil` | Date \| null | Account locked until this time |

Lockout: 5 failures within 10 min → locked for 15 min. Returns HTTP 429 with `Retry-After` header.
Migration: on first authenticated login after upgrade, plaintext `password` field is auto-hashed to `passwordHash`.

---

### AuditLog

| Field | Type | Notes |
|---|---|---|
| `action` | String | `login` · `create` · `update` · `delete` · `password_change` · `credential_update` |
| `entityType` | String | `auth` · `profile` · `project` · `skill` · etc. |
| `entityId` | String | MongoDB ObjectId as string |
| `actorUsername` | String | From JWT payload |
| `ipAddress` | String | From `x-forwarded-for` or `x-real-ip` |
| `userAgent` | String | Truncated to 512 chars |
| `success` | Boolean | |
| `details` | Mixed | Arbitrary sanitized payload |

Written by `logAuditEvent()` from `lib/audit-log.ts` — called from every mutating API route. Never throws; logs to console on failure.

---

### Project

| Field | Type | Notes |
|---|---|---|
| `titleEn` / `titleAr` | String | required / default '' |
| `slug` | String | Unique; auto-generated via `slugify(titleEn)` |
| `shortSummaryEn` / `shortSummaryAr` | String | Card subtitle |
| `executiveSummaryEn` / `executiveSummaryAr` | String | Intro paragraph |
| `category` | String | Free string; category groups are separate documents |
| `problemStatementEn/Ar` / `businessObjectiveEn/Ar` / `datasetOverviewEn/Ar` / `technicalApproachEn/Ar` / `resultsEn/Ar` | String | Structured project sections |
| `modelUsed` / `evaluationMetrics` | String | |
| `tools` | String[] | Tag list |
| `githubLink` / `liveDemoLink` / `kaggleLink` | String | Validated as absolute URLs |
| `thumbnail` / `ogImage` | String | Absolute URL or root-relative `/uploads/` path |
| `screenshots` | String[] | Same validation |
| `metaTitle` / `metaDescription` | String | Per-project SEO |
| `metaKeywords` | String[] | |
| `featured` | Boolean | Used for "featured" badge |
| `featuredOnHomepage` | Boolean | Shown in "selected" display mode |
| `homepageCategoryOrder` | Number | Sort within selected display |
| `visible` | Boolean | Public API filters `visible: true` |
| `displayOrder` | Number | Sort order |

Index: `{ category: 1, visible: 1 }`

---

### CategoryGroup
Maps to project filter tabs. Not embedded in Project — linked by matching `category` string to `name`.

| Field | Type | Notes |
|---|---|---|
| `name` | String | Display name (e.g. `"Machine Learning"`) |
| `slug` | String | Unique, lowercase, URL-safe |
| `description` | String | |
| `visible` | Boolean | |
| `sortOrder` | Number | Drag-and-drop ordering |

Index: `{ visible: 1, sortOrder: 1 }`

---

### SkillCategory
Controls skill tabs in the Skills section.

| Field | Type | Notes |
|---|---|---|
| `nameEn` / `nameAr` | String | required, max 120 |
| `slug` | String | Unique, lowercase — **Skills link to this slug via `category` field** |
| `descriptionEn` / `descriptionAr` | String | max 500 |
| `icon` | String | Lucide icon name (e.g. `'Brain'`) |
| `visible` | Boolean | |
| `sortOrder` | Number | Drag-and-drop ordering |

Index: `{ visible: 1, sortOrder: 1 }`

---

### Skill
One skill card. Linked to category by slug string.

| Field | Type | Notes |
|---|---|---|
| `nameEn` / `nameAr` | String | |
| `category` | String | Must match a `SkillCategory.slug` |
| `level` | `'Beginner'` \| `'Intermediate'` \| `'Advanced'` \| `'Expert'` | |
| `icon` | String | Lucide icon name (optional) |
| `visible` | Boolean | |
| `order` | Number | Within-category sort |

---

### Experience

| Field | Type | Notes |
|---|---|---|
| `titleEn` / `titleAr` | String | Job title |
| `companyEn` / `companyAr` | String | |
| `durationEn` / `durationAr` | String | Free text, e.g. `"2024–2025 · 9 Months"` |
| `bulletsEn` / `bulletsAr` | String[] | Responsibility bullets |
| `tools` | String[] | Technologies used |
| `metaTitle` / `metaDescription` / `metaKeywords` / `ogImage` | String / String[] | Per-entry SEO (optional) |
| `current` | Boolean | Marks active role |
| `visible` | Boolean | |
| `order` | Number | Timeline sort |

---

### Education

| Field | Type | Notes |
|---|---|---|
| `degreeEn` / `degreeAr` | String | |
| `institutionEn` / `institutionAr` | String | |
| `fieldOfStudyEn` / `fieldOfStudyAr` | String | |
| `startDate` / `endDate` | String | Free text (e.g. `"2024"`) |
| `descriptionEn` / `descriptionAr` | String | |
| `grade` | String | |
| `logo` | String | Institution logo URL |
| `visible` | Boolean | |
| `order` | Number | |

---

### Certification

| Field | Type | Notes |
|---|---|---|
| `nameEn` / `nameAr` | String | |
| `issuer` | String | |
| `date` | String | e.g. `"2025-02"` |
| `descriptionEn` / `descriptionAr` | String | |
| `credentialUrl` | String | Link to verify |
| `badge` | String | Badge image URL |
| `featured` | Boolean | Shown prominently |
| `visible` | Boolean | |
| `order` | Number | |

---

### Message
Contact form submissions. Read-only for public, admin can mark as read.

| Field | Type | Notes |
|---|---|---|
| `name` | String | max 100 |
| `email` | String | lowercase, max 254 |
| `subject` | String | max 200 |
| `message` | String | max 5000 |
| `read` | Boolean | default false |

Indexes: `{ createdAt: -1 }` and `{ read: 1, createdAt: -1 }`

---

### Relationship Summary

```
SiteSettings.sections[]      → controls which sections are visible/ordered on public page
CategoryGroup.name           ↔  Project.category  (loose string match for filtering)
SkillCategory.slug           ↔  Skill.category    (slug-based link)
Profile                      → direct props to Hero, About, Contact sections
ThemeSettings                → CSS custom properties on <html> (via inline style)
AdminCredential              → single admin user (no multi-user support)
AuditLog                     → append-only event log (no FK constraints)
```

---

## 3. Admin ↔ Public Pattern

### URL Mapping

| Admin page | Public section | Model(s) |
|---|---|---|
| `/admin/profile` | `#hero`, `#about`, `#contact` | `Profile` |
| `/admin/projects` | `#projects` | `Project` |
| `/admin/category-groups` | Project filter tabs | `CategoryGroup` |
| `/admin/skills` | `#skills` (cards) | `Skill` |
| `/admin/skill-categories` | `#skills` (tabs) | `SkillCategory` |
| `/admin/experience` | `#experience` | `Experience` |
| `/admin/education` | `#education` | `Education` |
| `/admin/certifications` | `#certifications` | `Certification` |
| `/admin/github` | Import → `#projects` | `Project` (write) |
| `/admin/messages` | (contact form submissions) | `Message` |
| `/admin/media` | (image picker for all forms) | Vercel Blob / `public/uploads/` |
| `/admin/theme` | Entire site appearance | `ThemeSettings` |
| `/admin/settings` | SEO, sections, analytics | `SiteSettings` |

### API Route Conventions

**Public GET** (no auth):
```
GET /api/projects           → { visible: true }, sorted by displayOrder
GET /api/skills             → { visible: true }, sorted by order
GET /api/certifications     → { visible: true }, sorted by order
GET /api/education          → { visible: true }, sorted by order
GET /api/experience         → { visible: true }, sorted by order
GET /api/skill-categories   → { visible: true }, sorted by sortOrder
GET /api/category-groups    → { visible: true }, sorted by sortOrder
GET /api/profile            → (public) uses getProfile() content helper
```

**Admin GET** (auth required via `?admin=true`):
```
GET /api/projects?admin=true  → all documents, no visibility filter
```
The pattern: check `searchParams.get('admin') === 'true'` → call `requireAuth(request)` → set `query = {}` instead of `{ visible: true }`.

**Protected mutations** (always require auth):
```
POST   /api/projects
PUT    /api/projects/[id]
DELETE /api/projects/[id]
PUT    /api/profile
PUT    /api/settings
PUT    /api/theme-settings
PUT    /api/skill-categories/reorder   ← array of IDs → sets sortOrder = index
PUT    /api/certifications/reorder
PUT    /api/education/reorder
PUT    /api/category-groups/reorder
GET    /api/media?subdir=...
DELETE /api/media
POST   /api/upload
GET    /api/github                    ← proxies GitHub API
GET/PUT /api/auth/credentials
```

**requireAuth pattern** (copy exactly):
```typescript
// At the top of every protected handler:
const authError = await requireAuth(request);
if (authError) return authError;   // returns 401 if no valid JWT cookie
```

### Revalidation
Every mutating API route calls `revalidatePath('/')` and `revalidatePath('/', 'layout')` after writing to the database. This triggers ISR revalidation of the public portfolio page (which has `export const revalidate = 3600`).

### Drag-and-drop Ordering Pattern
1. Model has `order` (Skill, Experience, Education, Certification) or `sortOrder` (SkillCategory, CategoryGroup) numeric field.
2. Admin page uses `@dnd-kit/sortable` for the drag handle UI.
3. On drop, client sends `PUT /api/<resource>/reorder` with `{ ids: string[] }`.
4. Server does `Promise.all(ids.map((id, index) => Model.findByIdAndUpdate(id, { sortOrder: index })))`.
5. Returns updated list; client replaces local state.

### Modal / Form Pattern
All admin CRUD pages follow this structure:
- Server component or `'use client'` with `useEffect` → `fetch('/api/resource?admin=true')` on mount
- Local `useState` for items list
- "Add" button opens a modal (`dialog` element or custom `<Dialog>` component)
- Form uses `admin-control` class on all inputs/selects/textareas
- Submit calls `POST` (create) or `PUT /api/resource/[id]` (update)
- On success: close modal + optimistically update local state list
- Delete calls `DELETE /api/resource/[id]` with confirmation

### Bilingual Content Pattern
- Every editable text field has two variants: `fieldEn` and `fieldAr`
- Components call `t(item.fieldEn, item.fieldAr)` from `useLanguage()`
- `t(en, ar)` returns `language === 'ar' ? ar : en`
- Admin forms show both language inputs side-by-side
- Arabic font (Cairo) applied via `[dir="rtl"] * { font-family: var(--font-cairo) }`
- `LanguageProvider` wraps children in `<div dir="rtl|ltr" lang="en|ar">`
- Language persisted in `localStorage` key `portfolio-lang`
- Initial language server-read from `SiteSettings.defaultLanguage` → passed as prop to `<Providers>`

### Singleton Document Pattern
For Profile, SiteSettings, ThemeSettings — only one document ever exists:
```typescript
// GET: create on first access
const doc = await Model.findOne();
if (!doc) return Model.create(defaults);
return doc;

// PUT: upsert
await Model.findOneAndUpdate({}, data, { upsert: true, new: true });
```

### DB-Driven with Hardcoded Fallback Pattern
Public page (`app/page.tsx`) wraps all queries in `try/catch`. On failure, returns empty arrays/nulls. Components receive props that may be empty — always render gracefully without data. Section visibility also falls back to `DEFAULT_SECTIONS` array if `settings.sections` is empty.

---

## 4. Key Features to Replicate

### Admin Authentication + Middleware

**Middleware** (`middleware.ts`):
```typescript
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const token = req.cookies.get('portfolio_admin_token')?.value;
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url));
    const payload = await verifyToken(token);  // jose jwtVerify
    if (!payload) {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.set('portfolio_admin_token', '', { maxAge: 0 });
      return res;
    }
    return NextResponse.next();
  }
}
export const config = { matcher: ['/admin', '/admin/:path*'] };
```

**Creating the first admin account**: manually insert into MongoDB:
```javascript
db.admincredentials.insertOne({
  username: "admin",
  passwordHash: "<bcrypt hash of your password>",
  failedLoginAttempts: 0,
  lastFailedLoginAt: null,
  lockUntil: null
})
```
Or use the helper script: `npm run reset-password` (reads `scripts/reset-admin-password.cjs`).

**Security hardening in `lib/security.ts`**:
- `sanitizeString()` — strips control characters, trims, max-length caps
- `sanitizeInput()` — recursively sanitizes any object/array/string tree
- `readSanitizedJsonObject()` — parse request body + sanitize in one call
- `sanitizeStringArray()` — filter + sanitize string arrays
- All API route handlers use these instead of raw `req.json()`

### Image Upload to Vercel Blob

`POST /api/upload` (multipart/form-data, field `file`):
- Validates MIME type: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`
- Max size: 10MB
- Optional `subdir` field (e.g. `"projects"`, `"profiles"`) → organises into Blob prefix or local subfolder
- Returns `{ url, filename }` — store the `url` in the model field

```typescript
if (process.env.VERCEL) {
  const blob = await put(`${safeSubdir}/${filename}`, file, { access: 'public' });
  return { url: blob.url };
}
// dev: write to public/uploads/
```

### Media Library

`GET /api/media?subdir=general` — lists all files in a Blob prefix (prod) or local folder (dev).
`DELETE /api/media` with `{ url }` — deletes from Blob or filesystem.

Admin page `/admin/media` renders a grid with thumbnail previews + delete buttons. The upload widget appears on every content form (profile image, project thumbnail, certification badge, etc.) — opens the media library in a modal, or accepts a direct URL paste.

### GitHub Repo Import

`GET /api/github` (auth required):
- Reads `GITHUB_USERNAME` env var
- Fetches `GET /users/{username}/repos?per_page=100&sort=updated&type=public` with `Accept: application/vnd.github+json`
- Returns simplified shape: `id, name, full_name, description, html_url, homepage, language, topics, stargazers_count, forks_count, updated_at, fork`
- Response cached 5 min via `next: { revalidate: 300 }`

Admin page `/admin/github` renders the list; clicking "Import" pre-fills the project create form with GitHub data. User edits bilingual fields and saves.

### SEO Setup

**`lib/seo.ts` — `buildMetadata(settings, pageSeo?)`**: constructs the full Next.js `Metadata` object from `SiteSettings`. Falls back through: page-level → global settings → hardcoded defaults. `metadataBase` always set to `siteUrl()` to suppress Next.js OG URL warnings.

**`app/opengraph-image.tsx`**: Next.js route that returns a 1200×630 `ImageResponse`. Used as automatic OG image fallback when no custom image is configured. Customise the JSX with the client's name/initials/brand colour.

**`app/sitemap.ts`**: returns single entry for homepage with `changeFrequency: 'weekly'`.

**`app/robots.ts`**: allows `/`, disallows `/admin` and `/api`.

**Favicon**: stored as URL in `SiteSettings.favicon`; applied to `icons.icon`, `icons.shortcut`, and `icons.apple` in the `Metadata` object.

**Google Analytics**: `SiteSettings.analytics.googleAnalyticsId` + `analytics.enabled` → injects `<Script>` tags in `app/layout.tsx`.

### Accessibility Patterns
- Skip-to-content link in `app/layout.tsx`: `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>`
- Main content wrapped in `<main id="main-content">`
- `<MotionConfig reducedMotion="user">` respects OS reduced-motion preference
- `suppressHydrationWarning` on `<html>` and `<body>` (needed because theme class is set client-side)
- `next/image` used for all content images (automatic WebP, lazy loading, sizes)

### Seed Route for Bootstrapping

`POST /api/seed` (auth required, blocked in production via `NODE_ENV` check):
1. Deletes all documents from: Project, Experience, Skill, Certification, Education, Profile, SiteSettings, ThemeSettings, CategoryGroup, SkillCategory
2. Re-creates with sample data
3. Returns a summary of inserted counts

**For a blank template**: keep the route but replace sample data with minimal placeholder documents so the dashboard shows structure but no real content.

---

## 5. Build Order

Follow this sequence when building from an empty Next.js 15 project.

### Phase 1 — Project Bootstrap
1. `npx create-next-app@latest --typescript --tailwind --app --no-src-dir`
2. Install all dependencies from the package list above
3. Configure `tailwind.config.ts`: add `darkMode: ['class']`, map CSS variable tokens, add custom keyframes/animations, add container settings, add font variables
4. Write `app/globals.css`: define all CSS custom property tokens under `:root` and `.dark`, add `.glass`, `.admin-*`, `.gradient-text`, `.glow`, `.shimmer` utility classes, add scrollbar styles, add `[dir="rtl"]` font rule
5. Create `.env.local` with `MONGODB_URI` and `JWT_SECRET`

### Phase 2 — Database Layer
6. Write `lib/mongodb.ts` — Mongoose singleton with `global._mongooseCache`
7. Write all 13 models in `models/`: Profile, SiteSettings, ThemeSettings, AdminCredential, AuditLog, Project, CategoryGroup, SkillCategory, Skill, Experience, Education, Certification, Message
8. Write `lib/utils.ts` — `cn()`, `slugify()`
9. Write `lib/security.ts` — `sanitizeString`, `sanitizeInput`, `readSanitizedJsonObject`, `sanitizeStringArray`, `getRequestIp`, `getUserAgent`
10. Write `lib/env.ts` — `getJwtSecret()` with dev fallback
11. Write `lib/auth.ts` — `createToken`, `verifyToken`, cookie helpers using `jose`
12. Write `lib/apiAuth.ts` — `requireAuth(req)`, `getAuthContext(req)`
13. Write `lib/admin-credentials.ts` — `authenticateAdminCredential`, `updateAdminCredential` with lockout logic
14. Write `lib/audit-log.ts` — `logAuditEvent()`

### Phase 3 — API Routes
15. Auth routes: `app/api/auth/login/`, `logout/`, `me/`, `credentials/`
16. Write `middleware.ts` — Edge JWT guard for `/admin/**`
17. Content API routes (each needs GET public + GET?admin=true + POST + PUT [id] + DELETE [id]):
    - `/api/profile` (GET + PUT only — singleton)
    - `/api/projects`
    - `/api/skills`
    - `/api/skill-categories` + `/reorder`
    - `/api/category-groups` + `/reorder`
    - `/api/experience`
    - `/api/education` + `/reorder`
    - `/api/certifications` + `/reorder`
18. Write `/api/settings` (GET + PUT — singleton)
19. Write `/api/theme-settings` (GET + PUT — singleton)
20. Write `/api/upload` — dual Vercel Blob / local filesystem handler
21. Write `/api/media` — GET list + DELETE
22. Write `/api/contact` — public POST with field validation and caps
23. Write `/api/messages` — GET (admin) + PUT [id] (mark read) + DELETE [id]
24. Write `/api/github` — proxies GitHub API
25. Write `/api/seed` — dev-only data seed, blocked in production

### Phase 4 — Admin Shell
26. Create `app/admin/layout.tsx` → delegates to `AdminShell.tsx`
27. `app/admin/AdminShell.tsx` — client wrapper; renders `<Sidebar>` + mobile header; conditionally hides on `/admin/login`
28. `components/admin/Sidebar.tsx` — grouped nav with logout handler
29. `app/admin/login/page.tsx` — login form → `POST /api/auth/login`
30. `app/admin/page.tsx` — dashboard with stat cards + recent messages (server component, `dynamic = 'force-dynamic'`)
31. Admin content pages (all client components): profile, projects, category-groups, skills, skill-categories, experience, education, certifications, github, messages, media, theme, settings

### Phase 5 — Public Portfolio
32. Write `contexts/LanguageContext.tsx` — `LanguageProvider`, `useLanguage`, `t(en, ar)`
33. Write `components/providers/Providers.tsx` — compose ThemeProvider + LanguageProvider + Toaster + MotionConfig
34. Write `app/layout.tsx` — load Inter + Cairo fonts, call `buildMetadata`, call `buildThemeStyle`, inject GA scripts, add skip-to-content link
35. Write `lib/seo.ts` — `buildMetadata`, `siteUrl`
36. Write `lib/content/theme-settings.ts` — `getThemeSettings`, `saveThemeSettings`, `buildThemeStyle`, full `COLOR_THEME_STYLES` preset map
37. Write public section components (each receives data as props from `app/page.tsx`):
    - `components/sections/Hero.tsx`
    - `components/sections/About.tsx`
    - `components/sections/Skills.tsx`
    - `components/sections/Experience.tsx`
    - `components/sections/EducationSection.tsx`
    - `components/sections/Projects.tsx`
    - `components/sections/Certifications.tsx`
    - `components/sections/Contact.tsx`
38. Write `app/page.tsx` — server component, `revalidate = 3600`, parallel data fetch, section ordering from settings, maintenance mode check
39. Write `components/Navbar.tsx`, `Footer.tsx`, `ScrollToTop.tsx`

### Phase 6 — SEO & Integrations
40. Write `app/opengraph-image.tsx` — 1200×630 `ImageResponse` with brand styling
41. Write `app/sitemap.ts`
42. Write `app/robots.ts`
43. Write `scripts/reset-admin-password.cjs` — CLI tool to set/reset admin password

### Phase 7 — Deployment
44. Push to GitHub
45. Create Vercel project, link GitHub repo
46. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `GITHUB_USERNAME`, `GITHUB_TOKEN`
47. Add a Vercel Blob store in Project Settings → `BLOB_READ_WRITE_TOKEN` is auto-injected
48. Deploy; visit `/admin` to seed and fill content via the dashboard

---

## 6. Master Prompt

Copy and paste this into a fresh Claude Code session in an empty repository to build the entire system.

---

```
You are building a full-stack portfolio website with a built-in headless CMS from scratch.
The target is a Next.js 15 App Router project (TypeScript) deployed to Vercel, with MongoDB
as the database. Follow the spec below exactly. Do not skip steps or add features not listed.

─── STACK ───────────────────────────────────────────────────────────────────────
- Next.js 15 App Router, React 19, TypeScript 5.7
- Tailwind CSS 3 with darkMode: ['class']
- shadcn/ui primitives (Radix UI) manually placed in components/ui/ — no CLI
- Framer Motion 11 (MotionConfig reducedMotion="user")
- next-themes 0.4 (attribute="class")
- MongoDB + Mongoose 8
- bcryptjs for password hashing (cost 12)
- jose for JWT (HS256, Edge-compatible, 7-day expiry)
- @vercel/blob for file storage in production (public/uploads/ in dev)
- @dnd-kit/sortable for drag-and-drop reordering
- lucide-react for icons

─── ENVIRONMENT VARIABLES ───────────────────────────────────────────────────────
Required: MONGODB_URI, JWT_SECRET
Recommended: NEXT_PUBLIC_APP_URL (canonical site URL)
Optional: GITHUB_USERNAME, GITHUB_TOKEN, BLOB_READ_WRITE_TOKEN (auto in Vercel)
JWT_SECRET falls back to a hardcoded dev string in non-production only.

─── DATABASE MODELS (13 total) ──────────────────────────────────────────────────
All models use the (models.Name || model('Name', Schema)) guard for HMR safety.
All server-only models import 'server-only'.

1. Profile (singleton) — nameEn/Ar, headlineEn/Ar, titleEn/Ar, subtitleEn/Ar,
   profileImage, showProfilePhoto, profilePhotoPosition, cvFile, summaryEn/Ar,
   aboutEn/Ar, aboutImage, email, phone, locationEn/Ar, github, linkedin, kaggle,
   whatsapp, twitter, ctaHireMeEn/Ar, ctaDownloadCvEn/Ar, availableForWork,
   availabilityLabelEn/Ar, highlightsEn[]/Ar[]

2. SiteSettings (singleton) — siteTitleEn/Ar, defaultMetaTitleEn/Ar, siteNameEn/Ar,
   defaultMetaDescriptionEn/Ar, siteDescriptionEn/Ar, siteKeywords[], ogTitleEn/Ar,
   ogDescriptionEn/Ar, ogImage, favicon, defaultTheme ('dark'|'light'),
   defaultLanguage ('en'|'ar'), sections[{key,labelEn,labelAr,visible,order}],
   analytics{googleAnalyticsId,enabled}, maintenanceMode, projectsDisplayMode
   ('selected'|'grouped'), footerTextEn/Ar

3. ThemeSettings (singleton, singletonKey:'theme') — colorTheme (enum: default,
   emerald-pro, blue-tech, purple-ai, cyan-data, amber-minimal, monochrome, neon-dark),
   radius (soft|rounded|sharp), cardStyle (premium|glass|minimal),
   typographyScale (compact|balanced|large), sectionSpacing (tight|normal|relaxed)

4. AdminCredential — username (unique), passwordHash (bcrypt), failedLoginAttempts,
   lastFailedLoginAt, lockUntil. Lockout: 5 failures in 10 min → locked 15 min.

5. AuditLog — action, entityType, entityId, actorUsername, ipAddress, userAgent,
   success, details (Mixed). Written on every auth event and mutation.

6. Project — titleEn/Ar, slug (unique, auto-generated), shortSummaryEn/Ar,
   executiveSummaryEn/Ar, category (string), problemStatementEn/Ar,
   businessObjectiveEn/Ar, datasetOverviewEn/Ar, technicalApproachEn/Ar,
   resultsEn/Ar, modelUsed, evaluationMetrics, tools[], githubLink, liveDemoLink,
   kaggleLink (validated absolute URLs), thumbnail, ogImage, screenshots[]
   (absolute URL or /uploads/ path), metaTitle, metaDescription, metaKeywords[],
   featured, featuredOnHomepage, homepageCategoryOrder, visible, displayOrder

7. CategoryGroup — name, slug (unique lowercase), description, visible, sortOrder.
   Links to Project.category by string match.

8. SkillCategory — nameEn/Ar, slug (unique lowercase), descriptionEn/Ar, icon
   (Lucide name), visible, sortOrder. Index: {visible:1, sortOrder:1}

9. Skill — nameEn/Ar, category (= SkillCategory.slug), level (Beginner|Intermediate|
   Advanced|Expert), icon, visible, order

10. Experience — titleEn/Ar, companyEn/Ar, durationEn/Ar, bulletsEn[]/Ar[], tools[],
    metaTitle, metaDescription, metaKeywords[], ogImage, current, visible, order

11. Education — degreeEn/Ar, institutionEn/Ar, fieldOfStudyEn/Ar, startDate, endDate,
    descriptionEn/Ar, grade, logo, visible, order

12. Certification — nameEn/Ar, issuer, date, descriptionEn/Ar, credentialUrl, badge,
    featured, visible, order

13. Message — name (max 100), email (lowercase, max 254), subject (max 200),
    message (max 5000), read (default false). Indexes: createdAt:-1 and read+createdAt.

─── AUTHENTICATION ───────────────────────────────────────────────────────────────
- lib/auth.ts: createToken(payload), verifyToken(token) using jose SignJWT/jwtVerify
- Cookie: portfolio_admin_token, httpOnly, sameSite:strict, secure in production
- lib/apiAuth.ts: requireAuth(req) returns 401 NextResponse or null
- middleware.ts (Edge): guard /admin/**, skip /admin/login, clear invalid cookie
- lib/admin-credentials.ts: authenticateAdminCredential with lockout,
  updateAdminCredential for password/username change
- lib/security.ts: sanitizeString, sanitizeInput (recursive), readSanitizedJsonObject,
  sanitizeStringArray, getRequestIp, getUserAgent
- All mutating API handlers call requireAuth first; use readSanitizedJsonObject for body

─── API ROUTES ───────────────────────────────────────────────────────────────────
Every collection-based resource follows this pattern:
  GET    /api/<resource>              → public, visible:true filter
  GET    /api/<resource>?admin=true   → all docs, requireAuth
  POST   /api/<resource>              → create, requireAuth
  PUT    /api/<resource>/[id]         → update, requireAuth
  DELETE /api/<resource>/[id]         → delete, requireAuth
  PUT    /api/<resource>/reorder      → { ids: string[] } → sets order=index, requireAuth

Singleton routes (profile, settings, theme-settings): GET (requireAuth) + PUT (requireAuth)
Special routes:
  POST /api/auth/login        → public (rate-limited by lockout)
  POST /api/auth/logout       → clears cookie
  GET  /api/auth/me           → returns username if authenticated
  GET/PUT /api/auth/credentials → manage admin username/password
  POST /api/upload            → multipart, 10MB max, jpg/png/webp/gif/pdf
  GET/DELETE /api/media       → list and delete uploaded files
  POST /api/contact           → public, field length validation
  GET/PUT/DELETE /api/messages → admin inbox management
  GET  /api/github            → proxy GitHub user repos API
  POST /api/seed              → dev only (NODE_ENV check), clears+reseeds all data

After every mutation: revalidatePath('/') + revalidatePath('/', 'layout')
Log every mutation with logAuditEvent() from lib/audit-log.ts

─── ADMIN SHELL ──────────────────────────────────────────────────────────────────
app/admin/layout.tsx → renders AdminShell.tsx (client component)
AdminShell: shows Sidebar + mobile header except on /admin/login
Sidebar groups: Overview (Dashboard), Content (Profile/Projects/CategoryGroups/
Experience/Skills/SkillCategories/Certifications/Education), Integrations
(GitHub Import/Messages/Media Library), Configuration (Theme & Branding/Settings)
All admin content pages are client components. Pattern:
  useEffect → fetch('/api/resource?admin=true') → setState
  Add button → modal with admin-control form fields
  Submit → POST or PUT → close modal + update local state
  Delete → DELETE with window.confirm

─── BILINGUAL PATTERN ────────────────────────────────────────────────────────────
contexts/LanguageContext.tsx: LanguageProvider wraps children in <div dir="rtl|ltr">
useLanguage() returns { language, toggleLanguage, isRTL, t(en, ar) }
t(en, ar) returns ar when language === 'ar', else en
Admin forms show both language inputs. Public components call t().
[dir="rtl"] * uses --font-cairo. Language persisted in localStorage 'portfolio-lang'.
Initial language from SiteSettings.defaultLanguage → prop to <Providers>.

─── THEME SYSTEM ─────────────────────────────────────────────────────────────────
lib/content/theme-settings.ts: buildThemeStyle(theme) returns CSSProperties with
--theme-light-* and --theme-dark-* CSS custom property overrides per preset.
Applied as inline style on <html> in app/layout.tsx.
CSS in globals.css reads --theme-light-background (etc.) via var() fallback chain.
HTML data attributes: data-color-theme, data-card-style, data-radius-style,
data-typography-scale, data-section-spacing.
CSS uses attribute selectors: html[data-radius-style="soft"] { --radius: 0.75rem }

─── PUBLIC PAGE ──────────────────────────────────────────────────────────────────
app/page.tsx: server component, export const revalidate = 3600
Fetches all data in parallel with Promise.all from Mongoose directly.
Serializes with JSON.parse(JSON.stringify(result.lean())).
Renders sections in order from SiteSettings.sections[].order.
Falls back to DEFAULT_SECTIONS if settings empty.
Maintenance mode: render a single glass panel instead of portfolio.
Passes data as props to each section component.

─── SEO ──────────────────────────────────────────────────────────────────────────
lib/seo.ts: buildMetadata(settings, pageSeo?) builds full Next.js Metadata.
Sets metadataBase to siteUrl() (NEXT_PUBLIC_APP_URL or hardcoded fallback).
Falls back: page-level → settings global → hardcoded defaults.
OG images: custom ogImage URL or /opengraph-image route fallback.
app/opengraph-image.tsx: ImageResponse 1200×630, brand gradient background.
app/sitemap.ts: single homepage entry.
app/robots.ts: allow /, disallow /admin + /api.
Favicon from SiteSettings.favicon → icons.icon + shortcut + apple.
GA: inject Script tags in layout when analytics.enabled + googleAnalyticsId set.

─── ACCESSIBILITY ────────────────────────────────────────────────────────────────
Skip-to-content link at top of layout: sr-only, visible on focus.
<main id="main-content"> wraps all public sections.
MotionConfig reducedMotion="user" on all animations.
suppressHydrationWarning on <html> and <body>.

─── SECTIONS ORDERING ────────────────────────────────────────────────────────────
Default section keys and order: hero(1) about(2) skills(3) experience(4)
education(5) projects(6) certifications(7) contact(8).
Each section has a scroll-margin-top: 72px for navbar offset.
Navbar receives sections array without 'hero'.

─── FILE UPLOAD DUAL MODE ────────────────────────────────────────────────────────
if (process.env.VERCEL) → use @vercel/blob put(), list(), del()
else → fs/promises writeFile to public/uploads/<subdir>/
Both modes return { url, filename }.
Media library opens as modal in every form that has an image field.

─── SEED ROUTE ───────────────────────────────────────────────────────────────────
POST /api/seed: blocked in production. Requires auth.
Deletes all content collections. Re-creates with empty placeholder documents
(or sample data for demo). Returns { success, seeded: { counts } }.
Use this to bootstrap a fresh installation.

─── BUILD ORDER ──────────────────────────────────────────────────────────────────
Phase 1: Bootstrap (create-next-app, install deps, tailwind config, globals.css, .env)
Phase 2: Database layer (mongodb.ts, all 13 models, lib/utils, lib/security, lib/auth,
         lib/apiAuth, lib/admin-credentials, lib/audit-log)
Phase 3: API routes (auth, middleware, all content routes, upload, media, contact,
         messages, github, seed)
Phase 4: Admin shell (layout, AdminShell, Sidebar, login, dashboard, all content pages)
Phase 5: Public portfolio (LanguageContext, Providers, layout, seo, theme-settings,
         all section components, page.tsx, Navbar, Footer, ScrollToTop)
Phase 6: SEO & integrations (opengraph-image, sitemap, robots, reset-password script)
Phase 7: Deploy to Vercel (env vars, Blob store, seed via dashboard)

─── CONTENT PLACEHOLDERS ────────────────────────────────────────────────────────
Replace all personal data with generic placeholders:
- Name: "Your Name"
- Title: "Your Professional Title"
- About: "Write your about text here."
- Skills: create 3 categories (Technical, Tools, Soft Skills) with 2 placeholder skills each
- Projects: create 2 placeholder projects with slug "project-one" and "project-two"
- Experience: 1 placeholder entry
- Education: 1 placeholder entry
- Certifications: 1 placeholder entry
- SiteSettings: siteNameEn="Portfolio", defaultTheme="dark", defaultLanguage="en"
- Admin credential: username="admin", password="changeme123" (force change on first login)

Build the entire system now, following the phases in order. Ask no clarifying questions —
all decisions are specified above. When a detail is unspecified (e.g. exact UI layout of
a specific admin form), use the patterns described (admin-control classes, modal pattern,
bilingual inputs side-by-side) and good judgment.
```

---

*Blueprint generated from reading the actual source code of the reference implementation.*
