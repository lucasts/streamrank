# PRD — Protótipo StreamRank

**Documento de requisitos de produto para o protótipo de plataforma de streaming com placar (gamificação)**

| Versão | Data | Autor |
|--------|------|-------|
| 1.0 | 2026-03-14 | Lucas Teixeira Stephanou |

---

## 1. Visão geral

### 1.1 Contexto

Protótipo funcional para pesquisa acadêmica (Projeto Final II — ADS/UNISINOS) que investiga o impacto da técnica de gamificação de **placar** na percepção de engajamento de usuários em plataformas de streaming. O protótipo será avaliado por meio de questionário Likert e perguntas abertas após o uso.

### 1.2 Objetivo do produto

Desenvolver um site mock de streaming de vídeos curtos (shorts) onde:
- Usuários entram informando apenas o nome (sem fricção para teste)
- Navegam pelo catálogo, assistem vídeos e avaliam com **gostei** / **não gostei**
- Visualizam um **placar** em tempo real com o ranking dos usuários mais ativos
- O placar motiva comparação social e feedback imediato (modelo conceitual do artigo)

### 1.3 Princípios de design

- **Simplicidade técnica**: Next.js padrão + Supabase — evitar complexidades adicionais
- **Baixo atrito de entrada**: registro com apenas nome (sem e-mail, senha ou autenticação)
- **Feedback imediato**: placar atualiza em tempo real após cada interação
- **Identidade visual distinta**: tema âmbar/dourado sobre fundo escuro (diferenciar de Netflix, Spotify, etc.)

---

## 2. Stack técnica

| Camada | Tecnologia | Observações |
|--------|------------|-------------|
| Framework | Next.js (App Router) | Padrão, sem configurações exóticas |
| Estilização | Tailwind CSS + DaisyUI | Componentes prontos, tema customizado |
| Back-end | Supabase | PostgreSQL, Realtime (WebSockets) |
| Armazenamento local | localStorage | Para guardar `profile_id` (UUID do usuário) |
| Assets | IA Generativa | Miniaturas, elementos visuais quando necessário |

---

## 3. Modelo de dados

### 3.1 Entidades

#### `profiles`
| Campo | Tipo | Descrição |
|-------|------|------------|
| id | uuid (PK) | Gerado automaticamente |
| display_name | text | Nome informado na tela de registro |
| avatar_url | text | Opcional — pode ser null inicialmente |
| created_at | timestamptz | Data de criação |

#### `videos`
| Campo | Tipo | Descrição |
|-------|------|------------|
| id | uuid (PK) | Gerado automaticamente |
| title | text | Título do vídeo |
| description | text | Descrição opcional |
| video_url | text | URL do vídeo (ex.: YouTube embed, arquivo hospedado) |
| thumbnail_url | text | URL da miniatura |
| created_at | timestamptz | Data de criação |

#### `interactions`
| Campo | Tipo | Descrição |
|-------|------|------------|
| id | uuid (PK) | Gerado automaticamente |
| user_id | uuid (FK → profiles) | Quem interagiu |
| video_id | uuid (FK → videos) | Em qual vídeo |
| type | text | `'like'` ou `'dislike'` |
| created_at | timestamptz | Data da interação |
| UNIQUE(user_id, video_id) | constraint | Uma avaliação por usuário por vídeo |

#### `leaderboard` (view)
- Agregação: `count(interactions)` por usuário
- Campos: `id`, `display_name`, `avatar_url`, `total_interactions`, `position`
- Ordenação: `position` ascendente (1º = mais interações)

### 3.2 SQL de setup (Supabase)

O SQL completo está em `capitulo-4-desenvolvimento.md`. Resumo:
- Criar tabelas `profiles`, `videos`, `interactions`
- Criar view `leaderboard`
- Sem RLS por ser protótipo de avaliação (ou políticas permissivas se desejar)

---

## 4. Fluxos de usuário

### 4.1 Primeiro acesso

1. Usuário acessa a raiz `/`
2. Se não houver `profile_id` em localStorage → redireciona para `/registro`
3. Tela de registro: campo "Nome" + botão "Entrar"
4. Ao submeter: INSERT em `profiles` com `display_name` → recebe `id`
5. Salva `id` em localStorage (ex.: chave `streamrank_profile_id`)
6. Redireciona para `/catalogo`

### 4.2 Usuário retornando

1. Usuário acessa `/` ou `/catalogo`
2. Verifica localStorage → se há `profile_id` → carrega perfil
3. Mantém na tela atual (catálogo ou player)

### 4.3 Navegação no catálogo

1. `/catalogo` — grade de vídeos (thumbnail, título)
2. Cada card pode mostrar indicador de avaliação do usuário (gostei/não gostei)
3. Componente de **placar** visível (sidebar ou topo)
4. Clique em um vídeo → `/player/[video_id]`

### 4.4 Reprodução e avaliação

1. `/player/[video_id]` — player de vídeo + botões gostei/não gostei
2. Ao clicar em gostei ou não gostei:
   - Se não existir interação: INSERT em `interactions`
   - Se existir e for diferente: UPDATE (troca like↔dislike)
3. Supabase Realtime propaga evento → todos os clientes reconsultam `leaderboard` → placar atualiza

### 4.5 Placar em tempo real

- Subscrição Supabase em `interactions` (ou refresh periódico da view `leaderboard`)
- Exibe: posição, avatar (ou iniciais), nome, total de interações
- Top N (ex.: 10 usuários) — definir limite para não poluir a tela

---

## 5. Especificação de telas

### 5.1 Tela de registro (`/registro`)

- **Layout**: centralizado, fundo escuro
- **Elementos**:
  - Título/logotipo da plataforma
  - Campo de texto: "Qual é o seu nome?" (obrigatório)
  - Botão "Entrar"
- **Validação**: nome não vazio, trim aplicado

### 5.2 Tela de catálogo (`/catalogo`)

- **Layout**: grade responsiva de cards de vídeo
- **Card**: thumbnail, título, indicador de gostei/não gostei (se já avaliou)
- **Placar**: painel lateral ou superior com top N usuários
- **Header**: nome do usuário logado (opcional)

### 5.3 Tela de reprodução (`/player/[id]`)

- **Layout**: player em destaque + área de informações
- **Player**: vídeo (iframe ou tag `<video>`)
- **Botões**: Gostei | Não gostei — visíveis e acessíveis
- **Placar**: mesmo componente da tela de catálogo
- **Voltar**: link/botão para retornar ao catálogo

### 5.4 Componente de placar (reutilizável)

- **Dados**: `leaderboard` (top 10)
- **Exibição**: tabela ou lista com:
  - Posição (1º, 2º, 3º…)
  - Avatar (ou iniciais em círculo)
  - Nome
  - Total de interações
- **Destaque**: usuário atual em evidência (ex.: borda dourada)
- **Atualização**: em tempo real (Supabase Realtime)

---

## 6. Identidade visual

### 6.1 Tema

- **Paleta**: âmbar/dourado sobre fundo escuro
- **Referência**: tema `streamrank` ou `luxury` do DaisyUI (ver `capitulo-4-desenvolvimento.md`)
- **Cores principais**:
  - primary: `#f59e0b` (âmbar)
  - accent: `#fbbf24` (dourado — posição #1 no placar)
  - base-100: `#0c0a09` (fundo escuro)
  - success: `#4ade80` (gostei)
  - error: `#f87171` (não gostei)

### 6.2 Terminologia na interface

- Botões: **Gostei** / **Não gostei** (em português)
- Título do ranking: **Placar** ou **Ranking**

---

## 7. Requisitos técnicos

### 7.1 Supabase

- Projeto criado em supabase.com
- Tabelas e view criadas conforme SQL do cap. 4
- Realtime habilitado para tabela `interactions`
- Variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 7.2 Vídeos (seed)

- Inserir 6–12 vídeos de teste
- Sugestão: vídeos curtos de domínio público ou YouTube (embed)
- Campos: title, video_url, thumbnail_url, description

### 7.3 Responsividade

- Funcionar em desktop e mobile (prioridade desktop para avaliação acadêmica)

---

## 8. Checklist de implementação

- [ ] Setup Next.js (App Router)
- [ ] Configurar Tailwind + DaisyUI com tema streamrank
- [ ] Configurar Supabase (projeto + variáveis de ambiente)
- [ ] Executar SQL (tabelas + view)
- [ ] Inserir seed de vídeos
- [ ] Tela de registro (`/registro`)
- [ ] Persistir `profile_id` em localStorage
- [ ] Tela de catálogo (`/catalogo`)
- [ ] Tela de player (`/player/[id]`)
- [ ] Componente de placar
- [ ] Lógica de interação (like/dislike) com upsert
- [ ] Subscrição Supabase Realtime para atualizar placar
- [ ] Link para questionário de avaliação (Etapa 2/3)

---

## 9. Prompt para desenvolvimento (IA)

> Use o texto abaixo como prompt para gerar ou guiar o desenvolvimento do protótipo:

```
Desenvolva um protótipo de plataforma de streaming com gamificação (placar) usando:

Tecnologias:
- Next.js (App Router)
- Tailwind CSS + DaisyUI (tema âmbar/dourado sobre fundo escuro)
- Supabase (PostgreSQL + Realtime)

Modelo de dados:
- profiles: id (uuid), display_name, avatar_url, created_at
- videos: id, title, description, video_url, thumbnail_url
- interactions: id, user_id, video_id, type ('like'|'dislike'), UNIQUE(user_id, video_id)
- leaderboard: view que agrega total de interações por usuário com posição no ranking

Fluxo:
1. Tela de registro: apenas nome. Cria profile, salva id no localStorage, redireciona ao catálogo
2. Catálogo: grade de vídeos + componente de placar visível
3. Player: reproduz vídeo + botões "Gostei" / "Não gostei". Cada interação atualiza o placar
4. Placar: top 10 usuários por total de interações, atualização em tempo real via Supabase Realtime

Interface:
- Botões em português: Gostei / Não gostei
- Tema escuro com âmbar e dourado
- Componente de placar reutilizável (catálogo e player)

Priorize simplicidade: Next.js padrão, Supabase, sem autenticação complexa. O usuário só informa o nome na primeira visita.
```

---

## 10. Referências

- `capitulo-4-desenvolvimento.md` — texto do cap. 4, diagramas, SQL, tema de cores
- `MEMORY_BANK.md` — decisões do projeto, objetivos, conceito do protótipo
