# Disney Cruise Trivia Study Hub

A webapp for Disney cruisers to study trivia, take quizzes, and search a Q&A database. Perfect for preparing for onboard trivia games!

## Features

- **Multiple Quiz Categories**: Disney Movies, Parks, Cruise Line, and Mixed
- **Quiz Modes**: Practice (instant feedback), Timed, and Study modes
- **Full-Text Search**: Search across all questions and answers
- **Progress Tracking**: Track your scores with local storage
- **Disney-Themed UI**: Navy blue and gold color scheme with smooth animations

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (optional - works with local data)
- **Hosting**: Vercel-ready

## Getting Started

### 1. Install Dependencies

```bash
cd disney-trivia
npm install
```

### 2. Configure Supabase (Optional)

The app works out of the box with local seed data. To enable Supabase:

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema in `supabase-schema.sql` in the Supabase SQL Editor
3. Copy `.env.local.example` to `.env.local`
4. Add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 to see the app.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
disney-trivia/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── quiz/              # Quiz pages
│   ├── search/            # Search page
│   ├── progress/          # Progress tracking page
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── questions.ts      # Question fetching logic
│   └── progress.ts       # Local progress tracking
├── data/                  # Seed data
│   └── seed-questions.json
├── types/                 # TypeScript types
└── supabase-schema.sql   # Database schema
```

## Seeding Additional Questions

To add more questions:

1. Edit `data/seed-questions.json` with new questions following the existing format
2. If using Supabase, import the questions via the Supabase dashboard or API

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables (if using Supabase)
4. Deploy

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform that supports Node.js.

## License

MIT
