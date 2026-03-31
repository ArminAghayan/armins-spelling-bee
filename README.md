# Armin's Spelling Bee

Live multiplayer spelling bee built with Next.js 15, Supabase Realtime, and Azure TTS.

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.local` and fill in your keys (already populated):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_AZURE_TTS_KEY=
NEXT_PUBLIC_AZURE_TTS_REGION=
```

## Deploy to Cloudflare Pages

1. `npm run build` — generates `out/` folder
2. Push to GitHub
3. In Cloudflare Pages, connect the repo:
   - **Build command**: `npm run build`
   - **Output directory**: `out`
4. Add env vars in Cloudflare Pages dashboard

## Supabase Table

Run this in your Supabase SQL editor:

```sql
create table hof_scores (
  id bigint generated always as identity primary key,
  name text not null,
  score int not null,
  words int default 0,
  difficulty text default 'easy',
  created_at timestamptz default now()
);
alter table hof_scores enable row level security;
create policy "Anyone can read scores" on hof_scores for select using (true);
create policy "Anyone can insert scores" on hof_scores for insert with check (true);
```
