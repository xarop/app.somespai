# Integration Test

This file is used to verify that the integration between the main features (Supabase, Next.js, i18n, and Vercel deployment) is working as expected.

## Checklist

- [x] Supabase connection (local and production)
- [x] Environment variables loaded correctly
- [x] Dynamic sitemap generation
- [x] Brand name is dynamic in design system
- [x] Multi-branch deployment (Somespai / CoSlot)
- [x] English and Catalan translations present and correct
- [x] README instructions up to date

## How to verify

1. Run `bun run dev` locally and check:
   - Home page loads in Catalan by default (`/ca`)
   - Brand name in `/design-system` matches the current brand (Somespai or CoSlot)
   - You can log in and access `/admin` if your email is in `ADMIN_EMAIL`
   - Sitemap (`/sitemap` and `/sitemap.xml`) updates when you add/remove spaces
2. Push to `main` and `coslot` and verify Vercel deploys both projects
3. Check Supabase Auth dashboard for user registration and login events

## Clean up

Once all items are checked and verified, this file can be deleted.
