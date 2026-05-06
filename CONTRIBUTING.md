# Guia de Contribució a Somespai

Gràcies per voler col·laborar a Somespai! 🎉 Aquest document t'ajudarà a configurar l'entorn de desenvolupament al teu ordinador i a entendre el flux de treball de (Git i GitHub) per a aquest projecte.

## 1. Requisits previs

Necessitaràs tenir instal·lat:
- [Node.js](https://nodejs.org/) (es recomana v20 o superior)
- [Bun](https://bun.sh/) (utilitzem Bun de forma estricta com a gestor de paquets i scripts d'execució)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (necessari per simular Supabase i la base de dades localment)

## 2. Muntar l'entorn local

Segueix aquests passos per tenir l'aplicació funcionant a la teva màquina:

1. **Clona el repositori:**
   ```bash
   git clone https://github.com/EL_TEU_USUARI/app.somespai.git
   cd app.somespai
   ```

2. **Instal·la les dependències:**
   ```bash
   bun install
   ```

3. **Inicia Supabase en local (Requereix Docker):**
   Atès que fem servir les eines de Supabase pel backend, necessites tenir **Docker** funcionant. Amb Docker obert en segon pla, engega l'entorn de Supabase:
   ```bash
   npx supabase start
   ```
   *El primer cop que s'executi descarregarà les imatges SQL i Edge Functions. Quan acabi et mostrarà per pantalla les URL API i les claus Anon de desenvolupament local.*

4. **Configura les variables d'entorn:**
   Crea un fitxer `.env.local` a l'arrel del projecte copiant i afegint-hi les claus locals (o del _dev_ online) de l'anterior o compartida per l'equip.
   
   ```env
   # Variables proporcionades normalment en local per 'npx supabase start'
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   
   # Opcional - API Maptiler per Tiles del mapa.
   NEXT_PUBLIC_MAP_TILES_URL=...
   
   # Opcional (fa bypass per entrar com a usuari autenticat en local)
   ADMIN_EMAIL=el-teu-email@exemple.com
   NEXT_PUBLIC_ADMIN_EMAIL=el-teu-email@exemple.com
   ```

5. **Inicia el servidor de desenvolupament de Next.js:**
   ```bash
   bun run dev
   ```
   Ara el projecte web estarà corrent a [http://localhost:3000](http://localhost:3000) connectat al Supabase de desenvolupament (API a la web o per localhost).

## 3. Panell d'Administració i Autenticació Local

En l'entorn de desenvolupament (`NODE_ENV=development`), t'hauràs adonat de la presència de les variables d'entorn `ADMIN_EMAIL` i/o `NEXT_PUBLIC_ADMIN_EMAIL`.

Com a eina per facilitar les proves:
- Quan inicies el projecte en local web, fas un "bypass" (saltes) de l'autenticació i entres directament connectat amb el correu configurat allà (exemple: posa el teu propi correu, com `el-teu-email@exemple.com`).
- Aquest súper-usuari té permís per accedir al **Panell d'Administració** (`/admin`), que té dues pestanyes:
  - **Espais** — crear (`/publica`), editar, publicar/pausar, destacar i eliminar espais.
  - **Usuaris** — llistat de tots els usuaris registrats amb data d'alta, últim accés, nombre d'espais i opció d'eliminar.

## 4. Flux de treball (GitHub)

La branca `main` està protegida per evitar trencaments a producció. **No fem push directe a `main`**. El correcte és fer servir el sistema de *Pull Requests*.

Si pertanys a l'equip (tens permisos de col·laborador), el procés és el següent:

1. **Actualitza la branca principal a l'última versió:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Crea una nova branca per treballar:**
   Posa-li un nom clar sobre allò que vas a desenvolupar:
   ```bash
   git checkout -b el-teu-nom/nova-funcionalitat
   ```

3. **Aplica els teus canvis:**
   Fes els teus canvis al codi. Si us plau, utilitza format de **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:` etc.):
   ```bash
   git add .
   git commit -m "feat(map): afegir funcionalitat de zoom"
   ```

4. **Puja els canvis i obre una Pull Request (PR):**
   ```bash
   git push origin el-teu-nom/nova-funcionalitat
   ```
   Ves a GitHub, obre la PR, i espera a què Vercel validi la *build* i algú més de l'equip n'aprovi el contingut. Així s'assegura l'estabilitat i es fusionarà cap a `main`.

---

## 5. Guies de Codi i Regles

**És obligatori** que abans d'escriure codi nou revisis la documentació oficial que governa aquest repositori. Pots trobar-la a l'arrel del projecte:

- **`AGENTS.md`** - Llegir-lo és obligatori. Conté les restriccions d'arquitectura, definició de la base de dades, regles de components RSC, i coses que "No" introduirem (ex: no s'usa Tailwind).
- **`DESIGN.md`** - Per entendre el sistema de disseny, els *Design tokens* en CSS, classes i accessibilitat.
- **`README.md`** - Resum i concepte del projecte general.

Feliç programació! 🚀