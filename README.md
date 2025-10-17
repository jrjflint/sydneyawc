# sydneyawc

A community of home winemaking enthusiasts in Sydney. This repo hosts the official Sydney Amateur Winemakers Club website — a static one-page site built with HTML/CSS and hosted on GitHub Pages.

## Table of contents
- [Project layout](#project-layout)
- [Changelog](#changelog)
- [Local preview](#local-preview)
- [Wineshow results data](#wineshow-results-data)
- [Event data pipeline](#event-data-pipeline)
  - [1. Prepare the spreadsheet export](#1-prepare-the-spreadsheet-export)
  - [2. Regenerate events.json](#2-regenerate-eventsjson)
  - [3. Publish a refreshed calendar feed](#3-publish-a-refreshed-calendar-feed)
- [Testing the Next Meeting structured data](#testing-the-next-meeting-structured-data)
- [Python environment setup](#python-environment-setup)
- [Working effectively with Codex or other AI assistants](#working-effectively-with-codex-or-other-ai-assistants)

## Project layout

- `index.html` – main landing page that loads the club overview, meeting details, competition info, and embeds structured event data.
- `style.css` – global stylesheet with responsive layouts, print styles, the wineshow results page components, and typography rules.
- `404.html` – custom not-found page that keeps visitors engaged and links back to the home page.
- `results.html` – dynamic results page for the annual wineshow, powered by vanilla JS and JSON feeds.
- `assets/`
  - `events.json` – canonical event data consumed by the homepage listings and JSON-LD helpers.
  - `sawc-events.ics` – the published iCalendar feed generated from the same event data (linked from the homepage and sitemap).
  - `events.js` and `nextevent.js` fetch the feeds above and render the upcoming meeting schedule plus structured data.
  - `js/results.js` powers the wineshow results experience (filters, leaderboards, JSON-LD updates).
  - `data/results.json` contains the structured competition results keyed by show year.
  - `generate_events_from_clean.py` converts a cleaned spreadsheet export into `events.json` (and can optionally emit an `.ics` file).
  - `generate_ics.py` and `generate_ics_refactored.py` rebuild an iCalendar feed from `events.json`.

## Changelog

Review [`CHANGELOG.md`](./CHANGELOG.md) before starting work to understand recent updates. When you finish a feature or fix that impacts users, append a dated bullet summarising the change so the history stays current.

## Local preview

The site uses plain HTML/CSS/JS — no bundler or build step is required. You can preview everything with any static file server.

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/index.html> in a browser.

## Wineshow results data

The annual wineshow results live at [`results.html`](./results.html). The page loads a JSON feed from `assets/data/` and renders everything client-side with progressive enhancement-friendly HTML. To publish a new year:

1. Export the latest judging spreadsheet and regenerate `results.json` (one top-level object per show year) following the documented schema with `show`, `classes`, `entrants`, `entries`, and `awards` sections.
2. Replace `assets/data/results.json` with the refreshed export and commit it.
3. Update any year-specific copy (e.g. start/end dates in the JSON-LD payload) if the event schedule has changed.
4. Preview <http://localhost:8000/results.html?year=YYYY> locally to confirm the filters, leaderboards, and print view look correct.

The script automatically detects the newest year in `results.json`, updates the `?year=` URL query string, and gracefully handles missing leaderboard sections.

> **Note:** The ordinal show numbering assumes the first competition was held in 1975. Update `baseYear` in `assets/js/results.js` if the historical reference changes.

## Testing the Next Meeting structured data

The Next Meeting section injects a JSON-LD `<script>` with the upcoming event metadata once `assets/nextevent.js` loads `events.json`.

1. **Start a local server** – run `python -m http.server 8000` (or any static server) from the repo root.
2. **Load the homepage** – visit <http://localhost:8000/index.html> and confirm the “Next Meeting” details render with real event data rather than the loading placeholder.
3. **Verify JSON-LD is present** – open your browser developer tools, inspect the `<head>`, and ensure there is a `<script id="next-event-jsonld" type="application/ld+json">` element containing the event payload.
4. **Validate with Google’s Rich Results Test** – navigate to <https://search.google.com/test/rich-results>, choose **URL** (for the deployed site) or **Code** (paste the HTML after copying it via “View Source”), and confirm the Event structured data appears without warnings for the previously missing fields (organizer, offers, image, performer, address).

If no upcoming meeting exists in `events.json`, the script removes the JSON-LD node. To test that branch, temporarily delete future events from `assets/events.json`, refresh the page, and confirm the structured data snippet disappears.

## Event data pipeline

Keeping the website up to date requires two artefacts under `assets/`: `events.json` (used for the event listings) and an iCalendar file (`sawc-events.ics`). The Python helper scripts make it repeatable to rebuild both from the club's planning spreadsheet.

### 1. Prepare the spreadsheet export

1. Export the _cleaned_ activities spreadsheet as either CSV or XLSX. Ensure it includes columns for **Date**, **Start**, **End**, **Meeting Activity**, **Mini Competition**, **Comments**, **Location**, and **Description** (case insensitive — the script recognises common aliases).
2. Fill in missing start/end times when possible. If a time is blank the script defaults to 7:30 PM–9:30 PM Australia/Sydney.
3. Save the export alongside the repository root (e.g. `SAWC 2025 Activities Calendar_Clean.csv`).

### 2. Regenerate `events.json`

Run the conversion script, pointing it at the spreadsheet export and desired output paths. From the repo root:

```bash
python assets/generate_events_from_clean.py "SAWC 2025 Activities Calendar_Clean.csv" \
  --json assets/events.json --ics assets/sawc-events.ics --id-mode uuid
```

Key flags:

- `--json` (**required**) – where to write the JSON feed.
- `--ics` (optional) – additionally emit an iCalendar feed alongside the JSON.
- `--id-mode` – `uuid` (default) for random IDs, or `deterministic` to derive IDs from the date/title.
- `--tz` – override the default `Australia/Sydney` timezone if the club ever changes locale.

The script validates required columns, normalises times, and prints a summary count when finished.

### 3. Publish a refreshed calendar feed

If you want a calendar feed that mirrors exactly what the site uses, regenerate it from the JSON so both artefacts stay in sync (useful when the events script ran without `--ics` or you want to refresh metadata without touching the spreadsheet):

```bash
python assets/generate_ics.py --in assets/events.json --out assets/sawc-events.ics
```

Both `generate_ics.py` variants default to writing `./assets/sawc-events.ics`, keeping the download link, sitemap entry, and JavaScript references in sync with the JSON feed.

This produces an RFC5545-compliant `.ics` file with folded lines, escaped text, and the correct timezone annotations for import into Google Calendar, Outlook, etc.

## Python environment setup

The helper scripts require Python 3.9+ along with `pandas`, `python-dateutil`, and `openpyxl` (for `.xlsx` input). We recommend a virtual environment so the dependencies stay isolated:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If you do not have `requirements.txt` synced locally yet, the essential packages are:

```bash
pip install pandas python-dateutil openpyxl
```

> **Tip:** When working on macOS with Apple Silicon, ensure you install the arm64 wheels (`pip install --only-binary=:all: pandas openpyxl`) if you encounter compilation errors.

## Working effectively with Codex or other AI assistants

AI models deliver better results when they understand the full context of a change request. Before prompting, share:

1. **The site architecture** – call out that this is a static HTML/CSS/JS GitHub Pages site with Python utilities, so the assistant does not assume React, build tooling, or server-side code.
2. **Relevant files** – paste or attach snippets from `index.html`, `style.css`, and any Python script or JSON file involved in the change.
3. **Data samples** – include representative rows from the spreadsheet export or an excerpt of `assets/events.json` if the task touches the event pipeline.
4. **Constraints and outputs** – remind the model that changes must work without npm tooling and that generated assets (`events.json`, `*.ics`) should be committed.
5. **Verification steps** – outline how you will preview or test (e.g. “run `python -m http.server` and refresh the page” or “re-run `generate_events_from_clean.py`”).
6. **Follow-up context** – when iterating, restate prior attempts and remaining gaps so the assistant can adjust instead of repeating earlier mistakes.

Providing the checklist above up front makes it much easier for Codex (or similar assistants) to offer accurate, repo-aware suggestions.