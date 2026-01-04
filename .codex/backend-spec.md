## Overview
- **Purpose:** Backend API for a Pinterest-style list application. Provides auth-backed CRUD for users, lists, and list items with URL metadata extraction.
- **Stack:** Node.js, Express, TypeScript, PostgreSQL (via `pg`), Clerk for authentication, Axios + Cheerio for metadata scraping, CORS configured by env.
- **Entry point:** `src/index.ts` (compiled output in `dist` for production). Health check at `/health`.

## Runtime & Environment
- **Port:** `PORT` (default `3001`).
- **Environment:** `NODE_ENV` (`development` or `production`).
- **CORS:** `CORS_ORIGIN` (comma-separated list of allowed origins). Requests without an Origin header are allowed. All API routes require `credentials: true`.
- **Database:** Either `DATABASE_URL` (preferred; enables SSL with `rejectUnauthorized: false` by default) or discrete `DB_HOST`, `DB_PORT` (default 5432), `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- **Clerk Auth:** `CLERK_SECRET_KEY` (required; from Clerk Dashboard), `CLERK_PUBLISHABLE_KEY` (optional; for frontend validation).
- **Security note:** `helmet` is currently not applied. README notes it should be enabled for production.

## Data Model (PostgreSQL)
- **users**
    - `id` `varchar(128)` **PK** (Clerk User ID, format: user_xxxxx)
    - `email` `varchar(255)` **unique, required**
    - `display_name` `varchar(255)`
    - `photo_url` `text`
    - `created_at` `timestamp` default `now()`
    - `updated_at` `timestamp` default `now()`
- **lists**
    - `id` `serial` **PK**
    - `user_id` `varchar(128)` **FK → users(id)** cascade delete
    - `title` `varchar(255)` **required**
    - `description` `text`
    - `is_public` `boolean` default `false`
    - `cover_image` `text`
    - `created_at` `timestamp` default `now()`
    - `updated_at` `timestamp` default `now()`
- **items**
    - `id` `serial` **PK**
    - `list_id` `integer` **FK → lists(id)** cascade delete
    - `url` `text` **required**
    - `title` `varchar(500)`
    - `description` `text`
    - `thumbnail_url` `text`
    - `source_type` `varchar(50)` (e.g., youtube, amazon, twitter, website)
    - `metadata` `jsonb` (platform-specific payload)
    - `position` `integer` default `0`
    - `created_at` `timestamp` default `now()`
    - `updated_at` `timestamp` default `now()`
- **Indexes:** `idx_lists_user_id`, `idx_items_list_id`, `idx_items_source_type`.
- **Triggers:** `update_*_updated_at` maintain `updated_at` on updates.

## Authentication & Authorization
- **Scheme:** Clerk session tokens (Bearer). Middleware verifies token via Clerk SDK, rejects missing/invalid tokens with `401`.
- **Scope:** All `/api/*` routes require authentication. `/health` is public.

## API Surface
- Base URL: `http://<host>:<PORT>`
- All request/response bodies are JSON unless noted.

### Health
- `GET /health` — Returns `{ status: "ok", timestamp: <iso> }`. No auth.

### Auth
- `POST /api/auth/sync`
    - **Auth:** Required (Bearer Clerk session token).
    - **Body:** `{ displayName?: string, photoUrl?: string }`.
    - **Behavior:** Upsert the authenticated Clerk user into `users` table (id from Clerk user ID; email extracted from Clerk user object).
    - **Responses:** `200 { user }` on success; `500` on failure.
- `GET /api/auth/me`
    - **Auth:** Required.
    - **Behavior:** Fetch current user row by Clerk user ID.
    - **Responses:** `200 { user }`; `404` if not found; `500` on error.

### Lists
- `POST /api/lists`
    - **Auth:** Required.
    - **Body:** `{ title: string, description?: string, isPublic?: boolean }`.
    - **Validation:** `title` must be non-empty, <=255 chars.
    - **Responses:** `201 { list }`; `400` on validation failure; `500` on error.
- `GET /api/lists`
    - **Auth:** Required.
    - **Behavior:** Return all lists for the authenticated user with `item_count`.
    - **Responses:** `200 { lists: [...] }`; `500` on error.
- `GET /api/lists/:id`
    - **Auth:** Required.
    - **Behavior:** Fetch a specific list owned by the user.
    - **Responses:** `200 { list }`; `404` if not found; `500` on error.
- `PUT /api/lists/:id`
    - **Auth:** Required.
    - **Body:** `{ title?: string, description?: string, isPublic?: boolean }`.
    - **Behavior:** Partial update; COALESCE keeps existing values.
    - **Responses:** `200 { list }`; `404` if not found; `500` on error.
- `DELETE /api/lists/:id`
    - **Auth:** Required.
    - **Behavior:** Delete a list owned by the user.
    - **Responses:** `200 { message }`; `404` if not found; `500` on error.

### Items
- `POST /api/items`
    - **Auth:** Required.
    - **Body:** `{ listId: number, url: string }`.
    - **Validation:** `listId` and `url` required; URL must parse with `new URL(url)`.
    - **Behavior:** Verifies the list belongs to the user; extracts metadata; inserts item at next position (`MAX(position)+1`).
    - **Responses:** `201 { item }`; `400` on validation; `404` if list missing; `500` on error.
- `GET /api/items/list/:listId`
    - **Auth:** Required.
    - **Behavior:** Fetch items for a list owned by the user, ordered by `position ASC`.
    - **Responses:** `200 { items: [...] }`; `404` if list missing; `500` on error.
- `DELETE /api/items/:id`
    - **Auth:** Required.
    - **Behavior:** Ensures item belongs to a list owned by the user, then deletes it.
    - **Responses:** `200 { message }`; `404` if not found; `500` on error.

## Metadata Extraction Service
- **Endpoint usage:** Implicit in `POST /api/items`; not exposed directly.
- **Detection:** Determines `source_type` from URL (youtube/amazon/twitter/instagram/website).
- **YouTube:** Uses oEmbed (`https://www.youtube.com/oembed?...`) to fetch title, author, thumbnail; falls back to Open Graph scraping.
- **Default scraping:** Fetches page with custom User-Agent; parses Open Graph/Twitter meta tags.
- **SSRF protections:** Blocks non-HTTP(S) protocols; rejects localhost/private/reserved IP ranges; resolves hostnames via DNS before requesting. Timeout 10s.

## Error Handling
- General errors bubble to an Express error handler:
    - In `development`: returns `{ error, stack }` with `500`.
    - In `production`: returns `{ error: 'Something went wrong!' }` with `500`.
- Auth middleware returns `401` on missing/invalid/expired token.

## CORS
- Allowed origins come from `CORS_ORIGIN` (comma-separated). Requests with no Origin are allowed (e.g., curl, mobile).
- Credentials enabled; clients should send cookies/credentials only if needed (currently tokens are header-based).

## Ancillary / Legacy Pieces
- Legacy sample routes under `src/routes/index.ts` (`/api/users/*` using a mock JSON datastore) are present but **not mounted** by `src/index.ts`. External services should use the `/api/auth`, `/api/lists`, `/api/items`, and `/health` endpoints above.

## Typical Flows
- **User sign-in sync:** Client obtains Clerk session token → `POST /api/auth/sync` to upsert user profile.
- **List CRUD:** Auth header with Clerk session token → create/list/get/update/delete via `/api/lists`.
- **Add item:** Auth header → `POST /api/items` with `listId` + `url` → service scrapes metadata and stores item.
