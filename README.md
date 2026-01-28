# LIFE - A Calm Space for Meaningful Decisions

LIFE is a personal reflection and decision-making app built with Next.js and Supabase. It provides a calm, thoughtful space to make meaningful life decisions, keep a private journal, and track your personal growth journey.

## Features

- 🔐 **Invite-Only Access** - Private beta with invite code system
- 🔑 **Google OAuth** - Secure authentication with Google
- 📔 **Private Journal** - Write and reflect on your thoughts
- ⚖️ **Decision Tracker** - Log and reflect on important decisions
- 🌙 **Dark/Light Mode** - Choose your preferred theme
- 👤 **Username Reservation** - Claim your unique username for future features
- 📱 **Responsive Design** - Works beautifully on all devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Styling**: CSS Modules
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/life-app.git
cd life-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project at [supabase.com](https://supabase.com)

4. Copy the environment file:
```bash
cp .env.local.example .env.local
```

5. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Run the SQL migrations in your Supabase SQL Editor:
   - `supabase/schema.sql` - Main database schema
   - `supabase/invite_codes.sql` - Invite code system
   - `supabase/fix_oauth_trigger.sql` - OAuth user handling
   - `supabase/add_username.sql` - Username feature

7. Enable Google OAuth in Supabase:
   - Go to Authentication → Providers → Google
   - Add your Google OAuth credentials

8. Run the development server:
```bash
npm run dev
```

9. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Update Supabase redirect URLs to include your production domain

### Important for Production

- Update Google OAuth redirect URI in Google Cloud Console
- Update Supabase Site URL and Redirect URLs
- Keep your Supabase keys secure

## License

Private project - All rights reserved

---

Built with ❤️ for meaningful reflection
