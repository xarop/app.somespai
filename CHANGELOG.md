# Changelog

Tots els canvis notables d'aquest projecte es documenten en aquest fitxer.

El format es basa en [Keep a Changelog](https://keepachangelog.com/ca/1.1.0/)
i el projecte segueix [Semantic Versioning](https://semver.org/lang/ca/).

## [Unreleased]

### Added
- Marca Somtallers amb cercador de tallers, mapa, fitxa de detall, contacte directe i publicació per passos, compartint els perfils i els espais de Somespai.
- Migració additiva de tallers i sessions amb RLS, índexs PostGIS i cerca RPC per proximitat i dates (`0022_workshops.sql`).
- Dades locals de demostració per tallers de terraris/plantes i ceràmica a Barcelona, basades en proveïdors amb oferta pública; sessions i places clarament orientatives.
- Cerques de tallers per ubicació actual (amb permís del navegador) o per ciutat/adreça, amb radi PostGIS de 15 km i filtratge equivalent en mode mock.
- Vinculació dels exemples amb espais Somespai, amb selector al començament del pas 2, enllaç per crear un espai a Somespai i actualització de la llista sense perdre el formulari.
- Camp `is_workshop_venue` per identificar espais que acullen tallers; inicialment només es marquen les sales i el selector de tallers filtra per aquesta opció.
- Somtallers passa a `tallers.somespai.net` i replica l’experiència de Somespai (mapa, cercador, filtres, targetes i menú) amb icones per categories creatives; la UI de Somespai només afegeix el selector d’espais aptes per a tallers.
- Mode mock compartit per executar Somtallers i Somespai en ports locals independents; els enllaços entre marques apunten al servei Somespai local.
- Documentació per configurar i provar Somtallers localment (`docs/somtallers.md`).
- Identitat pròpia de Somtallers: color principal taronja (`#F2A65A`) amb accent blau-verd, nou logo i favicon (`public/somtallers.svg`); Somespai manté el verd.

### Changed
- Més categories de tallers (fusteria, floristeria, rebosteria, begudes, música, dansa, benestar, fotografia, escriptura, il·lustració, teixit, vidre, cuir, escultura, maker i altres), amb icona i color propis.
- La pàgina d'Ajuda del menú de Somtallers explica Somtallers (cerca, filtres, contacte, publicació) en lloc de Somespai.
- El filtre de tipus de taller és un desplegable amb text (en lloc d'icones) i els camps de la capçalera s'alineen amb el cercador.

## [0.6.0] — 2026-06-09

### Added
- Escalat de fotos al client abans de pujar-les (publicador, edició i admin): redimensiona a 1280px de costat llarg amb JPEG q80 i orientació EXIF, reduint temps de pujada i egress (`src/lib/images/resize-image.ts`).
- Optimització de fotos a la importació de Google Places (`bulk-scraper.ts`): costat llarg ≤ 1280px i WebP q80.
- Script `scripts/resize-existing-photos.mjs` per reprocessar fotos ja pujades a R2 (amb `--dry-run`).
- Fallback de base de dades *mock* local + bàner de "Mockup Mode" al topnav quan `NEXT_PUBLIC_MOCK_DB` està actiu.
- Fitxer de verificació de Google Search Console (`public/google18d876afadec8d74.html`).
- Codi de Google Analytics (mesura `G-S9DSSWGP53`).

### Fixed
- `robots.txt` ara deriva `Host`/`Sitemap` del domini de la petició, així és correcte a tots els dominis (Somespai, CoSlot, previews), mantenint totes les pàgines públiques indexables.
- El modal d'autenticació ja no desquadra ni es talla en mòbil: es renderitza amb portal a `<body>` (fora del topnav amb `backdrop-filter`), usa `100dvh` i `scrollbar-gutter: stable`.
- Compatibilitat de la mock DB amb l'Edge runtime i errors de tipus TS; fallback a `VERCEL_URL` per al proxy d'edge.

### Changed
- Estils inline del modal d'autenticació substituïts per classes CSS (`.auth-modal__*`).

## [0.5.0] — 2026-05-18

### Changed
- Migració de l'emmagatzematge d'imatges de Supabase Storage a **Cloudflare R2** (egress zero) (`src/lib/r2.ts`).
- Script de migració de fotos existents Supabase → R2 (`scripts/migrate-photos-to-r2.mjs`).

### Added
- `.npmrc` amb `legacy-peer-deps` per a `@aws-sdk/client-s3`.

## [0.4.0] — 2026-05 (Phase 4 — SEO avançat)

### Added
- Sitemap dinàmic i multilingüe localitzat (`ca`/`es`/`en`).
- Redireccions canonical absolutes i enllaços alternatius `hreflang`.
- Schema.org `Product` + `BreadcrumbList` en JSON-LD.
- Rutes SEO amistoses tipus *landing*: `/[ciutat]` i `/[ciutat]/[tipus]`.
- Meta tags OpenGraph dinàmics generats als Server Components.
- Pàgina "Mapa Web" generada estàticament (`/[locale]/sitemap`).

### Changed
- La pàgina de detall d'espai passa de modal a HTML normal quan s'accedeix directament (millor lectura per crawlers).

## [0.3.0] — 2026-05 (Phase 3 — Admin, Premium, API)

### Added
- Panell d'administració complet (`/admin`): gestió d'espais (editar, publicar, pausar, esborrar, destacar) i d'usuaris.
- Edició autònoma de fitxes per part del propietari (`/editar/[slug]`) i secció "Els Meus Espais" al perfil.
- Comptes **Premium**: camp `is_premium`, badge daurada i límit de fotos (1 gratuït / 6 premium) aplicat al client i al servidor.
- **API REST v1** pública amb autenticació per clau, filtres espacials (PostGIS) i paginació per cursor (`/api/v1/spaces`).
- **Importació des de Google Places**: cerca, selecció i importació massiva des del panell admin, amb refresc i actualitzacions massives.
- Badge de Verificat / Garantitzat.

## [0.2.0] — 2026-05-04 (Phase 2 — Creació, Auth i Backoffice)

### Added
- Autenticació amb correu/contrasenya via Supabase Auth (local i producció).
- Formulari de publicació d'espais (`/publica`) amb auto-geolocalització (GPS + geocodificació inversa Nominatim).
- Pujada de fotos, fotos a targetes i hero, conversió a WebP.
- Camps de contacte estructurats (`phone`, `email_contact`, `whatsapp`, `web`, `contact_default`).
- Preferits amb actualització optimista i sistema de ressenyes amb rating d'estrelles.
- Web Share API i script d'importació d'anuncis.
- Colors per tipus d'espai aplicats a targetes, hero, marcadors de mapa i badges.

## [0.1.0] — 2026-05-03 (Phase 1 — Fonaments i UI principal)

### Added
- Scaffold del projecte: **Next.js 15** (App Router, RSC) + **Supabase** (Postgres + PostGIS, RLS) + **MapLibre GL JS**.
- Sistema CSS natiu en capes (`@layer`: tokens → elements → components → utilities), sense Tailwind.
- i18n complet amb next-intl (CA / ES / EN), català per defecte.
- Home amb mapa i llistat de targetes; càrrega d'espais reals des de Supabase.
- Pàgina de detall d'espai i *design system* interactiu (`/design-system`).
- Configuració PostGIS i polítiques RLS per defecte.

[0.6.0]: https://github.com/xarop/app.somespai/releases/tag/v0.6.0
[0.5.0]: https://github.com/xarop/app.somespai/releases/tag/v0.5.0
[0.4.0]: https://github.com/xarop/app.somespai/releases/tag/v0.4.0
[0.3.0]: https://github.com/xarop/app.somespai/releases/tag/v0.3.0
[0.2.0]: https://github.com/xarop/app.somespai/releases/tag/v0.2.0
[0.1.0]: https://github.com/xarop/app.somespai/releases/tag/v0.1.0
