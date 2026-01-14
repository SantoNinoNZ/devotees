# Santo Niño NZ Devotees App - Design Document

## Overview

A Progressive Web App (PWA) for the Santo Niño devotee community in New Zealand. This app serves as a central hub for community coordination, prayer requests, event management, and member communication.

---

## Tech Stack (Consistent with Existing Projects)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ with App Router |
| Language | TypeScript (strict mode) |
| UI Library | Ant Design (dark/light theme toggle) |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Notifications | Supabase Realtime + Web Push API |
| PWA | Service Worker + Web App Manifest |
| Deployment | GitHub Pages (static export) |

---

## User Roles & Hierarchy

### Role Definitions

```
┌─────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                          │
│         (Full system access, can manage all roles)          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  COORDINATOR  │    │  HERMANO/A    │    │ DANCE LEADER  │
│  (Area-based) │    │ (Confraternity│    │ (Group-based) │
└───────────────┘    │   Leaders)    │    └───────────────┘
        │            └───────────────┘            │
        ▼                     │                   ▼
┌───────────────┐            ▼            ┌───────────────┐
│ AREA MEMBERS  │    ┌───────────────┐    │   DANCERS     │
└───────────────┘    │   DEVOTEES    │    └───────────────┘
                     │   (General    │
                     │   Members)    │
                     └───────────────┘
```

### Role Details

| Role | Code | Permissions |
|------|------|-------------|
| Super Admin | `super_admin` | Full access, user management, system settings |
| Coordinator | `coordinator` | Manage area members, approve requests, post events |
| Hermano/Hermana | `hermano` | Lead prayers, respond to prayer/visit requests, post announcements |
| Dance Leader | `dance_leader` | Manage dance schedules, coordinate practice sessions |
| Sinulog Queen | `sinulog_queen` | Special profile, pageant-related posts |
| Dancer | `dancer` | View dance schedules, RSVP to practices |
| Devotee | `devotee` | Basic access, submit requests, view events |

### Role Attributes

```typescript
interface UserRole {
  id: string;
  user_id: string;
  role: 'super_admin' | 'coordinator' | 'hermano' | 'dance_leader' | 'sinulog_queen' | 'dancer' | 'devotee';
  area_id?: string;           // For coordinators and area-based roles
  dance_group_id?: string;    // For dance-related roles
  year?: number;              // For sinulog_queen (pageant year)
  is_active: boolean;
  granted_by: string;
  granted_at: timestamp;
}
```

---

## Database Schema

### Core Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  area_id UUID REFERENCES areas(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Areas (Geographic regions in NZ)
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- e.g., "Auckland Central", "Wellington"
  description TEXT,
  coordinator_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (Many-to-many, users can have multiple roles)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL,
  area_id UUID REFERENCES areas(id),
  dance_group_id UUID REFERENCES dance_groups(id),
  metadata JSONB,                  -- Flexible data (e.g., queen_year, title)
  is_active BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role, area_id, dance_group_id)
);

-- Dance Groups
CREATE TABLE dance_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- e.g., "Sinulog Dancers", "Youth Troupe"
  description TEXT,
  leader_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dance Group Members
CREATE TABLE dance_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES dance_groups(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member',      -- 'leader', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

### Events System

```sql
-- Event Types
CREATE TYPE event_type AS ENUM (
  'sinulog',           -- Main Sinulog festival events
  'novena',            -- Novena prayer sessions
  'community',         -- Community gatherings
  'internal',          -- Private/restricted events
  'practice',          -- Dance practice sessions
  'pageant',           -- Sinulog Queen pageant events
  'mass',              -- Holy Mass
  'procession',        -- Street processions
  'other'
);

-- Event Visibility
CREATE TYPE event_visibility AS ENUM (
  'public',            -- Anyone can see
  'members',           -- Logged-in members only
  'area',              -- Specific area members
  'role',              -- Specific roles only
  'group',             -- Specific groups (dance, etc.)
  'invited'            -- Invite-only
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,                    -- Rich text content (markdown)
  event_type event_type NOT NULL,
  visibility event_visibility DEFAULT 'public',

  -- Timing
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  rrule TEXT,                      -- RRule for recurring events

  -- Location
  location_name TEXT,
  location_address TEXT,
  location_coords POINT,           -- Lat/lng for maps
  is_online BOOLEAN DEFAULT false,
  online_link TEXT,

  -- Access Control
  allowed_roles TEXT[],            -- Array of role codes
  allowed_areas UUID[],            -- Array of area IDs
  allowed_groups UUID[],           -- Array of group IDs

  -- Metadata
  featured_image TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event RSVPs
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL,            -- 'going', 'maybe', 'not_going'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Event Invitations (for invite-only events)
CREATE TABLE event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  email TEXT,                      -- For non-members
  status TEXT DEFAULT 'pending',   -- 'pending', 'accepted', 'declined'
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Prayer & Visit Requests

```sql
-- Request Types
CREATE TYPE request_type AS ENUM (
  'prayer',            -- Prayer intention
  'house_visit',       -- Home blessing/visit
  'counseling',        -- Spiritual counseling
  'blessing',          -- Object blessing
  'other'
);

-- Request Status
CREATE TYPE request_status AS ENUM (
  'pending',           -- Just submitted
  'assigned',          -- Assigned to responder
  'in_progress',       -- Being handled
  'completed',         -- Done
  'cancelled'          -- Cancelled by requester
);

-- Prayer/Visit Requests
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type request_type NOT NULL,

  -- Requester Info
  requester_id UUID REFERENCES profiles(id),  -- NULL for anonymous
  requester_name TEXT,                         -- For anonymous requests
  requester_email TEXT,
  requester_phone TEXT,

  -- Request Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,           -- Only visible to assigned

  -- For house visits
  visit_address TEXT,
  preferred_date DATE,
  preferred_time_slot TEXT,                   -- 'morning', 'afternoon', 'evening'

  -- Routing
  area_id UUID REFERENCES areas(id),          -- Auto-assigned based on location

  -- Assignment
  status request_status DEFAULT 'pending',
  assigned_to UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Request Responses/Notes
CREATE TABLE request_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,          -- Only visible to handlers
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Novena Prayers

```sql
-- Novena Definitions
CREATE TABLE novenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                         -- e.g., "Novena to Santo Niño"
  description TEXT,
  total_days INTEGER DEFAULT 9,
  prayers JSONB NOT NULL,                      -- Array of day-by-day prayers
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Novena Prayer Structure (in prayers JSONB):
-- [
--   { "day": 1, "title": "Day 1", "content": "...", "reflection": "..." },
--   { "day": 2, "title": "Day 2", "content": "...", "reflection": "..." },
--   ...
-- ]

-- User Novena Progress
CREATE TABLE user_novenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  novena_id UUID NOT NULL REFERENCES novenas(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_day INTEGER DEFAULT 1,
  completed_days INTEGER[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, novena_id, started_at::DATE)
);
```

### Casting Calls & Announcements

```sql
-- Announcements/Casting Calls
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL,             -- 'general', 'casting_call', 'urgent'

  -- Targeting
  visibility event_visibility DEFAULT 'public',
  target_roles TEXT[],
  target_areas UUID[],
  target_groups UUID[],

  -- Casting Call Specific
  application_deadline TIMESTAMPTZ,
  requirements TEXT,
  how_to_apply TEXT,

  -- Metadata
  featured_image TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Casting Call Applications
CREATE TABLE casting_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  application_data JSONB,                      -- Flexible form responses
  status TEXT DEFAULT 'submitted',             -- 'submitted', 'reviewed', 'accepted', 'rejected'
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);
```

### Sinulog Queens

```sql
-- Sinulog Queen Registry
CREATE TABLE sinulog_queens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  year INTEGER NOT NULL,
  title TEXT NOT NULL,                         -- "Sinulog Queen 2024", "1st Runner Up 2024"
  placement INTEGER,                           -- 1 = Queen, 2 = 1st Runner Up, etc.
  bio TEXT,
  photo_url TEXT,
  achievements TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, placement)
);
```

### Notifications

```sql
-- Push Subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,                         -- { p256dh, auth }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,                                  -- { type, entity_id, action_url }
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Channel preferences
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,

  -- Category preferences
  events_enabled BOOLEAN DEFAULT true,
  prayer_requests_enabled BOOLEAN DEFAULT true,
  announcements_enabled BOOLEAN DEFAULT true,
  dance_schedules_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Dance Practice Scheduling

```sql
-- Practice Sessions
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES dance_groups(id),
  title TEXT NOT NULL,
  description TEXT,

  -- Timing
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Location
  location_name TEXT NOT NULL,
  location_address TEXT,

  -- Metadata
  is_mandatory BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice Attendance
CREATE TABLE practice_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL,                        -- 'attending', 'not_attending', 'maybe'
  reason TEXT,                                 -- If not attending
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);
```

---

## App Structure

```
src/
├── app/
│   ├── (auth)/                          # Auth routes (no layout)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── callback/page.tsx
│   │
│   ├── (main)/                          # Main app routes (with layout)
│   │   ├── layout.tsx                   # Main layout with nav
│   │   ├── page.tsx                     # Dashboard/Home
│   │   │
│   │   ├── events/
│   │   │   ├── page.tsx                 # Events list/calendar
│   │   │   ├── [id]/page.tsx            # Event detail
│   │   │   └── create/page.tsx          # Create event (role-restricted)
│   │   │
│   │   ├── prayers/
│   │   │   ├── page.tsx                 # Prayer hub
│   │   │   ├── novena/
│   │   │   │   ├── page.tsx             # Available novenas
│   │   │   │   └── [id]/page.tsx        # Novena prayer view
│   │   │   └── requests/
│   │   │       ├── page.tsx             # My requests
│   │   │       ├── new/page.tsx         # Submit request
│   │   │       └── manage/page.tsx      # Manage requests (role-restricted)
│   │   │
│   │   ├── visits/
│   │   │   ├── page.tsx                 # House visit requests
│   │   │   ├── new/page.tsx             # Submit visit request
│   │   │   └── manage/page.tsx          # Manage visits (role-restricted)
│   │   │
│   │   ├── dance/
│   │   │   ├── page.tsx                 # Dance groups hub
│   │   │   ├── groups/
│   │   │   │   └── [id]/page.tsx        # Group detail
│   │   │   ├── schedule/page.tsx        # Practice schedule
│   │   │   └── manage/page.tsx          # Manage schedules (leaders)
│   │   │
│   │   ├── announcements/
│   │   │   ├── page.tsx                 # Announcements list
│   │   │   ├── [id]/page.tsx            # Announcement detail
│   │   │   └── casting/
│   │   │       └── [id]/apply/page.tsx  # Apply to casting call
│   │   │
│   │   ├── community/
│   │   │   ├── page.tsx                 # Community hub
│   │   │   ├── queens/page.tsx          # Sinulog Queens gallery
│   │   │   ├── members/page.tsx         # Member directory
│   │   │   └── areas/page.tsx           # Area coordinators
│   │   │
│   │   ├── notifications/page.tsx       # Notification center
│   │   │
│   │   └── profile/
│   │       ├── page.tsx                 # My profile
│   │       ├── edit/page.tsx            # Edit profile
│   │       └── settings/page.tsx        # App settings
│   │
│   ├── admin/                           # Admin section
│   │   ├── layout.tsx                   # Admin layout
│   │   ├── page.tsx                     # Admin dashboard
│   │   ├── users/page.tsx               # User management
│   │   ├── roles/page.tsx               # Role management
│   │   ├── areas/page.tsx               # Area management
│   │   └── groups/page.tsx              # Group management
│   │
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Landing/redirect
│
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx               # Main app layout
│   │   ├── AdminLayout.tsx              # Admin layout
│   │   ├── BottomNav.tsx                # Mobile bottom navigation
│   │   ├── Sidebar.tsx                  # Desktop sidebar
│   │   └── Header.tsx                   # Top header
│   │
│   ├── auth/
│   │   ├── GoogleAuth.tsx
│   │   ├── AuthGuard.tsx                # Route protection
│   │   └── RoleGuard.tsx                # Role-based protection
│   │
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventCalendar.tsx
│   │   ├── EventForm.tsx
│   │   └── RSVPButton.tsx
│   │
│   ├── prayers/
│   │   ├── NovenaCard.tsx
│   │   ├── NovenaProgress.tsx
│   │   ├── PrayerDayView.tsx
│   │   └── RequestForm.tsx
│   │
│   ├── dance/
│   │   ├── ScheduleCalendar.tsx
│   │   ├── SessionCard.tsx
│   │   └── AttendanceForm.tsx
│   │
│   ├── community/
│   │   ├── MemberCard.tsx
│   │   ├── QueenCard.tsx
│   │   └── AreaCard.tsx
│   │
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── supabase.ts                      # Supabase client
│   ├── supabase-api.ts                  # API wrapper class
│   ├── auth.ts                          # Auth utilities
│   ├── notifications.ts                 # Push notification helpers
│   └── permissions.ts                   # Role/permission checks
│
├── hooks/
│   ├── useAuth.ts                       # Auth state hook
│   ├── useRoles.ts                      # User roles hook
│   ├── useNotifications.ts              # Notifications hook
│   └── useMobile.ts                     # Mobile detection
│
├── types/
│   ├── index.ts
│   ├── database.types.ts                # Supabase generated
│   ├── events.ts
│   ├── requests.ts
│   └── users.ts
│
├── utils/
│   ├── date.ts
│   ├── rrule.ts
│   └── format.ts
│
└── styles/
    └── globals.css
```

---

## Key Features Implementation

### 1. Role-Based Access Control (RBAC)

```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  // Events
  'events:create': ['super_admin', 'coordinator', 'hermano', 'dance_leader'],
  'events:edit': ['super_admin', 'coordinator', 'hermano'],
  'events:delete': ['super_admin', 'coordinator'],

  // Prayer Requests
  'requests:view_all': ['super_admin', 'coordinator', 'hermano'],
  'requests:assign': ['super_admin', 'coordinator', 'hermano'],
  'requests:respond': ['super_admin', 'coordinator', 'hermano'],

  // Dance
  'dance:manage_schedule': ['super_admin', 'dance_leader'],
  'dance:take_attendance': ['super_admin', 'dance_leader'],

  // Users
  'users:manage': ['super_admin'],
  'users:assign_roles': ['super_admin', 'coordinator'],

  // Announcements
  'announcements:create': ['super_admin', 'coordinator', 'hermano'],
  'casting:manage': ['super_admin', 'coordinator'],
} as const;

export function hasPermission(
  userRoles: string[],
  permission: keyof typeof PERMISSIONS
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return userRoles.some(role => allowedRoles.includes(role));
}
```

### 2. Notification Routing

```typescript
// Notification targets based on request/event type
const NOTIFICATION_ROUTING = {
  // Prayer requests notify Hermanos and Coordinators in the area
  prayer_request: {
    roles: ['hermano', 'coordinator'],
    scope: 'area', // Only same area
  },

  // House visits notify Hermanos and Coordinators in the area
  house_visit: {
    roles: ['hermano', 'coordinator'],
    scope: 'area',
  },

  // Dance practice notifies dance group members
  dance_practice: {
    scope: 'group',
  },

  // Sinulog events notify everyone
  sinulog_event: {
    scope: 'all',
  },

  // Internal events notify based on event settings
  internal_event: {
    scope: 'custom', // Uses event's allowed_roles/areas/groups
  },
};
```

### 3. PWA Features

```typescript
// Service Worker capabilities
- Offline access to static content
- Background sync for request submissions
- Push notifications
- App install prompt
- Caching strategy: Network-first for API, Cache-first for assets
```

### 4. Mobile-First Navigation

```
┌─────────────────────────────────────────┐
│  ☰ Santo Niño NZ         🔔 👤         │  <- Header
├─────────────────────────────────────────┤
│                                         │
│         [Main Content Area]             │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🏠    📅    🙏    💃    📢            │  <- Bottom Nav
│ Home  Events Prayer Dance  More        │
└─────────────────────────────────────────┘
```

---

## User Flows

### 1. New User Registration

```
1. User clicks "Join" / downloads PWA
2. Google OAuth login
3. Complete profile form:
   - Display name
   - Phone (optional)
   - Area selection
   - Photo (optional)
4. Request roles (optional):
   - "I am a dancer" -> Pending dance group approval
   - "I am Hermano/Hermana" -> Pending admin approval
5. Welcome screen with app tour
```

### 2. Prayer Request Flow

```
1. User navigates to Prayers > New Request
2. Fills form:
   - Request type (prayer/blessing/counseling)
   - Title & description
   - Urgent? Private?
   - Contact preference
3. System auto-routes based on user's area
4. Hermanos/Coordinators in area receive notification
5. Responder claims and handles request
6. Requester notified of status updates
7. Optional: Requester rates experience
```

### 3. House Visit Request Flow

```
1. User navigates to Visits > Request Visit
2. Fills form:
   - Visit purpose
   - Address
   - Preferred date/time
   - Special instructions
3. System routes to area Hermanos/Coordinators
4. Responder accepts and schedules
5. Both parties receive confirmation
6. Reminder notifications before visit
7. Post-visit follow-up
```

### 4. Dance Practice Coordination

```
1. Dance Leader creates practice session:
   - Date, time, location
   - Which group
   - Mandatory/optional
2. Group members receive notification
3. Members RSVP (Attending/Maybe/Not)
4. Leader sees attendance preview
5. Day-of reminder notifications
6. Leader takes actual attendance
7. Attendance history tracked
```

---

## API Endpoints (Supabase RPC Functions)

```sql
-- Get user with roles
CREATE FUNCTION get_user_profile(user_uuid UUID)
RETURNS JSON;

-- Get events for user (respecting visibility)
CREATE FUNCTION get_visible_events(user_uuid UUID, from_date DATE, to_date DATE)
RETURNS SETOF events;

-- Route request to appropriate responders
CREATE FUNCTION route_request(request_uuid UUID)
RETURNS void;

-- Get notifications for user
CREATE FUNCTION get_user_notifications(user_uuid UUID, limit_count INT)
RETURNS SETOF notifications;

-- Check user permission
CREATE FUNCTION check_permission(user_uuid UUID, permission TEXT)
RETURNS BOOLEAN;
```

---

## Security Considerations

### Row Level Security (RLS)

```sql
-- Profiles: Users can read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by members" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Requests: Complex visibility rules
CREATE POLICY "Requests visible to requester and handlers" ON requests
  FOR SELECT USING (
    requester_id = auth.uid() OR
    is_request_handler(auth.uid(), id)
  );

-- Events: Based on visibility setting
CREATE POLICY "Events visible based on visibility" ON events
  FOR SELECT USING (
    is_published = true AND
    can_view_event(auth.uid(), id)
  );
```

### Data Protection

- Phone numbers only visible to coordinators/hermanos
- Private prayer requests only visible to assigned responder
- Email addresses protected from public view
- Audit logs for sensitive operations

---

## Phase 1 MVP Features

1. **Authentication**
   - Google OAuth login
   - Profile creation
   - Basic role assignment (devotee)

2. **Events**
   - View public events
   - Event calendar view
   - Event detail page
   - RSVP functionality

3. **Prayer Requests**
   - Submit prayer request
   - View my requests
   - Basic routing to Hermanos

4. **Novena Prayers**
   - View available novenas
   - Track daily progress
   - Simple prayer view

5. **Notifications**
   - In-app notifications
   - Push notification setup

6. **PWA**
   - Installable
   - Offline viewing of cached content

---

## Phase 2 Features

1. House visit requests
2. Dance group management
3. Announcements & casting calls
4. Area coordinator features
5. Sinulog Queens gallery
6. Member directory
7. Advanced notification preferences

---

## Phase 3 Features

1. Admin dashboard
2. Analytics & reporting
3. Bulk notifications
4. Event photo galleries
5. Community chat (optional)
6. Integration with main website

---

## UI/UX Guidelines

### Color Palette (Santo Niño themed)

```css
:root {
  /* Primary - Santo Niño Red/Gold */
  --primary: #B91C1C;           /* Deep red */
  --primary-light: #DC2626;
  --primary-dark: #7F1D1D;

  /* Secondary - Gold accents */
  --secondary: #D97706;         /* Amber/Gold */
  --secondary-light: #F59E0B;
  --secondary-dark: #92400E;

  /* Neutrals */
  --background: #FAFAFA;
  --surface: #FFFFFF;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;

  /* Dark mode */
  --dark-background: #111827;
  --dark-surface: #1F2937;
  --dark-text-primary: #F9FAFB;
}
```

### Typography

- Headings: **Lora** (serif) - matches main website
- Body: **Roboto** - consistent with admin

### Iconography

- Use Ant Design icons for consistency
- Custom Santo Niño icon for app logo

---

## Finalized Decisions

| Question | Decision |
|----------|----------|
| **Database** | Same Supabase instance as admin/web (shared data) |
| **Authentication** | Google OAuth only |
| **MVP Scope** | All basic features: Events, Prayers, Novena, Announcements |
| **Areas** | NZ-wide with flexible areas (Pukekohe, North Shore, etc.) |
| **Hermano Hierarchy** | Flat structure - all Hermanos are equal |
| **Sinulog Dates** | January (same as Cebu - third Sunday) |
| **Language** | English only |

---

## Implementation Roadmap

### Phase 1: Foundation (MVP)
- [ ] Project setup with Next.js 16, TypeScript, Tailwind, Ant Design
- [ ] Supabase integration (same instance as admin/web)
- [ ] Database migrations for new tables
- [ ] Google OAuth authentication
- [ ] User profiles and role system
- [ ] Area management
- [ ] Basic PWA setup

### Phase 2: Core Features
- [ ] Events module (create, view, RSVP)
- [ ] Prayer requests (submit, route, respond)
- [ ] Novena prayers (view, track progress)
- [ ] Announcements and casting calls
- [ ] Push notifications

### Phase 3: Advanced Features
- [ ] House visit requests
- [ ] Dance group coordination
- [ ] Sinulog Queens gallery
- [ ] Member directory
- [ ] Admin dashboard

### Phase 4: Polish
- [ ] Offline support enhancement
- [ ] Performance optimization
- [ ] Analytics integration
- [ ] User feedback and iteration
