# Kalakriti — Project Restoration

## Original Problem Statement
- User reported: "cant see my last project that i was working on-kalakriti"
- Subsequent: User uploaded Kalakriti-main.zip (full codebase) and kalakriti.zip (artwork images); requested restore + swap of all in-code images (keeping logo).

## Restore Actions Completed (23 Apr 2026)
- Restored full Next.js 15 + FastAPI project from `Kalakriti-main.zip` into `/app`.
- Preserved `.emergent/emergent.yml` and `.git`.
- Created `/app/backend/.env` (MONGO_URL, DB_NAME=kalakriti_db, Cashfree/WhatsApp placeholders) and `/app/frontend/.env` (NEXT_PUBLIC_BACKEND_URL).
- Installed frontend deps (`yarn install`) and backend deps (`pip install -r requirements.txt`).
- Copied 48 artworks from `kalakriti.zip` into `/app/frontend/public/assets/images/gallery/` renamed `art-01.jpeg` … `art-48.jpeg`.
- Replaced all 32 external image URLs (img.rocket.new, images.unsplash.com, www.kalakari.in) across 6 files with local `/assets/images/gallery/art-XX.jpeg` paths. Logo files in `public/assets/images/` were NOT modified.
- Supervisor `backend` + `frontend` running; home page, gallery, portrait-configurator, review portal render correctly with new images.

## Tech Stack
- Frontend: Next.js 15.1.11 (TypeScript), TailwindCSS, framer-motion, zustand, lucide-react
- Backend: FastAPI + Motor/MongoDB, Emergent Google Auth, Cashfree payments, WhatsApp Cloud API
- Supervisor: `yarn start` (Next.js on :3000), `uvicorn server:app` (:8001), mongod

## Files Touched (image URL swap)
1. frontend/src/app/home-page/components/HeroSection.tsx (2 transformations, 4 URLs)
2. frontend/src/app/home-page/components/MediumShowcase.tsx (4 URLs)
3. frontend/src/app/home-page/components/TestimonialsSection.tsx (4 avatars)
4. frontend/src/app/gallery/page.tsx (9 URLs)
5. frontend/src/app/portrait-configurator/components/Step1MediumSize.tsx (6 URLs)
6. frontend/src/app/project-review-portal/components/ReviewPortal.tsx (4 URLs)

## Backlog / Next Steps
- P1: Provide real credentials for Cashfree + WhatsApp Cloud API + ADMIN_EMAILS before going live
- P1: Re-assign image mapping (testimonial avatars currently use artworks — user may want real avatar photos later)
- P2: Add proper alt text matching each artwork instead of generic ones
- P2: Create a seeded sample dataset for orders/projects in MongoDB for demos


## AI Chatbot (23 Apr 2026 — session 2)
- Added **Kalakriti Sakhi** AI concierge (GPT-5.2 via emergentintegrations, fallback gpt-4o).
- Backend endpoints: `POST /api/chat`, `GET /api/chat/history?session_id=`.
- Stores all turns in Mongo `chat_messages` (session_id keyed).
- Knowledge baked into system prompt: mediums, prices, sizes, policies, process, recommendations.
- Auto-detects `KLK-YYYYMMDD-XXXXXX` pattern in any user message, fetches order from DB, injects as ORDER CONTEXT for live status lookup.
- LLM emits `[CTA:CONFIGURE]` → renders "Start Configurator" button / `[CTA:CALL]` → renders "Call +91 96677 88175".
- Frontend: `/app/frontend/src/components/AIChatBot.tsx` mounted globally in `layout.tsx`. Replaced WhatsAppFloatingButton everywhere.
- `.env` additions: `OPENAI_API_KEY`, `AI_MODEL=gpt-5.2`, `SUPPORT_PHONE=+919667788175`.
- ⚠️ **Blocker on user key**: The OpenAI key provided returns "quota exceeded". Code is verified and working end-to-end — just needs an active billing key or switch to `EMERGENT_LLM_KEY`.

## Cashfree (live keys)
- PROD App ID + Secret wired. `CASHFREE_MODE=PROD`. `/api/payments/cashfree/create` confirmed returning real `payment_session_id`. Webhook URL pending setup in Cashfree dashboard.

## Admin CMS / Listings (25 Apr 2026)
- New self-serve content manager at **`/admin/listings`** (admin only).
- Tabs: **Mediums**, **Hero**, **Gallery**, **Pricing** — all editable without redeploy.
- Backend collection: `site_content` (key-based docs, falls back to defaults if unset)
  and `cms_images` (base64 stored, served via `/api/cms-image/{id}`).
- New endpoints:
  - `GET  /api/content/{section}` (public)
  - `PUT  /api/admin/content/{section}` (admin)
  - `POST /api/admin/content/{section}/reset` (admin)
  - `POST /api/admin/cms-image` (admin) — accepts data-URL, returns `/api/cms-image/{id}`
  - `GET  /api/cms-image/{id}` (public)
- Frontend: `MediumShowcase`, `HeroSection`, and `gallery/page.tsx` now fetch CMS content
  with hardcoded fallback (no breakage if API unreachable).
- Auth: uses existing Emergent Google login; `ADMIN_EMAILS=riddhijain0119@gmail.com`.

## Pricing CMS wired through (25 Apr 2026)
- Admin price edits at `/admin/listings → Pricing` now flow through to the live portrait configurator end-to-end.
- `engine.ts` constants converted to mutable `let` bindings + new `applyPricingOverrides()` and `loadPricingFromCMS()` exports.
- `usePricingVersion()` React hook + `subscribeToPricing()` listener trigger re-renders when CMS pricing changes.
- `PricingLoader.tsx` mounted at the configurator entry calls the CMS once and forces wizard recalc.
- Verified live: setting watercolour base = ₹9,999 in CMS → configurator shows "from ₹9,999" + live estimate ₹11,799 (incl. GST). Reset restores defaults.

## Admin orders grouped by status (25 Apr 2026)
- Admin dashboard now groups orders into separate collapsible sections per status (Placed / Confirmed / In Production / Shipped / Out for Delivery / Delivered / Cancelled).
- Filter pills show live count for each stage; "All" pill aggregates total.
- Each section has its own table with the same Update / WhatsApp action buttons.
- API change: admin dashboard fetches all orders once with `?limit=500` instead of per-status calls.

## Backlog / Next Steps (updated 25 Apr 2026)
- ✅ DONE: ReviewPortal timeline simplified to Order Received → In Production → Shipped → Delivered.
  Removed RevisionThread + draft/approve flow (full upfront payment, direct ship model).
- P1: Verify Resend domain `kalakritishop.in` (currently sending from `onboarding@resend.dev` sandbox).
- P1: User to whitelist preview/prod domain in Cashfree dashboard.
- P2: Wire portrait-configurator / pricing engine to `/api/content/pricing` so admin price edits flow through.
- P2: Delete unused `WhatsAppFloatingButton.tsx` and `RevisionThread.tsx`.


## Deployment Build Fix (06 Feb 2026)
- Wrapped `useSearchParams()` consumers in `<Suspense>` boundary to satisfy Next.js 15 strict CSR-bailout rule:
  - `/app/frontend/src/app/payment/return/page.tsx`
  - `/app/frontend/src/app/pay/page.tsx`
  - `/app/frontend/src/app/track-order/page.tsx`
- Pattern: inner `*Content()` component holds the existing logic; default export wraps it in `<Suspense>` with a brand-aligned loading fallback.
- Verified: `cd /app/frontend && yarn build` → exit 0, all 20 routes prerendered statically (17.28s).
- Deployment is now unblocked — user can hit "Deploy" on Emergent.

## Backlog / Next Steps (updated 06 Feb 2026)
- P0 ✅ DONE: Suspense fix for Next.js production build.
- P1: Abandoned-payment recovery (auto banner + email if order unpaid > 30 min).
- P2: Customer self-service review upload at `/my-orders` (photos + 5-star rating).
- P3: CSV order export from admin panel.
- ⚪ Deferred: `server.py` complexity refactor — intentionally untouched to avoid regression on revenue-critical paths.
