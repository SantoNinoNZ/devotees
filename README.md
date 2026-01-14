# Santo Niño NZ Devotees

A Progressive Web App (PWA) for the Santo Niño devotee community in New Zealand. This app serves as a central hub for community coordination, prayer requests, event management, and member communication.

## Features

- **Events Calendar** - View and RSVP to Sinulog festivals, novenas, and community gatherings
- **Prayer Requests** - Submit intentions and receive spiritual support from Hermanos
- **House Visit Requests** - Schedule home blessings with area Hermanos
- **Novena Prayers** - Daily prayers with progress tracking
- **Dance Coordination** - Practice schedules and attendance tracking for dance groups
- **Announcements** - Community news and casting calls for pageants
- **Push Notifications** - Targeted notifications by role and area

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| UI Library | Ant Design |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Deployment | GitHub Pages (Static Export) |

## User Roles

| Role | Description |
|------|-------------|
| Devotee | Basic community member |
| Hermano/Hermana | Spiritual leaders who handle prayer/visit requests |
| Coordinator | Area-based leaders (Pukekohe, North Shore, etc.) |
| Dance Leader | Manages dance group schedules |
| Sinulog Queen | Pageant title holders |
| Super Admin | System administrators |

## Related Projects

- [santoninonz-web](../santoninonz-web) - Public-facing website
- [santoninonz-admin](../santoninonz-admin) - Admin portal for content management

## Documentation

- [DESIGN.md](./DESIGN.md) - Technical design document with database schema and architecture
- [OVERVIEW.md](./OVERVIEW.md) - Non-technical overview for stakeholders
- [SUMMARY.md](./SUMMARY.md) - One-page quick summary

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (main)/            # Main app routes
│   └── admin/             # Admin section
├── components/            # React components
├── lib/                   # Utilities and API
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── styles/                # Global styles
```

## License

Private - Santo Niño NZ Trust
