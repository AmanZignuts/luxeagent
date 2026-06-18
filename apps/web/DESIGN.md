# Vestira Design System
### The authoritative visual language reference for all contributors, agents, and AI models

> This document is the single source of truth for every visual and structural decision in the Vestira codebase.
> If you are an AI model, automated code agent, or engineer working on this project — read this before touching any UI.
> Following these rules prevents hallucinated colors, wrong fonts, and inconsistent components.

---

## 1. Brand Identity at a Glance

**Vestira** is a luxury fashion concierge platform. The aesthetic is intentionally restrained — desaturated, editorial, and typographically refined.

| Principle | Description |
|---|---|
| **Restraint over vibrancy** | No bright primary colors. Palette is almost monochromatic: warm cream background, near-black foreground |
| **Editorial first** | Serif font for headings gives a fashion-magazine feel; sans-serif for data and UI |
| **Borders over shadows** | We use 1px border lines (`#E4E4E7`) for depth — never `shadow-lg` or `shadow-2xl` |
| **Micro-animation is intentional** | Framer Motion is used sparingly: spring-based modal entries, subtle scale on buttons |

---

## 2. Color Tokens (The Only Colors Allowed)

> ⚠️ **Rule for AI agents:** Never invent new colors. Every pixel of color must map to one of these five tokens.
> Using raw Tailwind colors like `bg-blue-500`, `text-green-600`, `border-red-300` (outside of semantic error/success states) is **not allowed**.

### Core Palette

| Token Name | CSS Variable | Hex Value | Tailwind Usage | Purpose |
|---|---|---|---|---|
| **Warm Linen** | `--bg-warm-linen` | `#FAF0E6` | `bg-[#FAF0E6]` / `bg-warm-linen` | Primary page background, input fill |
| **Obsidian Velvet** | `--fg-obsidian-velvet` | `#09090B` | `text-[#09090B]` / `text-obsidian-velvet` | All text, active buttons, borders |
| **Surface White** | `--surface-white` | `#FFFFFF` | `bg-[#FFFFFF]` / `bg-surface-white` | Cards, modals, sidebar, table rows |
| **Champagne Tint** | `--tint-champagne` | `#F2EBD9` | `bg-[#F2EBD9]` / `bg-tint-champagne` | AI message bubbles, secondary buttons, hover tints |
| **Muted Zinc** | `--border-muted-zinc` | `#E4E4E7` | `border-[#E4E4E7]` / `border-muted-zinc` | All structural borders, dividers, input borders |

### Semantic States (Allowed Exceptions)

These are the **only** exceptions where standard Tailwind colors are permitted:

| State | Color Usage | Example |
|---|---|---|
| **Error / Danger** | `text-red-500`, `border-red-400`, `bg-red-50`, `text-red-700` | Form field errors, delete buttons |
| **Success** | `text-emerald-700`, `bg-emerald-50`, `border-emerald-200` | Status badges, success indicators |
| **Warning** | `text-amber-700`, `bg-amber-50`, `border-amber-200` | Pending status badges |

### Opacity Modifiers

Opacity variants of `obsidian-velvet` are the primary way to create hierarchy:

```
text-obsidian-velvet        → #09090B (full)      — primary text
text-obsidian-velvet/80     → ~60% opacity         — secondary text
text-obsidian-velvet/60     → ~60% opacity         — muted body text
text-obsidian-velvet/50     → 50% opacity           — labels, meta text
text-obsidian-velvet/40     → 40% opacity           — placeholder-like text
text-obsidian-velvet/30     → 30% opacity           — disabled, faint hints
```

---

## 3. Typography

> ⚠️ **Rule for AI agents:** The font family determines the element's *function*, not just its visual weight. Never use `font-serif` for UI buttons or data. Never use `font-sans` for page-level editorial headings.

### Font Families

| Family | Google Font | CSS Variable | Tailwind Class | Role |
|---|---|---|---|---|
| **Editorial / Serif** | Playfair Display | `--font-serif` | `font-serif` | Page titles, product names, modal headings, order totals |
| **Operational / Sans** | Inter | `--font-sans` | `font-sans` | Buttons, labels, table data, form inputs, badges, metadata |

### Type Scale Examples

```tsx
// Page-level editorial heading (h1)
<h1 className="font-serif text-4xl font-light tracking-tight text-obsidian-velvet sm:text-5xl">
  Product Inventory
</h1>

// Section heading (h2)
<h2 className="font-serif text-2xl font-light tracking-tight text-obsidian-velvet">
  Your Order Summary
</h2>

// Modal / card title (h3)
<h3 className="font-serif text-lg font-light tracking-tight text-obsidian-velvet">
  Confirm Sign Out
</h3>

// UI label (uppercase tracking — used everywhere for field labels)
<label className="font-sans text-[10px] font-bold tracking-widest text-obsidian-velvet/50 uppercase">
  Full Name
</label>

// Body / description text
<p className="font-sans text-sm text-obsidian-velvet/60 leading-relaxed">
  This action cannot be undone.
</p>

// Badge / status chip text
<span className="font-sans text-[8px] font-bold uppercase tracking-wider">
  ACTIVE
</span>

// Button text
<span className="font-sans font-semibold text-xs tracking-wider uppercase">
  Save Changes
</span>
```

---

## 4. Spacing & Geometry

### Border Radius Rules

| Element Type | Radius Class | Pixels | Examples |
|---|---|---|---|
| **Container / Cards / Modals** | `rounded-xl` | 16px | Cards, dialogs, sidebars, panels |
| **Interactive elements** | `rounded-md` | 8px | Inputs, standard buttons, select dropdowns, badges |
| **Status badges / chips** | `rounded-sm` | 4px | Inline status labels, category tags |
| **Full circle / avatars** | `rounded-full` | 50% | Spinner, avatar, icon buttons |

### Shadow Policy

> **No `shadow-lg`, `shadow-xl`, or `shadow-2xl`.**

Depth is created through **1px borders** only:

```tsx
// ✅ Correct — use border for depth
<div className="bg-surface-white border border-muted-zinc rounded-xl">

// ✅ Minimal shadow is ok for very specific floating panels
<div className="bg-surface-white border border-muted-zinc rounded-xl shadow-sm">

// ❌ Never use heavy shadows
<div className="bg-surface-white shadow-lg rounded-xl">
<div className="bg-surface-white shadow-2xl rounded-xl">
```

### Standard Padding

| Component | Padding |
|---|---|
| Cards / Panels | `p-6` or `p-8` |
| Modal content area | `p-6` |
| Input fields | `px-4 py-3` |
| Buttons (sm) | `px-3.5 py-2` |
| Buttons (md) | `px-6 py-3` |
| Buttons (lg) | `px-8 py-4` |
| Table cells | `px-3 py-4` |

---

## 5. Component Library

All shared UI components live in `apps/web/components/ui/`. Import from there — never create one-off inline equivalents.

### Component Index

| File | Exports | When to use |
|---|---|---|
| `button.tsx` | `Button` | All clickable actions |
| `input.tsx` | `FormField`, `Input`, `Textarea`, `Select` | All form fields |
| `modal.tsx` | `Modal` | All dialogs, confirmations, overlays |
| `loader.tsx` | `Spinner`, `Shimmer`, `CardSkeleton`, `PageLoader`, `RowSkeleton` | Loading states |
| `empty-state.tsx` | `EmptyState` | Zero-results, empty list states |
| `error-state.tsx` | `ErrorState` | API error, fetch failure states |

### Button Component

```tsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="primary">Save Changes</Button>      // black fill
<Button variant="secondary">Cancel</Button>          // champagne fill
<Button variant="outline">Edit</Button>              // transparent, zinc border
<Button variant="ghost">View Details</Button>        // transparent, no border
<Button variant="danger">Delete</Button>             // red tones

// Sizes
<Button size="sm">Small</Button>      // px-3.5 py-2 text-[10px]
<Button size="md">Medium</Button>     // px-6 py-3 text-xs (default)
<Button size="lg">Large</Button>      // px-8 py-4 text-sm rounded-xl

// Loading state
<Button loading={isSaving}>Saving...</Button>
```

### Form Field + Input

```tsx
import { FormField, Input, Textarea, Select } from "@/components/ui/input";

// Standard form field with validation
<FormField label="Brand Name" error={errors.brandName?.message} optional>
  <Input
    type="text"
    error={!!errors.brandName}
    placeholder="e.g. Vestira"
    {...register("brandName")}
  />
</FormField>

// Textarea
<FormField label="Description" error={errors.description?.message}>
  <Textarea rows={4} error={!!errors.description} {...register("description")} />
</FormField>

// Native select (use Combobox for accessible version)
<FormField label="Category" error={errors.category?.message}>
  <Select error={!!errors.category} {...register("category")}>
    <option value="">Select...</option>
    <option value="Couture">Couture</option>
  </Select>
</FormField>
```

### Modal Component

```tsx
import { Modal } from "@/components/ui/modal";

// Standard use
<Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete" size="sm">
  <p className="font-sans text-sm text-obsidian-velvet/80">
    This action cannot be undone.
  </p>
  <div className="flex gap-3 justify-end pt-4">
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
  </div>
</Modal>

// Size options: "sm" | "md" | "lg" | "xl"
// sm = max-w-md (confirmations, alerts)
// md = max-w-lg (forms, default)
// lg = max-w-2xl (product overview, complex forms)
// xl = max-w-4xl (full panels)
```

---

## 6. shadcn/ui Configuration

The project uses **shadcn/ui** with Radix UI primitives as the accessible foundation for complex interactive components (`Dialog`, `Select`, `Command`).

### CSS Variable Mapping

shadcn uses its own CSS variable naming convention. Our `globals.css` maps Vestira tokens to shadcn's expected names:

```css
:root {
  /* Vestira core tokens */
  --background: #FAF0E6;         /* warm-linen */
  --foreground: #09090B;         /* obsidian-velvet */

  /* shadcn component variable mappings */
  --card: #FFFFFF;               /* surface-white */
  --card-foreground: #09090B;
  --popover: #FFFFFF;            /* used in dropdowns, tooltips */
  --popover-foreground: #09090B;
  --primary: #09090B;            /* obsidian-velvet — used for primary actions */
  --primary-foreground: #FFFFFF;
  --secondary: #F2EBD9;          /* champagne-tint */
  --secondary-foreground: #09090B;
  --muted: #FAF0E6;              /* warm-linen */
  --muted-foreground: rgba(9,9,11,0.5);
  --accent: #F2EBD9;             /* champagne-tint */
  --accent-foreground: #09090B;
  --destructive: #dc2626;
  --border: #E4E4E7;             /* muted-zinc */
  --input: #E4E4E7;
  --ring: #09090B;               /* focus ring = obsidian */
  --radius: 0.375rem;            /* = rounded-md, 6px */
}
```

### `components.json` (shadcn config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

---

## 7. Animation Principles

All animations use **Framer Motion** (`framer-motion` package). Tailwind's built-in `animate-in` utilities are also used for simple fade/slide entrances.

### Motion Tokens

```tsx
// Modal / Overlay entrance — spring-based, feels physical
initial={{ opacity: 0, scale: 0.95, y: 15 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 15 }}
transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}

// Button micro-interaction — barely perceptible scale
whileHover={{ scale: 1.015 }}
whileTap={{ scale: 0.985 }}

// Backdrop / overlay — simple opacity fade
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Page / list content entrance — use Tailwind's animate-in
className="animate-in fade-in duration-300"
className="animate-in slide-in-from-bottom-2 duration-200"
```

### Rules
- Modal backdrops: `bg-[#09090B]/10 backdrop-blur-sm` — intentionally light, not heavy black overlay
- Never use `animate-bounce` or `animate-pulse` except on loaders
- Spinner: `animate-spin` with `border-t-obsidian-velvet border-muted-zinc` — desaturated, not colored

---

## 8. Layout Architecture

There are three distinct shell layouts. **Never mix features across layout domains.**

### Layout Alpha — Customer Portal
- **Routes:** `app/(customer)/**`
- Sticky translucent nav at top: `fixed top-0 w-full backdrop-blur-md bg-white/80 border-b border-muted-zinc z-50`
- Content max-width: `max-w-7xl mx-auto`
- AI concierge bubble: `fixed bottom-6 right-6 z-40 bg-tint-champagne`

### Layout Beta — AI Concierge Workspace
- **Routes:** `app/(ai)/concierge`
- Full-screen: `h-screen w-screen overflow-hidden bg-warm-linen`
- Split: 35% chat log (left) + 65% generative staging canvas (right)
- No customer headers or navigation

### Layout Gamma — Seller Operations
- **Routes:** `app/seller/**` (note: not a route group — uses `app/seller/layout.tsx`)
- Fixed sidebar: `w-[260px] h-screen fixed left-0 top-0 bg-surface-white border-r border-muted-zinc`
- Main content: `pl-[260px] bg-warm-linen min-h-screen`
- No customer AI assistant elements

---

## 9. Do's and Don'ts Quick Reference

### ✅ Always Do

- Use `font-serif` for h1–h3 editorial headings, product names, modal titles
- Use `font-sans` for labels, buttons, badges, table data, body text
- Use `rounded-xl` for cards/containers, `rounded-md` for inputs/buttons
- Use `border border-muted-zinc` for all structural depth
- Import shared components from `@/components/ui/*`
- Use `<FormField>` wrapper around every form input
- Use `<Modal>` for every dialog/overlay — no raw `fixed inset-0` divs
- Use `<EmptyState>` and `<ErrorState>` for list feedback states
- Use `<Spinner>` or `<PageLoader>` for loading states

### ❌ Never Do

- Invent new colors outside the 5-token palette (except semantic error/success)
- Use `shadow-lg`, `shadow-xl`, `shadow-2xl`
- Use raw `<input>`, `<select>`, `<button>` elements in feature pages (always wrap)
- Create inline overlay divs (`fixed inset-0 bg-black/40`) — use `<Modal>` instead
- Mix `font-serif` and `font-sans` roles (serif ≠ UI, sans ≠ editorial)
- Add arbitrary Tailwind colors like `bg-blue-500`, `text-purple-600`
- Use `any` TypeScript type in production code

---

## 10. File Naming & Structure Conventions

```
apps/web/
├── app/                     # Next.js App Router pages & layouts
│   ├── (auth)/              # Auth route group — no persistent nav
│   ├── (customer)/          # Customer shop route group
│   ├── (ai)/                # AI concierge route group
│   ├── seller/              # Seller portal (layout.tsx = 260px sidebar)
│   └── globals.css          # All CSS tokens + shadcn variables here
├── components/
│   └── ui/                  # Shared UI primitives — source of truth
│       ├── button.tsx
│       ├── input.tsx        # FormField, Input, Textarea, Select
│       ├── modal.tsx
│       ├── loader.tsx       # Spinner, Shimmer, CardSkeleton, PageLoader
│       ├── empty-state.tsx
│       └── error-state.tsx
├── features/                # Feature-specific page components
│   ├── catalog/
│   ├── seller/
│   ├── customer/
│   ├── checkout/
│   └── ...
└── lib/                     # Utilities, Supabase client, actions
```

---

*Last updated: June 2026 — Vestira Concierge v1.0*
*Maintained by the core Vestira engineering team. Update this file whenever a design decision changes.*
