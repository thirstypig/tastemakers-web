---
id: DOC-014
type: costs
status: active
phase: null
owner: james
tags: []
links: [DOC-001]
updated: 2026-08-21
---

# Costs

> **GENERATED — do not hand-edit.** Edit `docs/costs.config.json`, then `npm run docs:refresh`.

## ⚠️ There is no revenue model

**Tastemakers has no pricing, no payment code, and no plan price.** Verified across all
five repos on 2026-07-23: no Stripe, no StoreKit, no in-app purchase, no checkout.
The only monetization signal is AdSense, and `ADS_ENABLED` is `false` in `src/lib/ads.ts`.

So every revenue and margin figure below is **$0.00 by definition, not by measurement.**
The cost side is real once the unit costs are filled in; the revenue side is a waiting
template. Set `planPriceUsd` in `costs.config.json` when a price exists.

## Assumptions

These drive every number below. Read them before reading the table.

| Assumption | Value |
|---|---|
| restaurant tag-seed runs per user per month | 0 ⚠️ VERIFY |
| Average tags generated per run | 0 ⚠️ VERIFY |
| Plan price (per user / month) | $0.00 ⚠️ VERIFY |

| Unit cost | Value |
|---|---|
| Primary variable, per restaurant tag-seed run | $0.00 ⚠️ VERIFY |
| Auth, per user / month | $0.00 ⚠️ VERIFY |
| Database, per user / month | $0.00 ⚠️ VERIFY |
| Hosting, flat / month | $0.00 ⚠️ VERIFY |
| Payment fee | 2.9% + $0.30 |

**⚠️ VERIFY** marks a figure nobody has confirmed against an invoice or a measured call.
Treat those rows as placeholders, not estimates.

## Unit economics by scale

| Users | Variable / user | Total variable | Hosting / user | Payment fees | Revenue | Total cost | Gross margin | Margin % |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | n/a |
| 100 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | n/a |
| 1,000 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | n/a |

### What drives these numbers

- **`primaryVariablePerUnit`** — Main per-use cost: one tag-seed run = 1 Google Places fetch + 1 Claude Haiku call + 1 Voyage embedding batch. Never measured - the pipeline has never run at scale.
- **`perUserMonthAuth`** — Supabase Auth. Free tier covers current volume; unknown above it.
- **`perUserMonthDb`** — Supabase Postgres storage + egress per user.
- **`hostingFlatMonth`** — Railway across 3 deployed services (API, web, marketing). Read the actual invoice.
- **`planPriceUsd`** — NO PRICING MODEL EXISTS. No payment code in any repo. The only monetization signal is AdSense, and ADS_ENABLED is false in src/lib/ads.ts.
- **`paymentPctFee`** — Standard card-processing rate. Not verified against any processor because none is integrated.
- **`knownFixedCosts`** — Apple Developer Program is a real recurring cost (~$99/yr) not modelled here - it is not per-user. Add it if you want total burn rather than unit economics.

<!-- generated 2026-08-21T00:56:01.109Z by scripts/refresh-docs.mjs -->
