# sydneyawc

A community of home winemaking enthusiasts in Sydney. This repo hosts the official Sydney Amateur Winemakers Club website — a static one-page site built with HTML/CSS and hosted on GitHub Pages.

## Table of contents
- [Project layout](#project-layout)
- [Local preview](#local-preview)
- [Event data pipeline](#event-data-pipeline)
  - [1. Prepare the spreadsheet export](#1-prepare-the-spreadsheet-export)
  - [2. Regenerate events.json](#2-regenerate-eventsjson)
  - [3. Publish a refreshed calendar feed](#3-publish-a-refreshed-calendar-feed)
- [Python environment setup](#python-environment-setup)
- [Working effectively with Codex or other AI assistants](#working-effectively-with-codex-or-other-ai-assistants)

## Project layout

- `index.html` – main landing page that loads the club overview, meeting details, competition info, and embeds structured event data.
- `style.css` – global stylesheet with responsive layouts, print styles, and typography rules.
- `404.html` – custom not-found page that keeps visitors engaged and links back to the home page.
- `assets/`
  - `events.js` and `nextevent.js` fetch data from JSON/ICS feeds and render the upcoming meeting schedule.
  - `events.json` and `calendar.ics` are the data feeds consumed by the front-end.
  - `generate_events_from_clean.py` converts a cleaned spreadsheet export into `events.json` (and optionally `calendar.ics`).
  - `generate_ics.py` and `generate_ics_refactored.py` rebuild an iCalendar feed from `events.json`.

## Local preview

The site uses plain HTML/CSS/JS — no bundler or build step is required. You can preview everything with any static file server.

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/index.html> in a browser.

## Event data pipeline

Keeping the website up to date requires two artefacts under `assets/`: `events.json` (used for the event listings) and an iCalendar file (`calendar.ics` or `sawc-events.ics`). The Python helper scripts make it repeatable to rebuild both from the club's planning spreadsheet.

### 1. Prepare the spreadsheet export

1. Export the _cleaned_ activities spreadsheet as either CSV or XLSX. Ensure it includes columns for **Date**, **Start**, **End**, **Meeting Activity**, **Mini Competition**, **Comments**, **Location**, and **Description** (case insensitive — the script recognises common aliases).
2. Fill in missing start/end times when possible. If a time is blank the script defaults to 7:30 PM–9:30 PM Australia/Sydney.
3. Save the export alongside the repository root (e.g. `SAWC 2025 Activities Calendar_Clean.csv`).

### 2. Regenerate `events.json`

Run the conversion script, pointing it at the spreadsheet export and desired output paths. From the repo root:

```bash
python assets/generate_events_from_clean.py "SAWC 2025 Activities Calendar_Clean.csv" \
  --json assets/events.json --ics assets/calendar.ics --id-mode uuid
```

Key flags:

- `--json` (**required**) – where to write the JSON feed.
- `--ics` (optional) – additionally emit an iCalendar feed alongside the JSON.
- `--id-mode` – `uuid` (default) for random IDs, or `deterministic` to derive IDs from the date/title.
- `--tz` – override the default `Australia/Sydney` timezone if the club ever changes locale.

The script validates required columns, normalises times, and prints a summary count when finished.

### 3. Publish a refreshed calendar feed

If you want a calendar feed that mirrors exactly what the site uses, regenerate it from the JSON so both artefacts stay in sync:

```bash
python assets/generate_ics.py --in assets/events.json --out assets/sawc-events.ics
```

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