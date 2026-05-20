# Restauració de Supabase (4 de Juny)

Aquest document detalla els passos necessaris per tornar a connectar l'aplicació a la base de dades real de **Supabase** un cop es renovin els límits del pla el proper **4 de juny de 2026**.

L'aplicació està desplegada a producció a: **[app.somespai.net](https://app.somespai.net)**

---

## 1. Entorn Local (Desenvolupament)

Per defecte, per continuar treballant en local sense dependre de Supabase, hem activat el **Mock Mode** (base de dades local simulada en un fitxer JSON).

Per tornar a connectar el teu entorn local a Supabase:

1. Obre el fitxer `.env.local` a l'arrel del teu espai de treball.
2. Cerca la variable `NEXT_PUBLIC_MOCK_DB`:
   ```env
   # Canvia de true a false per desactivar el mode simulació
   NEXT_PUBLIC_MOCK_DB=false
   ```
3. Reinicia el teu servidor local de desenvolupament:
   ```bash
   bun run dev
   ```
4. L'aplicació en local es connectarà automàticament a la instància real de Supabase utilitzant les credencials del teu fitxer `.env.local` (que hem mantingut intactes i de les quals hi ha una còpia a `.env.local.supabase`).

---

## 2. Entorn de Producció (app.somespai.net a Vercel)

El desplegament a producció a **app.somespai.net** es gestiona a través de Vercel. Per assegurar-te que la producció utilitza les dades reals de Supabase:

1. **Revisa les variables d'entorn a Vercel**:
   * Accedeix al tauler de control del projecte a Vercel.
   * Ves a **Settings** > **Environment Variables**.
   * Assegura't que la variable `NEXT_PUBLIC_MOCK_DB` **NO** està definida com a `true` (el millor és que no estigui definida o estigui en `false`).
2. **Pujar el codi a producció**:
   * Quan facis el *merge* de la branca `develop` cap a `main`, Vercel iniciarà un desplegament automàtic.
   * Com que la variable de Vercel `NEXT_PUBLIC_MOCK_DB` estarà absent o en `false`, el servidor de producció inicialitzarà el client oficial de Supabase connectant-se al teu projecte definitiu en línia.

---

## 3. Comprovació de Funcionament

Un cop restablert l'entorn de dades reals, pots verificar el correcte funcionament seguint aquests passos:
1. Accedeix a **app.somespai.net** (o en local amb `NEXT_PUBLIC_MOCK_DB=false`).
2. Intenta cercar un espai de la llista (comprova que es carreguen els espais reals des del teu panell de Supabase).
3. Intenta crear un nou espai de prova o afegir una petita ressenya per veure si es desa correctament a la base de dades en línia.

---

## 4. Dades creades durant el període de simulació (Opcional)

Si durant el període de bloqueig has creat o editat espais, ressenyes o favorits en local que vols traslladar a producció:
* Totes les dades simulades en local s'han desat al fitxer:
  [`src/lib/supabase/mock-db-file.json`](file:///C:/Users/ajl/.gemini/antigravity/worktrees/app.somespai/suggest-code-improvements/src/lib/supabase/mock-db-file.json)
* Pots fer servir aquest fitxer com a referència per tornar a crear manualment els espais des del formulari de la web, o utilitzar les eines d'importació de l'administrador per carregar-los en bloc.
