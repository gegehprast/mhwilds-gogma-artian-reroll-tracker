# MHWilds Gogma Reroll Tracker — Build Plan

## Overview

A personal web app for tracking Gimmick Augment (Gogma) reroll results in Monster Hunter Wilds. The backend is a Bun/SQLite/Drizzle HTTP API; the frontend is React + Vite + TailwindCSS. No authentication — instead, a **Tracker ID** (a random shareable string) scopes all data to a specific player.

---

## Key Design Decisions

### Tracker ID (Multi-player without auth)
- On first visit the frontend generates a random Tracker ID (e.g. `nanoid(12)`) and stores it in `localStorage`.
- The ID is displayed prominently in the header with a "Copy" button.
- Users can paste a different Tracker ID to switch to another player's data.
- All API calls send the Tracker ID as part of every request, scoping weapons and rolls to that player.
- Sharing your Tracker ID gives full read/write access to your data.

### Global Roll Index
The game maintains one shared roll-table index per roll type (`skills` and `bonuses`). Each time **any** weapon is rolled, the index advances — even for weapons that weren't the target of that roll. Only the rolled weapon records a result; all others simply "skip" that slot.

**How it is stored:** The current indices are stored as explicit integer counters directly on the `trackers` row (`skill_index`, `bonus_index`). Each roll record also stores the `index` value at which it was made.

- **Recording a new roll:** reads `trackers.skill_index` (or `bonus_index`), inserts the roll with that `index` value, then increments the counter — all in one transaction.
- **User override:** the user can freely edit `skill_index` / `bonus_index` via the UI at any time to correct a mistake. They are treated as manual markers first, auto-counters second.
- **Import:** does **not** touch `skill_index` or `bonus_index`. Imported roll records are assigned `index` values based on their insertion position relative to the selected cutoff point (see Import section).

### Roll Types
| JSON `mode` | Internal name | Result shape |
|---|---|---|
| `lottery` | `skills` | `{ group_skill, series_skill }` |
| `grinding` | `bonuses` | `bonus_1 … bonus_5` (5 separate columns) |

The two roll types have **independent** global indices.

### Database
Switch from the template's PostgreSQL to **SQLite** via `bun:sqlite` + `drizzle-orm/bun-sqlite`. DB file at `./data/tracker.db`.

---

## Data Model

### `trackers` table
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `nanoid(12)` — the shareable Tracker ID |
| `name` | text NOT NULL | User-friendly name for the tracker (defaults to `"My Tracker"`) |
| `skill_index` | integer NOT NULL | Current global index for skills rolls (starts at 1) |
| `bonus_index` | integer NOT NULL | Current global index for bonuses rolls (starts at 1) |
| `created_at` | integer NOT NULL | Unix ms |
| `updated_at` | integer NOT NULL | Unix ms |

### `weapons` table
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `nanoid()` |
| `tracker_id` | text FK NOT NULL | → `trackers.id` CASCADE DELETE |
| `weapon_type` | text NOT NULL | e.g. `"Charge Blade"` |
| `element` | text NOT NULL | e.g. `"Blast"` |
| `created_at` | integer NOT NULL | Unix ms |
| `updated_at` | integer NOT NULL | Unix ms |

Unique constraint: `(tracker_id, weapon_type, element)`.

### `skill_rolls` table
Each row = one skills roll made at a specific global index.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `nanoid()` |
| `index` | integer NOT NULL | The index of the roll on the roll table |
| `weapon_id` | text FK NOT NULL | → `weapons.id` CASCADE DELETE |
| `group_skill` | text NOT NULL | e.g. `"Rathalos's Flare"` |
| `series_skill` | text NOT NULL | e.g. `"Guardian's Pulse"` |
| `created_at` | integer NOT NULL | Unix ms |
| `updated_at` | integer NOT NULL | Unix ms |

Unique constraint: `(weapon_id, index)`.

### `bonus_rolls` table
Each row = one bonuses roll made at a specific global index.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `nanoid()` |
| `index` | integer NOT NULL | The index of the roll on the roll table |
| `weapon_id` | text FK NOT NULL | → `weapons.id` CASCADE DELETE |
| `bonus_1` | text NOT NULL | First rolled bonus stat |
| `bonus_2` | text NOT NULL | |
| `bonus_3` | text NOT NULL | |
| `bonus_4` | text NOT NULL | |
| `bonus_5` | text NOT NULL | |
| `created_at` | integer NOT NULL | Unix ms |
| `updated_at` | integer NOT NULL | Unix ms |

Unique constraint: `(weapon_id, index)`.

---

## Backend API

Base URL: `/api`. Every request includes `X-Tracker-Id: <trackerId>` header (validated by middleware; 401 if missing/unknown).

### Trackers

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/trackers` | Create a new tracker (body: `{ name? }`, name defaults to `"My Tracker"`), returns the generated ID and initial indices |
| `GET` | `/api/trackers/me` | Verify a tracker ID exists; returns tracker name, `skill_index`, `bonus_index`, and weapon count |
| `PATCH` | `/api/trackers/me` | Update tracker `name`, `skill_index`, and/or `bonus_index` (all optional) |

### Weapons

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/weapons` | List all weapons with per-weapon roll counts (current indices come from `GET /api/trackers/me`) |
| `POST` | `/api/weapons` | Add a new weapon+element combination |
| `GET` | `/api/weapons/:id` | Get a weapon's details |
| `DELETE` | `/api/weapons/:id` | Delete a weapon (cascades rolls) |

### Skill Rolls

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/weapons/:id/skill-rolls` | List all skill rolls, sorted by `index` ASC |
| `POST` | `/api/weapons/:id/skill-rolls` | Record a new skill roll — reads `skill_index`, inserts roll, increments `skill_index` (one transaction) |
| `PATCH` | `/api/skill-rolls/:rollId` | Correct `group_skill` or `series_skill` (`index` is not editable) |
| `DELETE` | `/api/skill-rolls/:rollId` | Delete a skill roll record |

### Bonus Rolls

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/weapons/:id/bonus-rolls` | List all bonus rolls, sorted by `index` ASC |
| `POST` | `/api/weapons/:id/bonus-rolls` | Record a new bonus roll — reads `bonus_index`, inserts roll, increments `bonus_index` (one transaction) |
| `PATCH` | `/api/bonus-rolls/:rollId` | Correct any of the five bonus columns (`index` is not editable) |
| `DELETE` | `/api/bonus-rolls/:rollId` | Delete a bonus roll record |

### Import

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/weapons/:id/skill-rolls/import` | Bulk-import skill rolls from JSON |
| `POST` | `/api/weapons/:id/bonus-rolls/import` | Bulk-import bonus rolls from JSON |

#### Import UX

Each row in the roll history table has an **"Upload from here"** button. Clicking it opens the `ImportModal` pre-loaded with the selected row's `index` value (`selectedIndex`). The user then picks a JSON file and confirms.

#### Import logic and request body

```json
{
  "selectedIndex": 29,
  "attempts": [
    { "attemptNum": 1, "skills": { "group": "A1", "series": "A2" } },
    { "attemptNum": 2, "skills": { "group": "B1", "series": "B2" } },
    { "attemptNum": 3, "skills": { "group": "C1", "series": "C2" } },
    { "attemptNum": 4, "skills": { "group": "D1", "series": "D2" } }
  ]
}
```

The frontend pre-filters `attempts` to only the relevant weapon and roll type before sending. The service (inside one transaction):

1. Sorts `attempts` by `attemptNum` ascending.
2. Counts them → `attemptCount` (e.g. 4).
3. Deletes the weapon's existing records with `index > selectedIndex` AND `index <= selectedIndex + attemptCount` (i.e. the exact slots the imported data will occupy). Records at `index <= selectedIndex` and `index > selectedIndex + attemptCount` are **not touched**.
4. Inserts each attempt in sorted order, assigning `index = selectedIndex + position` (position = 1, 2, 3…).
5. **`trackers.skill_index` and `bonus_index` are never modified.**
6. Only affects the roll type matching the current tab (`skill_rolls` or `bonus_rolls`).

`attemptNum` is used **only** for ordering the incoming attempts — it has no relationship to `index` and is never stored.

**Example** — `selectedIndex = 29`, 4 attempts imported:

| index | result | note |
|---|---|---|
| … | … | untouched |
| 29 | existing | untouched (anchor row) |
| 30 | A1 / A2 | imported attempt 1 |
| 31 | B1 / B2 | imported attempt 2 |
| 32 | C1 / C2 | imported attempt 3 |
| 33 | D1 / D2 | imported attempt 4 |
| 34 | existing | untouched (was beyond the import window) |
| … | … | untouched |

---

## Frontend Views

No URL routing — uses simple in-page tab/view state.

### View 1 — Tracker Setup (shown when no tracker ID in localStorage)
- Generate button: creates a new tracker via API, stores ID in localStorage.
- Load existing input: text field to enter a known Tracker ID; validates via API then stores.

### View 2 — Home (default after setup)
- Header: shows tracker name and Tracker ID with Copy and "Switch Tracker" buttons.
- Summary cards: current `skill_index`, current `bonus_index`, total weapons tracked.
- List of tracked weapon cards with quick stats.
- "Add Weapon" button.

### View 3 — Weapon Detail (click a weapon card)
- Breadcrumb back to Home.
- Tabs: **Skill Rolls** | **Bonus Rolls**
- Each tab:
  - Table of roll history sorted by `index` ASC (rank column, index value, result fields, edit/delete, "Upload from here" per row).
  - "Add Roll" button — manual entry; next `index` (= current `skill_index` or `bonus_index`) shown as a read-only preview.

### Modals
| Modal | Purpose |
|---|---|
| `AddWeaponModal` | Select weapon type + element from enums |
| `AddSkillRollModal` | `group_skill`, `series_skill`; next `skill_index` shown as read-only preview |
| `AddBonusRollModal` | Five bonus stat inputs; next `bonus_index` shown as read-only preview |
| `EditSkillRollModal` | Correct `group_skill` or `series_skill` (`index` not editable) |
| `EditBonusRollModal` | Correct any of the five bonus stats (`index` not editable) |
| `ImportModal` | Shows the selected cutoff row; file picker for JSON upload; preview list of attempts to be imported; confirm button |

---

## Implementation Steps

### Phase 1 — Backend Infrastructure ✅
1. ✅ **Switch database to SQLite**
   - Update `drizzle.config.ts`: `dialect: "sqlite"`, `dbCredentials.url: "./data/tracker.db"`
   - Rewrite `apps/backend/src/db/client.ts` using `bun:sqlite` + `drizzle-orm/bun-sqlite`
   - Rewrite `apps/backend/src/db/schemas/_helpers.ts` for SQLite types (`integer`, `text` instead of pg `uuid`, `timestamp`)
   - Update `apps/backend/src/config/index.ts`: replace `DATABASE_URL` default, strip JWT/auth config
   - Remove `postgres` and `jose` dev dependencies from `apps/backend/package.json`

2. ✅ **Remove unused template code**
   - Delete auth service, middleware, routes (`auth.*`)
   - Delete todos schema, repository, routes
   - Delete users schema, repository
   - Delete WebSocket chat route
   - Remove JWT/auth error types and constants
   - Clear the existing Drizzle migrations (`drizzle/` folder) — starting fresh with new schemas

3. ✅ **Create new schemas**
   - `trackers.schema.ts`
   - `weapons.schema.ts`
   - `skill-rolls.schema.ts`
   - `bonus-rolls.schema.ts`
   - Update `schemas/index.ts`

4. ✅ **Generate and apply migrations**
   - `bun run backend:db:generate`
   - `bun run backend:db:migrate`

### Phase 2 — Backend Business Logic ✅
5. ✅ **Create repositories**
   - `trackers.repository.ts` — `findById`, `create`
   - `weapons.repository.ts` — `findAllByTracker`, `findById`, `create`, `delete`, `getGlobalIndices`
   - `skill-rolls.repository.ts` — `findByWeapon`, `findById`, `create`, `update`, `delete`, `deleteFromRank`
   - `bonus-rolls.repository.ts` — same shape

6. ✅ **Create services**
   - `trackers.service.ts` — create + verify tracker
   - `weapons.service.ts` — CRUD, attach global index metadata to list response
   - `skill-rolls.service.ts` — read `skill_index` from tracker, insert roll, increment counter (transaction); delegate corrections to repo
   - `bonus-rolls.service.ts` — same with `bonus_index`
   - `import.service.ts` — parse and validate incoming attempts array, orchestrate delete+insert in a transaction

7. ✅ **Create Tracker ID middleware**
   - Reads `X-Tracker-Id` header, looks up tracker, attaches to request context; returns 401 if absent/invalid

8. ✅ **Create routes**
   - `trackers.routes.ts`
   - `weapons.routes.ts`
   - `skill-rolls.routes.ts`
   - `bonus-rolls.routes.ts`
   - Update `routes/index.ts`

### Phase 3 — Frontend 🔄
9. ✅ **Scaffold frontend**
   - ✅ Strip auth, chat, todos from `App.tsx` and `components/`
   - ✅ Install React Router is **not** needed — use `useState` view switching
   - ✅ Set up TanStack Query provider in `main.tsx`
   - ✅ Create `src/lib/api-client.ts` — openapi-fetch instance with `X-Tracker-Id` header injected from localStorage (used openapi-fetch instead of ky)
   - ✅ Create `src/hooks/useTracker.ts` — read/write tracker ID in localStorage, expose query + mutations
   - ✅ Create `src/lib/constants.ts` — weapon type and element enums (shared by all forms)

10. ✅ **Generate OpenAPI types and sync to frontend**
    - `bun run backend:openapi:generate` → writes to `apps/frontend/src/generated/`

11. ✅ **Implement views and components**
    - ✅ `TrackerSetup.tsx` — shown when no tracker ID stored
    - ❌ `HomeView.tsx` — summary + weapon card list (currently a single combined `App.tsx` view)
    - ❌ `WeaponDetailView.tsx` — tabs + roll tables (currently inline in `App.tsx`)
    - ✅ `SkillRollsTab.tsx`, `BonusRollsTab.tsx`
    - ❌ `AddWeaponModal.tsx` (inline form inside `WeaponSelector.tsx` instead)
    - ❌ `AddSkillRollModal.tsx`, `AddBonusRollModal.tsx` (inline forms in tabs instead)
    - ✅ `EditSkillRollModal.tsx`, `EditBonusRollModal.tsx`
    - ✅ `ImportModal.tsx`
    - ✅ `TrackerHeader.tsx` — tracker name edit, ID copy, Switch button, index counter edit

### Phase 4 — Validation & Polish ✅
12. ✅ **Zod validation** on all route inputs (body, params, query) — implemented in all route files
13. ✅ **Error handling** — `MutationCache` + `addToast()` in `main.tsx`; `lib/toast.ts` (useSyncExternalStore store); `ToastContainer.tsx` (auto-dismiss, bottom-right stack)
14. ✅ **Enum constants** — `game-constants.ts` in backend; `WeaponType`/`Element` exported as named OpenAPI schemas; `lib/constants.ts` in frontend derives types from generated spec

---

## Enum Values

### Weapon Types (14)
Great Sword, Sword & Shield, Dual Blades, Long Sword, Hammer, Hunting Horn, Lance, Gunlance, Switch Axe, Charge Blade, Insect Glaive, Bow, Light Bowgun, Heavy Bowgun

### Elements (9)
Fire, Water, Thunder, Ice, Dragon, Poison, Sleep, Paralysis, Blast
