# tRPC/API Agent

Domain
- tRPC router scaffolding and shared API contracts.

Use when
- Adding or evolving tRPC routers, procedures, or context wiring.

Key directories
- packages/api/src

Do
- Keep auth procedure behavior consistent with server-side session expectations.

Do not
- Treat tRPC as the primary API without coordinating with the Express server.
