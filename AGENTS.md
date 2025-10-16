# Agent Guide for the Sydney Amateur Winemakers Club Repo

## Purpose
This document orients AI contributors working in this repository. It supplements the human-facing README with quick references to
project conventions, safety checks, and workflow expectations.

## Repository overview
- **Site type:** Static HTML/CSS/JS site published on GitHub Pages for the Sydney Amateur Winemakers Club.
- **Entrypoints:** `index.html` (homepage), `results.html` (annual show results), `404.html` (custom error page).
- **Assets:** Supporting JavaScript lives under `assets/` (e.g., event rendering logic in `events.js`/`nextevent.js`, results code in
  `js/results.js`). Structured data feeds (`events.json`, `results.json`, etc.) also sit under `assets/`.
- **Python helpers:** `assets/generate_events_from_clean.py` and related scripts rebuild JSON/ICS feeds from spreadsheet exports.
- **Styling:** All global styles are in `style.css`; there is no build pipeline or CSS preprocessor.

### Documentation map
- **High-level orientation:** [`README.md`](./README.md) explains local preview steps, data pipelines, and helper scripts. Treat it as the
  canonical reference for how assets are generated and how Codex should be briefed when collaborating with humans.
- **Product intent:** [`PRD.md`](./PRD.md) captures audience goals, acceptance criteria, and success metrics. Use it to evaluate whether
  feature changes align with the club’s needs before editing files.
- **Execution planning:** [`PLANS.md`](./PLANS.md) defines the ExecPlan format required for multi-step or high-risk changes. Any plan you
  create must satisfy the constraints in that document in addition to the guidance here.

## Coding guidelines
Follow these principles when modifying files:
1. **Prefer semantic HTML.** Preserve accessible markup (ARIA attributes, heading hierarchy, descriptive alt text) present in
   existing documents. Keep content changes minimal unless the task demands a rewrite.
2. **Respect inline comments and structure.** Many files include explanatory comments; read them before editing to avoid breaking
   data contracts or rendering logic. When in doubt, consult the relevant section in `README.md` or `PRD.md` to confirm the intended
   behaviour before changing markup or data formats.
3. **No bundlers or transpilers.** Keep JavaScript in ES6-compatible syntax that runs natively in modern browsers. Avoid introducing
   dependencies that require a build step.
4. **CSS practices.** Use existing class naming patterns (dash-separated, utility-style). Maintain mobile-first responsive behaviour
   and print styles when touching layout rules.
5. **Python scripts.** Target Python 3.9+. Keep scripts idempotent, command-line friendly, and free of side effects beyond their
   outputs. Validate inputs and prefer standard library modules unless a dependency already exists in `requirements.txt`.
6. **Data files.** When updating JSON feeds, ensure they remain valid UTF-8 with trailing newline and formatted consistently with the
  current style (compact but readable, two-space indentation when appropriate). Mirror the schemas described in `README.md` and `PRD.md`
  so the front-end code continues to parse them safely.

## Working with ExecPlans
- If a task requires more than a trivial change, draft or update an ExecPlan under the scope dictated by [`PLANS.md`](./PLANS.md). Keep the
  plan checked in alongside the code changes and update the living sections (`Progress`, `Decision Log`, etc.) as work advances.
- ExecPlans must explicitly reference the behavioural expectations from `PRD.md` and any implementation steps from `README.md` so that a
  new contributor can trace requirements back to source material.
- When finishing an ExecPlan, summarise the validation steps taken (tests, manual verification) and confirm the instructions remain
  accurate for future agents.

## Testing & validation
Before committing changes, run the relevant manual or automated checks:
- **Static preview:** `python -m http.server 8000` from the repo root to spot visual regressions in a browser.
- **HTML validation:** Use browser devtools or <https://validator.w3.org/> if markup is altered significantly.
- **JSON feeds:** Validate with `python -m json.tool path/to/file.json` when editing structured data.
- **Python scripts:** Execute `python assets/generate_events_from_clean.py --help` after modifications to confirm they still run and
  display usage information without errors. Add unit tests only if the repo gains a testing harness in the future.

## Workflow expectations
- Keep commits focused and descriptive. Reference affected files in commit messages where possible.
- Update documentation (README, PRD, comments) when behaviour or data contracts change.
- Maintain compatibility with GitHub Pages hosting (no server-side logic, keep assets relative).
- If you touch files in new directories, create additional `AGENTS.md` files with directory-specific rules as needed.

## Resources
- Primary documentation: [`README.md`](./README.md) for data pipeline and local development details.
- Requirements: [`requirements.txt`](./requirements.txt) enumerates Python dependencies used by helper scripts.
- Project vision: [`PRD.md`](./PRD.md) outlines the product goals and target audience.

When in doubt, inspect existing patterns and mirror them. Ask for clarification if the requested task conflicts with these
conventions.
