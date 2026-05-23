# Refresh the Mead Overview Page

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. It follows the requirements in `PLANS.md`.

## Purpose / Big Picture

The existing `mead.html` page is a short development hub for the metric calculator. After this change, visitors can use `/mead.html` as a practical introduction to modern mead making and then move to `/mead-recipe-builder.html` when they want to plan a batch. This supports the README's static-site model and the PRD's requirement that the website provide practical, accessible educational content for members and prospects.

## Progress

- [x] (2026-05-23 20:58+10:00) Inspected `mead.html`, `mead-recipe-builder.html`, `style.css`, `README.md`, `PRD.md`, and `CHANGELOG.md`.
- [x] (2026-05-23 21:07+10:00) Replaced the Mead page body copy with an educational overview while preserving the page shell, GTM snippets, metadata pattern, and builder link.
- [x] (2026-05-23 21:07+10:00) Added small Mead-page CSS rules for intro actions, note boxes, responsive tables, resource lists, and section spacing.
- [x] (2026-05-23 21:07+10:00) Updated `CHANGELOG.md` with the user-visible Mead overview refresh.
- [x] (2026-05-23 21:15+10:00) Updated the `README.md` project layout description so it matches the new Mead page role.
- [x] (2026-05-23 21:13+10:00) Validated local files with targeted searches, existing builder calculation tests, and a local HTTP preview returning `200`.

## Surprises & Discoveries

- Observation: The current Mead page has no embedded calculators, scripts, or forms; all interactive calculator logic lives on `mead-recipe-builder.html` and `assets/js/mead-recipe-builder.js`.
  Evidence: `mead.html` contains static sections and a single builder CTA; `mead-recipe-builder.html` loads `assets/js/mead-recipe-builder.js`.

## Decision Log

- Decision: Keep `mead.html` as the educational overview and leave calculator-specific assumptions on `mead-recipe-builder.html`.
  Rationale: The user explicitly asked for `/mead` to explain concepts while `/mead-recipe-builder.html` remains the planning tool.
  Date/Author: 2026-05-23 / Codex

- Decision: Use compact external resource links instead of formal footnotes.
  Rationale: The current site does not have a citation component, and the user allowed clean external links in a resources section when citations are not part of the existing design.
  Date/Author: 2026-05-23 / Codex

- Decision: Add HTML TODO comments for technical claims that should be verified before turning them into exact calculator recommendations.
  Rationale: The user asked that claims needing source verification be flagged with comments, especially around nutrients, style bands, stabilisation, and legal notes.
  Date/Author: 2026-05-23 / Codex

## Outcomes & Retrospective

The Mead page now acts as a clear educational hub for Australian amateur winemakers. It explains what mead is, how modern process control applies, how honey must differs from grape must, how to think about ingredients and balance, and why stabilisation matters before bottling sweet mead. It keeps the recipe builder as the linked planning tool and avoids adding unsourced dosage schedules. Validation passed for the existing builder calculation test and the local `http://localhost:8000/mead.html` preview returned HTTP `200`.

## Context and Orientation

This repository is a static GitHub Pages site with no build step. `README.md` identifies `mead.html` as the mead resource hub, `mead-recipe-builder.html` as the metric calculator, and `style.css` as the shared stylesheet. `PRD.md` describes the site's broader goals: practical member education, accessible UX, static HTML/CSS/JS, and preserved analytics. The existing Mead pages use a `body.mead-page` / `body.mead-builder-page` scoped styling pattern in `style.css`, so the page update should stay inside that design system.

## Plan of Work

Edit `mead.html` to replace the development-roadmap copy with a structured educational overview. Preserve the canonical URL, Google Tag Manager snippets, font and stylesheet links, skip link, page header shell, main container, footer, and builder links. Improve the title and meta descriptions to match the new overview purpose.

Edit `style.css` only within the Mead page area to add responsive support for the new content patterns: call-to-action actions, note boxes, table wrappers, resource lists, and section spacing. Avoid introducing a framework or changing unrelated page styles.

Edit `CHANGELOG.md` under `[Unreleased]` to note the user-visible Mead overview refresh.

Edit the `README.md` project layout entry for `mead.html` because the page is no longer a development-update hub.

## Concrete Steps

From the repository root `c:\Users\james\OneDrive\Github\sydneyawc`, inspect files with:

    rg -n "mead|mead-recipe|Mead" .

Then edit `mead.html`, `style.css`, and `CHANGELOG.md` using file-scoped patches. Run validation commands:

    node assets/js/mead-recipe-builder-calculations.test.mjs
    rg -n "mead-recipe-builder.html|TODO: verify|Stabilisation|Common mead styles" mead.html

Start a local static server:

    python -m http.server 8000

Then open `http://localhost:8000/mead.html` and confirm the page renders, the table is readable, and the builder CTA points to `mead-recipe-builder.html`.

## Validation and Acceptance

Acceptance is met when `mead.html` renders as a modern educational Mead overview, contains a prominent link to `mead-recipe-builder.html`, includes all required sections from the user request in semantic headings, and does not load any new framework or image assets. The page remains responsive because it uses the existing Mead page layout and scoped CSS. The existing builder calculation test should still pass because the builder files are not changed.

## Idempotence and Recovery

The edits are static content and CSS changes. Re-running the validation commands is safe. If a local preview server is already running on port 8000, use a different port such as 8001 and open the matching URL.

## Artifacts and Notes

Current relevant files:

- `mead.html`: educational overview page being updated.
- `mead-recipe-builder.html`: calculator page that remains the practical planning tool.
- `style.css`: shared styling with Mead-scoped rules near the "Mead recipe builder" comment.
- `CHANGELOG.md`: project history for user-visible updates.

## Interfaces and Dependencies

No new dependencies, scripts, forms, or APIs are introduced. The page remains static HTML and CSS. Existing external links in the resources section are ordinary anchors and do not require JavaScript.
