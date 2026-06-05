# Vestira

**AI-Enhanced E-Commerce — Agentic Fashion Concierge**

**Vestira** is a high-end fashion commerce platform built with **Next.js 15**, **Vercel AI SDK**, and **Supabase (pgvector)**. Its centerpiece is **LuxeAgent**—the in-app AI concierge—that moves beyond passive search toward **agentic commerce**: understanding natural-language intent, running tool calls against live catalog data, and streaming **Generative UI** (product carousels, size pickers, outfit builders) directly into the chat experience.

The system combines **multi-modal RAG** (product text + vision-derived image captions) with **hybrid search** (pgvector semantic similarity + Postgres full-text / BM25-style keyword ranking fused via Reciprocal Rank Fusion). This mirrors the industry shift from chatbots to autonomous shopping agents—deep discovery, inventory-aware recommendations, and conversion inside one conversational flow.

> **Naming:** **Vestira** is the product and brand (UI, auth, seller portal). **LuxeAgent** is the autonomous stylist agent persona used in `/concierge` and `/api/chat`.

---

## Highlights

| # | Capability | Implementation |
|---|------------|----------------|
| 1 | **Agentic concierge** | Vercel AI SDK v6 (`streamText`, tool calling, UI message streams) + Google Gemini 2.0 Flash |
| 2 | **Hybrid search** | Supabase RPC `hybrid_search`: HNSW vector ANN + `tsvector` FTS, RRF fusion (default 70% semantic / 30% keyword) |
| 3 | **Multi-modal RAG** | Vision metadata on ingest → text + image caption embeddings → fused `combined_embedding` (60/40) |
| 4 | **Generative UI** | Concierge renders carousels, size pickers, comparisons, outfit builders from tool payloads |
| 5 | **Seller vision pipeline** | `POST /api/admin/ingest` — upload images → Gemini Vision → embeddings → catalog |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, React 19) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai/) v6, `@ai-sdk/google`, `@ai-sdk/react` |
| LLM / Vision / Embeddings | Google Gemini 2.0 Flash, `gemini-embedding-2` (768-dim) |
| Database & Auth | [Supabase](https://supabase.com/) — Postgres, Auth, Storage, RLS |
| Vector search | `pgvector` + **HNSW** indexes (`vector_cosine_ops`) |
| Keyword search | Generated `fts_document` + `ts_rank_cd` / `websearch_to_tsquery` |
| Styling | Tailwind CSS 4, editorial design tokens (warm linen / obsidian palette) |
| Validation | Zod 4 |

---

## AI Flow

High-level journey from user query to purchase-oriented UI:

```text
User Query (text and/or image)
        ↓
POST /api/chat  →  Gemini + system prompt
        ↓
Intent + tool selection (max 5 steps)
        ↓
Tools → hybridSearch / Supabase RPC / profile & orders
        ↓
Structured tool results (type: product_carousel, size_picker, …)
        ↓
Concierge showcase panel (Generative UI)
        ↓
Add to bag · checkout · orders (customer app)
```

### Frontend (Vestira shop + LuxeAgent concierge)

- **Conversational UI** — streaming tokens, quick prompts, image upload / drag-drop for visual search
- **Generative UI** — maps tool `type` to React components: `ProductCarousel`, `SizePicker`, `OutfitBuilder`, `ProductComparisonCard`, `ImageSearchResult`, `OccasionRecommendation`, order and style profile widgets
- **Image-based discovery** — user uploads reference image; model sees multimodal input, describes aesthetics, calls `findSimilarProducts`
- **Cart integration** — `addToBag` tool + shared `BagContext` across customer routes
- **Session persistence** — authenticated users: `chat_sessions` upsert on stream finish

### Backend (Agent + Data)

- **Orchestration** — `app/api/chat/route.ts`: `streamText` with `agentTools`, `stopWhen: stepCountIs(5)`, mock fallback on quota errors
- **Hybrid search** — `lib/ai/search.ts` embeds query → `hybrid_search` RPC; fallback to FTS-only if embedding API fails
- **Vision ingest** — `app/api/admin/ingest/route.ts`: Storage upload → Gemini Vision JSON metadata → dual embeddings → `products` + `product_embeddings`
- **Inventory** — `check_inventory` RPC + `checkInventory` tool → live size availability UI

### Agent Tools

| Tool | Purpose | UI payload |
|------|---------|------------|
| `searchProducts` | Natural-language catalog search | `product_carousel` |
| `findSimilarProducts` | Visual / description similarity | `image_search_result` |
| `checkInventory` | SKU stock by size | `size_picker` |
| `getProductDetails` | Full SKU metadata | `product_details` |
| `getPersonalizedRecommendations` | Style profile + hybrid search | `personalized_carousel` |
| `recommendByOccasion` | Wedding, office, vacation, etc. | `occasion_recommendation` |
| `generateOutfitLook` | Multi-category outfit | `outfit_builder` |
| `compareProducts` | Side-by-side two SKUs | `product_comparison` |
| `getUserStyleProfile` | Onboarding preferences | `style_profile` |
| `getOrderStatus` | Order history / tracking | `order_status` |
| `addToBag` | Cart action from chat | `add_to_bag_confirm` |

---

## Hybrid Search (How It Works)

1. **Query embedding** — User text (or vision-derived description) → 768-dim vector via Google embeddings API.
2. **Semantic leg** — `product_embeddings.combined_embedding` ANN search (HNSW, cosine distance).
3. **Keyword leg** — `products.fts_document` matched with `websearch_to_tsquery` + `ts_rank_cd`.
4. **RRF fusion** — Weighted reciprocal rank fusion in SQL (`semantic_weight` / `keyword_weight`, `rrf_k = 60`).
5. **Filters** — Optional category, gender, price min/max applied in both legs.

Defined in `supabase/migrations/20260602000005_hybrid_search_rpc.sql` and invoked from `lib/ai/search.ts`.

---

## Multi-Modal RAG Pipeline (Seller Ingest)

```text
Product images (multipart upload)
        ↓
Supabase Storage (product-images bucket)
        ↓
Gemini Vision → description, category, tags, colors, image_caption
        ↓
Text document (weighted title/tags) → text_embedding
Image caption → image_embedding
        ↓
fuseEmbeddings (60% text + 40% image) → combined_embedding
        ↓
products.vector_status: PENDING → ACTIVE
```

Re-run embeddings for seeded/pending SKUs with:

```bash
npx tsx scripts/generate-embeddings.ts
```

---

## Project Structure

```text
app/
├── (auth)/              login, register, style-persona & merchant onboarding
├── (customer)/          shop, PDP, checkout, profile, orders, BagContext
├── (ai)/concierge/      full-screen AI concierge + Generative UI components
├── seller/              merchant dashboard, inventory, ingestion, orders
├── api/
│   ├── chat/            AI agent streaming endpoint
│   ├── admin/ingest/    vision + embedding product pipeline
│   └── orders/          order APIs
lib/
├── ai/                  tools, search, embeddings, mock fallback
├── actions/             auth & orders server actions
└── supabase/            SSR clients, generated types
supabase/migrations/     schema, HNSW, FTS, hybrid_search RPC, RLS, seed data
scripts/                 embedding backfill, model listing utilities
```

See `PROJECT_ANTIGRAVITY_SPEC.md` for layout shells, design tokens, and route contracts.

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** (or pnpm/yarn)
- **Supabase** project (local CLI or hosted)
- **Google AI API key** ([Google AI Studio](https://aistudio.google.com/apikey))

### 1. Clone and install

```bash
git clone <your-repo-url>
cd vestira   # or your local folder name
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
# Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-only: ingest & scripts

# Google Generative AI (AI SDK reads this name)
GOOGLE_GENERATIVE_AI_API_KEY=<your-google-api-key>
```

Never commit `.env.local` or service role keys.

### 3. Database setup

**Option A — Supabase CLI (recommended for local dev)**

```bash
npx supabase start
npx supabase db reset   # applies all migrations under supabase/migrations/
```

**Option B — Hosted Supabase**

Link your project and push migrations:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Migrations enable `vector`, create `products` / `product_embeddings` / `user_style_profiles` / `orders` / `chat_sessions`, HNSW indexes, FTS triggers, `hybrid_search` + `check_inventory` RPCs, RLS policies, and seed products.

### 4. Generate embeddings for seed catalog

After migrations, backfill vectors for seeded products:

```bash
npx tsx scripts/generate-embeddings.ts
```

Requires `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY`.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/landing`.

| Route | Description |
|-------|-------------|
| `/landing` | Marketing entry |
| `/shop` | Product feed (public) |
| `/pdp/[itemId]` | Product detail + lookbook |
| `/concierge` | AI concierge (auth required) |
| `/login`, `/register` | Auth |
| `/onboarding/style-persona` | Shopper style calibration |
| `/seller/*` | Merchant panel (role: `merchant` in user metadata) |
| `/api/chat` | Agent streaming API |

**Mock / demo mode** (no Gemini quota): `/concierge?mock=true`, or set `AI_USE_MOCK=true` in `.env.local`. When the free tier is exhausted, the API automatically falls back to demo mode with real catalog tool calls.

### 6. Production build

```bash
npm run build
npm start
```

Deploy to **Vercel** with the same environment variables. Partial Prerendering (PPR) is prepared in `next.config.ts` but commented out until Next.js canary; enable when your deployment channel supports `experimental.ppr`.

---

## Authentication & Roles

- **Supabase Auth** with cookie-based SSR (`middleware.ts` refreshes sessions).
- **Shopper** — default role; access to shop, concierge, checkout, profile.
- **Merchant** — set `user_metadata.role = 'merchant'` at signup; redirected to `/seller/dashboard`.
- **Guest browsing** — `/shop`, `/pdp`, `/landing` are public; concierge and checkout require login.

---

## API Reference (Core)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Streamed agent; body: `{ messages, chatId?, mock? }` |
| `/api/admin/ingest` | POST | Multipart: `title`, `price`, `sku`, `images[]` (authenticated seller) |
| `/api/orders` | POST/GET | Order placement and listing |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsx scripts/generate-embeddings.ts` | Backfill `product_embeddings` for PENDING/FAILED products |
| `npx tsx scripts/list-models.ts` | List available Google embedding models |
| `npx tsx scripts/test-embedding-dim.ts` | Verify embedding dimensionality |

---

## Success Criteria (MVP)

A user should be able to:

1. Describe fashion needs in natural language.
2. Upload an image for visual discovery.
3. Receive curated recommendations with editorial commentary.
4. See dynamic product UI in the concierge showcase—not only plain text.
5. Check real-time inventory and sizes via the agent.
6. Build outfit looks and compare products in chat.
7. Add items to the bag and complete checkout in the customer app.

---

## Roadmap (Not Yet in Repo)

The architecture spec references capabilities planned for later iterations:

- **Trigger.dev** (or similar) for async embedding refresh and external inventory sync
- **Partial Prerendering** on Vercel canary channel
- **Monorepo** split (currently a single Next.js app: `vestira-next` in `package.json`)
- **Analytics service** for search and recommendation telemetry
- **Demo video** — technical walkthrough of agentic logic and HNSW tuning

---

## Related Documentation

- [`PROJECT_ANTIGRAVITY_SPEC.md`](./PROJECT_ANTIGRAVITY_SPEC.md) — Design system, layouts, route matrix
- [`supabase/migrations/`](./supabase/migrations/) — Source of truth for schema and search RPCs
- [`.agents/skills/supabase/`](./.agents/skills/supabase/) — Supabase agent skill for contributors

---

## License

Private project — all rights reserved unless otherwise specified by the repository owner.
