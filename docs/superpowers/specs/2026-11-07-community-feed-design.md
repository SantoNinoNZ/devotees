# Santo Niño NZ Devotees — Community Social Platform Design Specification

**Date:** 2026-11-07 (Updated: 2026-11-09)  
**Status:** Approved by User  
**Target Audience:** Santo Niño devotee community in New Zealand, Hermanos/Hermanas, Area Coordinators, Dance Troupes, and Administrators.

---

## 1. Executive Summary & Problem Statement

The previous concept for the Devotees application was heavily focused on siloed dashboard menus and forms, creating friction and feeling overly complex for everyday community members. 

This design pivots the application into a **Facebook-style, community-driven social hub** tailored for the Santo Niño NZ community. It blends the warmth and familiar UX of social media (feed, stories, post composer, photos, comments, and reactions) with sacred devotional practices (daily 9-day Novena prayers, community intention requests, event calendars/RSVPs, and Pilgrim Image house blessings).

### 1.1 Architectural Strategy: Pivot vs. Rewrite
- **Retain Proven Foundation:** Rather than starting from scratch, the project preserves existing tested plumbing:
  - Next.js 16 (App Router) + TypeScript (strict mode) + Tailwind CSS 4.
  - Supabase client with Google OAuth token handling in `/auth/callback`, `useAuth` hook, and RBAC permissions (`permissions.ts`).
  - Pre-generated database types and contracts (`database.types.ts`).
  - GitHub Pages static export CI/CD pipeline (`.github/workflows/deploy.yml`).
  - Reusable logic for events calendar/RSVP and novena prayer content.
- **Deprecate Standalone `/announcements`:** Dedicated announcements navigation is removed. Official announcements, casting calls, and notices are unified directly into the community feed as **Pinned / Official Posts** with verified badges (`Official Announcement`, `Casting Call`), eliminating redundant navigation while preserving high visibility.
- **Pivot Presentation Layer:** The landing/home route (`/`) becomes the Community Social Feed, matching the layout demonstrated in `public/prototype.html`.

---

## 2. User Roles & Permission Model

| Role | Badge | Permissions |
|------|-------|-------------|
| **Devotee** (General Member) | Member Tag / Area Chapter | Post reflections, share photos, embed YouTube videos, submit prayer intentions, mark Novena completion, RSVP to events, comment and react (*🙏 Amen*, *❤️ Care*, *👍 Like*), report content. |
| **Hermano / Hermana** | `Verified Hermana/Hermano` (Gold badge) | All Devotee permissions + create official announcements & events, collect intentions for Saturday Mass list, review & coordinate House Blessing visits, hide/moderate reported posts, pin announcements. |
| **Coordinator / Leader** | `Area Coordinator` / `Dance Leader` | All Devotee permissions + create area chapter events/rehearsals, manage dance group member lists, pin area notices. |
| **Super Admin** | `Administrator` | Full system administration, role assignment, content moderation, system configuration. |

---

## 3. Responsive UX & Layout Architecture

### 3.1 Mobile Viewport (`< 768px`)
- **Sticky Top Bar:** Santo Niño NZ branding (`👑`), search shortcut, and notification bell (`🔔`).
- **Devotional Stories Carousel:** Horizontal card strip directly below header with touch-scroll snapping:
  - *Today's Novena* (Day X of 9 progress)
  - *Daily Gospel / Reading*
  - *Fiesta 2027 Countdown*
  - *Add Story / Photo*
- **Main Stream:** Single-column timeline with rich cards (Social Posts, Prayer Cards, YouTube Festival Videos, Event RSVPs).
- **Streamlined 4-Tab Bottom Navigation:**
  1. `🏠 Feed`: Main community stream, composer, and devotion stories.
  2. `📅 Events`: Mass schedules, Sinulog rehearsal calendar, RSVP tracking.
  3. `📿 Prayers`: Interactive 9-Day Novena reader, hymns (*Bato Balani sa Gugma* audio), and intentions wall.
  4. `☰ Menu`: Pilgrim Image house blessing requests, area chapter directories, dance troupe hubs, profile access, and settings.

### 3.2 Desktop Viewport (`≥ 768px`)
A full 3-column Facebook-style layout:
- **Left Sidebar (`w-64`):**
  - Navigation shortcuts (`Community Feed`, `Mass & Event Schedules`, `Daily 9-Day Novena`, `House Blessing Visits`).
  - Area chapters (`Auckland Central`, `North Shore`, `West Auckland`, `South Auckland`).
  - Ministry groups (`Sinulog Dance Troupe`, `Sinulog Drummers & Brass`, `Hermano Council`).
- **Center Stream (`max-w-2xl`):**
  - Devotional Stories Bar.
  - Post Composer with quick triggers (`📷 Photo`, `🎬 YouTube Video`, `🙏 Request Prayer`).
  - Chronological interactive feed.
- **Right Sidebar (`w-80`):**
  - *Daily Devotion Widget:* Novena day tracker, petition excerpt, and 1-click audio playback.
  - *Upcoming Community Events Widget:* Next scheduled mass or rehearsal with instant 1-click RSVP.
  - *Community Intentions Stream:* Urgent prayer requests with a 1-click *"🙏 I Prayed For This"* button.

---

## 4. Feature Specifications

### 4.1 Post Composer & Media Pipeline
- **Composer Modes (Unified Modal):**
  1. **General Reflection / Update:** Devotee message with optional photo attachments.
  2. **Prayer Intention Request:** Dedicated fields selecting intention category (*Healing*, *Thanksgiving*, *Special Intention*, *Eternal Repose*), with privacy visibility (`public` vs `hermanos_only`).
  3. **Official Announcement & Event:** (Restricted to Hermanos/Coordinators/Admins) with announcement type (`general`, `casting_call`), pinned status, and optional event link.
  4. **YouTube Embed Mode:** Paste any YouTube or YouTube Shorts URL for free high-definition video streaming.

---

## 5. Zero-Cost Media Storage Architecture (Free Tier Safeguards)

To ensure the platform operates sustainably on free tiers without billing risk, the media architecture avoids Supabase's strict **1 GB storage** and **2 GB/month egress bandwidth** caps.

### 5.1 Media Strategy Matrix

| Media Type | Storage / Delivery Provider | Free Tier Allowance | Bandwidth / Egress Cost | Implementation Details |
| :--- | :--- | :--- | :--- | :--- |
| **Videos** | **YouTube Embeds** | **Unlimited** | **$0 (Zero Egress)** | Devotees paste YouTube or Shorts URLs. Client extracts video ID and renders a responsive 16:9 iframe embed (`youtube-nocookie.com`). Zero storage and zero bandwidth hit on app infrastructure. |
| **Audio (Hymns)** | **GitHub Pages (`/public/audio/`)** | **100 GB/month** | **$0 (Zero Egress)** | Static hymn files (e.g. *Bato Balani sa Gugma* MP3) are bundled in the repository's `public/audio/` directory. GitHub Pages serves static audio directly to clients with high transfer allowance. |
| **Photos (Primary)** | **Cloudflare R2** | **10 GB Storage** | **$0 (Zero Egress Fee)** | Industry standard for free media hosting. S3-compatible API. Cloudflare waives all egress/bandwidth fees entirely. Direct upload via presigned URL or worker proxy. |
| **Photos (Alternative)** | **ImageKit.io** or **Supabase + Cloudflare CDN** | **20 GB / 1 GB Storage** | **Cached at Edge** | Fallback option: If using Supabase Storage, a free Cloudflare CDN proxy caches images to prevent consuming Supabase's 2 GB monthly egress. |

### 5.2 Mandatory Client-Side WebP Compression
Regardless of the photo storage backend:
- All photos undergo browser-side canvas compression before upload.
- **Specifications:** Max dimension 1200px (width or height), converted to `image/webp` at `0.75` quality.
- **Result:** Average photo payload is reduced from 4–8 MB down to **80 KB – 180 KB** (over 95% bandwidth reduction).
- Max 4 photos per post.

---

## 6. Faith Identity, Honor Badges & Yearly Festival Roles

Community devotion and Sinulog festival engagement span years of volunteerism, performance, sacred liturgy, and community patronage. The app recognizes this through a **multi-tiered Badge & Honor Ribbons system** displayed on user profiles, post avatars, and comments.

### 6.1 Badge Taxonomy & Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FAITH & FESTIVAL BADGE TAXONOMY                       │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. CLERGY & LITURGY  │ 2. FESTIVAL ROLES    │ 3. CREATIVE & PRODUCTION      │
│  • Bishop / Priest   │  • Sinulog Dancer    │  • Official Photographer      │
│  • Deacon / Lay Min. │  • Dance Competitor  │  • Videographer / Media       │
│  • Hermano Major     │  • Miss Sinulog / Qn │  • Sound, Lights & Stage      │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 4. PARTNERS & VENDORS│ 5. DEVOTIONAL STREAKS│ 6. LEADERSHIP & SERVICE       │
│  • Festival Vendor   │  • 9-Day Novena Done │  • Area Coordinator           │
│  • Food/Merch Booth  │  • Pilgrim Host      │  • Dance Troupe Leader        │
│  • Fiesta Sponsor    │  • Chapter Pioneer   │  • Hermana Council Member     │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

#### Detailed Badge Types

| Category | Badge Title | Repeatable by Year? | Icon | Description & Example |
| :--- | :--- | :---: | :---: | :--- |
| **Clergy & Liturgy** | **Bishop / Priest** | No (Standing) | ✝️ | Ordained celebrants presiding over Holy Mass & blessings. |
| **Clergy & Liturgy** | **Deacon / Lay Minister** | No (Standing) | 🕊️ | Liturgical ministers assisting with communion and blessings. |
| **Clergy & Liturgy** | **Hermano / Hermana Major** | Yes (`year`) | 👑 | Spiritual heads/hosts for the festival year (e.g. *Hermano Major 2026*). |
| **Performance** | **Sinulog Dancer** | Yes (`year`) | 💃 | Dancers participating in the grand street dance (e.g. *Dancer '24, '25, '26*). |
| **Performance** | **Dance Troupe Competitor** | Yes (`year`) | 🏆 | Members competing in the Sinulog Dance Competition (with troupe name). |
| **Pageant** | **Sinulog Festival Queen / Miss Sinulog** | Yes (`year`) | 👸 | Pageant candidates, runners-up, and crowned titleholders (e.g. *Queen 2025*). |
| **Performance** | **Drummers & Brass Musician** | Yes (`year`) | 🥁 | Percussionists and brass instrumentalists providing Sinulog rhythm. |
| **Creative Guild** | **Official Photographer** | Yes (`year`) | 📸 | Accredited volunteer photographers capturing liturgical & festival events. |
| **Creative Guild** | **Official Videographer** | Yes (`year`) | 🎥 | Videographers documenting dances, novena masses, and recaps. |
| **Community & Commerce** | **Festival Partner / Vendor** | Yes (`year`) | 🛍️ | Official food, merchandise, and retail stallholders at Sinulog festivities. |
| **Community & Commerce** | **Festival Sponsor / Benefactor** | Yes (`year`) | 🤝 | Community businesses and donors sponsoring events (Gold, Silver, Bronze). |
| **Devotional** | **9-Day Novena Completer** | Yes (`year`) | 📿 | Devotees who complete all 9 days of the official annual Novena. |
| **Devotional** | **Pilgrim Image Host** | Yes (`year`) | 🏠 | Families hosting the sacred Pilgrim Image of Santo Niño for house visits. |
| **Community Service** | **Sinulog Contributor / Volunteer**| Yes (`year`) | 🌟 | Logistics volunteers, food committee, marshals, and coordinators. |

### 6.2 UX Placement & Badge Display
1. **Feed & Comment Flair:**
   - Beside the user's name on posts and comments, their primary/featured badge appears as a compact tag:
     - `Maria Santos-Cruz [Verified Hermana]`
     - `Fr. Mario [✝️ Priest]`
     - `Elijah Mondero [💃 Dancer '24, '25, '26]`
     - `Jun Santos [📸 Official Photographer '26]`
     - `Kanto Grill NZ [🛍️ Food Vendor '26]`
2. **Profile "Honor Ribbons" Shelf:**
   - On the Devotee's profile header, a dedicated visual shelf displays all earned badges grouped by year.
   - Tapping any badge opens a modal showing verified details (e.g., *"Sinulog Festival Queen 2025 — Auckland Chapter, 1st Runner Up"*).
3. **Yearly Archive & Directory Filter:**
   - The community directory allows filtering by badge and year:
     - *"View all Sinulog 2026 Dancers"*
     - *"Directory of 2026 Food & Merch Vendors"*
     - *"Media Guild: Photographers & Videographers"*

---

## 7. Devotional Features & Sacred Practices

### 7.1 Interactive Novena & Hymn Experience
- **9-Day Novena Guide:**
  - Day selector (Day 1 through Day 9) with visual completion progress dots.
  - Opening prayers, daily reflection, petitions, and litany.
  - Embedded audio player for *Bato Balani sa Gugma* with synchronized lyrics.
  - **"Mark Day as Completed":** Persists completion to `novena_progress` and offers a 1-tap feed share badge: *"Just completed Day 3 of the Santo Niño Novena! Viva Pit Señor! 📿"*.

### 7.2 Community Prayer Intentions & Saturday Mass Integration
- Intentions posted on the feed appear as high-visibility devotional cards with distinct category tags (*🙏 Healing*, *🎉 Thanksgiving*, *🕊️ Eternal Repose*).
- **"🙏 Amen / I Prayed"** interaction: Tapping adds to the live prayer count and notifies the author: *"Brother Jun and 14 others prayed for your intention"*.
- **Liturgical Export:** Hermanos have a 1-click feature to export all public intentions submitted during the week into the formal prayer petition list for the Saturday Novena Mass.

### 7.3 House Visits & Pilgrim Image Booking
- Public intentions appear on the social feed.
- Private house visits (Pilgrim Image home enthronement, house blessings, sick pastoral calls) remain securely routed to area Hermanos via the `requests` table with address and preferred timeslot details.

### 7.4 Full Liturgical Calendar, Pilgrimages & Map Directions

The events and calendar engine is built to support the entire Catholic liturgical cycle and Filipino community traditions across New Zealand:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LITURGICAL SEASONS & PILGRIMAGE FLOW                    │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. ADVENT & CHRISTMAS│ 2. FIESTA SEÑOR STO. │ 3. LENT & HOLY WEEK           │
│  • Simbang Gabi (9d) │  • 9-Day Novena      │  • Ash Wednesday Masses       │
│  • Christmas Eve     │  • Sinulog Festival  │  • Stations of the Cross      │
│  • Panunuluyan       │  • Street Dance      │  • Visita Iglesia (7 Churches)│
│  • Misa de Gallo     │  • Fiesta Mass       │  • Easter Dawn (Salubong)     │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

#### Key Capabilities:
1. **Turn-by-Turn Map Directions:**
   - Every event card includes a 1-tap **"📍 Get Directions"** link triggering native Google Maps or Apple Maps:
     `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue_name + ' ' + venue_address)}`
   - Includes venue parking tips, meeting point notes (e.g. *"Assembly at Cathedral Courtyard for street procession"*), and public transit advice.
2. **Seasonal Devotional Guides (Dynamic Stories Bar):**
   - In December: Stories bar features the **Simbang Gabi 9-Day Mass tracker**.
   - During Lent: Features the interactive **14 Stations of the Cross (Via Crucis)** guide with reflections and audio.
   - In January: Features the **Santo Niño 9-Day Novena**.
3. **Chapter Delegations & Pilgrimage Caravans:**
   - Supports group attendance for long-distance caravans (e.g., North Shore chapter bus delegation to Hamilton Mass or outdoor Stations of the Cross pilgrimage in Puhoi).
   - Event cards display group badges: *"18 Devotees from North Shore Chapter attending (Carpooling from Albany)"*.
4. **Liturgical Badges:**
   - Devotees can earn seasonal badges like `🎄 Simbang Gabi 2026 (9 Masses Done)` and `✝️ Via Crucis Pilgrim '26`.

---

## 8. Phased Roadmap

- **Phase 1 (Current Scope):**
  - Pivot root layout to 4-tab mobile navigation and 3-column desktop layout.
  - Deprecate `/announcements` and unify announcements/casting calls into feed posts.
  - Post composer with text, WebP compressed photos, and YouTube video embeds.
  - Feed interactions: Comments, reactions (*🙏 Amen*, *❤️ Care*, *👍 Like*), native Web Share.
  - Interactive Novena reader with audio hymn player and completion sharing.
  - Prayer intentions wall and Saturday Mass prayer collection export.
  - Events calendar and RSVP system.
  - Multi-tier Honor Badges & yearly festival roles displayed on profiles and post flairs.
  - Hermano/Admin moderation controls.

- **Phase 2 (Future Scope):**
  - Realtime direct messaging (DMs) between Devotees and Hermanos/Coordinators.
  - Push notifications via Web Push API.
  - Automated prayer intention reminders before Saturday Mass.

---

## 9. Database Schema Extensions (Supabase / PostgreSQL)

Existing tables in project: `profiles`, `areas`, `dance_groups`, `user_roles`, `sinulog_queens`, `requests` (for house visits/confidential requests), `events`.

### 1. `posts` (Community Feed)
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL,                  -- 'general', 'prayer_request', 'event', 'announcement', 'novena_completion'
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',           -- Storage URLs for photos (Cloudflare R2 or WebP bucket)
  youtube_video_id TEXT,                    -- YouTube video/short ID
  intention_category TEXT,                  -- 'healing', 'thanksgiving', 'special', 'repose'
  announcement_type TEXT,                   -- 'general', 'casting_call', 'urgent'
  event_id UUID REFERENCES events(id),      -- Optional link to event
  visibility TEXT DEFAULT 'public',         -- 'public', 'hermanos_only'
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `badge_definitions` & `user_badges` (Faith Identity & Yearly Honors)
```sql
-- Badge definitions catalog
CREATE TABLE badge_definitions (
  id TEXT PRIMARY KEY,                      -- e.g. 'priest', 'sinulog_dancer', 'festival_queen', 'photographer', 'festival_vendor'
  name TEXT NOT NULL,                       -- e.g. 'Sinulog Dancer'
  category TEXT NOT NULL,                   -- 'clergy', 'performance', 'pageant', 'media', 'partner', 'devotional'
  icon TEXT NOT NULL,                       -- e.g. '✝️', '💃', '👸', '📸', '🛍️', '📿'
  description TEXT,
  is_repeatable_yearly BOOLEAN DEFAULT true,-- whether badge can be awarded in multiple years
  badge_color TEXT DEFAULT 'amber',         -- 'gold', 'red', 'purple', 'emerald', 'blue'
  is_verified_only BOOLEAN DEFAULT true     -- requires admin/coordinator approval
);

-- User awarded badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  year INTEGER,                             -- e.g. 2024, 2025, 2026 (null for standing roles like clergy)
  title_override TEXT,                      -- e.g. "Lead Dancer", "Official Videographer", "Fiesta Gold Sponsor"
  organization_or_troupe TEXT,             -- e.g. "Auckland Youth Troupe", "Kanto Grill NZ"
  metadata JSONB DEFAULT '{}',              -- e.g. { "placement": "1st Runner Up", "booth_number": "B12" }
  is_featured BOOLEAN DEFAULT true,         -- show as flair beside name on posts/comments
  awarded_by UUID REFERENCES profiles(id),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id, year)
);
```

### 3. `post_reactions`
```sql
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,              -- 'amen', 'heart', 'like'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

### 4. `post_comments`
```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. `novena_progress`
```sql
CREATE TABLE novena_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 9),
  cycle_year INTEGER NOT NULL,              -- e.g. 2026
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number, cycle_year)
);
```

### 6. `event_rsvps`
```sql
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL,                     -- 'going', 'interested', 'declined'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
```

---

## 10. Verification & Success Criteria

1. **Responsive Verification:**
   - `< 768px`: 4-tab bottom navigation (`Feed`, `Events`, `Novena`, `Menu`), desktop sidebars hidden.
   - `≥ 768px`: 3-column layout (shortcuts on left, central feed, devotion/event widgets on right).
2. **Posting & Free-Tier Media:**
   - Posting a YouTube link embeds a responsive 16:9 player without third-party video storage.
   - Uploading a photo triggers browser-side WebP compression (< 200 KB) before saving to R2/storage.
3. **Badge & Faith Identity Verification:**
   - Profile header renders the "Honor Ribbons" shelf with active badges, icons, and year badges.
   - Posts and comments display the primary featured badge tag next to the author's name.
4. **Prayer & Novena Flow:**
   - Devotees can navigate days 1–9 of the Novena, stream *Bato Balani sa Gugma*, and mark days complete.
   - Marking completion creates a streak record and optional feed badge.
   - Prayer intention cards support *"🙏 Amen"* interaction with live counter updates.
5. **Events & RSVPs:**
   - Events render with date/venue badges and interactive RSVP toggle (`Going` / `Interested`).
6. **Static Export Build Integrity:**
   - All dynamic routes configure `dynamicParams = false` and `generateStaticParams()` to ensure `npm run build` succeeds under Next.js `output: 'export'`.
