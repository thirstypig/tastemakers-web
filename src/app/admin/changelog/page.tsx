import Link from "next/link";

const RELEASES = [
  {
    v: "v11.5.0",
    date: "2026-08-20",
    title: "Security sprint: 11 findings closed and verified live",
    items: [
      { type: "-", text: "Live reflected XSS on the password-reset page. /forgetpassword/otp/{code} took an unconstrained route param and echoed it into a // JavaScript comment, so a newline (%0A) broke out of the comment and executed — on the same origin that serves the session-guarded /admin panel. Reproduced on production. Closed by constraining the param to exactly 8 digits and deleting the dead sink line." },
      { type: "-", text: "Unauthenticated file upload on /api/signup. The endpoint took an image with no validation and stored it, so an anonymous request could plant HTML/JS on the api origin. It was the exact rule the profile endpoint got last session, missed on the signup sibling — the codebase's signature half-applied-fix shape, on its more dangerous (unauthenticated) half." },
      { type: "-", text: "The tag-picker endpoint 500'd on every call on PostgreSQL. ORDER BY on a column that was neither grouped nor aggregated, a MySQL-permissive GROUP BY, and an empty string bound to a bigint column — three faults, all confirmed by running the exact queries against production. The first one throws before the second runs, so no request ever completed." },
      { type: "-", text: "Editing a tastemaker list with an empty restaurant destroyed it. The endpoint DELETEd the contents then re-inserted them, but explode('') is ['' ] not [], so an empty input ran the loop once, failed to resolve a blank place_id, and hit a NOT NULL violation — after the delete, with no transaction to roll back." },
      { type: "-", text: "The password-reset code no longer travels in the URL at all. Last session added a no-referrer header; this took the code out of the path. The reset page is a pure app/store redirect that no longer uses the code, so new emails link to a code-less route and carry the 8-digit code in the body — out of Railway's access logs and browser history." },
      { type: "+", text: "Every reachable multi-write endpoint is now atomic. Four endpoints were wrapped in DB::transaction, and the bookmark toggle's check-then-attach race is closed with a UNIQUE (restaurant_id, user_id) constraint — verified against production first (0 rows, 0 duplicates) and confirmed in the migrations table after deploy. Fixes the old bug where only one person could bookmark a restaurant." },
      { type: "~", text: "One Supabase env contract instead of two. Server code read NEXT_PUBLIC_ names in the data layer and unprefixed names in auth/tagging, so a deploy that set only one pair broke half the app silently. Consolidated behind one resolver that accepts either; the admin gate stays deliberately strict." },
      { type: "~", text: "Corrected the /privacy consent wording — GA4 and AdSense load unconditionally with Consent Mode gating cookie behavior, not the scripts. Two findings closed as not-a-bug after verification: a profile field was safe via an iOS CodingKey, and two tag-search endpoints turned out complementary, not divergent." },
      { type: "+", text: "Backend tests 191 to 211, web 481 to 488. Every fix reverted and watched fail before being trusted. The multi-write-atomicity + TOCTOU pattern was written up as a searchable solution doc so the next occurrence takes minutes." },
    ],
  },
  {
    v: "v11.4.0",
    date: "2026-08-20",
    title: "Backlog triage: a third of it was already fixed, and four findings understated themselves",
    items: [
      { type: "-", text: "A blank password field destroyed the account's password. Request::has() is true for an empty string, so a client posting password=\"\" — what a form with a blank field sends — hashed the empty string and stored it. Verified against the real endpoint: the original password stopped working and the response was 200 \"User updated successfully\". Login rejects an empty password, so this locked users out rather than letting anyone in. Checked production: 232 accounts, zero hit." },
      { type: "-", text: "Login was unthrottled in practice on a live App Store app. throttle:5,1 keys on $request->ip(), and on Railway every request arrives from a different edge address — eight sequential logins measured remaining = 4,4,3,2,4,4,4,4. Auth endpoints now key on the submitted email. The IP is deliberately absent: including it reintroduces the bug, since a rotating address gives a fresh bucket regardless of what else is in the key." },
      { type: "-", text: "Twelve places took the acting user from the request body. auth:api only proves you are A user; each then acted on an id the caller supplied. Fixed the write and destructive half — creating a list owned by someone else, renaming theirs, deleting their photo, filing an abuse report in their name. imagedelete was the sharpest: the body value SCOPED the DELETE, so supplying the victim's id did not bypass a check, it selected the target." },
      { type: "-", text: "A commit security review then caught what that missed. Fixing WHO THE ACTOR IS is not the same as checking WHETHER THEY OWN THE OBJECT. tastemakerlistEdit scoped its UPDATE but not the DELETE two lines below, so an attacker's rename silently no-opped while the victim's list contents were wiped and replaced. The first fix made the endpoint look MORE guarded while leaving that open." },
      { type: "-", text: "/api/* returned a 302 to an HTML page when the caller sent no Accept header — which the shipped iOS client never does. Not a 422, not JSON. Fixed at the edge rather than by enabling the commented-out exception handler, which is gated on the same Accept check that is the root cause and hardcodes HTTP 200 for every error." },
      { type: "-", text: "The password-reset code leaked to Apple and Google. It travels in the URL path, and that page links to the App Store and Play Store, so clicking either sent /forgetpassword/otp/<CODE> in the Referer. The code is live for 15 minutes and grants a reset. Now no-referrer. Still in Railway's access logs and browser history — that needs the code out of the path." },
      { type: "-", text: "The backlog index generator shifted every carried column by one, in every committed version back to the first. It read carried columns from the STATUS cell, so the Issue column showed the status word and Scope and Action were junk copies. Self-propagating. The hand-written columns it exists to preserve had never once been preserved. Found by writing its first tests." },
      { type: "~", text: "Roughly a third of the P2 backlog was already fixed and never flipped — including one closed by a commit that literally said \"Closes todo 010\". Others understated themselves: 046 reads as documentation drift but restaurants has zero country/city columns and country_id is NULL on all 1,388 rows, so search results have always returned country: null." },
      { type: "~", text: "Tag levels are percentage-based, not a gap from the leader. The old rule was a subtraction that only behaves while counts stay in single digits: at a leader of 50, anything under 47 votes collapsed to L5. Changed while all 4,230 vote pairs still had exactly one vote, so nothing moved visually. Web and iOS now rank differently on purpose." },
      { type: "+", text: "Android shelved rather than left implying work in flight. 14 findings moved to a new deferred status — the whole app is 135 lines that render Text(\"Tastemakers\") on a blank screen and does not compile. Two of the sixteen were kept open because they are not Android-only." },
      { type: "+", text: "Tests 442 to 481 (web) and 162 to 191 (backend), plus the first 16 for the index generator. Every fix mutation-verified. Two of the tests written this session proved nothing until mutation testing exposed them — one used the wrong field name and 422'd, one claimed coverage of a guard whose removal left the suite green." },
      { type: "~", text: "Known and unfixed: the Google Places migration will silently blank the iOS discovery feed. Google's pagination token is a string, the shipped app declares nextPageToken as a required Int with no CodingKeys, and the decode failure is swallowed — no crash, no error, just an empty feed on every installed device." },
    ],
  },
  {
    v: "v11.3.0",
    date: "2026-08-20",
    title: "Four counts that were wrong, and the arithmetic that gave them away",
    items: [
      { type: "-", text: "Tastemaker tag counts on /tastemakers were short. The listing read every tastemaker's restaurant_tag rows in one unpaged query; PostgREST caps at 1000 and reports success, so the counts were computed from a truncated set. Thirsty Pig showed 871 and Master Taster 129 — summing to exactly 1000 — while the profile page, one user and under the cap, showed 932. Per-user totals landing on precisely the cap was the entire symptom: no error, no log line, no visual defect." },
      { type: "-", text: "Tastemaker profile URLs 404'd on any casing but the stored one. /tastemakers/thirstypig failed while /tastemakers/Thirstypig rendered, because the lookup used .eq(\"username\", slug) and .eq is case-sensitive. Our own links carry the stored casing so they always worked — this only ever broke inbound links, which is the traffic these SEO pages exist to capture. Now resolves case-insensitively and 308s to the canonical spelling." },
      { type: "~", text: "The obvious fix for that was the wrong one. .ilike would have worked and also treats _ as a single-character wildcard, and _ is a legal username character — thirsty_pig would have matched thirstyXpig too. Matched in JS on the miss path instead." },
      { type: "~", text: "listRestaurants read its top-60 tag rows with .in(...) but no range: 848 rows against the 1000 cap, 15% headroom, re-measured against production before touching it. Not wrong today, but the bound is data-dependent and the top 60 are by definition where new tagging density lands. Paged, along with the tags lookup beside it." },
      { type: "~", text: "Every fetchAllPages call site now sorts by id before ranging. Postgres does not guarantee row order without ORDER BY, so a row could land on two pages or none; a sequential scan of a static table happens to be stable, which is why three call sites omitted it without visible damage. Checked the live schema first — category_restaurant is a pivot table and could easily have had no id column, in which case the fix would have 500'd /cuisines." },
      { type: "+", text: "Tests 442 to 454, on two functions that had none. All four fixes verified by reverting them and watching the right test fail for the right reason: 1000 where 1200/1500/300 belong for the cap, \"expected null to be truthy\" for the casing, \"expected 0 to be greater than 0\" for the listing — while the in-cap and unknown-slug controls kept passing." },
      { type: "-", text: "Three error_log files had been tracked in the backend repo since 2021. .gitignore has carried an error_log pattern for some time, but that does nothing for files already tracked — the guard was added and the cleanup was not. PHP fatals from the legacy Namecheap host disclosing /home/tastofgc/public_html/. Scanned for credentials before removing: none." },
      { type: "~", text: "Corrected mid-session: a claim that the search page left _ unescaped as a LIKE wildcard was wrong. sanitizeSearchTerm strips it to a space, so _izza becomes izza, which genuinely substring-matches Pizzana. The discriminating probe (p_zza returning 0) confirmed both % and _ are neutralised." },
      { type: "~", text: "Still open and now recorded: /tastemakers/73 is a numeric-id URL for a tastemaker with no username, and the lookup branches on parseInt — so an all-digits username would route to the id query and miss. The \"Known for\" tag cloud on a profile still cannot render; it is blocked on a ranking decision, not on code." },
    ],
  },
  {
    v: "v11.2.0",
    date: "2026-08-19",
    title: "Repairing the backend the App Store build talks to",
    items: [
      { type: "-", text: "Tag voting works again. UNIQUE (restaurant_id, tag_id) meant the second person to apply an existing tag got HTTP 500, and every vote count was pinned at 1 — the product ranks tags by how many people agree, so agreement was literally unrepresentable. Replaced with (restaurant_id, tag_id, user_id). Proven on live data: one tag went 1 to 3 votes in a rolled-back transaction. It does NOT recover the ~941 votes the original migration deleted." },
      { type: "-", text: "Apple Sign-In accepted forged tokens. The identity token's signature was never verified, and the account was then looked up by the token's own email claim — so anyone could mint a JWT naming a victim and receive a working access token, with no credentials. Now verified against Apple's published keys, failing closed. Google login was never affected; it already verified." },
      { type: "-", text: "Two more Apple bugs found while testing meant NEW Apple signups had never worked at all: the raw ~800-character token was stored in a varchar(255) password column, and the name fields were read unguarded although Apple only sends them on first authorisation." },
      { type: "-", text: "Three endpoints authenticated the caller and then acted on an id from the request body: any logged-in user could delete any list, delete anyone else's tags, or read any profile — which returned email, device_token and fcm_token publicly for any user id." },
      { type: "-", text: "Deploys had never applied a migration. railway.json used deploy.releaseCommand, which is not a key Railway has, so artisan migrate never ran on any deploy while every deploy reported SUCCESS. That one typo explains the 24-vs-30 migrations table, the vote-destroying constraint that was never recorded, and 8 production tables with no migration." },
      { type: "~", text: "Removed the last MySQL-only SQL: 36 IFNULL to COALESCE, 2 nested IF() to CASE WHEN (the tag-level thresholds), radians(varchar) cast at 48 sites, and HAVING on a SELECT alias replaced at 14. Location queries execute again." },
      { type: "~", text: "RestaurantController 3059 to 2480 lines. GET /api/restaurants1 was registered against a commented-out method and returned 500 on every call; it 404s now." },
      { type: "+", text: "Backend tests 5 to 106 (3 deliberately red: the controller returns 200 with status:false on bad credentials, and changing that is an API change the shipped binary would feel). Every fix verified by reverting it and watching its test fail." },
      { type: "~", text: "Still broken and tracked: discovery returns status:false because Foursquare is unkeyed; the tag level can only ever compute 5; RLS is off on all 31 Supabase tables." },
    ],
  },
  {
    v: "v11.1.0",
    date: "2026-08-18",
    title: "Hardening the iOS shim after review",
    items: [
      { type: "-", text: "Uploads over 10 MB through /v2/api returned a plain-text 500 after 37 seconds. Next truncates a proxied body past its 10 MB default while still forwarding the original Content-Length, so Laravel blocked waiting for bytes that never arrived until the 30s proxy timeout fired. Measured: 11 MB gave 500 in 37s through the shim versus a parseable 413 in 10s direct. Four 12 MP photos clears the limit." },
      { type: "-", text: "Both guard tests protecting the shim passed while it was broken. Commenting out the rewrite, reintroducing the /api catch-all with backticks and 127.0.0.1, and disabling it in production only — all three shipped green. A cosmetic quote change was the only thing that failed them. They now execute the config instead of regexing its text; all four mutations behave correctly." },
      { type: "-", text: "Middleware ran on every legacy iOS call, forwarding the browser's Supabase access and refresh tokens to the Laravel host and burning rotated session cookies that an external rewrite discards. It now short-circuits the prefix, strips Cookie and client-supplied x-forwarded-*, and forces Accept: application/json — which also converts the iOS expired-token path from a 302 to a plaintext http:// URL that App Transport Security blocks into a 401 the app can handle, with no App Store release." },
      { type: "+", text: "Tripwire test: no redirect may capture /v2/api. Redirects evaluate before rewrites, so a routine apex-to-www SEO redirect would downgrade every legacy POST to GET — breaking login and every write from the installed base while still looking like a healthy 3xx in logs." },
      { type: "+", text: "robots.txt now disallows /v2/api. The whole Laravel GET surface was crawlable under the primary SEO domain; \"/api\" does not cover it, since robots paths match from the root." },
      { type: "~", text: "The shim destination is hardcoded for every build and overridable only in development, so npm run dev no longer proxies writes into the production database — and an unset or stale env var cannot silently break the installed base, which is the SOL-006 failure mode." },
      { type: "+", text: "ADR-002 records the decision and its consequences; TASK-24 gates removal on a measurable condition. The stated gate — iOS adoption above 90% — still has no instrument behind it, because PostHog is browser-only and never sees a URLSession call." },
      { type: "~", text: "Found but NOT fixed here: the Laravel rate limiter never decrements, so there is no brute-force protection on login, signup or password reset. Verified twice — x-ratelimit-remaining stays at 4 across every request. Needs the Railway CACHE_DRIVER value, which this connection cannot read. Todo 110." },
    ],
  },
  {
    v: "v11.0.0",
    date: "2026-08-18",
    title: "Domain merge, and reconnecting the shipped iOS app",
    items: [
      { type: "+", text: "www.tastemakersapp.com and the apex now serve this app; app.tastemakersapp.com is retired. Until today the brand domain served a 15 KB static page with zero <h1> from a different Railway service, while the whole v2 redesign sat on a subdomain nobody links to. Railway Hobby caps custom domains at 2 per service, so keeping app. would have forced a Pro upgrade for nothing." },
      { type: "+", text: "CANONICAL_ORIGIN and canonical() replaced 15 hardcoded origins — moving the site is now one environment variable plus a redeploy. Deliberately a NEW variable rather than reusing NEXT_PUBLIC_SITE_URL, which is localhost:3050 in dev by design; canonicals derived from it would make any local build publish localhost canonicals and sitemap." },
      { type: "-", text: "The canonical fallback still named the retired app. domain. A fallback never runs while the env var is set, so nothing noticed — and nine tests asserted the dead value, so the suite was protecting it. Found by asking a subagent to adversarially refute claims already shipped. It now asserts against a RETIRED_ORIGINS list rather than a literal, so the guard survives the next domain move." },
      { type: "-", text: "Unmatched /api/* returned 500, not 404, in production: next.config carried a fallback rewrite to http://localhost:4050, the dev port, shipped. Deleted rather than repointed at Laravel, which would have exposed the whole API surface through the web domain." },
      { type: "-", text: "Every request the live iOS app makes was 404ing. The App Store binary builds every call from tastemakersapp.com/v2/api/ — the old Namecheap layout, gone since the Railway move. That prefix now forwards to the Laravel host. Old versions stay installed for months, so this could not be fixed by shipping a new build." },
      { type: "+", text: "Persistent App Store link in the app shell. The link existed in three places and was unreachable from all of them: signed-out only, first-visit-then-dismissed-forever, or on the two remaining v1 pages. Now server-rendered on every page." },
      { type: "~", text: "Redirects for /privacy-policy, /review-tag and /about-us, all hardcoded in the shipped iOS build. /terms deliberately left 404 — the marketing repo claims the apps link to it, but no such reference exists in either client." },
      { type: "+", text: "Tests: 363 to 390 across 32 files. New guards cover the redirect table (destinations must resolve to real pages; no redirect may shadow a route), the /api namespace (no proxy), and the canonical fallback (never a retired host). Each verified by reintroducing the exact bug it describes." },
      { type: "~", text: "Known and unfixed: profile images still 404 — they lived on the Namecheap disk and were never migrated to object storage. /v2/api/restaurants still fails server-side on missing Foursquare credentials. Connectivity is restored; not every endpoint behind it works." },
    ],
  },
  {
    v: "v10.0.0",
    date: "2026-08-17",
    title: "v2 web rebuild, iOS-matched tag ranking, and the SSR fix",
    items: [
      { type: "+", text: "Public app rebuilt on the v2 light design system in a new (app) route group — home, search, cuisines, lists, restaurant detail, photos, bookmarks, profile, sign-in. Tokens scoped to .tm-app so the admin Paper/Gruvbox toggle still works." },
      { type: "~", text: "Nav is a bottom tab bar under 768px and a top bar at 768+. The sidebar, hamburger drawer and 768–1023 icon rail are all gone — four destinations justify none of them, and the rail had caused two layout bugs." },
      { type: "+", text: "Code reorganised into src/features/* modules; each owns its queries, components and stylesheet. css-wiring.test.ts fails the build on a tm-* class used but never defined, or a stylesheet that nothing imports." },
      { type: "~", text: "Tag levels now match iOS exactly: a tag's level is its gap from that restaurant's leading tag, not an absolute threshold. Web's 10/5/3/2 thresholds had ranked the same restaurant differently from the app." },
      { type: "+", text: "Five-level ramp re-derived for a light canvas. The source design's ramp was drawn for #1A1038 where its strongest fill reads 15:1; on #F1F1F3 it measures 1.06:1 and inverts. Fills now spaced ~15 L* apart with size and weight as a second, non-colour channel." },
      { type: "~", text: "Restaurant and list URLs are name-plus-id (langers-delicatessen-159). Name alone isn't unique — 68 shared slugs, 14 In-N-Out Burgers, 34 non-Latin names. Old numeric URLs still resolve; rel=canonical points at the slug." },
      { type: "-", text: "CRITICAL, now fixed: every page was reaching crawlers empty. useSearchParams in PostHogProvider shared the root Suspense boundary with the whole app, so static pages shipped a shell with no <h1>, no tags, no content — while build, typecheck, 333 tests and every screenshot stayed green. Restaurant page went 26,589 → 41,102 bytes. Documented as SOL-005." },
      { type: "-", text: "A second user's vote was silently dropped: POST /api/restaurants/[id]/tag returned 200 on a unique-constraint violation. Now distinguishes 'already voted' from 'the constraint blocked this' (409)." },
      { type: "-", text: "The restaurants index ranked from 1000 of 4230 tag rows — PostgREST caps responses regardless of .limit(5000), so the second most-tagged restaurant never appeared. fetchAllPages walks ranges." },
      { type: "-", text: "getRestaurantDetail filtered testmaker_list on a deleted_at column that doesn't exist, so the 'on these lists' rail silently vanished. Photo URLs resolved a bare filename as a relative path." },
      { type: "+", text: "beehiiv newsletter signup behind /api/subscribe, key server-side only. First-visit explainer on restaurant pages. City-scoped search — the header said 'Los Angeles' while results came from Pasadena and Taipei." },
      { type: "+", text: "Tests: 127 → 363 across 28 files. Component testing is now possible at all — the repo had @testing-library/react installed with no JSX transform, so no component test had ever run. Added @vitejs/plugin-react and the .tsx glob." },
    ],
  },
  {
    v: "v9.0.0",
    date: "2026-07-24",
    title: "Docs knowledge base, auto-walking viewer, and the archaeology findings",
    items: [
      { type: "+", text: "docs/ knowledge base established: frontmatter convention (id/type/status/tags/links), 14-tag controlled vocabulary, ID scheme (PRD/ADR/DOC/RISK/EXP/SOL/TODO), 9 board sections organised by reader question — spec in docs/README-DOCS.md" },
      { type: "~", text: "/admin/docs rebuilt AGAIN: the hand-maintained DOCS_REGISTRY whitelist is gone, replaced by an auto-walker over docs/ — frontmatter drives section, H1 drives title (with a code-fence + HTML-comment guard so a `# comment` inside a bash block can't become the title). Add a doc, it appears. 38 docs indexed." },
      { type: "+", text: "Viewer UX: search over title/id/path/tag, per-section purpose blurbs, status badges including shipped-vs-planned on PRDs, wider sidebar with hover tooltips, generated-doc banner" },
      { type: "+", text: "4 PRDs written — tagging + badges reconstructed retroactively from code with every claim tagged [intended]/[inferred]/[unknown]; account-deletion + search written forward-looking. Plus ADR-001 (feature module isolation, 7-module map), launch spec, intake gate, glossary, roadmap, to-dos, priority map" },
      { type: "+", text: "Living docs: scripts/refresh-docs.mjs generates stats/costs/system-status and rewrites the status block in README + CLAUDE.md between markers; scripts/sync-inbox.mjs drives the comment-inbox loop. npm run docs:refresh / docs:inbox" },
      { type: "-", text: "EXP-001 REFUTED: 86% of tagged restaurants have exactly one tagger, so tag votes have a hard ceiling of 1 — the consensus the product rests on does not exist in the data. Only 3.9% of restaurants could ever have reached 3 votes." },
      { type: "-", text: "UNIQUE(restaurant_id, tag_id) found ALREADY APPLIED in production and absent from the migrations table — every vote count is capped at 1, 759 ids missing from the sequence, and the second user to apply an existing tag gets an HTTP 500 today" },
      { type: "-", text: "Tagging activity down 98.5% from peak: 3,068 tags / 67 taggers in 2021 → 44 tags / 6 taggers in 2025. Logged as RISK-016; it outranks the technical backlog." },
      { type: "-", text: "getallBadges hardcodes user_id = 43 in three queries — every user sees user 43's badges; 19 MySQL-only IFNULL/IF() calls throw on PostgreSQL; searchByTags has no ORDER BY at all" },
      { type: "+", text: "Tests: 127 → 219 across 15 files. Added the docs registry/title-extraction suite (63), docs-generation script coverage (43), and a client/server boundary guard. vitest now includes scripts/**/*.test.mjs" },
      { type: "~", text: "Stats LOC corrected: the generator was counting 429,667 lines of vendored assets (the committed Metronic admin theme) as project code — real application source is ~81K, not 510K" },
    ],
  },
  {
    v: "v8.10.0",
    date: "2026-06-09",
    title: "Docs reorg + live dashboard",
    items: [
      { type: "~", text: "/admin/docs rebuilt: single DOCS_REGISTRY in src/lib/docs.ts drives index + viewer + static params — killed 5 desync 404s; docs grouped into 5 categories (planning/operations/product/reference/context)" },
      { type: "+", text: "New ops docs: operations.md (deploy/rollback/incident/env inventory), architecture.md (system map), metrics.md (KPI definitions); going-live.md refreshed (+blockers.md merged in, deleted); cross-todos.md regenerated; root-claude.md snapshot added" },
      { type: "+", text: "/admin landing dashboard rebuilt: 12-week trend sparkbars (users/restaurants/tags/saves), 30d trending-cities leaderboard with deltas, PostHog 7d web stats (cached 5min), merged activity feed (signups/tags/lists) — force-dynamic, Promise.allSettled failure-isolated" },
      { type: "~", text: "posthog.ts shared HogQL client extracted — analytics page refactored to use it; GITHUB_TOKEN optional env var for authenticated GitHub requests in docs viewer" },
      { type: "+", text: "22 new tests: trends.ts (5), city-stats.ts (4), activity-feed.ts (3), posthog.ts (3), docs.test.ts expanded — suite now 118 tests across 12 files" },
    ],
  },
  {
    v: "v8.9.4",
    date: "2026-06-09",
    title: "Admin style consistency pass + /todo page + test lib",
    items: [
      { type: "+", text: "/admin/todo — new page with 22 detailed implementation tasks filterable by platform (backend/ios/android/web/marketing), priority (P1/P2/P3), and status" },
      { type: "~", text: "Roadmap reorganized from flat P1/P2/P3 list to platform-grouped macro milestones with expandable detail notes" },
      { type: "~", text: "tech + status pages: replaced hardcoded dark tokens (#0f0f23) with CSS vars — light/dark theme toggle now applies consistently across all admin pages" },
      { type: "~", text: "tech + status pages: removed standalone sticky header/footer that was duplicating admin chrome; replaced with standard tab strip pattern" },
      { type: "~", text: "analytics page: service names are clickable links to GA4, PostHog, Search Console, AdSense dashboards; AdSense added to services list" },
      { type: "+", text: "admin-filters.ts — extracted filterTodos() + summarizeRoadmap() as shared pure lib; 13 unit tests covering AND-logic filter, 'all' sentinel, P1 counter excludes done items" },
    ],
  },
  {
    v: "v8.9.3",
    date: "2026-06-08",
    title: "Fix production OAuth login — Railway port + email allowlist",
    items: [
      { type: "~", text: "auth/callback: use NEXT_PUBLIC_SITE_URL as redirect origin — request.url inside Railway resolves to localhost:8080, not the public domain" },
      { type: "~", text: "Removed x-forwarded-host fallback (open redirect vulnerability — host header is client-controlled)" },
      { type: "~", text: "Root cause of loop-to-login: ADMIN_EMAILS in Railway had a typo (jimmyc316 vs jimmychang316) — corrected in Railway env vars" },
      { type: "+", text: "Production admin fully live: app.tastemakersapp.com/admin — login, users, restaurants, tags, platforms, analytics all working" },
    ],
  },
  {
    v: "v8.9.2",
    date: "2026-06-08",
    title: "Fix PostHog project ID + confirm analytics live",
    items: [
      { type: "~", text: "Analytics page: correct PostHog project ID from 348330 (Fantasy Leagues) → 455919 (Tastemakers)" },
      { type: "~", text: "PostHog write key corrected in env — tracking now active on Tastemakers project" },
      { type: "+", text: "Admin analytics page fully live: GA4 active, Plausible active, PostHog event counts rendering real data" },
    ],
  },
  {
    v: "v8.9.1",
    date: "2026-06-08",
    title: "Live platforms commits + real analytics service status",
    items: [
      { type: "+", text: "Platforms page: live commits from GitHub API for web (5min cache); private repos fall back to hardcoded" },
      { type: "+", text: "Platforms page: repo field shows public/private status per platform" },
      { type: "+", text: "Analytics page: GA4, Plausible, Search Console show real 'active/verified' status" },
      { type: "+", text: "Analytics page: PostHog event table (last 7d) when POSTHOG_PERSONAL_API_KEY is set" },
      { type: "~", text: "Analytics page: upgraded from stub placeholder to async Server Component with env-gated data" },
    ],
  },
  {
    v: "v8.9.0",
    date: "2026-06-07",
    title: "Live admin — real Supabase data, restaurants + tags pages",
    items: [
      { type: "+", text: "supabase-admin.ts — server-only service-role client; never bundled to browser" },
      { type: "+", text: "Admin overview wired to live KPIs: total_users, total_restaurants, total_tags, total_saves, total_tag_applications, total_lists" },
      { type: "+", text: "Admin overview: recent signups panel + top tags by usage (live)" },
      { type: "+", text: "/admin/users — real user table (email, name, username, is_testmaker flag, joined, last seen)" },
      { type: "+", text: "/admin/restaurants — real restaurant table with per-row save + tag counts" },
      { type: "+", text: "/admin/tags — real tag table sorted by usage with inline usage bar" },
      { type: "~", text: "Admin login: fixed post-OAuth redirect landing on /explore instead of /admin (missing ?next=/admin in redirectTo)" },
    ],
  },
  {
    v: "v8.8.2",
    date: "2026-06-04",
    title: "P1+P2 security & seeder hardening (26 todos resolved)",
    items: [
      { type: "~", text: "Auth: move delete endpoints behind auth:api; throttle:5,1 on login/signup/forgot-password" },
      { type: "~", text: "FCM hardcoded key → config('services.fcm.server_key'); env() → config() in RestaurantController" },
      { type: "~", text: "Production: restaurant_tag.user_id nullable; UNIQUE(restaurant_id,tag_id) + UNIQUE(tags.name) on Supabase" },
      { type: "~", text: "TagSeederService: prompt sanitization, placeId URL encode, embedding float validation, hasCandidates hoist, pgvector lateral query, TAG_REGEX 3-char min, tags_invalid counter split, expires_at scope" },
      { type: "~", text: "Tag model: users() scoped to source='user'; global expires_at scope; author_name removed (GDPR)" },
    ],
  },
  {
    v: "v8.8.1",
    date: "2026-06-04",
    title: "Tag seeding pipeline deep review",
    items: [
      { type: "+", text: "21 new backend todos filed (046–066) from 7-agent parallel code review" },
      { type: "!", text: "P1: .env_bkp with DB + SMTP passwords committed to git — rotate + purge required (046)" },
      { type: "!", text: "P1: RestaurantController pluck(user_id) passes NULL to WhereIn post-seeding (047)" },
      { type: "~", text: "Security findings: prompt injection, placeId URL risk, embedding validation, GDPR author_name (048–052, 060)" },
      { type: "~", text: "Performance findings: hasCandidates per-tag waste, pgvector double-eval (053–054)" },
    ],
  },
  {
    v: "v8.8.0",
    date: "2026-06-03",
    title: "User auth + site consolidation",
    items: [
      { type: "+", text: "End-user Supabase auth — AuthProvider + useAuth(), session refresh in middleware" },
      { type: "+", text: "Marketing home at / + /explore hub (replaces / → /restaurants redirect)" },
      { type: "+", text: "/review inline auth-gate stub; /profile/* route protection" },
      { type: "+", text: "Auth-aware Nav on marketing/app-shell routes" },
      { type: "~", text: "Auth redirects default to /explore; login honors ?next (open-redirect-safe)" },
    ],
  },
  {
    v: "v8.7.0",
    date: "2026-06-03",
    title: "Privacy & analytics",
    items: [
      { type: "+", text: "Privacy Policy pages live on marketing + web app (/privacy)" },
      { type: "+", text: "GA4 (G-062TFF0ZGE) on both sites with Consent Mode v2" },
      { type: "+", text: "Google AdSense loader + Privacy & messaging consent CMP" },
      { type: "+", text: "ads.txt deployed; AdSense site submitted for review" },
      { type: "~", text: "Consent denied by default in EEA/UK until granted" },
    ],
  },
  {
    v: "v8.6.3",
    date: "2026-05-11",
    title: "Security sprint",
    items: [
      { type: "+", text: "9 PHPUnit feature tests added (AuthTest + UserProfileTest)" },
      { type: "~", text: "Removed hardcoded FCM key → moved to .env + config/services.php" },
      { type: "~", text: "Stripped all debug echo/print_r statements" },
      { type: "~", text: "role_id removed from User $fillable — privilege escalation fixed" },
      { type: "~", text: "Mass assignment risk resolved, UserFactory updated" },
    ],
  },
  {
    v: "v8.6.2",
    date: "2026-05-04",
    title: "Railway cutover",
    items: [
      { type: "+", text: "api.tastemakersapp.com live on Railway (CNAME + cert)" },
      { type: "+", text: "Passport RSA keys stored as env vars, written to disk on boot" },
      { type: "~", text: "PHP pinned to 8.1 (Laravel 8 incompatible with 8.4+)" },
      { type: "~", text: "PostgreSQL on Supabase — connection strings configured for all 5 services" },
    ],
  },
  {
    v: "v8.6.1",
    date: "2026-04-22",
    title: "Cross-project code review",
    items: [
      { type: "+", text: "84 findings catalogued across all 5 repos (22 P1, 35 P2, 27 P3)" },
      { type: "+", text: "todos/ directory created with structured issue files" },
      { type: "-", text: "Android build confirmed broken (Hilt DI module missing)" },
      { type: "-", text: "iOS multi-image upload confirmed broken (Content-Type boundary mismatch)" },
    ],
  },
  {
    v: "v8.6.0",
    date: "2026-04-01",
    title: "Supabase migration",
    items: [
      { type: "+", text: "PostgreSQL on Supabase — all tables migrated from MySQL" },
      { type: "~", text: "MySQL-specific SQL rewritten for PostgreSQL compatibility" },
      { type: "-", text: "GROUP BY, IFNULL, IF() calls identified for rewrite" },
    ],
  },
];

function typeColor(t: string) {
  if (t === "+") return "var(--tm-accent)";
  if (t === "-") return "var(--tm-err)";
  return "var(--tm-warn)";
}

export default function ChangelogPage() {
  return (
    <div>
      {/* Tab strip */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--tm-line)",
          background: "var(--tm-panel)",
          fontSize: 11,
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {[
          { label: "CHANGELOG.md", active: true, href: "/admin/changelog" },
          { label: "overview.tsx", active: false, href: "/admin" },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
              padding: "7px 14px",
              borderRight: "1px solid var(--tm-line)",
              color: tab.active ? "var(--tm-ink)" : "var(--tm-muted)",
              background: tab.active ? "var(--tm-bg)" : "transparent",
              fontWeight: tab.active ? 600 : 400,
              textDecoration: "none",
              display: "block",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px",
          gap: 0,
        }}
      >
        {/* Main content */}
        <div style={{ padding: "14px 18px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 16, fontSize: 11.5 }}>
            <span style={{ color: "var(--tm-accent)" }}>$</span> cat CHANGELOG.md
          </div>

          {RELEASES.map((r) => (
            <div key={r.v} id={r.v} style={{ marginBottom: 24 }}>
              {/* Version header */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--tm-ink)",
                  marginBottom: 4,
                }}
              >
                ## {r.v} — {r.date}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--tm-muted)",
                  marginBottom: 8,
                }}
              >
                {r.title}
              </div>

              {/* Items */}
              <div
                style={{
                  background: "var(--tm-panel)",
                  border: "1px solid var(--tm-line)",
                  borderRadius: 6,
                }}
              >
                {r.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 14px",
                      borderBottom:
                        i === r.items.length - 1
                          ? "none"
                          : "1px solid var(--tm-line)",
                      display: "flex",
                      gap: 10,
                      fontSize: 11.5,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        color: typeColor(item.type),
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {item.type}
                    </span>
                    <span style={{ color: "var(--tm-ink)" }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* TOC */}
        <div
          style={{
            borderLeft: "1px solid var(--tm-line)",
            padding: "14px 12px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            position: "sticky" as const,
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--tm-muted)",
              marginBottom: 8,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
            }}
          >
            versions
          </div>
          {RELEASES.map((r) => (
            <a
              key={r.v}
              href={`#${r.v}`}
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--tm-muted)",
                textDecoration: "none",
                padding: "3px 0",
              }}
            >
              {r.v}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
