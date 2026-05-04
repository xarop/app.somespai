# Somespai — Design System

> Geolocated P2P marketplace for spaces in Vila de Gràcia, scaling to Catalonia.
> Minimalist, organic, mobile-first. Editorial sensibility, neighborhood warmth.

---

## 1. Design Principles

1. **Radical minimalism, not minimal effort.** Every element earns its place.
2. **Friction is the enemy.** Magic link, optional fields, one-tap share.
3. **Place over product.** The map and the neighborhood lead. Listings serve the place.
4. **Glass over solid.** Floating UI lets the map breathe. Glassmorphism is subtle, never loud.
5. **Semantic before decorative.** A `<button>` looks like a button without `.btn-primary-large-rounded-shadow`.
6. **Flat, no shadows.** Depth is expressed through borders and tonal contrast, never drop shadows.

---

## 2. Brand & Tone

- **Mood**: Mediterranean afternoon. Olive grove. Sun on terracotta. The patience of an old neighborhood.
- **Voice**: Catalan-first, warm, brief. Never corporate. "Lloga el teu espai" not "Optimitza la teva monetització immobiliària".
- **Adjectives we are**: orgànic, proper, càlid, honest, calm.
- **Adjectives we are not**: corporate, gamified, urgent, neon, dark-mode-by-default.

---

## 3. Color Tokens

All colors live as CSS custom properties on `:root`. Never hardcode hex values inside components.

```css
:root {
  /* Surfaces */
  --bg:        #f4ede0;  /* warm cream — base canvas */
  --bg-soft:   #ebe2d2;  /* secondary surface */
  --bg-deep:   #e2d6c1;  /* sunken / pressed */

  /* Ink (text) */
  --ink:       #1f1c17;  /* primary text */
  --ink-soft:  #5a544a;  /* secondary text */
  --ink-mute:  #8a8276;  /* tertiary / placeholders */

  /* Brand */
  --primary:      #3d4f29;  /* deep olive — actions, links */
  --primary-soft: #6b8053;  /* hover, illustrations */
  --primary-tint: #d8e0cc;  /* selected backgrounds */

  /* Accent — used sparingly, for "live" / "new" / featured */
  --accent:      #c45a2c;  /* terracotta */
  --accent-soft: #e8a583;
  --gold:        #b8893a;  /* premium / verified badge */

  /* Status */
  --success: #4a7c2e;
  --warning: #b8893a;
  --danger:  #b54336;

  /* Glass */
  --glass:        rgba(255, 252, 247, 0.72);
  --glass-strong: rgba(255, 252, 247, 0.92);
  --glass-border: rgba(31, 28, 23, 0.10);
}
```

**Usage rule**: 70% bg/ink, 20% primary, 8% bg-deep accents, 2% terracotta. Terracotta is precious — use it for one moment per screen.

---

## 4. Typography — Recursive

One variable font for everything. **Recursive** (Google Fonts) covers sans, mono, display, and italic from a single file.

```css
:root {
  --font: var(--font-recursive), monospace;

  /* Axis presets */
  --rx-sans:   "MONO" 0, "CASL" 0,   "slnt" 0,   "CRSV" 0.5;
  --rx-mono:   "MONO" 1, "CASL" 0,   "slnt" 0,   "CRSV" 0.5;
  --rx-casual: "MONO" 0, "CASL" 0.5, "slnt" 0,   "CRSV" 0.5;
  --rx-italic: "MONO" 0, "CASL" 0.5, "slnt" -10, "CRSV" 1;
}
```

| Preset | Use |
|---|---|
| `--rx-sans` | Body text, labels, inputs |
| `--rx-mono` | Code, IDs, addresses, data labels |
| `--rx-casual` | Headings, prices, brand name |
| `--rx-italic` | Emphasis, pull quotes |

### Type scale

| Token | Size | Use |
|---|---|---|
| `--t-xs` | 12px | Captions, meta |
| `--t-sm` | 14px | Secondary body |
| `--t-base` | 16px | Body |
| `--t-lg` | 19px | Lead paragraph |
| `--t-xl` | 24px | h3 / Card title |
| `--t-2xl` | 32px | h2 / Section |
| `--t-3xl` | 40px | h1 / Hero (mobile) |
| `--t-4xl` | 56px | h1 / Hero (desktop) |

---

## 5. Spacing & Layout

Linear scale (no t-shirt sizes — predictable).

```css
--s-1: 4px;  --s-2: 8px;  --s-3: 12px;
--s-4: 16px; --s-5: 24px; --s-6: 32px;
--s-7: 48px; --s-8: 64px; --s-9: 96px;
```

- **Container max-widths**: `--c-sm: 640px`, `--c-md: 880px`, `--c-lg: 1200px`.
- **Grid**: 12 columns on desktop, 4 on mobile, gutter `--s-4`.
- **Touch targets**: minimum 44×44px.

---

## 6. Radii & Depth

Shapes are quasi-square — very subtle rounding, never pill-shaped containers.

```css
--r-sm:   2px;   /* small details */
--r-md:   3px;   /* buttons, inputs, chips */
--r-lg:   5px;   /* cards, sheets, nav */
--r-xl:   7px;   /* modals, hero cards */
--r-pill: 18px;  /* reserved for lang badges only */
```

**No drop shadows.** Depth is expressed through:
- `1px` borders using `--glass-border`
- Tonal background contrast (`--bg` → `--bg-soft` → `--bg-deep`)
- Glassmorphism blur over the map only

---

## 7. Motion

```css
--ease:      cubic-bezier(0.22, 1, 0.36, 1);
--ease-out:  cubic-bezier(0.16, 1, 0.3, 1);
--ease-in:   cubic-bezier(0.7, 0, 0.84, 0);
--t-fast:  160ms;
--t-norm:  280ms;
--t-slow:  480ms;
```

### Rules
- **Hover**: translateY(-1px), never more.
- **Modal**: 280ms fade + scale from 0.98 → 1.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` collapses all transitions to 0ms.

---

## 8. Components — Anatomy

### Button
States: `default · hover · focus-visible · active · disabled`.
Variants: `primary` (filled ink), `ghost` (border), `subtle` (bg-soft).
Variants via `data-variant="ghost"`. No extra class names.

### Card (`<article class="space-card">`)
Photo (16:10), title (`--rx-casual`), price, location, rating row.
Hover: translateY(-1px). Border separates from bg, no shadow.

### Input (`<input>`, `<textarea>`)
Glass background, 1px `--glass-border`, focus ring `--primary`.

### Filter chip (`<button data-chip>`)
Small radius (`--r-md`), icon + label. Selected = `--ink` background.

### Bottom sheet (mobile)
Glass surface, drag handle, snap points: `peek` · `half` · `full`.

### Map marker
Glass pill (`--r-md`). Type icon in a square glass badge. No shadow.

---

## 9. Iconography

- Stroke-based, 1.5px, rounded caps (Lucide-style).
- 4 type icons: storage, workspace, garden, room.

---

## 10. Accessibility

- Contrast: WCAG AA minimum, AAA for body text.
- Focus rings: **always** visible (`:focus-visible`), 2px `--primary`, 2px offset.
- Semantic HTML first. ARIA only when HTML can't express the relationship.
- All interactive elements reachable by keyboard. Modals trap focus.
- `prefers-reduced-motion` respected.

---

## 11. Glassmorphism — How and When

**When**: floating UI over the map (search bar, filters, space card, bottom sheet, modals).
**When not**: dense lists, forms inside pages, anywhere without a backdrop image/map.

```css
.glass {
  background: var(--glass);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid var(--glass-border);
  /* no box-shadow */
}
```

Fallback for browsers without `backdrop-filter`: `--glass-strong` via `@supports not`.

---

## 12. Internationalization

- **Default**: Catalan (`ca`).
- **Supported**: `ca`, `es`, `en`.
- All UI strings live in `/messages/{locale}.json`. **Never** hardcode strings in components.
- Date, number, currency: `Intl` API, locale-aware.

---

## 13. Design System Route

`/design-system` renders an interactive gallery with live state previews of every component. Every new component must be added there before it ships to production.
