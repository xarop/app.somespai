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
  --glass:        rgba(255, 252, 247, 0.62);
  --glass-strong: rgba(255, 252, 247, 0.88);
  --glass-border: rgba(31, 28, 23, 0.08);
  --glass-shadow: 0 8px 32px rgba(31, 28, 23, 0.08),
                  0 2px 6px  rgba(31, 28, 23, 0.04);
}
```

**Usage rule**: 70% bg/ink, 20% primary, 8% bg-deep accents, 2% terracotta. Terracotta is precious — use it for one moment per screen.

---

## 4. Typography

Two families, one system.

| Role     | Family                  | Weights        | Notes                         |
|----------|-------------------------|----------------|-------------------------------|
| Display  | **Fraunces** (variable) | 400 / 500 / 700 | Editorial, optical sizing 9–144 |
| Body     | **Geist** (variable)    | 400 / 500 / 600 | Modern, neutral, very readable  |
| Mono     | **Geist Mono**          | 400 / 500       | Code, IDs, addresses            |

```css
:root {
  --serif: 'Fraunces', 'Iowan Old Style', Georgia, serif;
  --sans:  'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono:  'Geist Mono', ui-monospace, monospace;
}
```

### Type scale (modular, ratio 1.2)

| Token        | Size    | Line  | Use                         |
|--------------|---------|-------|-----------------------------|
| `--t-xs`     | 12px    | 1.5   | Captions, meta              |
| `--t-sm`     | 14px    | 1.5   | Secondary body              |
| `--t-base`   | 16px    | 1.55  | Body                        |
| `--t-lg`     | 19px    | 1.45  | Lead paragraph              |
| `--t-xl`     | 24px    | 1.3   | h3 / Card title             |
| `--t-2xl`    | 32px    | 1.2   | h2 / Section                |
| `--t-3xl`    | 44px    | 1.1   | h1 / Hero (mobile)          |
| `--t-4xl`    | 64px    | 1.05  | h1 / Hero (desktop)         |

Headings (h1, h2, h3) use the **serif** by default. Body, buttons, inputs use the **sans**. Never mix display and body weights inside the same element.

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

## 6. Radii & Elevation

```css
--r-sm:   8px;   /* chips, inputs */
--r-md:  14px;   /* buttons, small cards */
--r-lg:  22px;   /* cards, sheets */
--r-xl:  32px;   /* hero cards, modals */
--r-pill: 999px; /* filter chips, avatars */
```

Elevation is **not** drop shadows on a white card. It's `--glass` over a real backdrop. When a shadow is needed, it's warm:

```css
--shadow-1: 0 1px 2px  rgba(31, 28, 23, 0.06);
--shadow-2: 0 6px 18px rgba(31, 28, 23, 0.08);
--shadow-3: 0 18px 48px rgba(31, 28, 23, 0.12);
```

---

## 7. Motion

```css
--ease:      cubic-bezier(0.22, 1, 0.36, 1);   /* default */
--ease-out:  cubic-bezier(0.16, 1, 0.3, 1);    /* arrivals */
--ease-in:   cubic-bezier(0.7, 0, 0.84, 0);    /* departures */
--t-fast:  160ms;
--t-base:  280ms;
--t-slow:  480ms;
```

### Rules
- **Page enter**: staggered reveal of cards (40ms delta), fade + 8px y-translate.
- **Hover**: lift 2px, never 4+ (we are not a casino).
- **Modal**: 280ms fade + scale from 0.98 → 1.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` collapses all transitions to 0ms.

---

## 8. Components — Anatomy

### Button
States: `default · hover · focus-visible · active · disabled · loading`.
Variants: `primary` (filled olive), `ghost` (outline), `subtle` (no border).
**Never** add `.btn`, `.btn-large`, `.btn-rounded`. A `<button>` has the shape. Variants are `data-variant="ghost"`.

### Card (`<article class="space-card">`)
Photo (16:10), title (serif), price (ink), location (ink-soft), rating row.
Hover: lift + image scale 1.03.

### Input (`<input>`, `<textarea>`)
Floating label, glass background, 1px `--glass-border`, focus ring `--primary`.

### Filter chip (`<button data-chip>`)
Pill, icon + label. Selected = `--primary` background, white text. Unselected = `--glass`.

### Bottom sheet (mobile)
Glass surface, drag handle, snap points: `peek` (120px) · `half` (50vh) · `full` (90vh).

### Map marker
Custom HTML marker. Type icon in a glass pill. Cluster: olive circle with count.

---

## 9. Iconography

- Stroke-based, 1.5px, rounded caps. From Lucide-style set, redrawn for consistency.
- 4 type icons (storage, workspace, garden, room) — hand-tuned, never stock photography.

---

## 10. Accessibility

- Contrast: WCAG AA minimum, AAA for body text.
- Focus rings: **always** visible (`:focus-visible`), 2px `--primary`, 2px offset.
- Semantic HTML first. ARIA only when HTML can't express the relationship.
- All interactive elements reachable by keyboard. Modals trap focus.
- Language attribute (`<html lang>`) updates with i18n switch.
- `prefers-reduced-motion` respected.

---

## 11. Glassmorphism — How and When

**When**: floating UI over the map (search bar, filters, space card, bottom sheet, modals).
**When not**: dense lists, forms inside a settings page, anywhere without a backdrop image/map.

```css
.glass {
  background: var(--glass);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
```

Fallback for browsers without `backdrop-filter`: `--glass-strong` (more opaque) is auto-applied via `@supports not`.

---

## 12. Internationalization

- **Default**: Catalan (`ca`).
- **Supported**: `ca`, `es`, `en`.
- All UI strings live in `/messages/{locale}.json`. **Never** hardcode strings in components.
- Date, number, currency: `Intl` API, locale-aware.
- `<html lang>` and `<html dir>` updated on switch.

---

## 13. Design System Route

`/design-system` renders an interactive gallery with live state previews of every component. Every new component must be added there before it ships to production. It doubles as a regression test surface.
