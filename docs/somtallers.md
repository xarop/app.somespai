# Somtallers

Somtallers is an independent brand deployment of this Next.js app. It uses
`NEXT_PUBLIC_BRAND=somtallers`, while Supabase Auth, `profiles`, and `spaces`
remain shared with Somespai. Workshop data is additive in `workshops` and
`workshop_sessions`. The Somtallers deployment is `tallers.somespai.net`.
Its directory mirrors Somespai's map-first layout, search header, filter chips,
result sheet, map/list toggle, and hamburger menu, with category icons and
workshop markers/cards instead of space types. Somespai's existing directory
and menu remain unchanged; its publishing form gains the workshop-venue
checkbox, and the detail page of venue spaces lists their workshops with
buttons to create one on Somtallers (`/publicar-taller?space=<slug>`) or ask the
owner. Set `NEXT_PUBLIC_SOMTALLERS_URL` to override the Somtallers link.

## Local setup

### Run both brands without Docker

The mock database includes five illustrative workshop listings and links them
to the existing mock Somespai spaces. Run both brands in separate terminals;
they use independent Next.js build directories and share the same mock data:

```bash
# Terminal 1: Somtallers
NEXT_PUBLIC_BRAND=somtallers NEXT_PUBLIC_MOCK_DB=true NEXT_PUBLIC_SUPABASE_URL=mock \
NEXT_BUILD_DIR=.next-somtallers bun run dev -- --port 3000

# Terminal 2: Somespai
NEXT_PUBLIC_BRAND=somespai NEXT_PUBLIC_MOCK_DB=true NEXT_PUBLIC_SUPABASE_URL=mock \
NEXT_BUILD_DIR=.next-somespai bun run dev -- --port 3001
```

Open `http://localhost:3000` for Somtallers and `http://localhost:3001` for
Somespai. The mock login is automatic. This mode is for UI smoke testing; it
does not validate Supabase migrations, RLS, or account sharing. Browser
geolocation is requested on a fresh directory visit; allow it to search within
15 km, or type a city/address to filter the examples. The location can be
changed any time.

1. Install the project dependencies and start local Supabase:

   ```bash
   bun install
   npx supabase start
   npx supabase db reset --local
   ```

   The database reset applies `0022_workshops.sql` and `0023_workshop_venues.sql`
   along with the existing schema and seeds five local Somtallers listings in
   Barcelona. Only `room` spaces are initially marked as suitable for workshops.
   The Somespai space publish form allows opting other spaces in. It resets the
   local database; do not use `--local` against a shared production project.

2. Copy the local Supabase API URL and anon key from `npx supabase status` into
   `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Leave `NEXT_PUBLIC_MOCK_DB` unset or set it to `false` to test the real local
   schema and RLS.

3. Start the Somtallers UI:

   ```bash
   NEXT_PUBLIC_BRAND=somtallers bun run dev
   ```

   Open `http://localhost:3000` (Catalan), `http://localhost:3000/es`, or
   `http://localhost:3000/en`.

## Manual smoke test

1. Create or sign in to a local Supabase Auth account using the account control
   in the header.
2. Open `/publicar-taller`. Add a title, category, price, location coordinates,
   contact method, and at least one future session. At step 2, select an active
   Somespai space first. To create one, open the Somespai publishing link in a
   new tab, finish listing the space, return to the workshop form, and refresh
   the space list before selecting it.
3. Confirm the success link opens `/taller/[slug]`. Verify the session dates,
   contact links, and linked Somespai space.
4. Return to `/`, filter with the category select (text labels) and date field, and verify
   the category icon appears on both the map marker and result card. Switch
   between map and list layouts, and clear the filters to verify the listing
   remains discoverable.
5. In Supabase Studio, confirm the new workshop's `organizer_id` matches the
   authenticated profile and its `location` was populated from `lat`/`lng`.
6. With a second account, confirm the active workshop and scheduled sessions are
   readable, while updating or deleting the first organizer's listing is denied
   by RLS.

The local sample listings use publicly advertised workshop providers and link to
their websites. Their Somespai space associations are demonstration links only;
the future session dates and seat counts are illustrative, not real availability
or bookable offers. Example sources:

- [Jungle Mow's workshops](https://junglemows.com/cat/workshops/) — terrarium and plant workshops in Barcelona.
- [Casapampa workshops](https://www.casapampa.net/talleres) — terrarium workshops.
- [Consell81](https://www.consell81.com/primera-experiencia-ceramica/) — introductory ceramics experience.
- [Atuell](https://atuell.com/) — ceramics initiation and modelling / wheel-throwing courses.
- [Aforest](https://aforest.es/) — ceramics classes and creative workshops.

## Checks and deployment

Run the type check and production build before deploying:

```bash
bun run type-check
bun run build
```

The Somtallers Vercel project should deploy branch `somtallers`, set
`NEXT_PUBLIC_BRAND=somtallers`, and reuse the Somespai Supabase URL and anon key.
Configure the domain as `tallers.somespai.net`.
Apply `0022_workshops.sql` and `0023_workshop_venues.sql` to the shared Supabase
database once, after validating them locally. Migration version `0021` is already
used by `0021_explicit_grants.sql`; do not rename the workshop migration to `0021`.
