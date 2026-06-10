> Snapshot of tastemakers/todos/README.md · refreshed 2026-06-09 by /doc skill

# Tastemakers — Cross-Project Todos

Code review findings from multi-repo reviews. These are cross-project issues spanning backend, web, iOS, Android, WordPress, and documentation.

> Backend-only findings (31 additional items) are in `tastemakers-backend/todos/`.

## Status Key
- `pending` — Needs triage/decision
- `ready` — Approved, ready to work
- `complete` — Done

## Priority Key
- `p1` — Critical: blocks production safety or causes data bugs
- `p2` — Important: should fix before shipping new clients
- `p3` — Nice-to-have: cleanup and improvements

---

## P1 — Critical (22 findings)

| # | Issue | Scope | Action |
|---|-------|-------|--------|
| 001 | [`.env_bkp` with production secrets in git](001-pending-p1-env-bkp-secrets-in-git.md) | Backend | Rotate credentials, remove from git history |
| 002 | [Tag `name` vs `tag_name` field mismatch](002-pending-p1-tag-field-name-mismatch.md) | Cross-project | Verify backend controller mapping; align all clients |
| 003 | [User `short_description` vs `description` mismatch](003-pending-p1-user-description-field-mismatch.md) | Cross-project | Verify backend controller mapping; align all clients |
| 004 | [`search-tags` endpoint divergence (iOS vs docs)](004-pending-p1-search-tags-endpoint-divergence.md) | Cross-project | Audit both endpoints; update all docs and clients |
| 005 | [`wp-config.php` has production DB password](005-pending-p1-wp-config-credentials-in-repo.md) | WordPress | Add to .gitignore, rotate password, regenerate salts |
| 020 | [SQL injection in `imageList()` via string interpolation](020-pending-p1-sql-injection-image-list.md) | Backend | Use parameter binding; replace user_id with Auth::id() |
| 021 | [Duplicate/ghost API routes (`restaurants1`, `nearByCuisine`)](021-pending-p1-duplicate-ghost-api-routes.md) | Backend | Remove ghost routes, consolidate duplicates |
| 022 | [MySQL functions used with PostgreSQL config](022-pending-p1-mysql-functions-on-postgresql.md) | Backend | Audit production DB; replace MySQL-specific SQL |
| 023 | [Active `echo`/`print_r` leaking Foursquare credentials](023-pending-p1-active-debug-echo-leaking-credentials.md) | Backend | Delete debug statements immediately |
| 024 | [iOS hardcoded API keys in Constant.swift + GoogleService-Info.plist](024-pending-p1-ios-hardcoded-api-keys.md) | iOS | Move to .xcconfig, gitignore plist |
| 025 | [Hardcoded Google OAuth client_id in backend](025-pending-p1-hardcoded-google-oauth-backend.md) | Backend | Move to .env and config() |
| 026 | [`old_Laravel_Backup/` directory (457 MB dead weight)](026-pending-p1-old-laravel-backup-in-repo.md) | Backend | Delete directory, add to .gitignore |
| 050 | [FCM server key hardcoded in UserController (regression)](050-pending-p1-fcm-key-hardcoded-regression.md) | Backend | Remove hardcoded key; use config('services.fcm.key') |
| 051 | [Apple Sign-In JWT signature never verified](051-pending-p1-apple-signin-jwt-bypass.md) | Backend | Fetch Apple public keys; verify RS256 signature |
| 052 | [`nearbycuisine` POST returns 500 — method missing](052-pending-p1-nearbycuisine-500.md) | Backend | Implement RestaurantController::nearbyCuisine() |
| 053 | [Web admin login always fails (token path mismatch)](053-pending-p1-web-admin-login-broken.md) | Web | Change `data.token` → `data.data?.token` |
| 054 | [No DB transactions — all multi-step writes can partially succeed](054-pending-p1-no-db-transactions.md) | Backend | Wrap multi-step writes in DB::transaction() |
| 055 | [Android AuthResponse misses `data` envelope — login broken](055-pending-p1-android-auth-response-envelope.md) | Android | Wrap AuthResponse in ApiResponse\<T\> envelope |
| 056 | [Bookmark toggle checks wrong pivot — broken for all users](056-pending-p1-save-restaurant-wrong-pivot.md) | Backend | Check restaurant_user, not category_restaurant |
| 057 | [`getallBadges()` hardcoded user_id=43 — returns wrong user's data](057-pending-p1-getall-badges-hardcoded-user.md) | Backend | Replace hardcoded 43 with Auth::id() |
| 058 | [`getAllRecentReviewRestaurant` leaks full user profiles unauthenticated](058-pending-p1-recent-review-profile-leak.md) | Backend | Add auth:api middleware; strip sensitive fields |
| 059 | [Debug `/debug-signup` route live in production — creates real users](059-pending-p1-debug-signup-live-prod.md) | Backend | Delete /debug-schema, /debug-signup, /run-schema-fix from web.php |

## P2 — Important (35 findings)

| # | Issue | Scope | Action |
|---|-------|-------|--------|
| 006 | [Web types missing API response envelopes](006-pending-p2-web-missing-response-envelopes.md) | Web | Add AuthResponse, RestaurantsResponse, etc. |
| 007 | [Android won't compile (no Hilt module, no google-services.json)](007-pending-p2-android-wont-compile.md) | Android | Create NetworkModule; remove Firebase deps |
| 008 | [Web localStorage token is XSS-exploitable](008-pending-p2-web-localstorage-token-xss.md) | Web | Migrate to httpOnly cookies |
| 009 | [Android `user_id` in requests codifies IDOR](009-pending-p2-android-user-id-idor.md) | Android | Remove user_id from request models |
| 010 | [`error_log` files with production paths in git](010-pending-p2-error-log-files-in-git.md) | Backend | Delete files, add to .gitignore |
| 011 | [5 different brand name spellings](011-pending-p2-brand-name-inconsistency.md) | Cross-project | Standardize to "tastemaker(s)" everywhere |
| 012 | [Android has premature Phase 3-5 dependencies](012-pending-p2-android-premature-dependencies.md) | Android | Remove unused deps so project compiles cleanly |
| 027 | [Wildcard CORS allows any origin](027-pending-p2-wildcard-cors-configuration.md) | Backend | Restrict to known domains |
| 028 | [No API versioning strategy](028-pending-p2-no-api-versioning.md) | Cross-project | Introduce /api/v1/ URL prefix versioning |
| 029 | [`role_id` in User $fillable enables privilege escalation](029-pending-p2-role-id-in-user-fillable.md) | Backend | Remove from $fillable |
| 030 | [Empty validation rules on profile update](030-pending-p2-empty-validation-rules.md) | Backend | Add proper min/unique/mimes rules |
| 031 | [Unrestricted image upload (potential RCE/XSS)](031-pending-p2-unrestricted-image-upload.md) | Backend | Add MIME validation, use Storage facade |
| 032 | [Inconsistent API response envelope (4+ formats)](032-pending-p2-inconsistent-api-response-envelope.md) | Cross-project | Standardize with Laravel API Resources |
| 033 | [iOS "Restaurent" typo in 20+ locations](033-pending-p2-ios-restaurent-typo.md) | iOS | Bulk rename in coordinated commit |
| 034 | [Web theme object duplicated across 9 files](034-pending-p2-web-theme-duplicated.md) | Web | Extract to shared module |
| 035 | [Haversine formula duplicated 16 times + cURL 12 times](035-pending-p2-haversine-duplicated-16-times.md) | Backend | Extract scope + FoursquareService |
| 036 | [Weak OTP entropy (rand() not cryptographically secure)](036-pending-p2-weak-otp-entropy.md) | Backend | Replace with random_int() or Laravel password reset |
| 037 | [iOS hardcoded production API URL](037-pending-p2-ios-hardcoded-production-url.md) | iOS | Move to .xcconfig with Debug/Release |
| 038 | [next.config.ts hardcoded to localhost](038-pending-p2-next-config-hardcoded-localhost.md) | Web | Conditionalize to dev only |
| 039 | [User migration missing 9+ columns from model](039-pending-p2-missing-user-migration-columns.md) | Backend | Create migration for missing columns |
| 060 | [Android TagRestaurantRequest uses wrong field `tag_name` instead of `tags`](060-pending-p2-android-tag-request-wrong-fields.md) | Android | Fix field name and add missing required fields |
| 061 | [Android FollowRequest uses `tastemaker_id` instead of `testmaker_id`, missing fields](061-pending-p2-android-follow-request-wrong-fields.md) | Android | Fix key name; add user_id and is_follow fields |
| 062 | [Android SaveRestaurantRequest missing 4 required fields](062-pending-p2-android-save-restaurant-missing-fields.md) | Android | Add name, address, lat, lng to request model |
| 063 | [Android Tag model uses `tag_name` — backend column is `name`](063-pending-p2-android-tag-model-field-name.md) | Android | Rename to `name`; update all usages |
| 064 | [Update-profile response envelope missing in Web types](064-pending-p2-update-profile-response-envelope.md) | Web | Wrap response in ApiResponse\<User\> |
| 065 | [API exception handler commented out — all errors return HTML](065-pending-p2-api-exception-handler-commented-out.md) | Backend | Uncomment JSON exception handler in Handler.php |
| 066 | [Passport token TTL never configured — tokens last 1 year](066-pending-p2-passport-token-ttl-never-set.md) | Backend | Add Passport::tokensExpireIn(7 days) |
| 067 | [7 production tables have no migration files](067-pending-p2-missing-table-migrations.md) | Backend | Create migrations for all missing tables |
| 068 | [`imageLikeunlike` accepts `user_id` from body — IDOR](068-pending-p2-imagelikeunlike-idor.md) | Backend | Replace with Auth::id() |
| 069 | [Password reset OTP in URL path with no expiry](069-pending-p2-otp-url-path-no-expiry.md) | Backend | Move to POST body; add expiry column |
| 070 | [iOS `getProfileAPI` calls completion handler twice on success](070-pending-p2-ios-double-completion-bug.md) | iOS | Remove unconditional `complition(nil)` after success block |
| 071 | [iOS Bearer token stored in UserDefaults (not Keychain)](071-pending-p2-ios-token-userdefaults.md) | iOS | Migrate to Keychain via Security framework |
| 072 | [Android missing `nearbycuisine` endpoint in API interface](072-pending-p2-android-cuisine-endpoint-missing.md) | Android | Add nearbycuisine to TastemakersApi.kt |
| 073 | [`TastemakerList.name` should be `list_name` — cross-platform](073-pending-p2-tastemakerlist-name-field.md) | Cross-project | Rename field in Android model and Web types |
| 074 | [`restaurantImageSave` serializes `$_POST`+`$_FILES` to api_logs](074-pending-p2-restaurant-image-save-logging.md) | Backend | Remove logging; never log raw request superglobals |

## P3 — Nice-to-Have (27 findings)

| # | Issue | Scope | Action |
|---|-------|-------|--------|
| 013 | [TypeScript nullability doesn't match API](013-pending-p3-typescript-nullability-mismatch.md) | Web | Add `\| null` to nullable fields |
| 014 | [Android Restaurant missing `city`/`country`](014-pending-p3-android-missing-restaurant-fields.md) | Android | Add fields to data class |
| 015 | [User models missing 6 social fields](015-pending-p3-web-user-missing-social-fields.md) | Cross-project | Add social fields to web + Android |
| 016 | [Root CLAUDE.md API contract incomplete](016-pending-p3-root-api-contract-incomplete.md) | Docs | Regenerate from actual api.php |
| 017 | [Android using kapt instead of KSP](017-pending-p3-android-kapt-to-ksp.md) | Android | Migrate to KSP for faster builds |
| 018 | [WordPress missing .gitignore and .htaccess](018-pending-p3-wordpress-missing-gitignore-htaccess.md) | WordPress | Create both files |
| 019 | [Android `allowBackup="true"`](019-pending-p3-android-allowbackup-true.md) | Android | Set to false |
| 040 | [No OpenAPI/Swagger API documentation](040-pending-p3-no-openapi-spec.md) | Cross-project | Generate OpenAPI 3.0 spec |
| 041 | [No admin API endpoints (0/6 admin features)](041-pending-p3-no-admin-api-endpoints.md) | Backend | Create admin REST API controllers |
| 042 | [WordPress core (~50K files) committed to git](042-pending-p3-wordpress-core-in-git.md) | WordPress | Restructure, gitignore WP core |
| 043 | [Backend empty controllers and dead code](043-pending-p3-backend-empty-controllers-dead-code.md) | Backend | Delete CountryController, Mandal*, stubs, dead methods |
| 044 | [iOS vendored libraries instead of package manager](044-pending-p3-ios-vendored-libraries.md) | iOS | Replace with CocoaPods/SPM |
| 045 | [iOS dead/duplicate/buggy network methods](045-pending-p3-ios-dead-duplicate-methods.md) | iOS | Delete duplicates, fix double completion |
| 046 | [Restaurant migration country_id vs model country string](046-pending-p3-restaurant-migration-country-mismatch.md) | Backend | Create migration reflecting current schema |
| 047 | [No pagination on list endpoints (1/8)](047-pending-p3-no-pagination-on-list-endpoints.md) | Backend | Add Laravel paginate() to all lists |
| 048 | [Zero caching despite Redis being configured](048-pending-p3-zero-caching-in-backend.md) | Backend | Add Cache::remember() for hot paths |
| 049 | [Zero eager loading (N+1 everywhere)](049-pending-p3-zero-eager-loading.md) | Backend | Add with() to all relationship queries |
| 075 | [iOS multipart upload sends double Content-Type header with mismatched boundaries](075-pending-p3-ios-multipart-double-boundary.md) | iOS | Remove manual Content-Type header; let URLSession set it |
| 076 | [iOS dead methods: `arrayToNSData`, `makeNetworkActivityHidden`](076-pending-p3-ios-dead-methods.md) | iOS | Delete both dead methods |
| 077 | [web.php has 68-line commented block + duplicate admin route](077-pending-p3-webphp-dead-code-cleanup.md) | Backend | Delete commented routes; remove duplicate Route::get('/admin') |
| 078 | [`review_count1()` dead method with guaranteed runtime crash](078-pending-p3-dead-review-count1-method.md) | Backend | Delete the method |
| 079 | [`checkpermission()` copy-pasted into every controller](079-pending-p3-check-permission-inline.md) | Backend | Extract to middleware or base controller |
| 080 | [`review_count` leaks restaurant IDs for any user ID](080-pending-p3-review-count-user-enum.md) | Backend | Add User::findOrFail(); strip restaurant_ids from non-self response |
| 081 | [Admin plane accessible only via browser session — no API](081-pending-p3-admin-api-parity.md) | Backend | Add admin API group with auth:api + admin.role middleware |
| 082 | [Backend test command hardcodes Homebrew path — fails on Linux/CI](082-pending-p3-test-command-fragile.md) | Backend | Add `composer test` script shorthand |
| 083 | [iOS `otherUser` enum case bakes query string into path](083-pending-p3-ios-other-user-url-enum.md) | iOS | Change to `case otherUser = "user"`; pass param via dict |
| 084 | [Android CLAUDE.md documents stale prod URL + no gradlew commands](084-pending-p3-android-docs-stale.md) | Android | Update URL; add assembleDebug/test/lint commands |

---

## Related: Backend-Only Todos

The `tastemakers-backend/todos/` directory contains 31 additional findings from the backend code review (2026-03-12):

- **10 P1 Critical:** Unauthenticated deletes, hardcoded FCM key, broken Apple Sign-In, debug credential leaks, public cache-clear route, IDOR, missing indexes, N+1 queries, unhashed OAuth password, env() in controllers
- **10 P2 Important:** No rate limiting, god controllers, sync Foursquare cURL, lat/lng strings, mass assignment, GET deletes, $_POST superglobal, no Form Requests, OTP no expiry, SSL disabled
- **11 P3 Nice-to-Have:** Haversine duplication, commented code, naming, CurModel alias, var keyword, inconsistent responses, no tests, route naming, unbounded tags, permission copy-paste, DataTable N+1

## How to Work These

```bash
# View all pending todos
ls todos/*-pending-*.md

# When starting work, rename to ready:
mv todos/007-pending-p2-android-wont-compile.md todos/007-ready-p2-android-wont-compile.md

# When done, rename to complete:
mv todos/007-ready-p2-android-wont-compile.md todos/007-complete-p2-android-wont-compile.md
```

---

## Future Work (Roadmap)

Forward-looking product/feature work (not code-review findings). Tracked in the admin roadmap dashboard too.

| # | Item | Scope | Priority |
|---|------|-------|----------|
| 085 | [Marketing site consolidation / content build-out](085-pending-p3-marketing-site-consolidation.md) | Marketing / Web | p3 |
| 086 | [Complete Supabase end-user auth (profile, reset, account mgmt)](086-pending-p2-complete-supabase-auth.md) | Web | p2 |
| 087 | [User access tiers — free vs registered rules](087-pending-p2-user-access-tiers.md) | Web / Backend | p2 |
| 088 | [Backend admin — user/content management](088-pending-p2-backend-admin-buildout.md) | Web | p2 |
