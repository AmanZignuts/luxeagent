# Vestira & Vestira Concierge Monorepo

**AI-Enhanced E-Commerce Platform & Agentic Fashion Concierge**

Welcome to **Vestira**, a high-end luxury fashion e-commerce platform built with **Next.js 16 (Canary)**, the **Vercel AI SDK**, and **Supabase**. 

At the center of Vestira is **Vestira Concierge**—an autonomous AI stylist concierge designed for premium commerce. Vestira Concierge understands natural language requests, uploads and analyzes reference images, executes tools against live database catalogs using hybrid search, and streams interactive **Generative UI** widgets (like outfit builders, size pickers, and product carousels) directly into the customer's chat.

---

## 📖 Table of Contents
1. [Key Highlights](#-key-highlights)
2. [Tech Stack](#-tech-stack)
3. [Architecture Overview](#-architecture-overview)
4. [Prerequisites](#-prerequisites)
5. [Getting Started (Step-by-Step)](#-getting-started-step-by-step)
6. [Environment Variables](#-environment-variables)
7. [App Routing & Page Matrix](#-app-routing--page-matrix)
8. [User Roles & Authentication](#-user-roles--authentication)
9. [Development Scripts](#-development-scripts)
10. [Architecture Specifications](#-architecture-specifications)

---

## ✨ Key Highlights

* **Agentic Stylist Concierge:** Leverages Vercel AI SDK v6 (`streamText`, tool calling, and Generative UI streams) with Google Gemini to guide users, check stock, suggest edits, and construct outfits.
* **Hybrid Search (pgvector + FTS):** Custom Supabase RPC fuses HNSW-indexed vector search (for semantic meaning) with Postgres Full-Text Search (for exact match keywords) using Reciprocal Rank Fusion (RRF).
* **Multi-Modal Vision & Update Pipeline:** Handles automated ingestion and secure updates (`POST /api/admin/update`). Upload or edit product attributes, extract tags, colors, and descriptions using Gemini Vision, and automatically regenerate and fuse 768-dimensional textual-visual embeddings.
* **Accessible Component Architecture:** Fully integrated Radix UI (via `shadcn/ui`) design system mapped to custom HSL brand tokens, replacing all native forms, selects, and dialogs with keyboard-navigable components.
* **Seamless Guest Session Merging:** Intercepts protected guest routes to prompt in-place login modals instead of hard page redirects. Upon authentication, guest shopping carts (`localStorage`) merge automatically with the user's database cart, maintaining uninterrupted shopping sessions.
* **Transferable Product Ownership:** Secure Postgres Row-Level Security (RLS) policies permit merchants to query and edit default seeded products, automatically transferring item ownership to the merchant's authenticated account upon save.
* **Performance & UX Optimization:** Bypasses global loading states for seller dashboard routes, implements `sessionStorage` caching to display the customer loading splash screen only once per tab session, and supports Next.js Partial Prerendering (PPR) for instant page load times.
* **Interactive Developer Sidebar:** Integrated [Agentation](https://github.com/agentation/agentation) UI dashboard in development mode to inspect state, trace tool-calling history, and debug agent execution.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 16 (Canary)](https://nextjs.org/) (App Router, React 19) | Main web application framework |
| **AI SDK** | [Vercel AI SDK](https://sdk.vercel.ai/) v6, `@ai-sdk/google` | Multi-step agent orchestrator and React UI streams |
| **LLM & Vision** | Google Gemini 2.0 / 1.5 | Model used for chat, vision tagging, and metadata extraction |
| **Embeddings** | `text-embedding-004` (or `gemini-embedding-2`) | 768-dimensional textual and vision caption embeddings |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Data persistence, Auth, Storage, and RLS security |
| **Vector Index** | `pgvector` with HNSW Index | Cosine-distance optimized vector space search |
| **Styling** | Tailwind CSS 4 | Minimalist editorial warm-linen & obsidian design system |
| **Developer Tools**| `agentation` | Developer debug sidebar and trace dashboard |

---

## 🏛️ Architecture Overview

The codebase is organized as an **npm monorepo** workspace to logically isolate the Next.js application, utility scripts, and Supabase config layers:

```text
├── apps/
│   └── web/                # The main Next.js 16 application (pages, components, API routes)
│       ├── app/            # App Router routes (concierge, shop, seller dashboards, auth)
│       ├── components/     # Reusable layout and theme elements
│       ├── features/       # Feature-specific components (concierge, outfit-builder, checkout)
│       └── lib/            # Shared logic (AI orchestrator, database clients, helpers)
├── scripts/                # Node utility scripts (seed inserts, backfill embeddings)
├── supabase/               # Database management and environment setup
│   └── migrations/         # Database migrations (schemas, RPCs, index setup, seed products)
├── .env.example            # Template for environment configuration
└── package.json            # Root monorepo configuration & runner scripts
```

> [!NOTE]
> **Symlinked Environments:** The file `apps/web/.env.local` is a symbolic link pointing to the root `.env.local` configuration. Defining variables in the root directory will automatically configure the Next.js application.

---

## 📋 Prerequisites

Before setting up the repository, make sure you have the following installed/ready:

1. **Node.js** (v20 or higher recommended)
2. **npm** (comes packaged with Node.js)
3. **Docker Desktop** (Required **ONLY** if you plan to run Supabase locally using the Supabase CLI)
4. **Google AI Studio Key:** A Gemini API key is required to use the AI stylist. Get your key at [Google AI Studio](https://aistudio.google.com/apikey).
5. **Supabase Account** (Required **ONLY** if you choose to host your database on the cloud instead of running locally)

---

## 🚀 Getting Started (Step-by-Step)

Follow these steps to configure and boot up your local development environment:

### Step 1: Clone the Repo & Install Dependencies
Clone the repository and run `npm install` from the root folder to download all required packages for both the web workspace and local utilities:
```bash
git clone <your-repo-url>
cd luxeagent
npm install
```

### Step 2: Configure Environment Variables
Copy the environment variables template to a new file named `.env.local` in the root directory:
```bash
cp .env.example .env.local
```
Open `.env.local` and enter your credentials (see [Environment Variables](#-environment-variables) below for a breakdown). At a minimum, you will need a `GEMINI_API_KEY`.

### Step 3: Run Database Setup

You can choose between setting up the database locally (recommended) or using a hosted Supabase project.

#### Option A: Local Supabase Instance (Recommended)
Make sure **Docker Desktop** is running, then run:
```bash
# Start the local database, storage bucket, and auth service containers
npx supabase start

# Apply all schema migrations and run the SQL product seeds
npx supabase db reset
```
*This command runs database migrations located in `supabase/migrations/` to establish tables, configure HNSW vector and full-text indexes, define RLS security policies, and seed products.*

#### Option B: Hosted Supabase Instance (Cloud)
If you prefer using a remote hosted Supabase project:
```bash
# Link the CLI to your project reference ID
npx supabase link --project-ref <your-project-ref>

# Push the migration schemas to your hosted database
npx supabase db push
```

### Step 4: Backfill Product Embeddings
The seed files populate the database with fashion products but they don't contain pre-generated vectors. Run the backfill script to convert text attributes and vision captions into embeddings via Gemini:
```bash
npx tsx scripts/generate-embeddings.ts
```
*Note: This script requires a valid `GEMINI_API_KEY` and the `SUPABASE_SERVICE_ROLE_KEY` (to bypass RLS during write operations).*

### Step 5: Start the Development Server
Launch the Next.js development server from the root of the repository:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application. The homepage will automatically redirect you to `/landing`.
---

## 🔑 Environment Variables

The system supports the following environment variables inside `.env.local`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `http://127.0.0.1:54321` | The API URL of your local or hosted Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | - | Public API key for client-side queries (enforces RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Secret admin key used only for backend ingestion and seeding scripts |
| `GEMINI_API_KEY` | Yes | - | API key for Google Gemini model generation and embedding functions |

---

## 🧭 App Routing & Page Matrix

The consumer and merchant platforms are divided into separate layout routes:

| Route | Role Access | Description |
|---|---|---|
| **`/landing`** | Public | Editorial brand entry page |
| **`/shop`** | Public | Grid feed showcasing active product inventory |
| **`/pdp/[itemId]`** | Public | Product details page with AI-powered lookbook suggest |
| **`/concierge`** | Customer (Auth) | Immersive full-screen Vestira Concierge chat canvas & Generative UI |
| **`/login` / `/register`** | Public | Customer authentication endpoints |
| **`/onboarding/style-persona`**| Customer (Auth) | Style onboarding questionnaire to calibrate user profiles |
| **`/checkout`** | Customer (Auth) | Editorial Express Checkout Matrix |
| **`/profile`** | Customer (Auth) | Customer profile configurations |
| **`/orders`** | Customer (Auth) | Historical purchase dossier and order details |
| **`/orders/confirmation`** | Customer (Auth) | Order success confirmation & tailor AI banner |
| **`/seller/login` / `/seller/register`** | Public | Merchant-specific authentication endpoints |
| **`/seller/dashboard`** | Merchant (Auth) | Store performance ledger and analytics |
| **`/seller/inventory`** | Merchant (Auth) | Raw catalog data grids and SKU table |
| **`/seller/ingestion`** | Merchant (Auth) | Vision-AI media processing and product ingestion pipeline |
| **`/seller/orders`** | Merchant (Auth) | Merchant order fulfillment queue |
| **`/seller/settings`** | Merchant (Auth) | Storefront API integration dashboard |

---

## 👥 User Roles & Authentication

The application implements role-based layouts and access boundaries using Supabase Auth:

1. **Shoppers (Default):** Sign up via `/register`. This role gives you access to the store, cart checkout, style onboarding, and the `/concierge` styling room.
2. **Merchants (Sellers):** To access the `/seller` dashboards, register an account and update your user metadata database record to define your role:
   * **Setup:** Set the `role` field inside the user metadata JSON payload to `'merchant'` (e.g. `user_metadata.role = 'merchant'`).
   * **Redirect:** Upon logging in, merchants are automatically redirected to `/seller/dashboard`.

---

## 📜 Development Scripts

You can execute workspace commands directly from the root directory:

| Script | Command | Purpose |
|---|---|---|
| **`npm run dev`** | `npm run dev --workspace=web` | Starts the Next.js app in development mode |
| **`npm run build`** | `npm run build --workspace=web` | Compiles a production bundle of the Next.js app |
| **`npm run lint`** | `npm run lint --workspace=web` | Runs ESLint diagnostics |
| **`generate-embeddings`**| `npx tsx scripts/generate-embeddings.ts` | Calculates text and vision embeddings for pending products |
| **`insert-seeds`** | `npx tsx scripts/insert-seeded-products.ts` | Utilities to insert additional products manually |
| **`list-models`** | `npx tsx scripts/list-models.ts` | Prints list of available Gemini/Google models |

---

## 🎨 Architecture Specifications

For granular details regarding typography, custom CSS color variables (e.g., Linen `#FAF0E6` vs Obsidian `#09090B`), spacing guidelines, and RSC boundary configurations, consult:
* **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System Architecture and Design Contract
* **[supabase/migrations/](./supabase/migrations/)** - SQL source files detailing the database schema and RLS policies
