# Checklist del 4 de juny de 2026

> Supabase va bloquejar el projecte el 18/05/2026 per excedir la quota
> de Cached Egress (28 GB / 5 GB = 562%). La quota es reinicia el **4 de juny**.

---

## 1. Verificar que Supabase ha tornat a funcionar

https://supabase.com/dashboard/project/nkdmysztmgerwhrklzhx/settings/billing

- [ ] "Cached Egress" ha tornat a 0
- [ ] L'avís de restricció ha desaparegut
- [ ] L'app a https://app.somespai.net torna a carregar

> Pot trigar fins a 1 hora des de la mitjanit en reiniciar-se.

---

## 2. Migrar les fotos existents a Cloudflare R2

Des de l'arrel del projecte:

```bash
node scripts/migrate-photos-to-r2.mjs
```

L'script descarrega cada foto de Supabase, la puja a R2 i actualitza la URL
a la base de dades. Idempotent — es pot executar diverses vegades.

Comprova el resultat: busca alguna space a la DB i verifica que la URL de la
foto comença per `https://pub-10851b008c13466c9244553370aec04f.r2.dev/`.

---

## 3. Fer el mateix a CoSlot (branca `coslot`)

CoSlot (`www.coslot.space`) comparteix el mateix Supabase però té el seu
propi codi. Cal aplicar-hi la mateixa migració:

```bash
git checkout coslot
git merge main          # porta els canvis de R2 (r2.ts, actions.ts, .npmrc)
# Resol conflictes si n'hi ha (ull amb "espai" → "slot")
git push origin coslot
```

I executar l'script de migració de fotos (el script és el mateix, llegeix
de la mateixa DB de Supabase).

---

## 4. Netejar Supabase Storage (opcional però recomanat)

Un cop verificat que totes les URLs apunten a R2, buida el bucket de Supabase
per alliberar espai i evitar futurs problemes d'egress:

```bash
# Via Supabase CLI
npx supabase storage rm 'space-photos/**' --project-ref nkdmysztmgerwhrklzhx
```

O manualment des del dashboard:
https://supabase.com/dashboard/project/nkdmysztmgerwhrklzhx/storage/buckets/space-photos

---

## Referència ràpida

| Recurs | URL |
|---|---|
| Supabase billing | https://supabase.com/dashboard/project/nkdmysztmgerwhrklzhx/settings/billing |
| Cloudflare R2 bucket | https://dash.cloudflare.com/?to=/:account/r2/buckets/somespai-photo |
| R2 Public URL | `https://pub-10851b008c13466c9244553370aec04f.r2.dev` |
| Script migració | `scripts/migrate-photos-to-r2.mjs` |
