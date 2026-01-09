# Release Checklist

Preflight
- Ensure `.env` values are set for target environment.
- Run `bun lint` and `bun type-check`.
- Run `bun build` from repo root.

Deployment notes
- Web app needs `SERVER_API_URL` configured.
- Server requires Clerk secrets and DB connectivity.
