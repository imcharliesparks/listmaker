# Local Development

Run apps with Bun:
- `bun dev` - all apps
- `bun dev:web` - web only
- `bun dev:web:server` - web + server
- `bun dev:native` - native only
- `bun dev:native:server` - native + server
- `bun dev:server` - server only

Notes
- Web app expects server at `SERVER_API_URL`.
- Native app uses Expo dev server; follow apps/native/README.md for details.
