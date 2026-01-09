# Backend API Spec (Express)

Base URL
- Server runs at `http://localhost:3001` by default.
- All routes are JSON unless noted.

Auth
- Uses Clerk with `Authorization: Bearer <session-token>`.
- Protected routes return 401 when token is missing or invalid.

Health
- `GET /health`
  - Response: `{ "status": "ok" }`

Auth
- `POST /api/auth/sync`
  - Body: `{ "displayName"?: string, "photoUrl"?: string }`
  - Response: `{ "user": User }`
  - Notes: Fetches email from Clerk and upserts user row.
- `GET /api/auth/me`
  - Response: `{ "user": User }`
  - 404 when user not found.

Lists
- `POST /api/lists`
  - Body: `{ "title": string, "description"?: string, "isPublic"?: boolean }`
  - Response: `{ "list": List }`
- `GET /api/lists`
  - Response: `{ "lists": (List & { item_count: string })[] }`
  - Notes: item_count is returned as a string from SQL aggregate.
- `GET /api/lists/:id`
  - Response: `{ "list": List }`
- `PUT /api/lists/:id`
  - Body: `{ "title"?: string, "description"?: string, "isPublic"?: boolean }`
  - Response: `{ "list": List }`
- `DELETE /api/lists/:id`
  - Response: `{ "message": "List deleted successfully" }`

Items
- `POST /api/items`
  - Body: `{ "listId": number, "url": string }`
  - Response: `{ "item": Item }`
  - Notes: URL metadata is scraped before insert.
- `GET /api/items/list/:listId`
  - Response: `{ "items": Item[] }`
- `DELETE /api/items/:id`
  - Response: `{ "message": "Item deleted successfully" }`

Data shapes (from Prisma schema)
- User: `id`, `email`, `display_name`, `photo_url`, `created_at`, `updated_at`
- List: `id`, `user_id`, `title`, `description`, `is_public`, `cover_image`, `created_at`, `updated_at`
- Item: `id`, `list_id`, `url`, `title`, `description`, `thumbnail_url`, `source_type`, `metadata`, `position`, `created_at`, `updated_at`

Metadata scraping
- Service: `apps/server/src/services/urlMetadataService.ts`
- Guards: DNS lookup + IP range blocking for loopback, private, link-local, etc.
- YouTube: Uses oEmbed when possible, falls back to OpenGraph.
