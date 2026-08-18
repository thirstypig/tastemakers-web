# Going-Live Runbook

> Updated 2026-06-09 · maintained by the /doc skill · canonical home: tastemakers-web

## Current blockers

| # | Blocker | Impact | Owner action |
|---|---------|--------|--------------|
| 1 | `FOURSQUARE_API_KEY` missing in Railway | `/api/restaurants` fails in prod | Add key in Railway → backend service vars |
| 2 | Marketing site status unknown (502 last checked 2026-05-11) | www domain may be down | Check Railway service + Caddyfile |
| 3 | iOS still points at Namecheap URL | Old API serves iOS users | Update Constant.swift → App Store submission |
| 4 | `FCM_SERVER_KEY` missing in Railway | Push notifications fail in prod | Add key in Railway → backend service vars (Firebase Console → Project Settings → Cloud Messaging) |

## Launch sequence (remaining)

1. Fix blockers 1–2 above
2. Update iOS `Constant.swift` base URL → `api.tastemakersapp.com` → TestFlight → App Store review
3. Keep legacy `tastemakersapp.com/v2/api/` responding until iOS adoption > 90% (assume months). Now served by the rewrite in `next.config.ts`; removal is TASK-24, which needs usage instrumented before the 90% gate can be evaluated
4. Cancel Namecheap hosting (keep domain registration)

## Done

- ✅ Laravel API live on Railway (`api.tastemakersapp.com`)
- ✅ Supabase live, 22 tables
- ✅ Web app + admin live (`www.tastemakersapp.com`), Google OAuth working
- ✅ DNS: Squarespace nameservers, api/app/www CNAMEs configured
- ✅ Debug routes removed from production (`/debug-schema`, `/run-schema-fix`, `/debug-signup`)
