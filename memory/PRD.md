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

