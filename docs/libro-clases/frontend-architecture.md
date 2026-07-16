# Libro de Clases Digital — Frontend Architecture

## Routing
- No React Router. Manual `ViewType` string state with `switch` in `App.tsx`.
- URL synced via `window.history.pushState` for `/libro-clases`.
- New ViewType: `'libro-clases'` and `'libro-clases-session'`.

## Auth & Permissions
- `useAuth()` returns `user` with `institutionalRole`, `permissions[]`.
- `classbookPermissions.ts` reads these to derive `canViewClassbook`, `canCreateSession`, etc.

## API Client
- All calls via `api.get/post/put/patch` from `src/services/apiClient.ts`.
- Handles 401 globally (clears token, dispatches event).
- Returns `{ ok, data }` or throws.

## Layout
- Reuses `AppShell` with sidebar + topbar + mobile bottom nav.
- Classbook adds its own internal sidebar (ClassbookSidebar) inside the main content area.

## Design System
- Tailwind v4 with violet/fuchsia brand colors.
- Reuse: `Button`, `Card`, `Badge`, `EmptyState`, `PageHeader`, `SearchInput` from `src/components/ui/`.
- Page transitions via `framer-motion`.

## Data Flow
1. ClassbookView mounts → fetches academic years, selects active year.
2. Fetches sessions for that year.
3. Sidebar shows: Resumen, Sesiones, Asistencia, Observaciones, Revisiones, Firmas.
4. Detail view fetched on demand via session ID.
