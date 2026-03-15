# StreamRank Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a streaming prototype with leaderboard gamification for academic research (PF2 — UNISINOS).

**Architecture:** Next.js App Router client-side app communicating with Supabase (PostgreSQL + Realtime). All pages are `"use client"` since they depend on localStorage and realtime subscriptions. No authentication — users register with a name, stored as UUID in localStorage.

**Tech Stack:** Next.js 15, Tailwind CSS 4, DaisyUI 5, Supabase JS SDK, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-15-streamrank-design.md`

---

## File Structure

```
app/
  layout.tsx            — root layout: HTML shell, tema streamrank, fonte
  page.tsx              — redirect logic: localStorage check → /catalogo or /registro
  registro/page.tsx     — registration form (name only)
  catalogo/page.tsx     — video grid + leaderboard + header
  player/[id]/page.tsx  — YouTube player + like/dislike + leaderboard
components/
  Header.tsx            — user name display + questionnaire placeholder link
  Leaderboard.tsx       — top 10 ranking, realtime subscription
  VideoCard.tsx         — catalog card (thumbnail, title, interaction indicator)
  LikeDislike.tsx       — like/dislike buttons with upsert logic
lib/
  supabase.ts           — Supabase browser client singleton
<!-- no tailwind.config.ts needed — Tailwind 4 uses CSS-based config -->
```

---

## Chunk 1: Project Setup & Infrastructure

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/lts/dev/prototipo-pf2
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias="@/*" --turbopack
```

Accept defaults. This creates the full Next.js scaffold with Tailwind CSS 4.

- [ ] **Step 2: Verify it runs**

```bash
cd /Users/lts/dev/prototipo-pf2
npm run dev
```

Expected: Dev server starts at localhost:3000, default Next.js page renders.

- [ ] **Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with Tailwind"
```

---

### Task 2: Install DaisyUI and configure streamrank theme

**Files:**
- Modify: `package.json` (add daisyui)
- Modify: `app/globals.css` (add daisyui plugin + custom theme via CSS)

Tailwind CSS 4 uses CSS-based config (`@import "tailwindcss"`). DaisyUI 5 uses `@plugin "daisyui"`. Custom themes are defined via `@plugin "daisyui/theme"` blocks in CSS — no `tailwind.config.ts` needed.

- [ ] **Step 1: Install DaisyUI**

```bash
npm install daisyui@latest
```

- [ ] **Step 2: Update globals.css with DaisyUI plugin and custom streamrank theme**

Replace `app/globals.css` content with:

```css
@import "tailwindcss";
@plugin "daisyui";
@plugin "daisyui/theme" {
  name: "streamrank";
  default: true;
  --color-primary: #f59e0b;
  --color-primary-content: #0c0a09;
  --color-secondary: #d97706;
  --color-secondary-content: #ffffff;
  --color-accent: #fbbf24;
  --color-accent-content: #0c0a09;
  --color-neutral: #292524;
  --color-neutral-content: #e7e5e4;
  --color-base-100: #0c0a09;
  --color-base-200: #1c1917;
  --color-base-300: #292524;
  --color-base-content: #e7e5e4;
  --color-info: #38bdf8;
  --color-success: #4ade80;
  --color-warning: #fb923c;
  --color-error: #f87171;
}
```

Note: With `default: true`, the theme applies automatically without needing `data-theme` on the HTML element. If the theme doesn't apply, add `data-theme="streamrank"` to the `<html>` tag as fallback.

- [ ] **Step 3: Set lang and base styles on layout**

In `app/layout.tsx`, update the root layout:

```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="streamrank">
      <body className="min-h-screen bg-base-100 text-base-content">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Delete tailwind.config.ts if it exists**

Next.js with Tailwind 4 may not generate this file, but if it exists from the scaffold, delete it — Tailwind 4 does not use it.

```bash
rm -f tailwind.config.ts tailwind.config.js
```

- [ ] **Step 5: Verify theme works**

```bash
npm run dev
```

Visit localhost:3000. Page should have dark background (`#0c0a09`). Inspect the page to confirm DaisyUI classes (e.g., `bg-base-100`) resolve to the streamrank colors.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add DaisyUI with custom streamrank theme"
```

---

### Task 3: Configure Supabase client

**Files:**
- Create: `lib/supabase.ts`
- Create: `.env.local` (gitignored)

- [ ] **Step 1: Install Supabase SDK**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create .env.local**

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Verify `.env.local` is in `.gitignore` (Next.js scaffold includes it by default).

- [ ] **Step 3: Create Supabase client**

Create `lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add Supabase client configuration"
```

---

### Task 4: Create database schema in Supabase

**Files:** None (SQL executed in Supabase dashboard or via MCP)

- [ ] **Step 1: Run table creation SQL**

Execute in Supabase SQL Editor (or via MCP tool `execute_sql`):

```sql
create table public.profiles (
  id uuid default gen_random_uuid() primary key,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

create table public.videos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  created_at timestamptz default now()
);

create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  type text check (type in ('like', 'dislike')) not null,
  created_at timestamptz default now(),
  unique (user_id, video_id)
);
```

- [ ] **Step 2: Create leaderboard view**

```sql
create or replace view public.leaderboard as
select
  p.id,
  p.display_name,
  p.avatar_url,
  count(i.id)::int as total_interactions,
  rank() over (order by count(i.id) desc)::int as position
from public.profiles p
left join public.interactions i on p.id = i.user_id
group by p.id, p.display_name, p.avatar_url
order by total_interactions desc;
```

- [ ] **Step 3: Enable Realtime on interactions table**

In Supabase Dashboard → Database → Replication, enable realtime for the `interactions` table. Or via SQL:

```sql
alter publication supabase_realtime add table public.interactions;
```

- [ ] **Step 4: Seed videos**

Insert 15 YouTube shorts in pt-BR. The `video_url` field stores only the YouTube video ID. The embed URL is built at render time: `https://www.youtube.com/embed/{video_url}`. Thumbnail follows `https://img.youtube.com/vi/{id}/mqdefault.jpg`.

**Important:** The implementer must search YouTube Shorts for 15 real, currently available shorts in pt-BR before running this INSERT. The videos below are examples/placeholders — **replace each video ID and title with a real, working YouTube Short ID found via search**. Use diverse categories (humor, curiosidades, música, esporte, ciência, etc.).

To find shorts: search YouTube for "shorts em português" or browse Brazilian creator channels. Copy the video ID from the URL (e.g., `youtube.com/shorts/ABC123` → ID is `ABC123`).

```sql
insert into public.videos (title, description, video_url, thumbnail_url) values
  ('Short 1 - Título Real', 'Descrição breve', 'VIDEO_ID_1', 'https://img.youtube.com/vi/VIDEO_ID_1/mqdefault.jpg'),
  ('Short 2 - Título Real', 'Descrição breve', 'VIDEO_ID_2', 'https://img.youtube.com/vi/VIDEO_ID_2/mqdefault.jpg'),
  ('Short 3 - Título Real', 'Descrição breve', 'VIDEO_ID_3', 'https://img.youtube.com/vi/VIDEO_ID_3/mqdefault.jpg'),
  ('Short 4 - Título Real', 'Descrição breve', 'VIDEO_ID_4', 'https://img.youtube.com/vi/VIDEO_ID_4/mqdefault.jpg'),
  ('Short 5 - Título Real', 'Descrição breve', 'VIDEO_ID_5', 'https://img.youtube.com/vi/VIDEO_ID_5/mqdefault.jpg'),
  ('Short 6 - Título Real', 'Descrição breve', 'VIDEO_ID_6', 'https://img.youtube.com/vi/VIDEO_ID_6/mqdefault.jpg'),
  ('Short 7 - Título Real', 'Descrição breve', 'VIDEO_ID_7', 'https://img.youtube.com/vi/VIDEO_ID_7/mqdefault.jpg'),
  ('Short 8 - Título Real', 'Descrição breve', 'VIDEO_ID_8', 'https://img.youtube.com/vi/VIDEO_ID_8/mqdefault.jpg'),
  ('Short 9 - Título Real', 'Descrição breve', 'VIDEO_ID_9', 'https://img.youtube.com/vi/VIDEO_ID_9/mqdefault.jpg'),
  ('Short 10 - Título Real', 'Descrição breve', 'VIDEO_ID_10', 'https://img.youtube.com/vi/VIDEO_ID_10/mqdefault.jpg'),
  ('Short 11 - Título Real', 'Descrição breve', 'VIDEO_ID_11', 'https://img.youtube.com/vi/VIDEO_ID_11/mqdefault.jpg'),
  ('Short 12 - Título Real', 'Descrição breve', 'VIDEO_ID_12', 'https://img.youtube.com/vi/VIDEO_ID_12/mqdefault.jpg'),
  ('Short 13 - Título Real', 'Descrição breve', 'VIDEO_ID_13', 'https://img.youtube.com/vi/VIDEO_ID_13/mqdefault.jpg'),
  ('Short 14 - Título Real', 'Descrição breve', 'VIDEO_ID_14', 'https://img.youtube.com/vi/VIDEO_ID_14/mqdefault.jpg'),
  ('Short 15 - Título Real', 'Descrição breve', 'VIDEO_ID_15', 'https://img.youtube.com/vi/VIDEO_ID_15/mqdefault.jpg');
```

- [ ] **Step 5: Verify data**

```sql
select count(*) from public.videos;       -- should return 15
select * from public.leaderboard limit 5; -- should return empty (no interactions yet)
```

---

## Chunk 2: Registration & Routing

### Task 5: Build registration page (`/registro`)

**Files:**
- Create: `app/registro/page.tsx`

- [ ] **Step 1: Create registration page**

Create `app/registro/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Por favor, informe seu nome.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: dbError } = await supabase
      .from("profiles")
      .insert({ display_name: trimmed })
      .select("id")
      .single();

    if (dbError || !data) {
      setError("Erro ao registrar. Tente novamente.");
      setLoading(false);
      return;
    }

    localStorage.setItem("streamrank_profile_id", data.id);
    router.push("/catalogo");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <form onSubmit={handleSubmit} className="card bg-base-200 shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary text-center mb-2">
          StreamRank
        </h1>
        <p className="text-center text-base-content/70 mb-6">
          Plataforma de streaming com placar
        </p>

        <label className="label mb-1">
          <span className="label-text">Qual é o seu nome?</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-primary w-full mb-4"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          autoFocus
        />

        {error && <p className="text-error text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner" /> : "Entrar"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders**

```bash
npm run dev
```

Visit `localhost:3000/registro`. Should show dark page with centered card, name input, and "Entrar" button.

- [ ] **Step 3: Test registration flow**

1. Type a name and click "Entrar"
2. Check Supabase dashboard → `profiles` table should have new row
3. Browser should redirect to `/catalogo` (will 404 for now, that's OK)
4. Open browser DevTools → Application → localStorage → verify `streamrank_profile_id` is set

- [ ] **Step 4: Commit**

```bash
git add app/registro/page.tsx
git commit -m "feat: add registration page with Supabase profile creation"
```

---

### Task 6: Build root redirect (`/`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace default page with redirect logic**

Replace `app/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      const profileId = localStorage.getItem("streamrank_profile_id");
      if (!profileId) {
        router.replace("/registro");
        return;
      }

      // Validate profile still exists in database (handles DB reset)
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", profileId)
        .maybeSingle();

      if (data) {
        router.replace("/catalogo");
      } else {
        localStorage.removeItem("streamrank_profile_id");
        router.replace("/registro");
      }
    }
    checkProfile();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}
```

This validates the stored profile ID against the database. If the profile doesn't exist (e.g., after a DB reset during development), it clears localStorage and redirects to registration.

- [ ] **Step 2: Verify redirect works**

1. Clear localStorage → visit `/` → should redirect to `/registro`
2. Register a name → visit `/` → should redirect to `/catalogo`

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add root page with localStorage redirect logic"
```

---

## Chunk 3: Core Components

### Task 7: Build Header component

**Files:**
- Create: `components/Header.tsx`

- [ ] **Step 1: Create Header component**

Create `components/Header.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const QUESTIONNAIRE_URL = "#"; // placeholder — substituir pela URL real do questionário

export default function Header() {
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const profileId = localStorage.getItem("streamrank_profile_id");
      if (!profileId) return;

      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", profileId)
        .single();

      if (data) setDisplayName(data.display_name);
    }
    fetchProfile();
  }, []);

  return (
    <header className="navbar bg-base-200 border-b border-neutral px-4">
      <div className="flex-1">
        <span className="text-xl font-bold text-primary">StreamRank</span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href={QUESTIONNAIRE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-primary btn-sm"
        >
          Responder questionário
        </a>
        {displayName && (
          <span className="text-base-content/70 text-sm">
            Olá, <span className="text-primary font-medium">{displayName}</span>
          </span>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: add Header component with user name and questionnaire link"
```

---

### Task 8: Build Leaderboard component

**Files:**
- Create: `components/Leaderboard.tsx`

- [ ] **Step 1: Create Leaderboard component**

Create `components/Leaderboard.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_interactions: number;
  position: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .limit(10);
    if (data) setEntries(data);
  }

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("streamrank_profile_id"));
    fetchLeaderboard();

    const channel = supabase
      .channel("interactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interactions" },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div className="card bg-base-200 p-4">
      <h2 className="text-lg font-bold text-primary mb-3">Placar</h2>
      {entries.length === 0 ? (
        <p className="text-base-content/50 text-sm">Nenhuma interação ainda.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const isCurrentUser = entry.id === currentUserId;
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  isCurrentUser
                    ? "border-2 border-accent bg-base-300"
                    : "bg-base-100"
                }`}
              >
                <span
                  className={`text-sm font-bold w-6 text-center ${
                    entry.position === 1 ? "text-accent" : "text-base-content/50"
                  }`}
                >
                  {entry.position}º
                </span>
                <div className="avatar placeholder">
                  <div
                    className={`w-8 h-8 rounded-full ${
                      entry.position === 1 ? "bg-accent text-accent-content" : "bg-neutral text-neutral-content"
                    }`}
                  >
                    <span className="text-xs">{getInitials(entry.display_name)}</span>
                  </div>
                </div>
                <span className="flex-1 text-sm truncate">{entry.display_name}</span>
                <span className="text-sm text-base-content/50">
                  {entry.total_interactions}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify component**

Temporarily import `<Leaderboard />` in any page and verify it renders the "Placar" heading with empty state message.

- [ ] **Step 3: Commit**

```bash
git add components/Leaderboard.tsx
git commit -m "feat: add Leaderboard component with realtime subscription"
```

---

### Task 9: Build VideoCard component

**Files:**
- Create: `components/VideoCard.tsx`

- [ ] **Step 1: Create VideoCard component**

Create `components/VideoCard.tsx`:

```tsx
import Link from "next/link";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url: string | null;
  };
  userInteraction: "like" | "dislike" | null;
}

export default function VideoCard({ video, userInteraction }: VideoCardProps) {
  const thumbnail =
    video.thumbnail_url ||
    `https://img.youtube.com/vi/${video.video_url}/mqdefault.jpg`;

  return (
    <Link href={`/player/${video.id}`}>
      <div className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer overflow-hidden">
        <figure className="relative">
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />
          {userInteraction && (
            <span
              className={`absolute top-2 right-2 badge badge-sm ${
                userInteraction === "like" ? "badge-success" : "badge-error"
              }`}
            >
              {userInteraction === "like" ? "👍" : "👎"}
            </span>
          )}
        </figure>
        <div className="card-body p-3">
          <h3 className="card-title text-sm">{video.title}</h3>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/VideoCard.tsx
git commit -m "feat: add VideoCard component with interaction indicator"
```

---

### Task 10: Build LikeDislike component

**Files:**
- Create: `components/LikeDislike.tsx`

- [ ] **Step 1: Create LikeDislike component**

Create `components/LikeDislike.tsx`:

```tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface LikeDislikeProps {
  videoId: string;
  userId: string;
  interaction: "like" | "dislike" | null;
  onInteractionChange: (newType: "like" | "dislike") => void;
}

export default function LikeDislike({
  videoId,
  userId,
  interaction,
  onInteractionChange,
}: LikeDislikeProps) {
  const [loading, setLoading] = useState(false);

  async function handleInteraction(type: "like" | "dislike") {
    if (loading || interaction === type) return;

    setLoading(true);

    const { error } = await supabase.from("interactions").upsert(
      { user_id: userId, video_id: videoId, type },
      { onConflict: "user_id,video_id" }
    );

    if (!error) {
      onInteractionChange(type);
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-3">
      <button
        className={`btn ${
          interaction === "like" ? "btn-success" : "btn-outline btn-success"
        }`}
        onClick={() => handleInteraction("like")}
        disabled={loading}
      >
        👍 Gostei
      </button>
      <button
        className={`btn ${
          interaction === "dislike" ? "btn-error" : "btn-outline btn-error"
        }`}
        onClick={() => handleInteraction("dislike")}
        disabled={loading}
      >
        👎 Não gostei
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/LikeDislike.tsx
git commit -m "feat: add LikeDislike component with upsert logic"
```

---

## Chunk 4: Pages (Catálogo & Player)

### Task 11: Build catalog page (`/catalogo`)

**Files:**
- Create: `app/catalogo/page.tsx`

- [ ] **Step 1: Create catalog page**

Create `app/catalogo/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import VideoCard from "@/components/VideoCard";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
}

interface Interaction {
  video_id: string;
  type: "like" | "dislike";
}

export default function CatalogoPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profileId = localStorage.getItem("streamrank_profile_id");
    if (!profileId) {
      router.replace("/registro");
      return;
    }

    async function fetchData() {
      const [videosRes, interactionsRes] = await Promise.all([
        supabase.from("videos").select("*").order("created_at"),
        supabase
          .from("interactions")
          .select("video_id, type")
          .eq("user_id", profileId),
      ]);

      if (videosRes.data) setVideos(videosRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
      setLoading(false);
    }

    fetchData();
  }, [router]);

  function getUserInteraction(videoId: string): "like" | "dislike" | null {
    const found = interactions.find((i) => i.video_id === videoId);
    return found ? found.type : null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                userInteraction={getUserInteraction(video.id)}
              />
            ))}
          </div>
        </main>
        <aside className="w-full lg:w-80 shrink-0">
          <Leaderboard />
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify catalog page**

```bash
npm run dev
```

1. Visit `/catalogo` (must be logged in via localStorage)
2. Should show Header with user name, video grid with 15 thumbnails, and Leaderboard sidebar
3. Each card should link to `/player/[id]`

- [ ] **Step 3: Commit**

```bash
git add app/catalogo/page.tsx
git commit -m "feat: add catalog page with video grid and leaderboard"
```

---

### Task 12: Build player page (`/player/[id]`)

**Files:**
- Create: `app/player/[id]/page.tsx`

- [ ] **Step 1: Create player page**

Create `app/player/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import LikeDislike from "@/components/LikeDislike";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
}

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [interaction, setInteraction] = useState<"like" | "dislike" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profileId = localStorage.getItem("streamrank_profile_id");
    if (!profileId) {
      router.replace("/registro");
      return;
    }
    setUserId(profileId);

    async function fetchData() {
      const [videoRes, interactionRes] = await Promise.all([
        supabase.from("videos").select("*").eq("id", videoId).single(),
        supabase
          .from("interactions")
          .select("type")
          .eq("user_id", profileId)
          .eq("video_id", videoId)
          .maybeSingle(),
      ]);

      if (videoRes.data) setVideo(videoRes.data);
      if (interactionRes.data) setInteraction(interactionRes.data.type);
      setLoading(false);
    }

    fetchData();
  }, [videoId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <p className="text-error">Vídeo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
        <main className="flex-1">
          <div className="aspect-video w-full mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${video.video_url}`}
              title={video.title}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
          {video.description && (
            <p className="text-base-content/70 mb-4">{video.description}</p>
          )}
          <div className="flex items-center justify-between">
            {userId && (
              <LikeDislike
                videoId={videoId}
                userId={userId}
                interaction={interaction}
                onInteractionChange={(newType) => setInteraction(newType)}
              />
            )}
            <Link href="/catalogo" className="btn btn-ghost">
              ← Voltar ao catálogo
            </Link>
          </div>
        </main>
        <aside className="w-full lg:w-80 shrink-0">
          <Leaderboard />
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify player page**

1. From catalog, click a video card
2. Should show YouTube embed, title, description
3. Like/Dislike buttons should appear
4. Leaderboard sidebar should be visible

- [ ] **Step 3: Test interaction flow**

1. Click "Gostei" → button becomes filled green
2. Check Supabase `interactions` table → new row with type `'like'`
3. Leaderboard should update (position/count changes)
4. Click "Não gostei" → switches to filled red, Supabase row updates to `'dislike'`
5. Return to catalog → video card should show interaction indicator badge

- [ ] **Step 4: Commit**

```bash
git add app/player/\[id\]/page.tsx
git commit -m "feat: add player page with YouTube embed and like/dislike"
```

---

## Chunk 5: Final Verification

### Task 13: End-to-end verification

- [ ] **Step 1: Full flow test**

1. Clear localStorage
2. Visit `/` → redirected to `/registro`
3. Enter name → click "Entrar" → redirected to `/catalogo`
4. Verify: Header shows name, 15 video cards, Leaderboard sidebar
5. Click a video → player page with YouTube embed
6. Click "Gostei" → leaderboard updates in real time
7. Click "Voltar ao catálogo" → back to catalog, card shows like indicator
8. Click another video → click "Não gostei" → leaderboard count increases

- [ ] **Step 2: Test realtime with two tabs**

1. Open `/catalogo` in two browser tabs (same or different profiles)
2. In tab A: interact with a video
3. In tab B: leaderboard should update automatically without refresh

- [ ] **Step 3: Test responsive layout**

1. Resize browser to mobile width
2. Catalog: grid should collapse to single column, leaderboard below videos
3. Player: video fills width, leaderboard below

- [ ] **Step 4: Verify questionnaire placeholder**

1. Click "Responder questionário" in header
2. Should open a `#` link (placeholder) — confirm it's visible and clickable

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: verify full app flow and build"
```
