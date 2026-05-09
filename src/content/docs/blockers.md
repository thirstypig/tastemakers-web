# Blockers & Next Steps

**Last updated:** May 2026  
**Status:** Active — backend is live, working through unblocking each client

---

## Immediate Blockers (Do First)

### 1. `php artisan passport:install` — HIGHEST PRIORITY

**What it does:** Creates the OAuth client records in Supabase that Laravel Passport uses to issue Bearer tokens.  
**Why it's blocked:** `railway run` uses local PHP 8.4 which crashes. Need to either use Supabase MCP (SQL insert) or add to Railway startup.  
**Impact:** Without this, `POST /api/login` responds correctly but never returns a Bearer token. iOS, Android, and web cannot authenticate users.

**Fix options:**
- Start a new Claude Code session (Supabase MCP active) → insert OAuth client records directly via SQL
- Or add `php artisan passport:keys && php artisan passport:client --personal` to Railway `releaseCommand` for next deploy

**Passport tables needed in Supabase:**
- `oauth_clients` — the registered app clients
- `oauth_personal_access_clients` — personal token client
- `oauth_access_tokens` — issued tokens (populated at runtime)
- `oauth_refresh_tokens` — refresh token records

---

### 2. Missing Environment Secrets (Railway)

These env vars are not set in Railway for `tastemakers-backend`. Without them, any endpoint that touches these services will 500.

| Secret | Service | Where to get it | Railway var name |
|--------|---------|-----------------|------------------|
| FCM server key | Push notifications | Firebase Console → Project Settings → Cloud Messaging | `FCM_SERVER_KEY` |
| Foursquare API key | Venue search (restaurant data) | Foursquare Developer Dashboard | `FOURSQUARE_API_KEY` |
| Apple Sign-In key | Apple OAuth login | Apple Developer → Certificates → Sign in with Apple | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` |
| Google Client ID | Google OAuth login | Google Cloud Console → Credentials | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

**Note:** FCM and Foursquare are the most critical — they affect core app functionality. Apple/Google Sign-In can wait until iOS is updated.

---

### 3. Create Test User

Once Passport is installed, create at least one user in Supabase to do a real end-to-end auth test:

```sql
INSERT INTO users (first_name, email, password, role_id, created_at, updated_at)
VALUES ('Test', 'test@tastemakersapp.com', '<bcrypt hash>', 1, NOW(), NOW());
```

Then test:
```
POST https://api.tastemakersapp.com/api/login
{ "email": "test@tastemakersapp.com", "password": "..." }
→ Should return: { "status": true, "token": "..." }

GET https://api.tastemakersapp.com/api/user
Authorization: Bearer <token>
→ Should return user object
```

---

## iOS — Going Live Checklist

- [ ] Passport install complete (blocker above)
- [ ] FCM server key set in Railway (for push notifications)
- [ ] Foursquare API key set in Railway (for venue search)
- [ ] End-to-end login test passes with Bearer token
- [ ] Update `API_BASE_URL` in `Constant.swift` (currently: `tastemakersapp.com/v2/api/`, target: `api.tastemakersapp.com/api/`)
- [ ] Test all iOS flows against new API: login, signup, restaurant list, tastemaker lists, photo upload, bookmarks
- [ ] Submit App Store update (review takes 24–48h)
- [ ] After App Store approval: monitor crash rates
- [ ] Cancel Namecheap hosting (after 1–2 weeks confirmed stable)

**Relevant todo:** Cross-project #037 — iOS hardcoded production URL (should be in `.xcconfig`)

---

## Android — Build Blockers

The Android app **does not compile**. Must fix before any testing or deployment.

- [ ] Fix missing Hilt module — add `@HiltAndroidApp` to Application class or provide the missing `NetworkModule`
- [ ] Remove premature Firebase dependencies (FCM, Analytics) that require `google-services.json` not in repo
- [ ] Migrate `kapt` → `KSP` (annotation processor — faster, recommended for Kotlin)
- [ ] Add `google-services.json` to `.gitignore` if not already
- [ ] Once compiling: update API URL to `api.tastemakersapp.com`
- [ ] Test all flows
- [ ] Publish to Google Play Store

**Relevant todos:** Cross-project #007 (won't compile), #012 (premature deps), #017 (kapt→KSP)

---

## Web App — Auth Needed First

The web app is live but has no user-facing pages yet. Auth is the prerequisite for everything else.

- [ ] Build `/login` page → `POST /api/login` → store Bearer token
- [ ] Build `/register` page → `POST /api/signup`
- [ ] Add Google OAuth (`POST /api/google-login`)
- [ ] Auth context + middleware (protect `/profile`, `/bookmarks`, etc.)
- [ ] Once auth works: build Home/Discover, Restaurant Detail, Search, Tastemaker Profile

**Relevant todos:** Cross-project #008 (localStorage XSS — use httpOnly cookies), #038 (next.config hardcoded localhost)

---

## Data Migration Decision

**Question:** Do we migrate existing user data from Namecheap (MySQL) to Supabase (PostgreSQL)?

**Option A — Migrate:**
- Export users, restaurants, tags, lists from Namecheap MySQL
- Transform (MySQL → PostgreSQL compatible, handle schema differences)
- Import into Supabase
- Existing users keep their accounts
- More work, risk of data issues

**Option B — Start Fresh:**
- Existing users re-register on the new platform
- Clean slate — no legacy data baggage
- Simpler, faster to ship
- Users lose history (reviews, lists, followers)

**Recommendation:** If the existing user base is small/early, start fresh. If there are active users with data they care about, migrate.

---

## Infrastructure — Remaining

- [ ] Set up error monitoring (Sentry or Railway's built-in) on the Laravel backend
- [ ] Set up uptime monitoring / alerts for `api.tastemakersapp.com`
- [ ] Review CORS config — currently wildcard (`*`), restrict to known origins
- [ ] Set up staging environment in Railway (separate from production)
