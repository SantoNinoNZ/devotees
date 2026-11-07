# Santo Niño NZ Devotees — Community Social Platform Design Specification

**Date:** 2026-11-07  
**Status:** Approved by User  
**Target Audience:** Santo Niño devotee community in New Zealand, Hermanos/Hermanas, Area Coordinators, Dance Troupes, and Administrators.

---

## 1. Executive Summary & Problem Statement

The previous concept for the Devotees application was heavily focused on siloed dashboard menus and forms, creating friction and feeling overly complex for everyday community members. 

This design pivots the application into a **Facebook-style, community-driven social hub** tailored for the Santo Niño NZ community. It blends the warmth and familiar UX of social media (feed, stories, post composer, photos, comments, and reactions) with sacred devotional practices (daily 9-day Novena prayers, community intention requests, event calendars/RSVPs, and Pilgrim Image house blessings).

Additionally, the architecture is specifically optimized for **Supabase Free Tier limits** by leveraging responsive YouTube video embedding (zero video storage/bandwidth cost) and browser-side WebP image compression.

---

## 2. User Roles & Permission Model

| Role | Badge | Permissions |
|------|-------|-------------|
| **Devotee** (General Member) | Member Tag / Area Chapter | Post reflections, share photos, embed YouTube videos, submit prayer intentions, mark Novena completion, RSVP to events, comment and react (*🙏 Amen*, *❤️ Care*, *👍 Like*), report content. |
| **Hermano / Hermana** | `Verified Hermana/Hermano` (Gold badge) | All Devotee permissions + create official event announcements, collect intentions for Saturday Mass list, review & coordinate House Blessing visits, hide/moderate reported posts. |
| **Coordinator / Leader** | `Area Coordinator` / `Dance Leader` | All Devotee permissions + create area chapter events/rehearsals, manage dance group member lists, pin announcements. |
| **Super Admin** | `Administrator` | Full system administration, role assignment, content moderation. |

---

## 3. Responsive UX & Layout Architecture

### 3.1 Mobile Viewport (`< 768px`)
- **Sticky Top Bar:** Santo Niño NZ branding (`👑`), global search shortcut, and notification bell (`🔔`).
- **Devotional Stories Carousel:** Horizontal card strip directly below header:
  - *Today's Novena* (Day X of 9 progress)
  - *Daily Gospel / Reading*
  - *Fiesta 2027 Countdown*
  - *Add Story / Photo*
- **Main Stream:** Single-column timeline with rich cards (Social Posts, Prayer Cards, Event RSVPs).
- **Streamlined 4-Tab Bottom Navigation:**
  1. `🏠 Feed`: Main community stream, composer, and devotion stories.
  2. `📅 Events`: Mass schedules, Sinulog rehearsal calendar, RSVP tracking.
  3. `📿 Prayers`: Interactive 9-Day Novena reader, hymns (*Bato Balani sa Gugma* audio), and intentions wall.
  4. `☰ Menu`: Pilgrim Image house blessing requests, area chapter directories, dance troupe hubs, profile access, and settings.

### 3.2 Desktop Viewport (`≥ 768px`)
A full 3-column Facebook-style layout:
- **Left Sidebar (`w-64`):**
  - Navigation shortcuts (`Feed`, `Events Calendar`, `Novena Prayers`, `House Blessing Visits`).
  - Area chapters (`Auckland Central`, `North Shore`, `West Auckland`).
  - Ministry groups (`Sinulog Dance Troupe`, `Sinulog Queen Committee`, `Hermano Council`).
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
- **Composer Modes:**
  1. **General Reflection / Update:** Devotee message with optional photo attachments.
  2. **Prayer Intention Request:** Dedicated modal selecting category (*Healing*, *Thanksgiving*, *Special Intention*, *Eternal Repose*), optional privacy toggle (Public vs Hermanos Only).
  3. **Event Announcement:** (Restricted to Hermanos/Coordinators/Admins) with event title, date/time, venue address, and RSVP limit.
- **Media Optimization (Free Tier Guard):**
  - **Photos:** Handled via browser-side WebP compression (`max 300KB` per image, max 4 images per post) before upload to Supabase Storage bucket `community-media`.
  - **Videos:** Handled via **YouTube URL Embedding**. Devotees paste any standard YouTube or Shorts URL (`youtube.com/watch?v=...` or `youtu.be/...`). The client parses the video ID and renders a native-feeling 16:9 embedded player with zero Supabase storage or bandwidth consumption.

### 4.2 Interactive Novena & Hymn Experience
- **9-Day Novena Guide:**
  - Day selector (Day 1 through Day 9) with visual completion indicator.
  - Opening prayers, daily reflection, petitions, and litany.
  - Embedded audio player for *Bato Balani sa Gugma* with synchronized lyrics and wave animation.
  - **"Mark Day as Completed"** action: Updates member's personal streak and prompts optional one-tap share to feed: *"Just completed Day 3 of the Santo Niño Novena! Viva Pit Señor! 📿"*.

### 4.3 Community Prayer Intentions Board
- Intentions posted on the feed appear as high-visibility devotional cards.
- **"🙏 Amen / Praying"** interaction: Tapping adds to the live prayer count and notifies the author: *"Brother Jun and 14 others prayed for your intention"*.
- Hermanos can filter and export intentions into the liturgical prayer list for the upcoming Saturday Novena Mass.

### 4.4 Events & Sinulog Practice Schedules
- Event cards with venue map preview, date/time badge, and RSVP status (`Going`, `Interested`, `Can't Go`).
- Attendee avatar preview (e.g. *"Maria, Jun, and 28 others are attending"*).
- One-tap "Add to Device Calendar" (`.ics` generation or Google Calendar link).

### 4.5 User Profile & Faith Identity
- **Header:** Cover photo, avatar, verified servant badge (e.g. `Verified Hermana`), area chapter, and bio.
- **Devotional Badges:** Area chapter, Novena completion streaks, Pilgrim Image host history.
- **Profile Tabs:**
  - `Posts`: User's feed contributions and shared photos.
  - `Intentions`: Prayer requests authored by the user (with ability to mark as *"Answered / Thanksgiving"*).
  - `Events Attending`: Upcoming events the user is attending.
  - `About`: Chapter affiliation and volunteer details.

### 4.6 Moderation & Safety
- Devotees can report posts via `••• -> Report Content`.
- Hermanos, Coordinators, and Admins have inline moderation controls:
  - `Hide Post from Community Feed`
  - `Delete Post`
  - `Pin Announcement to Top of Feed`

---

## 5. Phased Roadmap

- **Phase 1 (Current Scope):**
  - 4-tab mobile navigation and 3-column desktop layout.
  - Post composer with text, compressed photos, and YouTube video embeds.
  - Feed interactions: Comments, reactions (*🙏 Amen*, *❤️ Care*, *👍 Like*), native Web Share.
  - Interactive Novena reader with audio hymn player and completion sharing.
  - Prayer intentions wall and Saturday Mass prayer collection.
  - Events calendar and RSVP system.
  - Devotee user profiles with badges and chapter tags.
  - Hermano/Admin moderation controls.

- **Phase 2 (Future Scope):**
  - Realtime direct messaging (DMs) between Devotees and Hermanos/Coordinators.
  - Push notifications via Web Push API.
  - Automated prayer intention reminders.

---

## 6. Database Schema Extensions (Supabase / PostgreSQL)

Existing tables in project: `profiles`, `areas`, `dance_groups`, `user_roles`, `sinulog_queens`.

### New Tables to Add:
1. **`posts`**
   - `id` (uuid, primary key)
   - `author_id` (uuid, references `profiles.id`)
   - `post_type` (text: `general`, `prayer_request`, `event`, `novena_completion`)
   - `content` (text)
   - `media_urls` (text array, Supabase storage URLs for photos)
   - `youtube_video_id` (text, nullable)
   - `intention_category` (text, nullable: `healing`, `thanksgiving`, `special`, `repose`)
   - `is_pinned` (boolean, default false)
   - `is_hidden` (boolean, default false)
   - `created_at` (timestamp with time zone)
   - `updated_at` (timestamp with time zone)

2. **`post_reactions`**
   - `id` (uuid, primary key)
   - `post_id` (uuid, references `posts.id` on delete cascade)
   - `user_id` (uuid, references `profiles.id`)
   - `reaction_type` (text: `amen`, `heart`, `like`)
   - `created_at` (timestamp)
   - *Unique constraint:* `(post_id, user_id)`

3. **`post_comments`**
   - `id` (uuid, primary key)
   - `post_id` (uuid, references `posts.id` on delete cascade)
   - `author_id` (uuid, references `profiles.id`)
   - `content` (text)
   - `created_at` (timestamp)

4. **`novena_progress`**
   - `id` (uuid, primary key)
   - `user_id` (uuid, references `profiles.id`)
   - `day_number` (int, 1 to 9)
   - `completed_at` (timestamp)
   - `cycle_year` (int, e.g. 2026)
   - *Unique constraint:* `(user_id, day_number, cycle_year)`

5. **`event_rsvps`**
   - `id` (uuid, primary key)
   - `event_id` (uuid, references `events.id`)
   - `user_id` (uuid, references `profiles.id`)
   - `status` (text: `going`, `interested`, `declined`)
   - `created_at` (timestamp)
   - *Unique constraint:* `(event_id, user_id)`

---

## 7. Verification & Success Criteria

1. **Responsive Verification:**
   - On screens `< 768px`: bottom navigation bar renders 4 tabs (`Feed`, `Events`, `Prayers`, `Menu`), desktop sidebars are hidden.
   - On screens `≥ 768px`: 3-column layout displays navigation on left, feed in middle, devotion/event widgets on right.
2. **Posting & Free-Tier Media:**
   - Creating a post with a YouTube link embeds a playable YouTube iframe.
   - Attaching an image compresses the file before saving to storage bucket.
3. **Prayer & Novena Flow:**
   - Devotees can navigate days 1-9 of the Novena and play *Bato Balani sa Gugma*.
   - Marking a day completed saves to `novena_progress` and offers 1-tap feed share.
   - Prayer intention posts display with *"🙏 Amen"* button and live count.
4. **Events & RSVPs:**
   - Events render with date/venue and interactive RSVP toggle (`Going` / `Interested`).
5. **User Profile:**
   - Profile renders cover, avatar, devotee role badge, and history tabs.
