# Kalakriti — Complete System Documentation

> Single-source migration / onboarding document. Assumes zero prior context.
> Last updated: Feb 2026 (based on the state of `/app` at the time of generation).

---

## 1. Product Overview

### 1.1 What is Kalakriti?
Kalakriti is a **D2C e-commerce platform for bespoke handmade portraits** (oil, watercolour, charcoal, pencil, acrylic, digital, etc.) based in India. A customer uploads a reference photo, chooses a medium / size / frame, pays **100% upfront** via Cashfree, and the piece is painted by in-house artists, then shipped pan-India via Shiprocket. A GPT-5.2-powered AI concierge ("**Kalakriti Sakhi**") can take the order conversationally if the customer doesn't want to use the visual configurator.

The brand is premium-Indian, Hinglish-friendly, and optimized for WhatsApp-first buyers.

### 1.2 Core user flows

| Flow | Entry point | Outcome |
|------|-------------|---------|
| **Visual configurator order** | `/portrait-configurator` | Customer picks medium → size → frame → faces → add-ons → fills shipping form → pays upfront → order placed. |
| **AI-chat order** | Floating chat bubble (global) → `AIChatBot.tsx` | Customer chats with "Kalakriti Sakhi". When she detects intent + details, she emits `[PLACE_ORDER:{...}]` which the backend parses into a real order + returns a Cashfree payment link. |
| **Gallery browse** | `/gallery` | Public artwork showcase (48 real works from `/public/assets/images/gallery/art-01..48.jpeg`). |
| **Order tracking** | `/track-order?awb=...` or `/my-orders` | Logged-in customers see their timeline (Placed → Confirmed → In Production → Shipped → Out for Delivery → Delivered). `/track-order` pulls live Shiprocket status by AWB. |
| **Review portal** | `/project-review-portal/[order_id]` | Customer previews the finished piece (simplified: no revision/approve loop — upfront payment means direct ship). |
| **Payment** | `/pay?order_id=...` or `/payment/return` | Cashfree Hosted Checkout; `/payment/return` lands the user post-pay and reconciles via webhook. |
| **Admin CMS** | `/admin`, `/admin/listings`, `/admin/coupons`, `/admin/reviews`, `/admin/broadcast` | Google-authed admin can edit mediums/hero/gallery/pricing live, moderate reviews, create coupons, broadcast WhatsApp, ship orders, view stats. |

### 1.3 Target user
- **Primary**: Indian gift-buyers (25–55) ordering anniversary / wedding / memorial / family portraits; mobile-first; comfortable with UPI; prefers WhatsApp support.
- **Secondary**: Corporate / NRI buyers ordering larger framed works shipped domestically.
- **Admin persona**: Kalakriti founder (`riddhijain0119@gmail.com`) — single-admin CMS, not a multi-tenant dashboard.

---

## 2. Architecture

### 2.1 Tech stack
| Layer | Technology |
|-------|------------|
| Frontend | **Next.js 15.1.11** (App Router, TypeScript, React 19), TailwindCSS 3.4, framer-motion, zustand, lucide-react, recharts, react-hook-form, sonner (toasts) |
| Backend | **FastAPI 0.110** + **Motor** (async MongoDB driver), Python 3.11 |
| Database | **MongoDB** (local in dev via `mongod` on `localhost:27017`, Mongo Atlas in prod). Single DB `kalakriti_db`. |
| Auth | **Emergent-managed Google OAuth** (session-token cookie flow; external call to `demobackend.emergentagent.com`) |
| LLM | **GPT-5.2** via `emergentintegrations.LlmChat` (fallback: `gpt-4o`). Uses the **Emergent Universal LLM Key** (`OPENAI_API_KEY` env var holds it). |
| Payments | **Cashfree PG v2023-08-01** (Hosted Checkout + Webhook). PROD mode. |
| Shipping | **Shiprocket APIv2** (serviceability, adhoc order create, AWB assign, label PDF, tracking, webhook) |
| Email | **Resend** (`kalakritishop.in` domain pending verification; sandbox `onboarding@resend.dev` active) |
| WhatsApp | **Meta WhatsApp Cloud API** (template `order_confirmation`, `advance_payment_received`) + `wa.me` fallback links |
| Process mgr | `supervisord` managing `frontend` (Next.js `yarn start`, port 3000), `backend` (`uvicorn server:app`, port 8001), `mongodb` |

### 2.2 Folder structure

```
/app
├── backend/
│   ├── server.py              ← Monolithic FastAPI app (~1700 LOC). ALL routes.
│   ├── shiprocket.py          ← Shiprocket service wrapper (token cache, 6 methods)
│   ├── requirements.txt       ← pip freeze (litellm, motor, fastapi, resend, emergentintegrations…)
│   ├── .env                   ← All secrets (Mongo, Cashfree, WhatsApp, Shiprocket, Resend, LLM)
│   └── tests/                 ← pytest scaffolding (mostly empty)
│
├── frontend/
│   ├── package.json           ← Next 15 + React 19 + Tailwind
│   ├── next.config.mjs
│   ├── public/assets/images/
│   │   ├── gallery/art-01..48.jpeg   ← 48 real artwork photos
│   │   └── logo.*
│   └── src/
│       ├── app/                       ← Next.js App Router pages
│       │   ├── layout.tsx             ← Root: mounts AIChatBot + Nav globally
│       │   ├── home-page/             ← Landing page (Hero, MediumShowcase, Testimonials, CTA)
│       │   ├── gallery/               ← Public artwork grid
│       │   ├── portrait-configurator/ ← 4-step wizard (medium → size → frame → details)
│       │   │   ├── engine.ts          ← Pricing engine (mutable, CMS-overridable)
│       │   │   ├── components/Step1MediumSize.tsx, Step2…, PricingLoader.tsx
│       │   ├── checkout/              ← Order form + Cashfree handoff
│       │   ├── pay/page.tsx + loading.tsx      ← Standalone pay link (suspense-wrapped)
│       │   ├── payment/return/page.tsx + loading.tsx  ← Post-pay landing (suspense)
│       │   ├── track-order/page.tsx + loading.tsx     ← Public AWB tracking (suspense)
│       │   ├── my-orders/             ← Logged-in order list
│       │   ├── project-review-portal/ ← Per-order review page (simplified timeline)
│       │   ├── reviews/               ← Public customer testimonials
│       │   ├── policies/              ← Static legal/returns/refund page
│       │   ├── login/                 ← Google login screen
│       │   └── admin/                 ← Admin-only CMS
│       │       ├── page.tsx           ← Dashboard (orders grouped by status, stats, ship button)
│       │       ├── listings/          ← Mediums/Hero/Gallery/Pricing CMS
│       │       ├── coupons/           ← Coupon CRUD
│       │       ├── reviews/           ← Moderate reviews
│       │       └── broadcast/         ← WhatsApp/Email broadcast to past customers
│       ├── components/
│       │   ├── AIChatBot.tsx          ← Floating chat UI (image upload, CTAs, markdown)
│       │   ├── KalakritiNav.tsx       ← Top nav
│       │   ├── PayBalanceButton.tsx   ← (legacy, kept for balance-due orders)
│       │   ├── SiteBanner.tsx         ← Announcement banner
│       │   ├── WhatsAppFloatingButton.tsx (unused, flagged for deletion)
│       │   └── ui/                    ← shadcn primitives (button, card, dialog…)
│       └── lib/                       ← API client helpers, stores, utilities
│
├── .emergent/emergent.yml     ← Emergent platform metadata (preview/deploy config)
├── .gitignore                 ← NOTE: `.env` is intentionally NOT ignored so deployer can inject
└── memory/
    ├── PRD.md                 ← Living product doc (dated entries)
    ├── test_credentials.md    ← Admin/test-user creds for the testing agent
    └── SYSTEM_DOCUMENTATION.md (this file)
```

### 2.3 Key design decisions & tradeoffs

| Decision | Rationale | Tradeoff / Risk |
|----------|-----------|-----------------|
| **Single-file `server.py` (~1700 LOC)** | Fastest iteration, one place to grep, no import graph to maintain. | High cyclomatic complexity in `cashfree_webhook()` and `ai_chat()`. **Intentionally not refactored** — it sits on the revenue path. |
| **Emergent Google Auth** (not custom JWT) | Zero auth infra to maintain; single-admin model doesn't need role hierarchy. | Coupled to Emergent's auth service (`demobackend.emergentagent.com`). Session tokens stored in `user_sessions` collection with 7-day TTL. |
| **100% upfront payment policy** (replaced earlier advance_25 + revision flow) | Protects artist labour; kills no-show cancellations; removes complex draft/approve UI. | Slightly higher friction at checkout — mitigated by Cashfree UPI 1-tap. `advance_25` plan is still supported in code for legacy compatibility. |
| **CMS via MongoDB `site_content` collection** instead of Git-based content | Non-dev founder can edit mediums/prices/hero copy/gallery from `/admin/listings` without a deploy. | Adds a live DB read on every public page load. Mitigated with React-level fallback to hardcoded defaults if API unreachable. |
| **Pricing engine made mutable** (`let` not `const`) + `loadPricingFromCMS()` + `usePricingVersion()` | Lets admin price edits flow through to the live configurator without redeploy. | Any direct import of constants before CMS load gets stale values — guarded via the `PricingLoader` component mounted at the configurator root. |
| **CMS images stored as base64 in Mongo**, served via `/api/cms-image/{id}` | No S3/blob setup; one-click upload from admin panel. | Not scalable past a few MB per image. Acceptable because (a) gallery has ~48 static images already on disk, and (b) admin uploads are rare. |
| **AI Chatbot can CREATE real orders** via `[PLACE_ORDER:{...json}]` tag in LLM output | Removes biggest conversion blocker (form fatigue on mobile). | LLM hallucination risk — mitigated by strict JSON schema extraction (`PLACE_ORDER_RE`), payment_plan whitelist, phone/email sanitization, and upfront-only payment (so a bad order can't ship). |
| **Shiprocket token cached in-memory** (not Redis) | Single-replica deployment; token lives 9 days; auto-refresh on 401. | Breaks under horizontal scaling. Not yet a concern. |
| **`.env` tracked in git** | Emergent deployer injects production vars through GitHub; keeping `.env` trackable avoids key-mismatch bugs. | Must never commit real secrets to a public fork. Repo is private. |
| **Next.js 15 `useSearchParams` → Suspense wrappers** on `/pay`, `/payment/return`, `/track-order` | Next 15 bails out of static prerender otherwise — deployment build fails. | Adds a tiny skeleton flash; `loading.tsx` files provide brand-aligned placeholders. |
| **All API routes prefixed `/api`** | Kubernetes ingress routes `/api/*` → backend:8001, everything else → frontend:3000. | Never add backend routes outside `/api`. |

---

## 3. Feature Breakdown

### 3.1 Authentication (Emergent Google OAuth)
- **Entry**: `/login` → redirects to Emergent's Google flow.
- **Session exchange**: Frontend calls `POST /api/auth/session` with `X-Session-ID` header → backend calls `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data` → upserts user in `db.users`, creates `db.user_sessions` row, sets `httpOnly` `session_token` cookie (`secure; samesite=none; 7-day`).
- **Role assignment**: If `email ∈ ADMIN_EMAILS` env var → `role='admin'`, else `'customer'`. No promotion UI — add email to `.env` and restart.
- **Protected routes**: `require_user()` and `require_admin()` helpers read cookie → lookup session → attach user.

### 3.2 Orders
- **Create**: `POST /api/orders` (guest allowed) → generates `KLK-YYYYMMDD-XXXXXX` → inserts with `status='Placed'`, `payment_status='PENDING'`, seeded `timeline[]`.
- **List**: `GET /api/orders` — customers get their own, admins get all (optional `?status=` and `?limit=500`).
- **Status update**: `PATCH /api/orders/{id}/status` — appends to `timeline[]`, optionally stores `courier`/`tracking_id`. 7 canonical statuses: `Placed, Confirmed, In Production, Shipped, Out for Delivery, Delivered, Cancelled`.
- **Admin stats**: `GET /api/admin/stats` — aggregates by status + payment_status, returns counts + revenue.

### 3.3 Cashfree Payments
- **Create session**: `POST /api/payments/cashfree/create?order_id=&installment=advance|balance|full` →
  - For `full`/`advance`, charges full amount (since default plan is `full`).
  - Supports legacy `advance_25` (25% upfront, 75% balance later) if order was created that way.
  - Returns `payment_session_id` consumed by Cashfree's hosted checkout JS.
  - If keys unset → returns `mock: true` session (dev-only).
- **Webhook**: `POST /api/payments/cashfree/webhook` —
  - Verifies signature: `base64(HMAC_SHA256(CF_SECRET, timestamp + raw_body))` == `x-webhook-signature`.
  - On `PAYMENT_SUCCESS_WEBHOOK`: updates `paid_amount`, `balance_due`, `payment_status` (`PAID` or `PARTIAL`), appends `timeline`, fires `send_payment_received_emails` + WhatsApp confirmation.
- **Mock confirm**: `POST /api/payments/cashfree/mock-confirm` — admin-only test helper.

### 3.4 AI Chatbot — "Kalakriti Sakhi"
- **Model**: GPT-5.2 via `emergentintegrations.LlmChat`, fallback `gpt-4o`.
- **System prompt**: 200+ line `KALAKRITI_SYSTEM_PROMPT` (in `server.py`, grep for it) — encodes mediums, sizes, prices, process, return policy, tone (warm Hinglish), CTAs.
- **Features**:
  - **Multi-turn memory**: last 4 turns injected into system prompt; full history persisted in `db.chat_messages` keyed by `session_id`.
  - **Order context auto-injection**: `_load_order_context()` matches `KLK-YYYYMMDD-XXXXXX` regex in any user msg, pulls order from DB, appends as `ORDER CONTEXT` block so Sakhi can answer "where's my order".
  - **Image uploads**: up to 5 base64 images per message stored in `db.chat_uploads`, served via `/api/chat/image/{id}`. LLM is told `[IMAGES_UPLOADED: N]`.
  - **CTA tags**: LLM emits `[CTA:CONFIGURE]` → frontend renders "Start Configurator" button; `[CTA:CALL]` → "Call +91 96677 88175".
  - **Order placement tag**: LLM emits `[PLACE_ORDER:{"customer_name":..,"customer_email":..,"customer_phone":..,"shipping_address":..,"medium":..,"size":..,"faces":..,"amount":..,"payment_plan":"full"}]` → backend creates real order, returns `payment_url`, ties chat uploads to order as `reference_urls`.
- **Endpoints**:
  - `POST /api/chat` — main turn
  - `GET /api/chat/history?session_id=`
  - `GET /api/chat/prefill?session_id=` — auto-fills configurator from latest AI-placed order
  - `GET /api/chat/image/{image_id}` — serves uploaded reference photo

### 3.5 Coupons
- Admin CRUD at `/api/admin/coupons` (list/create/update/delete).
- Public validation: `POST /api/coupons/validate` — checks enabled/dates/min_order/max_uses/medium_filter.
- Apply to order: `POST /api/orders/{id}/apply-coupon` — decrements amount, increments `used_count`, appends timeline.
- Schema: `{code, type: percent|flat, value, min_order, max_uses, used_count, starts_at, ends_at, medium_filter, enabled, created_at}`.
- Status computed on-the-fly: `active | disabled | scheduled | expired | exhausted`.

### 3.6 Reviews
- Customer-side: `POST /api/reviews` (after delivery) → queued as `pending`. `GET /api/me/reviews` — my submitted.
- Public: `GET /api/reviews?limit=50` — only `approved`.
- Admin: `GET /api/admin/reviews?status=`, `PATCH /api/admin/reviews/{id}` (approve/reject), `DELETE`.
- Schema: `{review_id, order_id, user_id, customer_name, medium, rating 1-5, text, status: pending|approved|rejected, created_at}`.

### 3.7 WhatsApp + Broadcast
- Confirmation: `_send_whatsapp_confirmation(order)` fires a Meta Cloud API template on every paid order.
- Audience: `GET /api/admin/broadcast/audience` — counts by medium + tier.
- Send: `POST /api/admin/broadcast/send` with `{template, audience_filter}` — enqueues to Meta WhatsApp.
- History: `GET /api/admin/broadcast/history`.
- Fallback `wa.me` link: `GET /api/whatsapp/chat-link?message=&phone=`.

### 3.8 Shipping (Shiprocket)
- **Rates preview** (public): `GET /api/shipping/rates?pincode=&weight=` — calls `serviceability()`.
- **Ship an order** (admin): `POST /api/admin/orders/{id}/ship` → creates adhoc order → assigns cheapest AWB → generates label PDF → sets `status='Shipped'`, stores `shiprocket: {awb, courier_name, shipment_id, label_url, tracking_url, shipped_at}` → emails customer tracking link.
- **Get label**: `GET /api/admin/orders/{id}/label` — returns PDF URL, regenerates if cache miss.
- **Track**: `GET /api/track/{awb}` — proxied live tracking for `/track-order` page.
- **Webhook**: `POST /api/webhooks/shiprocket` — maps Shiprocket statuses to our 7 canonical statuses.

### 3.9 CMS (Admin Listings)
- Collections: `site_content` (key → value), `cms_images` (id → base64).
- Public: `GET /api/content/{section}` — returns stored content OR falls back to `DEFAULT_CMS_CONTENT[section]`.
- Admin: `PUT /api/admin/content/{section}`, `POST /api/admin/content/{section}/reset`.
- Image upload: `POST /api/admin/cms-image` (accepts `data:image/...` URL), returns `/api/cms-image/{id}` public URL.
- Sections: `hero`, `mediums`, `gallery`, `pricing`, `policies`.
- **Live pricing propagation**: `PricingLoader.tsx` on configurator mount → `GET /api/content/pricing` → `applyPricingOverrides()` → `subscribeToPricing()` triggers `usePricingVersion()` hook re-render.

### 3.10 Transactional Email (Resend)
- `_send_email(to, subject, html)` — thin wrapper around Resend SDK.
- `_order_email_html(order, heading, intro, cta_url)` — brand-styled HTML template.
- Triggers:
  - Order placed → `send_order_placed_emails()` (customer + admin copy)
  - Payment received → `send_payment_received_emails()` (differentiates full vs advance)
  - Shipped → inline HTML with AWB + tracking link (fired inside `/ship` endpoint)
- Sender: `SENDER_EMAIL` env (currently `onboarding@resend.dev` sandbox — needs `kalakritishop.in` domain verification for prod deliverability).

---

## 4. State & Data Flow

### 4.1 Data flow overview

```
Customer
  │
  ├─ Browse gallery  ──────────► GET /api/content/gallery  ─► MongoDB.site_content
  │
  ├─ Configurator    ──────────► GET /api/content/pricing  ─► MongoDB.site_content
  │                                                           (fallback: hardcoded engine.ts)
  │
  ├─ Checkout form   ──POST────► /api/orders  ──────────────► MongoDB.orders
  │                                    │
  │                                    └── asyncio.create_task(send_order_placed_emails)
  │                                            └─► Resend API
  │
  ├─ Pay button      ──POST────► /api/payments/cashfree/create  ─► Cashfree PG
  │                                    │
  │                                    ▼ payment_session_id
  │                              Cashfree Hosted Checkout  (customer pays)
  │                                    │
  │                                    ▼ webhook
  │                              POST /api/payments/cashfree/webhook
  │                                    │
  │                                    ├─► MongoDB.orders (set payment_status=PAID, push timeline)
  │                                    ├─► Resend (payment receipt email)
  │                                    └─► Meta WhatsApp Cloud API (confirmation template)
  │
  ├─ Chat            ──POST────► /api/chat  ────────────────► GPT-5.2 via emergentintegrations
  │                                    │                       │
  │                                    ├─► MongoDB.chat_messages (persist)
  │                                    └─► If [PLACE_ORDER:{}] detected:
  │                                             ├─► MongoDB.orders (create)
  │                                             └─► return payment_url
  │
  └─ Track           ──GET─────► /api/track/{awb}  ─────────► Shiprocket track API

Admin
  └─ Ship order      ──POST────► /api/admin/orders/{id}/ship
                                        │
                                        ├─► Shiprocket: create order → assign AWB → generate label
                                        ├─► MongoDB.orders (set status=Shipped, shiprocket:{…})
                                        └─► Resend (tracking email)

Shiprocket webhook  ─────────► POST /api/webhooks/shiprocket
                                        └─► MongoDB.orders (map status)
```

### 4.2 MongoDB collections & schemas

#### `users`
```js
{ user_id: "user_ab12cd34…", email, name, picture, role: "admin"|"customer", created_at }
```

#### `user_sessions`
```js
{ user_id, session_token, expires_at: Date, created_at }
```

#### `orders` (most important)
```js
{
  order_id: "KLK-20260206-A1B2C3",
  user_id: "user_…" | null,          // null = guest or AI-chat order
  customer_name, customer_email, customer_phone, shipping_address,
  items: [{ medium, size, frame, faces, addons:[], notes, reference_urls:[] }],
  amount: 11999,
  currency: "INR",
  payment_plan: "full" | "advance_25",
  advance_amount: 11999,              // == amount if plan='full'
  paid_amount: 0,
  balance_due: 11999,
  status: "Placed" | "Confirmed" | "In Production" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled",
  payment_status: "PENDING" | "PARTIAL" | "PAID",
  payment_provider: "cashfree",
  cf_payment_session_id, cf_order_id, last_installment, last_charge_amount,
  coupon: { code, type, value, discount_applied } | undefined,
  shiprocket: { shiprocket_order_id, shipment_id, awb_code, courier_name,
                courier_company_id, label_url, tracking_url, shipped_at,
                last_status, last_updated_at } | undefined,
  timeline: [{ status, at: ISO, note }],
  chat_session_id: "…" | undefined,   // set if placed via AI chat
  placed_via: "ai_chat" | undefined,
  notes, created_at, updated_at
}
```

#### `chat_messages`
```js
{ session_id, role: "user"|"assistant", text, image_ids:[], created_at }
```

#### `chat_uploads`
```js
{ image_id: "img_…", session_id, data: "<base64>", created_at }
```

#### `coupons`
```js
{ code, type: "percent"|"flat", value, min_order, max_uses, used_count,
  starts_at, ends_at, medium_filter, enabled, created_at }
```

#### `reviews`
```js
{ review_id, order_id, user_id, customer_name, medium, rating: 1-5, text,
  status: "pending"|"approved"|"rejected", created_at }
```

#### `site_content`
```js
{ section: "hero"|"mediums"|"gallery"|"pricing"|"policies", value: <arbitrary JSON>, updated_at }
```

#### `cms_images`
```js
{ image_id, data: "<base64>", content_type, uploaded_at }
```

#### `broadcasts`
```js
{ broadcast_id, template, audience_filter, recipient_count, sent_at, status }
```

### 4.3 Frontend state
- **Zustand** stores (in `/src/lib/`): configurator state (medium → size → frame → faces → addons), auth session (mirrored from `/api/auth/me` on mount).
- **Chat** state is local to `AIChatBot.tsx`; `session_id` persisted in `localStorage` under `kalakriti_chat_session`.
- **Pricing** mutation channel: `subscribeToPricing()` publisher-subscriber pattern in `engine.ts`; `usePricingVersion()` returns an incrementing integer that components depend on for re-render.

---

## 5. Environment & Setup

### 5.1 Environment variables

#### `/app/backend/.env`
| Key | Purpose | Required |
|-----|---------|----------|
| `MONGO_URL` | Mongo connection string | ✅ |
| `DB_NAME` | Database name (`kalakriti_db`) | ✅ |
| `CORS_ORIGINS` | Comma-separated allowed origins | ✅ |
| `ADMIN_EMAILS` | Comma-separated admin Google emails | ✅ |
| `OPENAI_API_KEY` | **Emergent Universal LLM Key** (not a real OpenAI key) | ✅ for AI chat |
| `AI_MODEL` | `gpt-5.2` (fallback `gpt-4o`) | ✅ |
| `SUPPORT_PHONE` | `+919667788175` | ✅ |
| `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` | PROD keys from Cashfree dashboard | ✅ |
| `CASHFREE_MODE` | `TEST` or `PROD` | ✅ |
| `META_WA_PHONE_NUMBER_ID`, `META_WA_ACCESS_TOKEN` | Meta WhatsApp Cloud API | ✅ for WA |
| `META_WA_TEMPLATE_NAME` | `order_confirmation` | ✅ |
| `META_WA_ADVANCE_TEMPLATE_NAME` | `advance_payment_received` | ✅ |
| `WA_BRAND_NAME` | `Kalakriti` | ✅ |
| `META_WA_TEMPLATE_LANG` | `en_US` | ✅ |
| `BUSINESS_WHATSAPP_NUMBER` | `919667788175` | ✅ |
| `META_WA_GRAPH_VERSION` | `v21.0` | ✅ |
| `FRONTEND_URL` | Public frontend base URL (used in Cashfree `return_url`) | ✅ |
| `RESEND_API_KEY` | Resend API key | ✅ for emails |
| `SENDER_EMAIL` | e.g. `hello@kalakritishop.in` | ✅ |
| `SENDER_NAME` | `Kalakriti` | ✅ |
| `SHIPROCKET_API_EMAIL`, `SHIPROCKET_API_PASSWORD` | Shiprocket dashboard creds | ✅ for shipping |
| `SHIPROCKET_PICKUP_PINCODE`, `SHIPROCKET_PICKUP_LOCATION` | Pickup address in Shiprocket | ✅ |

#### `/app/frontend/.env`
| Key | Purpose |
|-----|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Public backend base URL for client-side fetches. In dev this is the Emergent preview URL; the ingress routes `/api/*` to backend:8001. |

### 5.2 Dependencies
- **Backend**: `pip install -r /app/backend/requirements.txt`. Key libs: `fastapi`, `motor`, `emergentintegrations` (install with `--extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`), `litellm`, `resend`, `httpx`, `bcrypt`, `python-jose`.
- **Frontend**: `cd /app/frontend && yarn install`. Yarn only — never `npm`.

### 5.3 Deployment steps (Emergent platform)

1. **Pre-flight locally**:
   ```bash
   cd /app/frontend && yarn build
   # Must exit 0 with all routes prerendered.
   cd /app/backend && python -c "from server import app; print('ok')"
   ```
2. **Push to GitHub**: Use the "Save to GitHub" button in the Emergent chat UI. This commits everything under `/app` (including `.env` because `.gitignore` is relaxed — keep the repo private).
3. **Deploy**: Click "Deploy" in Emergent. Platform builds against the latest GitHub snapshot, injects prod env vars, and boots supervisor.
4. **Post-deploy smoke tests**:
   - `curl $FRONTEND_URL/api/` → `{"message":"Kalakriti API"}` style response
   - Visit `/` — gallery loads
   - Visit `/admin` logged in as `ADMIN_EMAILS[0]` — dashboard loads
   - Place a ₹1 test order → Cashfree PG opens → complete payment → webhook fires → order shows `payment_status: PAID` in admin
5. **Third-party dashboard setup** (one-time):
   - **Cashfree**: whitelist `${FRONTEND_URL}/payment/return` and set webhook URL to `${FRONTEND_URL}/api/payments/cashfree/webhook`.
   - **Shiprocket**: add webhook URL `${FRONTEND_URL}/api/webhooks/shiprocket`.
   - **Meta WhatsApp**: verify `order_confirmation` + `advance_payment_received` templates are approved.
   - **Resend**: verify `kalakritishop.in` DNS for the sender domain.

### 5.4 Local dev (inside Emergent container)
Services are supervisor-managed:
```bash
sudo supervisorctl status
sudo supervisorctl restart backend      # after .env change
sudo supervisorctl restart frontend     # after yarn add
tail -n 100 /var/log/supervisor/backend.*.log
```
Hot reload is on for both — don't run `uvicorn` or `next dev` manually.

---

## 6. AI / Agent Decisions — Why these approaches were chosen

### 6.1 Why GPT-5.2 via Emergent Universal Key (not direct OpenAI)
- User doesn't need to maintain separate OpenAI billing. Universal Key works across OpenAI/Anthropic/Gemini behind one interface.
- Fallback to `gpt-4o` is built-in so quota exhaustion on GPT-5.2 doesn't break chat.

### 6.2 Why `[PLACE_ORDER:{…json}]` tag over tool-calling
- `emergentintegrations.LlmChat` abstracts the provider — tool-calling support varies. A tagged-JSON protocol works uniformly across OpenAI/Anthropic/Gemini and is trivial to parse with a regex: `PLACE_ORDER_RE`.
- Tradeoff: slightly more brittle than native function-calling. Mitigated by schema-level validation when constructing the order doc.

### 6.3 Why monolithic `server.py`
- At 1700 LOC with one developer + one AI agent, module boundaries would slow iteration more than they'd help. Grep-ability beats file-organization at this size.
- **When to refactor**: when more than one human starts editing backend, or when `server.py` crosses ~2500 LOC. Pull out `cashfree.py`, `resend_email.py`, `whatsapp.py`, `coupons.py`, `reviews.py`, `chatbot.py` as siblings to `shiprocket.py`.

### 6.4 Why `.env` is committed (not `.env.example`)
- The Emergent deployer reads the repo snapshot and the platform overrides via environment injection. Keeping `.env` in the tree prevents "forgot to set var X" drift. Private repo requirement is the security boundary.

### 6.5 Why `loading.tsx` files for 3 pages only
- Next.js 15 requires any `useSearchParams` consumer to be inside a Suspense boundary at build time. `loading.tsx` provides an auto-Suspense fallback per route, belt-and-braces alongside the explicit `<Suspense>` wrapper in each page.

### 6.6 Known limitations
1. **Single-admin model** — `ADMIN_EMAILS` env is a list but no UI distinguishes admins. Adding per-admin audit logs is future work.
2. **Shiprocket token cache is in-memory** — horizontal scaling will cause thundering-herd re-auths. Move to Redis when multi-replica.
3. **CMS images are base64 in Mongo** — don't accept 10MB+ uploads; move to S3 if that becomes a need.
4. **Cashfree webhook replay protection**: signature + timestamp are verified, but there is no explicit dedupe on `cf_payment_id`. If Cashfree re-sends a success webhook, we'll double-apply — partially mitigated by idempotent `$set` on `payment_status='PAID'`, but `paid_amount` could drift on `PARTIAL` flows. Add an `events_seen` collection if this becomes a real issue.
5. **AI chat order creation bypasses the visual configurator validation** — the LLM could place an order with an unusual `(medium, size)` combination. Production-grade fix: whitelist combinations on the backend before insert.
6. **No abandoned-cart/payment recovery yet** — P1 backlog.

### 6.7 Things to be careful about
- **Never edit the `useSearchParams` pages to "simplify" them.** The Suspense wrapper is load-bearing for the build.
- **Never run `npm install`.** Use `yarn`. Mixing lockfiles breaks Next builds.
- **Never delete `.git` or `.emergent`.** Platform requires them.
- **Don't refactor `server.py` during a deployment-blocker sprint.** That code sits on the revenue path; regression risk is high.
- **Cashfree `return_url`** must be whitelisted in the Cashfree merchant dashboard — setting it only in the payload silently fails in PROD.
- **Resend domain** — until DNS is verified, production emails may go to spam.
- **MongoDB `_id`** — every `find`/`find_one` in this codebase uses `{'_id': 0}` projection. Maintain that pattern or Pydantic will explode on BSON ObjectId serialization.
- **datetime** — always `datetime.now(timezone.utc).isoformat()`, never naive `datetime.utcnow()`.

---

## 7. Pending Work / Roadmap

### 7.1 Incomplete / blocked
| Priority | Item | State |
|----------|------|-------|
| **P0** | Production deployment itself | Codebase is 100% correct (`yarn build` passes locally). Last session was blocked by Emergent deployer serving a stale cached snapshot (Build ID `3b5968e9…`). Action: user must "Save to GitHub" → "Deploy". If same build ID recurs, contact `support@emergent.sh`. |
| **P1** | Resend domain verification | Sender still `onboarding@resend.dev`. Verify `kalakritishop.in` DNS in Resend dashboard. |
| **P1** | Cashfree domain whitelist | Whitelist final prod URL in Cashfree merchant console. |

### 7.2 Backlog
| Priority | Item | Notes |
|----------|------|-------|
| **P1** | Abandoned-payment recovery | Cron/scheduled task: if `order.payment_status='PENDING'` and `created_at > 30min ago` → email + WhatsApp nudge. New collection `abandonment_events` for dedupe. |
| **P2** | Customer self-service review upload at `/my-orders` | Photo upload + 5-star rating; currently reviews are admin-entered only. |
| **P3** | CSV order export from admin panel | `GET /api/admin/orders/export.csv` with date range. |
| **P3** | Cashfree webhook idempotency (`events_seen` collection) | Defense against duplicate webhooks. |
| **P3** | Delete unused `WhatsAppFloatingButton.tsx` and legacy `RevisionThread.tsx` | Cosmetic cleanup. |
| **P3** | Pull `server.py` apart into `routes/*.py` once >2500 LOC | Only after a deployment-stable window. |
| **⚪** | `alt` text on the 48 gallery images | Currently generic; per-image SEO descriptions would help organic. |

### 7.3 Suggested immediate next steps for a new engineer
1. Resolve the deployment cache loop (fresh GitHub push + Deploy).
2. Verify Resend domain.
3. Ship P1 abandoned-payment recovery — estimated 3-4 hours of work.
4. Add an `events_seen` idempotency layer to `cashfree_webhook()` — 1 hour.
5. Add pytest coverage at `/app/backend/tests/` for order-creation + coupon-validate + webhook-signature.

---

## 8. "If another AI continues this project" — operating manual

### 8.1 First 10 minutes after takeover
1. **Read, in order**: `/app/memory/PRD.md` (dated log) → this file → `/app/memory/test_credentials.md`.
2. Run `cd /app/frontend && yarn build` — confirm exit code 0. If it fails, **fix the build before anything else**; a broken build is the one thing that blocks the user's revenue.
3. Run `curl http://localhost:8001/api/` and `curl $NEXT_PUBLIC_BACKEND_URL/api/` — confirm both paths reach the backend.
4. Open `/app/backend/server.py` and `Ctrl-F` for the endpoint you want to touch. Do **not** reorganize files.

### 8.2 Extension rules
- **Adding a new API endpoint** → put it in `server.py` under the nearest thematic section (Orders, Payments, Chat, Coupons, Reviews, Shipping, CMS). Always prefix `/api`. Always use `{'_id': 0}` projection on Mongo reads. Always return Pydantic-serializable dicts.
- **Adding a new page** → create `src/app/<route>/page.tsx`. If it uses `useSearchParams` or `useRouter` at the top level, wrap it in `<Suspense>` and add a sibling `loading.tsx`. Follow the existing visual language in `home-page/` and `gallery/`.
- **Adding a new admin tool** → new page under `src/app/admin/<tool>/`. Gate with `useAdminGuard()` (check how `/admin/coupons` does it). New API routes must call `await require_admin(request)` as the first line.
- **Adding an integration** → call `integration_playbook_expert_v2` first. Do not hand-roll. The existing Cashfree, Resend, Shiprocket, Meta WA code all came through that playbook and match its conventions.
- **Modifying auth** → call `integration_playbook_expert_v2` with `Emergent Google Auth`. Do not touch session cookie logic without the playbook.
- **Modifying pricing** → edit `src/app/portrait-configurator/engine.ts` OR the CMS `/admin/listings → Pricing`. If the change must survive a deploy, put it in `engine.ts` as the new default AND update CMS to match.

### 8.3 Testing protocol
- **Small change** (one function, one component): self-test with `curl` + screenshot.
- **Medium/large change** (>2 features or a critical bug): call `testing_agent_v3_fork` after batch-editing.
- **Integration change** (Cashfree/Shiprocket/Resend/WA): always end-to-end via `testing_agent_v3_fork` with the relevant test credentials.
- **Never** declare "done" without running the build locally.

### 8.4 Red lines — do not cross
- ❌ Do not refactor `server.py` unless the current task explicitly requires it.
- ❌ Do not remove the Suspense wrappers on `/pay`, `/payment/return`, `/track-order`.
- ❌ Do not change `DB_NAME` or `MONGO_URL` — those are the only protected env vars.
- ❌ Do not switch to `npm` from `yarn`.
- ❌ Do not make the 100% upfront payment policy optional in `create_order` without explicit user approval (reverts a deliberate business decision).
- ❌ Do not expose any endpoint that returns user emails / phone numbers without `require_admin`.

### 8.5 Green lights — safe extensions
- ✅ Adding new admin CMS sections (follow the `site_content` pattern).
- ✅ Adding new WhatsApp templates (register in Meta, add env var, call from Python).
- ✅ Adding new coupon types (extend `CouponBody.type` enum + validator).
- ✅ Adding new order statuses at the tail (extend `ORDER_STATUSES` list + update admin dashboard filter pills).
- ✅ Improving the AI system prompt — it's just a Python string constant `KALAKRITI_SYSTEM_PROMPT` in `server.py`.

### 8.6 Useful greps
```bash
grep -n "^@api_router" /app/backend/server.py          # all API routes
grep -n "^class " /app/backend/server.py               # all Pydantic models
grep -rn "useSearchParams" /app/frontend/src           # suspense-sensitive pages
grep -n "KALAKRITI_SYSTEM_PROMPT" /app/backend/server.py  # AI system prompt
grep -n "DEFAULT_CMS_CONTENT" /app/backend/server.py   # CMS defaults
```

### 8.7 Credentials
See `/app/memory/test_credentials.md`. Admin test account: `riddhijain0119@gmail.com`. All third-party keys live only in `/app/backend/.env`.

---

**End of document.** If you're a new agent or engineer: the single most important file is `/app/backend/server.py`, the single most important page is `src/app/portrait-configurator/`, the single most important collection is `orders`, and the single most important rule is *don't break the Cashfree webhook*.
