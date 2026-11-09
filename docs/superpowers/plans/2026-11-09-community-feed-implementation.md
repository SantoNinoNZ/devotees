# Community Social Feed & Liturgical Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Santo Niño NZ Devotees app into a Facebook-style community social hub featuring devotional stories, prayer intention counters, YouTube embeds, Discord-style honor badges, and liturgical choir rosters, sharing a unified Supabase instance with `santoninonz-admin` and `santoninonz-web`.

**Architecture:** A Next.js 16 (App Router) static export client deployed on GitHub Pages. Database layer runs on a shared Supabase PostgreSQL instance using backward-compatible additive migrations. Public feed data uses `community_posts` (preventing conflicts with the CMS `posts` table used by web/admin), client-side WebP image compression (<200KB), and YouTube URL embedding to strictly protect Supabase free-tier limits.

**Tech Stack:** Next.js 16 (App Router, Turbopack, static export), TypeScript (strict mode), Tailwind CSS 4, Google Fonts (`Cinzel` & `Plus Jakarta Sans`), `@supabase/supabase-js`, FontAwesome 6, date-fns.

**Spec:** [`docs/superpowers/specs/2026-11-07-community-feed-design.md`](file:///C:/Projects/santoninonz-devotees/docs/superpowers/specs/2026-11-07-community-feed-design.md)

---

## Global Constraints

- **Shared Supabase Instance:** All database schema migrations are additive and tracked in `C:\Projects\santoninonz-admin\supabase\migrations\028_devotees_community_feed_and_badges.sql`.
- **No Collision with CMS `posts`:** Community feed table MUST be named `community_posts` (along with `community_post_reactions` and `community_post_comments`) because `santoninonz-admin` and `santoninonz-web` already use `posts` for CMS articles.
- **User Administration Boundary:** User role assignment, badge definition management, and official verification are administered exclusively via `santoninonz-admin`.
- **Zero-Cost Media Limits:** No direct video hosting on Supabase. Videos must use YouTube/Shorts 16:9 iframe embedding (`youtube-nocookie.com`). Photos must undergo canvas WebP compression (< 200 KB) before upload.
- **Static Export Build Integrity:** Every dynamic route segment (`[id]`) must declare `export const dynamicParams = false;` and implement `generateStaticParams()` to allow successful static builds for GitHub Pages (`output: 'export'`).
- **Typography & Theme:** Headings and liturgical titles use `Cinzel` (`font-cinzel`). Body and UI elements use `Plus Jakarta Sans`. Canvas background is warm parchment (`#FAF8F5`).

---

## Review Focus

1. **Table Collision & Foreign Keys:** Ensure `community_posts` links to `profiles.id` (not the CMS `authors.id`), preventing integrity errors across shared portals.
2. **Offline & Build-Time Fallbacks:** Ensure Supabase client does not throw or crash during static HTML page generation when environment secrets are absent.
3. **Mobile Touch Scroll:** Ensure the top devotional stories carousel supports touch-snap scrolling on small iOS/Android screens without horizontal overflow.
4. **Liturgical Roster Null Safety:** Ensure event cards gracefully render when optional fields (`choir_name`, `presider_name`, `lectors`) are null or unassigned.
5. **Amen Prayer Increment Idempotency:** Ensure tapping *"Amen / Pray"* does not result in duplicate `(post_id, user_id)` entries in `community_post_reactions`.

---

## File Structure & Responsibilities

```
C:\Projects\santoninonz-admin\
└── supabase\
    └── migrations\
        └── 028_devotees_community_feed_and_badges.sql      # Central additive migration for shared Supabase

C:\Projects\santoninonz-devotees\
├── src\
│   ├── types\
│   │   ├── database.types.ts                               # Supabase schema contracts
│   │   └── index.ts                                        # Application & domain model types
│   ├── utils\
│   │   ├── media.ts                                        # WebP compressor & YouTube URL parser
│   │   └── date.ts                                         # Liturgical & relative time formatters
│   ├── lib\
│   │   ├── supabase.ts                                     # Initialized Supabase client with build fallbacks
│   │   └── supabase-api.ts                                 # API wrapper for community feed, badges & roster
│   ├── components\
│   │   ├── feed\
│   │   │   ├── StoriesBar.tsx                              # Devotional stories carousel
│   │   │   ├── PostComposerModal.tsx                       # Unified post creation modal
│   │   │   ├── PrayerIntentionCard.tsx                     # Prayer card with Amen counter
│   │   │   ├── YouTubeVideoCard.tsx                        # 16:9 responsive YouTube player card
│   │   │   ├── EventAnnouncementCard.tsx                   # Event card with liturgical roster & map link
│   │   │   └── CommunityFeed.tsx                           # Center stream controller
│   │   ├── events\
│   │   │   └── ChoirRotationModal.tsx                      # 9-Day Novena & Simbang Gabi choir schedule
│   │   ├── prayers\
│   │   │   └── NovenaReaderModal.tsx                       # 9-Day Novena reader with Bato Balani hymn player
│   │   ├── profile\
│   │   │   └── HonorRibbonsModal.tsx                       # Discord-style profile badges showcase
│   │   └── layout\
│   │       ├── Header.tsx                                  # Top bar with branding & search
│   │       ├── Sidebar.tsx                                 # Left navigation & chapter shortcuts
│   │       └── BottomNav.tsx                               # Mobile 4-tab bottom navigation
│   └── app\
│       ├── (main)\
│       │   └── page.tsx                                    # Social feed homepage (replaces dashboard)
│       └── globals.css                                     # Font imports, color tokens, scrollbar utilities
└── tests\
    ├── unit\
    │   ├── media.test.ts                                   # Tests for WebP compression & YouTube parsing
    │   └── rbac.test.ts                                    # Tests for badge verification & post permissions
    └── components\
        └── feed.test.tsx                                   # Tests for feed card rendering & counters
```

---

## Task Decomposition

### Task 1: Central Supabase Migration (Feed, Badges & Liturgical Roster)

**Files:**
- Create: `C:\Projects\santoninonz-admin\supabase\migrations\028_devotees_community_feed_and_badges.sql`
- Modify: `src/types/database.types.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: Existing `profiles`, `events`, `areas`, and `dance_groups` tables.
- Produces: `community_posts`, `community_post_reactions`, `community_post_comments`, `badge_definitions`, `user_badges`, `novena_progress`, and extended `events` columns.

- [ ] **Step 1: Write SQL migration file**
  Create `028_devotees_community_feed_and_badges.sql` in `C:\Projects\santoninonz-admin\supabase\migrations\`:
  - `community_posts` with `post_type` (`'general'`, `'prayer_request'`, `'event'`, `'announcement'`, `'novena_completion'`), `media_urls`, `youtube_video_id`, `intention_category`, `visibility`, `is_pinned`, `is_hidden`.
  - `community_post_reactions` with unique `(post_id, user_id)` constraint.
  - `community_post_comments` with foreign keys to `community_posts` and `profiles`.
  - `badge_definitions` and `user_badges` with unique `(user_id, badge_id, year)`.
  - `novena_progress` with unique `(user_id, day_number, cycle_year)`.
  - Add liturgical roster columns to `events`: `presider_name`, `presider_id`, `choir_name`, `choir_group_id`, `lectors`, `acolytes_guild`, `sponsor_chapter`, `mass_sequence_number`.
  - RLS Policies: Public read for published/public posts; insert/update restricted to authenticated owners; badge management restricted to admins.

- [ ] **Step 2: Update TypeScript types in `src/types/database.types.ts` & `src/types/index.ts`**
  Add strong types for `CommunityPost`, `PostReaction`, `PostComment`, `BadgeDefinition`, `UserBadge`, `NovenaProgress`, and `EventLiturgicalRoster`.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`  
  Expected: PASS with 0 type errors.

- [ ] **Step 4: Commit**
  ```bash
  git add src/types/database.types.ts src/types/index.ts
  git commit -m "feat: add community feed, badges, and liturgical roster database types"
  ```

---

### Task 2: Free-Tier Media Utilities (YouTube Parser & WebP Compressor)

**Files:**
- Create: `src/utils/media.ts`
- Test: `tests/unit/media.test.ts`

**Interfaces:**
- Produces:
  - `extractYouTubeVideoId(url: string): string | null`
  - `getYouTubeEmbedUrl(videoId: string): string`
  - `compressImageToWebP(file: File, maxWidth?: number, quality?: number): Promise<Blob>`

- [ ] **Step 1: Write failing unit test for YouTube parser and image validation**
  Create `tests/unit/media.test.ts` testing extraction from standard URLs (`youtube.com/watch?v=5qap5aO4i9A`), short URLs (`youtu.be/5qap5aO4i9A`), and shorts (`youtube.com/shorts/5qap5aO4i9A`).

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx tsx tests/unit/media.test.ts` (or jest/vitest if configured)  
  Expected: FAIL with "module not found".

- [ ] **Step 3: Implement `src/utils/media.ts`**
  - Implement regex parser matching standard, short, and Shorts URLs returning the 11-char ID.
  - Implement `getYouTubeEmbedUrl(videoId)` returning `https://www.youtube-nocookie.com/embed/${videoId}`.
  - Implement canvas-based `compressImageToWebP` scaling to `max 1200px` at `0.75` quality.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx tsx tests/unit/media.test.ts`  
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/utils/media.ts tests/unit/media.test.ts
  git commit -m "feat: add YouTube video parser and browser WebP image compressor"
  ```

---

### Task 3: Supabase API Service for Feed, Badges & Roster

**Files:**
- Modify: `src/lib/supabase-api.ts`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`, types from `src/types`.
- Produces:
  - `communityFeedApi.getFeedPosts(limit?: number): Promise<CommunityPostWithAuthor[]>`
  - `communityFeedApi.createPost(post: NewCommunityPost): Promise<CommunityPost>`
  - `communityFeedApi.toggleAmen(postId: string, userId: string): Promise<{ added: boolean, count: number }>`
  - `communityFeedApi.getLiturgicalRoster(eventId: string): Promise<EventLiturgicalRoster>`
  - `badgesApi.getUserBadges(userId: string): Promise<UserBadgeWithDetails[]>`
  - `novenaApi.markDayCompleted(userId: string, day: number, year: number): Promise<void>`

- [ ] **Step 1: Write API wrapper functions in `src/lib/supabase-api.ts`**
  Implement typed queries for `community_posts` joined with `profiles`, `user_badges` joined with `badge_definitions`, and `events` liturgical roster fields.

- [ ] **Step 2: Add build-time graceful fallbacks**
  Ensure API functions return empty arrays / safe defaults when environment variables are placeholders during Next.js static builds.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`  
  Expected: PASS.

- [ ] **Step 4: Commit**
  ```bash
  git add src/lib/supabase-api.ts
  git commit -m "feat: add community feed, badges, and liturgical API client methods"
  ```

---

### Task 4: Devotional Stories Carousel Component

**Files:**
- Create: `src/components/feed/StoriesBar.tsx`
- Modify: `src/app/globals.css` (custom scrollbar hiding & font classes)

**Interfaces:**
- Consumes: `NovenaProgress`, active user profile.
- Produces: `StoriesBar` component with interactive cards:
  - Day X of 9 Novena card (opens Novena modal).
  - Daily Gospel card (shows scripture reflection).
  - Fiesta 2027 Countdown card.
  - "Share Reflection" card (opens post composer).

- [ ] **Step 1: Create `src/components/feed/StoriesBar.tsx`**
  Implement horizontal scrolling card strip with `rounded-2xl`, glassmorphic badges (`bg-white/20 backdrop-blur-md`), and gradient styles matching `prototype.html`.
  Add touch-scroll snapping (`snap-x mandatory`).

- [ ] **Step 2: Add Google Fonts and styling in `src/app/globals.css`**
  Import `Cinzel` and `Plus Jakarta Sans` Google fonts, configure warm canvas background `#FAF8F5`.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`  
  Expected: PASS.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/feed/StoriesBar.tsx src/app/globals.css
  git commit -m "feat: add devotional stories carousel component with liturgical gradients"
  ```

---

### Task 5: Post Cards (Prayer Intentions, YouTube Video & Events Roster)

**Files:**
- Create: `src/components/feed/PrayerIntentionCard.tsx`
- Create: `src/components/feed/YouTubeVideoCard.tsx`
- Create: `src/components/feed/EventAnnouncementCard.tsx`
- Create: `src/components/feed/CommunityFeed.tsx`

**Interfaces:**
- Consumes: `CommunityPostWithAuthor`, `communityFeedApi.toggleAmen`.
- Produces: Rich feed cards with Discord-style author badge flairs:
  - `PrayerIntentionCard`: Displays intention category tag, "🙏 42 Devotees joined in prayer" bar, and interactive Amen button.
  - `YouTubeVideoCard`: Responsive 16:9 iframe embed with zero storage footprint.
  - `EventAnnouncementCard`: Date badge, Liturgical Ministry & Choir Roster box, RSVP Going button, and 1-tap "📍 Map" link.

- [ ] **Step 1: Create `src/components/feed/PrayerIntentionCard.tsx`**
  Render devotional card with live Amen counter toggle and "✓ Included in Saturday Mass Intentions" highlight.

- [ ] **Step 2: Create `src/components/feed/YouTubeVideoCard.tsx`**
  Render responsive 16:9 iframe with `youtube-nocookie.com`.

- [ ] **Step 3: Create `src/components/feed/EventAnnouncementCard.tsx`**
  Render event details with Liturgical Ministry Roster (Presider, Choir, Lector, Sponsor), 1-tap Google Maps directions link, and "View Full Choir Schedule" trigger.

- [ ] **Step 4: Create `src/components/feed/CommunityFeed.tsx`**
  Assemble timeline rendering appropriate card by `post_type`.

- [ ] **Step 5: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`  
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/feed/
  git commit -m "feat: add feed cards for prayer intentions, YouTube videos, and event rosters"
  ```

---

### Task 6: Unified Post Composer Modal

**Files:**
- Create: `src/components/feed/PostComposerModal.tsx`

**Interfaces:**
- Consumes: `communityFeedApi.createPost`, `compressImageToWebP`.
- Produces: Accessible modal allowing text, YouTube URL input, WebP photo upload notice, and intention category selector.

- [ ] **Step 1: Implement `PostComposerModal.tsx`**
  - Text area for reflection / update.
  - Expandable row for pasting YouTube or YouTube Shorts links.
  - WebP compression attachment trigger with badge explaining the free-tier guard.
  - Category selector for prayer intentions (`healing`, `thanksgiving`, `special`, `repose`).
  - Submit action publishing to `community_posts`.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`  
  Expected: PASS.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/feed/PostComposerModal.tsx
  git commit -m "feat: add unified post composer modal with YouTube and WebP support"
  ```

---

### Task 7: Choir Rotation & Liturgical Ministry Modal

**Files:**
- Create: `src/components/events/ChoirRotationModal.tsx`

**Interfaces:**
- Consumes: Upcoming 9-day novena masses from `eventsApi`.
- Produces: Modal showcasing multi-day choir assignments, presiding clergy, and sponsor chapters.

- [ ] **Step 1: Implement `ChoirRotationModal.tsx`**
  - Displays schedule of Mass 1 through Mass 9 with assigned chapter choirs (`Coro de Santo Niño`, `Auckland Catholic Youth Choir`, etc.) and presiders.
  - Includes button to contact Music Ministry coordinator for chapter choir registration.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`  
  Expected: PASS.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/events/ChoirRotationModal.tsx
  git commit -m "feat: add choir rotation and liturgical roster schedule modal"
  ```

---

### Task 8: Interactive 9-Day Novena & Audio Hymn Reader

**Files:**
- Create: `src/components/prayers/NovenaReaderModal.tsx`
- Add: `public/audio/bato-balani.mp3` (or sample audio asset)

**Interfaces:**
- Consumes: Novena prayer text, `novenaApi.markDayCompleted`.
- Produces: Interactive reader with 1–9 day progress dots, HTML5 `<audio>` player for *Bato Balani sa Gugma*, and "Mark Day as Completed" action.

- [ ] **Step 1: Implement `NovenaReaderModal.tsx`**
  - Opening prayers, daily petitions, and litanies formatted with `Cinzel` headings.
  - Audio hymn player with play/pause state streaming from `/public/audio/`.
  - "Mark Day as Completed" button updating `novena_progress` and triggering 1-tap feed share.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`  
  Expected: PASS.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/prayers/NovenaReaderModal.tsx
  git commit -m "feat: add interactive 9-day novena reader and audio hymn player modal"
  ```

---

### Task 9: Discord-Style Profile Honor Ribbons Modal

**Files:**
- Create: `src/components/profile/HonorRibbonsModal.tsx`

**Interfaces:**
- Consumes: `badgesApi.getUserBadges(userId)`.
- Produces: Profile shelf displaying verified honors:
  - Sinulog Dancers with multi-year streaks (`'24, '25, '26`).
  - Media Guild (Official Photographer / Videographer).
  - Music Ministry (Choir Member).
  - Liturgical Servants (Priest, Deacon, Lector, Server).
  - Festival Partners & Food Vendors.

- [ ] **Step 1: Implement `HonorRibbonsModal.tsx`**
  - Grid shelf showcasing active badges with icons, titles, and year tags.
  - Tapping any badge opens verification details.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`  
  Expected: PASS.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/profile/HonorRibbonsModal.tsx
  git commit -m "feat: add Discord-style profile honor ribbons modal"
  ```

---

### Task 10: Social Feed Homepage & Layout Integration

**Files:**
- Modify: `src/app/(main)/page.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/BottomNav.tsx`

**Interfaces:**
- Consumes: Components from Tasks 4–9.
- Produces: Complete responsive social feed replacing the old dashboard:
  - Desktop (≥768px): 3-column layout (Shortcuts on left, Feed in center, Devotion/Event widgets on right).
  - Mobile (<768px): Streamlined 4-tab bottom navigation (`Feed`, `Events`, `Novena`, `Profile`).

- [ ] **Step 1: Update `src/components/layout/Header.tsx`**
  Add Santo Niño crown logo, search input, notification bell, and user avatar with Discord-style status dot.

- [ ] **Step 2: Update `src/components/layout/Sidebar.tsx`**
  Add devotee quick card with badge flairs, navigation shortcuts, and NZ area chapter directory.

- [ ] **Step 3: Update `src/components/layout/BottomNav.tsx`**
  Implement 4-tab mobile navigation (`Feed`, `Events`, `Novena`, `Profile`).

- [ ] **Step 4: Update `src/app/(main)/page.tsx`**
  Render the 3-column community feed layout integrating `StoriesBar`, `PostComposerModal`, `CommunityFeed`, `DailyDevotionWidget`, and `UpcomingCalendarWidget`.

- [ ] **Step 5: Run full production static build**
  Run: `npm run build`  
  Expected: PASS (all 19+ static routes pre-rendered with zero errors).

- [ ] **Step 6: Commit and push**
  ```bash
  git add src/app/(main)/page.tsx src/components/layout/
  git commit -m "feat: integrate community social feed layout and 4-tab mobile navigation"
  git push origin main
  ```

---

## Self-Review Checklist

1. **Spec Coverage:** Skimmed against [`2026-11-07-community-feed-design.md`](file:///C:/Projects/santoninonz-devotees/docs/superpowers/specs/2026-11-07-community-feed-design.md).
   - Social feed, stories bar, YouTube embed, WebP compression, prayer intention counter, choir rotation, Discord badges, and map navigation are all covered in Tasks 1–10.
2. **Step Scan:** Every step specifies exact files, interfaces, CLI verification commands, and expected outputs.
3. **Type Consistency:** Schema uses `community_posts` to avoid collisions with the shared Supabase CMS `posts` table used by `santoninonz-admin` and `santoninonz-web`.
4. **Review Focus:** Addressed all 5 review focus items (table collision, build fallbacks, mobile touch scroll, null safety for roster fields, and Amen reaction idempotency).
5. **Proportion:** Plan is focused and modular without duplicate transcript code.
