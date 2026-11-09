# Santo Niño NZ Devotees App - Development Progress

## Project Overview
A Progressive Web App (PWA) for the Santo Niño devotee community in New Zealand.

**Tech Stack:** Next.js 15, TypeScript, Ant Design, Tailwind CSS 4, Supabase (shared instance)

---

## Completed Work

### 1. Project Setup ✅
- [x] Next.js 15 project initialized with App Router
- [x] TypeScript configured (strict mode)
- [x] Ant Design + Tailwind CSS 4 configured
- [x] Supabase client setup (`src/lib/supabase.ts`)
- [x] Environment variables configured (`.env.local`)
- [x] GitHub Actions deploy workflow (`.github/workflows/deploy.yml`)
- [x] PWA manifest (`public/manifest.json`)

### 2. Authentication ✅
- [x] Google OAuth setup via Supabase
- [x] `useAuth` hook (`src/hooks/useAuth.ts`)
- [x] Login page (`src/app/login/page.tsx`)
- [x] Auth callback handler (`src/app/auth/callback/page.tsx`) - manually handles OAuth tokens
- [x] Permissions system (`src/lib/permissions.ts`)
- [x] Fixed navigator.locks AbortError with no-op lock function in Supabase client

### 3. Layout Components ✅
- [x] MainLayout with header/nav
- [x] Header component
- [x] Sidebar (desktop)
- [x] BottomNav (mobile)

### 4. Basic Pages ✅
- [x] Home/Dashboard (`src/app/(main)/page.tsx`)
- [x] Events placeholder
- [x] Prayers placeholder
- [x] Community placeholder
- [x] Announcements placeholder
- [x] Profile placeholder
- [x] Notifications placeholder

### 5. Database Migrations ✅ (Applied to Supabase)

**File locations:** `santoninonz-admin/supabase/migrations/`

| Migration | Tables/Features |
|-----------|-----------------|
| `020_create_devotees_profiles.sql` | `areas`, `profiles` (auto-create on signup) |
| `021_create_devotees_roles_groups.sql` | `dance_groups`, `user_roles`, `dance_group_members`, `sinulog_queens`, `practice_sessions`, `practice_attendance` |
| `022_create_devotees_requests.sql` | `requests`, `request_notes` (prayer/house visits) |
| `023_create_devotees_novenas.sql` | `novenas`, `user_novenas` (includes default Santo Niño Novena) |
| `024_create_devotees_announcements.sql` | `announcements`, `casting_applications`, `push_subscriptions`, `notifications`, `notification_preferences` |
| `025_extend_events_for_devotees.sql` | Extended `events` table + `event_rsvps`, `event_invitations` |

### 6. Events System Extended ✅
The existing events table (used by admin/web) has been extended for devotees:
- Added `category` enum: sinulog, novena, community, practice, mass, etc.
- Added `visibility` enum: public, members, area, role, group, invited
- Added access control: `allowed_roles`, `allowed_areas`, `allowed_groups`
- Added RSVP system: `event_rsvps` table
- Added invitations: `event_invitations` table
- Backward compatible with admin/web

---

## Pending Work

### Phase 1: Core Features (MVP)

#### Events Module ✅
- [x] Events list page with filtering by category
- [x] Event detail page
- [x] RSVP functionality (going/maybe/not going)
- [x] Calendar view with Ant Design Calendar
- [x] Event visibility enforcement (via Supabase RLS)

#### Prayer Requests Module ✅
- [x] Submit prayer request form
- [x] My requests list
- [x] Request detail view
- [ ] For Hermanos: View/manage area requests
- [x] Request status updates

#### Novena Prayers Module ✅
- [x] Available novenas list
- [x] Novena detail with day-by-day prayers
- [x] Track daily progress
- [x] Mark days complete
- [x] Progress indicator

#### Announcements Module ✅
- [x] Announcements list with visibility filtering
- [x] Announcement detail page
- [x] Casting call applications

#### Profile Module ✅
- [x] View/edit profile
- [x] Area selection
- [x] Role display
- [ ] Notification preferences (Phase 2)

### Phase 2: Advanced Features

#### House Visit Requests
- [ ] House visit request form
- [ ] Scheduling system
- [ ] For Hermanos: Manage visits

#### Dance Groups
- [ ] Group listing
- [ ] Join/leave groups
- [ ] Practice schedule view
- [ ] Attendance RSVP
- [ ] For Leaders: Manage schedules

#### Push Notifications
- [ ] Service worker setup
- [ ] Push subscription management
- [ ] Notification preferences UI

### Phase 3: Admin Features
- [ ] User role management (in admin portal)
- [ ] Area management
- [ ] Announcements management

---

## Database Schema Summary

### Core Tables (Devotees-specific)
```
profiles          - User profiles (extends auth.users)
areas             - NZ geographic areas (Auckland, Wellington, etc.)
user_roles        - Role assignments with area/group context
```

### Dance & Community
```
dance_groups      - Dance group definitions
dance_group_members - Group membership
sinulog_queens    - Sinulog Queen registry
practice_sessions - Scheduled practices
practice_attendance - RSVP and check-in
```

### Requests
```
requests          - Prayer and house visit requests
request_notes     - Communication on requests
```

### Prayers
```
novenas           - Novena prayer definitions
user_novenas      - User progress tracking
```

### Announcements & Notifications
```
announcements     - General and casting call announcements
casting_applications - Applications to casting calls
notifications     - In-app notifications
notification_preferences - User notification settings
push_subscriptions - Web push endpoints
```

### Events (Extended from admin/web)
```
events            - Extended with category, visibility, access control
event_rsvps       - RSVP responses
event_invitations - For invite-only events
```

---

## User Roles

| Role | Code | Permissions |
|------|------|-------------|
| Super Admin | `super_admin` | Full access |
| Coordinator | `coordinator` | Area management, approve requests |
| Hermano/Hermana | `hermano` | Prayer/visit requests, announcements |
| Dance Leader | `dance_leader` | Manage dance schedules |
| Sinulog Queen | `sinulog_queen` | Special profile |
| Dancer | `dancer` | View schedules, RSVP |
| Devotee | `devotee` | Basic access (default) |

---

## Default Data Created

### Areas (10 NZ regions)
- Auckland Central, North Shore, South Auckland, West Auckland, East Auckland
- Pukekohe, Hamilton, Wellington, Christchurch, Other

### Santo Niño Novena (9-day prayer)
Pre-populated with prayers for each day covering: Faith, Hope, Love, Humility, Gratitude, Peace, Healing, Protection, Thanksgiving.

---

## File Structure

```
santoninonz-devotees/
├── src/
│   ├── app/
│   │   ├── (main)/           # Authenticated routes
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── events/
│   │   │   │   ├── page.tsx           # Events list with filtering
│   │   │   │   └── [id]/page.tsx      # Event detail with RSVP
│   │   │   ├── prayers/
│   │   │   │   ├── page.tsx           # Prayers hub
│   │   │   │   ├── novena/
│   │   │   │   │   ├── page.tsx       # Novenas list
│   │   │   │   │   └── [id]/page.tsx  # Novena detail with progress
│   │   │   │   └── request/
│   │   │   │       ├── page.tsx       # Submit request form
│   │   │   │       └── [id]/page.tsx  # Request detail with notes
│   │   │   ├── community/
│   │   │   ├── announcements/
│   │   │   ├── profile/
│   │   │   └── notifications/
│   │   ├── auth/callback/    # OAuth callback
│   │   ├── login/            # Login page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── layout/           # MainLayout, Header, Sidebar, BottomNav
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── supabase-api.ts   # API methods for events, novenas, requests, announcements
│   │   └── permissions.ts
│   └── types/
│       ├── database.types.ts # Updated with all extended event fields
│       └── index.ts
├── public/
│   └── manifest.json
├── .env.local
├── .github/workflows/deploy.yml
├── DESIGN.md                 # Full technical design
├── OVERVIEW.md               # Non-technical overview
├── SUMMARY.md                # Quick reference
└── PROGRESS.md               # This file
```

---

## Next Steps (Recommended Order)

1. ~~**Create Supabase API client** (`src/lib/supabase-api.ts`)~~ ✅ DONE
   - Methods for events, requests, novenas, announcements
   - Type definitions

2. ~~**Build Events module**~~ ✅ DONE
   - List with category filters
   - Detail page with RSVP
   - Respect visibility rules
   - Calendar view

3. ~~**Build Novena module**~~ ✅ DONE
   - List available novenas
   - Day-by-day prayer view
   - Progress tracking

4. ~~**Build Prayer Requests module**~~ ✅ DONE
   - Submit form
   - My requests list

5. ~~**Build Profile module**~~ ✅ DONE
   - View/edit profile
   - Area selection

6. ~~**Build Announcements module**~~ ✅ DONE
   - Announcements list
   - Detail page
   - Casting call applications

7. ~~**Add Calendar view to Events**~~ ✅ DONE
   - Integrated Ant Design Calendar
   - Shows events on calendar

8. **Add Hermano features** (NEXT)
   - Area requests management
   - Request assignment

9. **Push Notifications** (Phase 2)
   - Service worker setup
   - Notification preferences

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://uvxrdmwmscevovbbrnky.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## GitHub Secrets Required (for Actions)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Related Projects

- **santoninonz-admin**: Admin portal (manages events, posts, users)
- **santoninonz-web**: Public website (displays events, posts)
- **santoninonz-devotees**: This app (community features)

All three share the same Supabase instance.
