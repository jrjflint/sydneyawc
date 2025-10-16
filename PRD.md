# Product Requirements Document — Sydney Amateur Winemakers Club Website

## 1. Product Overview
- **Product name:** Sydney Amateur Winemakers Club (SAWC) website
- **Type:** Static marketing and information site hosted on GitHub Pages, implemented with vanilla HTML/CSS/JS plus Python utilities for data preparation.【F:README.md†L19-L39】
- **Purpose:** Promote the club, communicate meeting logistics, showcase competition results, and provide calendar/data feeds for members and prospects.【F:index.html†L63-L165】【F:results.html†L13-L100】

## 2. Objectives & Success Metrics
| Objective | Success Indicator | Measurement Source |
| --- | --- | --- |
| Provide up-to-date meeting logistics for members | Next meeting block renders dynamic data instead of placeholder copy | Successful fetch/render in `assets/nextevent.js`; Rich Results validation per README checklist.【F:assets/nextevent.js†L201-L222】【F:README.md†L54-L63】
| Promote ongoing engagement & growth | Click-throughs on mailing list, Facebook group, and calendar subscription CTAs | `data-gtm` instrumentation combined with Google Tag Manager configuration.【F:index.html†L92-L165】【F:index.html†L5-L55】
| Publish annual wineshow outcomes | Results page loads JSON feeds, filters entries, and surfaces highlights for latest year | `assets/js/results.js` loading/parsing requirements; JSON feeds under `assets/data/` kept current.【F:assets/js/results.js†L18-L507】【F:README.md†L41-L53】
| Maintain search visibility | Structured metadata renders for events and wineshow | JSON-LD emitted on homepage events and results page.【F:assets/nextevent.js†L95-L198】【F:assets/events.js†L15-L141】【F:results.html†L102-L121】

## 3. Target Users & Use Cases
- **Prospective members** seeking club overview, meeting cadence, and contact options.【F:index.html†L63-L138】
- **Current members** needing reminders, event calendars, and competition information.【F:index.html†L92-L165】【F:assets/events.js†L118-L177】
- **Competition entrants/judges** looking for historical wineshow standings, filters, and downloadable data.【F:results.html†L22-L100】【F:assets/js/results.js†L204-L444】

## 4. In-Scope Features & Functional Requirements
### 4.1 Homepage Content
1. **Hero & About section** summarises club mission, meeting cadence, and location expectations.【F:index.html†L63-L90】
2. **Next Meeting module**
   - Loads the upcoming event from `assets/events.json` and replaces the placeholder content once data is available.【F:assets/nextevent.js†L201-L214】
   - Formats date/time with Sydney timezone, handles “TBA” venues, and displays meeting activity/mini competition notes where present.【F:assets/nextevent.js†L5-L188】
   - Emits Schema.org `Event` JSON-LD (with organizer, offers, performer, image, and address) into `<head>`; removes it if no future meeting exists.【F:assets/nextevent.js†L95-L198】
3. **Calls-to-action** offer direct email signup, Facebook group link, and mailto prefill copy. Links must retain `data-gtm` attributes for analytics.【F:index.html†L92-L120】
4. **Events list**
   - Fetches all events, sorts chronologically, and splits into upcoming and past collections with monthly groupings.【F:assets/events.js†L118-L177】
   - Each event article contains schema markup, location, descriptive fields, and per-event JSON-LD snippets appended to the DOM.【F:assets/events.js†L24-L141】
   - Past events remain accessible behind a `<details>` disclosure; hide the wrapper when empty.【F:index.html†L123-L131】【F:assets/events.js†L134-L141】
5. **Footer utilities** expose contact email, copyright, calendar subscription buttons for Apple/Outlook, Google, and direct download — all tracked via `data-gtm` attributes.【F:index.html†L134-L165】

### 4.2 Wineshow Results Experience
1. **Standalone page layout** with skip link, filter controls, highlight cards, and entries table that defaults to the latest competition year.【F:results.html†L13-L92】
2. **Data loading**
   - Preload JSON feeds for aggregates (`results_index.json`) and entries (`results_entries.json`).【F:results.html†L8-L9】
   - Fetch both feeds on DOM ready, cache in local state, and gracefully handle failures with shared error copy.【F:assets/js/results.js†L16-L507】
3. **Filters & interactions**
   - Populate year dropdown from index data, sync `?year=` query param, and reset filters when year changes.【F:assets/js/results.js†L77-L145】
   - Provide class dropdown and text search, filtering the entries table in real time and pushing GTM events for analytics.【F:assets/js/results.js†L51-L507】
   - Maintain accessible tabbed navigation for leaderboard metrics (Average, Median, Sum Top 5) with keyboard support.【F:results.html†L46-L59】【F:assets/js/results.js†L204-L305】
4. **Highlights & table rendering**
   - Champions list, leaderboards, and best-in-class sections update per year, showing fallback messaging when data is missing.【F:assets/js/results.js†L169-L354】
   - Entries table displays class, entry, winemaker, wine, score, and flags (BIC/Champion) sorted by score with summary text reflecting filters.【F:assets/js/results.js†L356-L444】
5. **Structured data** updates JSON-LD script on year change, including ordinal numbering derived from base year 1975.【F:results.html†L102-L121】【F:assets/js/results.js†L424-L460】

### 4.3 Data & Content Pipeline
1. **Events data maintenance**
   - Rebuild `assets/events.json` (and optional `.ics`) from the cleaned club spreadsheet using `generate_events_from_clean.py` and related scripts.【F:README.md†L65-L101】
   - Spreadsheet export must include required columns (Date, Start, End, Meeting Activity, Mini Competition, Comments, Location, Description).【F:README.md†L69-L73】
2. **Wineshow results updates**
   - Refresh both `results_index.json` and `results_entries.json` from judging spreadsheets, keeping schema consistent and updating year-specific copy as needed.【F:README.md†L41-L53】
3. **Local preview workflow** relies on any static HTTP server (no build step); document remains in README for continuity.【F:README.md†L31-L39】

### 4.4 Analytics & Instrumentation
- Google Tag Manager snippet and gtag configuration must remain in the `<head>` and `<noscript>` fallback for tracking.【F:index.html†L5-L62】【F:index.html†L44-L55】
- Front-end interactions push structured events into `dataLayer` for filters, searches, and leaderboard tab changes on the results page.【F:assets/js/results.js†L498-L507】
- CTA anchors include `data-gtm` attributes to align click tracking with GTM triggers.【F:index.html†L92-L165】

### 4.5 SEO, Accessibility & UX
- Maintain canonical URL, meta description/keywords, and Open Graph/Twitter metadata for the homepage.【F:index.html†L3-L42】
- JSON-LD should cover upcoming meetings, per-event listings, and wineshow outcomes for rich result eligibility.【F:assets/nextevent.js†L95-L198】【F:assets/events.js†L15-L141】【F:results.html†L102-L121】
- Accessibility considerations include `aria-live` regions, skip links, labelled controls, keyboard-friendly tabs, and structured tables.【F:index.html†L123-L131】【F:results.html†L13-L92】【F:assets/js/results.js†L204-L305】
- Ensure responsive layout handled via `style.css`; print view and typography are governed globally (no alterations required for this PRD but documented here for awareness).【F:README.md†L19-L24】

## 5. Out-of-Scope Items
- Introducing server-side rendering, CMS integrations, or npm-based build pipelines (site remains static).【F:README.md†L31-L39】
- Authentication, payment processing, or gated member areas (no support in current architecture).【F:index.html†L63-L165】【F:results.html†L13-L100】
- Automated email marketing workflows beyond existing mailto link.

## 6. Dependencies & Technical Constraints
- Hosting on GitHub Pages; assets served at root-relative paths (e.g., `/assets/...`).【F:README.md†L3-L39】
- External services: Google Tag Manager (`GTM-NDSCP4Q6`), Google Analytics (`G-KT0VVGNPQT`), Google Fonts, and Facebook group URL.【F:index.html†L5-L118】
- Python 3.9+ with `pandas`, `python-dateutil`, and `openpyxl` required for data generation scripts; virtual environment recommended.【F:README.md†L103-L120】

## 7. Operational Considerations
- Document yearly process for regenerating events and wineshow feeds in README; PRD assumes teams will follow scripts before publishing.【F:README.md†L41-L101】
- Validate structured data after updates using Google Rich Results Test as part of release checklist.【F:README.md†L54-L63】
- When adding future functionality, ensure new files maintain vanilla JS approach and reuse existing analytics instrumentation patterns.

## 8. Risks & Open Questions
- **Data staleness:** Manual spreadsheet exports may lag behind real-world schedule changes; consider adding update reminders or automation.
- **Single JSON source of truth:** Any schema changes to `events.json` or results feeds require coordinated updates across scripts and front-end renderers.
- **Third-party dependencies:** Changes in Google Tag Manager/Analytics IDs or Facebook group URL should be version-controlled and communicated.

## 9. Future Enhancements (Nice-to-have)
- Add hosted form (e.g., Formspree/Mailchimp) to replace mailto workflow while keeping GTM tracking intact.【F:index.html†L92-L106】
- Publish public `.ics` subscription link directly from README for discoverability alongside automation to sync with external calendar providers.【F:index.html†L142-L165】【F:README.md†L95-L101】
- Expand results archive with downloadable CSV exports or charts once data volumes grow, ensuring accessibility and performance remain intact.【F:assets/js/results.js†L356-L444】
