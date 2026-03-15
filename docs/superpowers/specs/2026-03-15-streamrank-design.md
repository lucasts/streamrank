# Design Spec — Protótipo StreamRank

**Data**: 2026-03-15
**Status**: Aprovado

---

## 1. Visão geral

Protótipo de plataforma de streaming com gamificação (placar) para pesquisa acadêmica (PF2 — ADS/UNISINOS). Investiga o impacto de placares na percepção de engajamento. Usuários entram com nome, navegam vídeos shorts, avaliam com gostei/não gostei, e acompanham um ranking em tempo real.

## 2. Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js (App Router) |
| Estilização | Tailwind CSS + DaisyUI (tema custom `streamrank`) |
| Back-end | Supabase (PostgreSQL + Realtime) |
| Sessão | localStorage (`streamrank_profile_id`) |
| Vídeos | YouTube embeds (iframe) |

## 3. Modelo de dados (Supabase)

### Tabelas

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

### View

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

### Sem RLS — protótipo acadêmico de avaliação.

## 4. Estrutura de arquivos

```
app/
  layout.tsx            — tema streamrank, fonte, metadata
  page.tsx              — redireciona para /catalogo ou /registro
  registro/page.tsx     — formulário de nome
  catalogo/page.tsx     — grade de vídeos + leaderboard
  player/[id]/page.tsx  — player YouTube + like/dislike + leaderboard
components/
  Header.tsx            — nome do usuário + link questionário placeholder
  Leaderboard.tsx       — placar top 10, atualização realtime
  VideoCard.tsx         — card do catálogo (thumbnail, título, indicador)
  LikeDislike.tsx       — botões gostei/não gostei
lib/
  supabase.ts           — Supabase client (browser)
```

## 5. Rotas e fluxos

### `/` (page.tsx)
- Verifica localStorage para `streamrank_profile_id`
- Se existe: redireciona para `/catalogo`
- Se não existe: redireciona para `/registro`

### `/registro`
- Campo "Qual é o seu nome?" + botão "Entrar"
- Validação: nome não vazio, trim
- INSERT em `profiles` → salva `id` em localStorage → redireciona para `/catalogo`

### `/catalogo`
- Se não há profile_id em localStorage → redireciona para `/registro`
- **Header**: nome do usuário logado + link placeholder para questionário de avaliação ("Responder questionário" → URL placeholder)
- Fetch de todos os vídeos (`videos` table)
- Fetch das interações do usuário atual (para mostrar indicadores)
- Grade responsiva de `<VideoCard />` — thumbnail YouTube, título, indicador de like/dislike
- `<Leaderboard />` visível (sidebar em desktop, seção em mobile)
- Clique em card → `/player/[id]`

### `/player/[id]`
- Se não há profile_id → redireciona para `/registro`
- YouTube embed via iframe (modo embed do shorts)
- `<LikeDislike />` — botões gostei/não gostei
  - Se não existe interação: INSERT
  - Se existe e diferente: UPDATE (upsert via `ON CONFLICT`)
- `<Leaderboard />` visível
- Botão "Voltar ao catálogo"

## 6. Componentes

### `<Leaderboard />`
- Fetch da view `leaderboard` (top 10)
- Subscribe no canal `interactions` via Supabase Realtime
- A cada evento INSERT/UPDATE/DELETE → re-fetch da view
- Exibe: posição, iniciais em círculo (avatar), nome, total de interações
- Destaque do usuário atual com borda dourada (accent)

### `<VideoCard />`
- Props: video (dados), userInteraction (like/dislike/null)
- Thumbnail: `https://img.youtube.com/vi/{videoId}/mqdefault.jpg`
- Indicador visual de like (verde) / dislike (vermelho) se já avaliou
- Link para `/player/[id]`

### `<LikeDislike />`
- Props: videoId, userId, currentInteraction
- Dois botões: Gostei (success) / Não gostei (error)
- Estado ativo quando selecionado
- Upsert via Supabase client (INSERT ou UPDATE, sem DELETE)
- Otimistic update local + re-fetch

## 7. Realtime

- Subscribe na tabela `interactions` (canal público)
- Eventos: INSERT, UPDATE, DELETE
- Handler: re-fetch da view `leaderboard`
- Escopo: componente `<Leaderboard />` gerencia sua própria subscription
- Cleanup: unsubscribe no unmount

## 8. Identidade visual

Tema DaisyUI custom `streamrank` (do capítulo 4):

| Token | Cor | Uso |
|-------|-----|-----|
| primary | `#f59e0b` | Botões, destaques, links |
| secondary | `#d97706` | Variações de âmbar |
| accent | `#fbbf24` | Dourado — posição #1, badges |
| neutral | `#292524` | Cards, bordas |
| base-100 | `#0c0a09` | Fundo principal |
| base-200 | `#1c1917` | Fundo secundário |
| base-300 | `#292524` | Fundo terciário |
| base-content | `#e7e5e4` | Texto padrão |
| primary-content | `#0c0a09` | Texto sobre primary |
| secondary-content | `#ffffff` | Texto sobre secondary |
| accent-content | `#0c0a09` | Texto sobre accent |
| neutral-content | `#e7e5e4` | Texto sobre neutral |
| info | `#38bdf8` | Informativo |
| success | `#4ade80` | Gostei |
| warning | `#fb923c` | Alerta |
| error | `#f87171` | Não gostei |

Interface em português: "Gostei", "Não gostei", "Placar", "Entrar".

## 9. Seed de vídeos

15 shorts populares em pt-BR de canais brasileiros. YouTube embeds com thumbnails extraídas automaticamente via `img.youtube.com/vi/{id}/mqdefault.jpg`.

## 10. Decisões técnicas

1. **Client-side rendering** — todas as páginas são `"use client"` pois dependem de localStorage e Supabase Realtime
2. **Upsert para interações** — `ON CONFLICT (user_id, video_id) DO UPDATE SET type = $1`
3. **Sem toggle off** — uma vez avaliado, o usuário só pode trocar entre like/dislike (fiel ao PRD)
4. **Sem autenticação** — apenas nome + localStorage UUID
5. **Sem RLS** — protótipo de avaliação acadêmica
6. **Placeholder para questionário** — link/botão visível no catálogo apontando para URL placeholder

## 11. Fora de escopo

- Autenticação (e-mail, senha, OAuth)
- Upload de vídeos
- Comentários
- Sistema de notificações
- PWA / service workers
- Analytics além do placar
- Internacionalização (interface fixa em pt-BR)
