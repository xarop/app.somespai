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
- **Voice**: Catalan-first, warm, brief. Never corporate.
- **Adjectives we are**: orgànic, proper, càlid, honest, calm.
- **Adjectives we are not**: corporate, gamified, urgent, neon, dark-mode-by-default.

---

## 3. Color Tokens

```css
:root {
  /* Surfaces */
  --bg:        #f4ede0;  /* warm cream — base canvas */
  --bg-soft:   #ebe2d2;
  --bg-deep:   #e2d6c1;

  /* Ink (text) */
  --ink:       #1f1c17;
  --ink-soft:  #5a544a;
  --ink-mute:  #8a8276;

  /* Brand */
  --primary:      #3d4f29;  /* deep olive */
  --primary-soft: #6b8053;
  --primary-tint: #d8e0cc;

  /* Accent — terracotta, used sparingly */
  --accent:      #c45a2c;
  --accent-soft: #e8a583;
  --gold:        #b8893a;  /* premium / verified */

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

**Usage**: 70% bg/ink, 20% primary, 8% bg-deep, 2% terracotta. Terracotta is precious.

---

## 4. Typography

| Role     | Family                   | Notes                                     |
|----------|--------------------------|-------------------------------------------|
| Display  | **Fraunces** (variable)  | Editorial serif, optical sizing 9–144     |
| Body     | **Geist** (variable)     | Modern sans, very readable                |
| Mono     | **Geist Mono**           | Code, IDs, addresses                      |

```css
:root {
  --serif: 'Fraunces', 'Iowan Old Style', Georgia, serif;
  --sans:  'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono:  'Geist Mono', ui-monospace, monospace;
}
```

### Type scale (modular, ratio 1.2)

| Token       | Size  | Use                       |
|-------------|-------|---------------------------|
| `--t-xs`    | 12px  | Captions, meta            |
| `--t-sm`    | 14px  | Secondary body            |
| `--t-base`  | 16px  | Body                      |
| `--t-lg`    | 19px  | Lead paragraph            |
| `--t-xl`    | 24px  | h3 / Card title           |
| `--t-2xl`   | 32px  | h2 / Section              |
| `--t-3xl`   | 44px  | h1 / Hero (mobile)        |
| `--t-4xl`   | 64px  | h1 / Hero (desktop)       |

Headings → serif. Body, buttons, inputs → sans.

---

## 5. Spacing

```css
--s-1: 4px;  --s-2: 8px;  --s-3: 12px;
--s-4: 16px; --s-5: 24px; --s-6: 32px;
--s-7: 48px; --s-8: 64px; --s-9: 96px;
```

Container max-widths: `--c-sm: 640px`, `--c-md: 880px`, `--c-lg: 1200px`.
Touch targets: minimum 44×44px.

---

## 6. Radii

```css
--r-sm:   8px;   /* chips, inputs */
--r-md:  14px;   /* buttons */
--r-lg:  22px;   /* cards */
--r-xl:  32px;   /* hero, modals */
--r-pill: 999px;
```

---

## 7. Motion

```css
--ease:      cubic-bezier(0.22, 1, 0.36, 1);
--ease-out:  cubic-bezier(0.16, 1, 0.3, 1);
--t-fast:  160ms;
--t-base:  280ms;
--t-slow:  480ms;
```

- **Page enter**: staggered card reveal (40ms delta), fade + 8px y-translate.
- **Hover**: lift 2px, never more.
- **Modal**: 280ms fade + scale 0.98 → 1.
- `prefers-reduced-motion`: collapse all transitions to 0ms.

---

## 8. Components — Anatomy

- **Button**: variants via `data-variant="primary|ghost|subtle"`. Never `.btn-primary`.
- **Card** (`<article class="space-card">`): photo (16:10), serif title, ink price, ink-soft meta, rating row.
- **Input**: glass background, 1px `--glass-border`, focus ring `--primary`.
- **Filter chip**: pill, icon + label. Selected uses `--ink` background.
- **Bottom sheet** (mobile): glass, drag handle, snap points (peek/half/full).
- **Map marker**: HTML marker. Type icon + price in glass pill. Cluster: olive circle.

---

## 9. Glassmorphism — How and When

**When**: floating UI over the map (search bar, filters, cards, sheets, modals).
**When not**: dense lists, settings forms, anywhere without a backdrop.

```css
.glass {
  background: var(--glass);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
```

Fallback: `@supports not (backdrop-filter)` → `--glass-strong` (more opaque).

---

## 10. Accessibility

- Contrast: WCAG AA min, AAA for body.
- Focus: `:focus-visible`, 2px `--primary`, 2px offset, always visible.
- Semantic HTML first. ARIA only when HTML can't express the relationship.
- Keyboard reachable. Modals trap focus.
- `<html lang>` updates with locale switch.
- `prefers-reduced-motion` respected.

---

## 11. Internationalization

- **Default**: Catalan (`ca`).
- **Supported**: `ca`, `es`, `en`.
- Strings live in `/messages/{locale}.json`. **Never hardcode** in components.
- Use `Intl` API for dates, numbers, currency.

---

## 12. Design System Route

`/design-system` renders an interactive gallery of every component with all states. Every new component must be added there before shipping.
