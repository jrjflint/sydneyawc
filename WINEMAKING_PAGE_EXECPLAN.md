# Add Beginner Winemaking Guide

This ExecPlan is a living document. It follows the requirements in `PLANS.md`.

## Purpose / Big Picture

The site already has a modern mead education page, but beginners interested in grape and fruit winemaking do not have an equivalent starting point. This change adds `winemaking.html` as a practical beginner guide and links it from the homepage alongside the Mead page so visitors can choose the learning path that fits their interest.

## Progress

- [x] (2026-05-23 21:35+10:00) Inspected `index.html`, `mead.html`, `style.css`, `README.md`, `CHANGELOG.md`, and `sitemap.xml`.
- [x] (2026-05-23 21:42+10:00) Added `winemaking.html` with the existing static page shell, metadata, GTM snippets, shared CSS, beginner content, and safety notes.
- [x] (2026-05-23 21:42+10:00) Added homepage learning cards linking to `/winemaking.html` and `/mead.html`.
- [x] (2026-05-23 21:42+10:00) Updated `sitemap.xml`, `README.md`, and `CHANGELOG.md`.
- [x] (2026-05-23 21:47+10:00) Validated static links, ran `git diff --check`, and confirmed local `index.html` and `winemaking.html` return HTTP 200.

## Surprises & Discoveries

- Observation: The homepage does not have a site-wide navigation menu, so learning links fit best as a small `cta-grid` section after the About section.
  Evidence: `index.html` moves directly from About to podcast, meeting, CTA cards, events, and footer.

## Decision Log

- Decision: Use `winemaking.html` as the page path and canonical URL.
  Rationale: It matches the existing static file pattern used by `mead.html` and is clear for beginner search intent.
  Date/Author: 2026-05-23 / Codex

- Decision: Reuse `body class="mead-page"` for the guide page.
  Rationale: The plan explicitly allowed this, and the Mead page styling is already a general education-page shell with responsive cards and tables.
  Date/Author: 2026-05-23 / Codex

- Decision: Add source-verification TODO comments for procedural safety and legal wording instead of publishing chemical dose rates.
  Rationale: The user asked for cautious beginner content and no exact unverified dosage guidance.
  Date/Author: 2026-05-23 / Codex

## Outcomes & Retrospective

The implementation adds a full beginner winemaking guide, exposes both winemaking and mead education pages from the homepage, and updates supporting documentation and sitemap entries. Static link checks passed, `git diff --check` reported only normal line-ending warnings, and both `index.html` and `winemaking.html` returned HTTP 200 in local preview.

## Context and Orientation

The repository is a static GitHub Pages site. `index.html` is the homepage, `mead.html` is the existing educational Mead guide, `style.css` contains shared and Mead-scoped styles, `sitemap.xml` lists published URLs, `README.md` describes project layout, and `CHANGELOG.md` records user-visible changes.

## Plan of Work

Create `winemaking.html` with the same page shell as `mead.html`, but content aimed at beginners learning winemaking. Add a learning CTA section to the homepage after About Us. Update sitemap, README, and changelog. Keep the change static and dependency-free.

## Concrete Steps

Run these commands from `c:\Users\james\OneDrive\Github\sydneyawc`:

    rg -n "winemaking.html|mead.html|learn-winemaking|learn-mead" index.html winemaking.html sitemap.xml
    git diff --check
    python -m http.server 8000

Then open or request:

    http://localhost:8000/winemaking.html
    http://localhost:8000/index.html

## Validation and Acceptance

The change is accepted when `winemaking.html` and `index.html` return HTTP 200 locally, the homepage contains working buttons to `/winemaking.html` and `/mead.html`, the guide uses responsive existing styles, and `git diff --check` reports no whitespace errors beyond normal line-ending warnings.

## Idempotence and Recovery

The change is static HTML and documentation. Re-running validation is safe. If port 8000 is busy, use another local HTTP server port and check the matching URLs.

## Artifacts and Notes

No new frameworks, scripts, forms, or images are introduced.

## Interfaces and Dependencies

The public interface is the new URL `/winemaking.html` and two homepage CTA links. Existing analytics use `data-gtm` attributes on the new links: `learn-winemaking` and `learn-mead`.
