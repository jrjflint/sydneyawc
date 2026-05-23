# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
- Added a beginner winemaking guide and homepage learning links for the winemaking and mead resource pages.
- Reworked the Mead page into a practical modern mead-making overview with style guidance, fermentation health notes, safety cautions, resources, and recipe builder links.
- Finished the metric mead recipe builder with final gravity input, Brix, honey/water estimates, dynamic Go-Ferm rehydration, Fermaid AT scheduling, and shareable URL parameters.
- Matched the Wine Chat with Cal podcast heading level and size to the Wined Up Podcast heading on the homepage.
- Updated the June 4, 2026 meeting activity to Making mead across the event feed and calendar export.
- Added a homepage podcast feature linking James and Dario's Wine Chat with Cal episode and noting James' upcoming Wined Up appearance.
- Updated the homepage podcast feature with James Follent's Wined Up Podcast links for YouTube, Spotify, and Apple Podcasts while retaining the Wine Chat with Cal feature.
- Added a production-ready SAWC_V1 primary horizontal logo suite with live-text and outlined SVG variants in black, burgundy, and white.
- Regenerated the events calendar feed so 2026 meetings appear in the published ICS download.
- Updated the February 5 mini-competition listing to a blended red wine category across the JSON and calendar exports.

## 2025-10-19
- Launched dedicated mead hub and prototype metric recipe builder pages to anchor the calculator rollout.
- Verified and documented the builder's gravity, honey, and residual sugar formulas against club benchmark assumptions.
- Automated Fermaid AT planning alongside yeast, Go-Ferm, and rehydration water dosing guidance based on club standards.

## 2025-09-27
- Established the static site foundation, styling, and deployment configuration.
- Added open graph imagery and favicon assets.
- Configured the project’s custom domain and initial content.

## 2025-09-28
- Reworked the homepage to load events dynamically, including “next event” callouts.
- Added supporting assets for event data and progressive enhancements.
- Expanded calendar functionality across multiple revisions.

## 2025-09-29
- Iterated on event calendars and locations, keeping the schedule data accurate.
- Introduced and refined a custom 404 page experience.
- Updated click-tracking instrumentation and Google Tag Manager wiring.

## 2025-10-11
- Fixed sitemap and robots.txt canonical URLs for the deployed site.
- Added Next Event JSON-LD structured data and documented how to validate it. (#1)
- Updated documentation to help contributors onboard Codex assistants effectively.
- Corrected the generated calendar feed so ICS times match the JSON schedule. (#1)

## 2025-10-16
- Updated the iCalendar export to include explicit Sydney daylight saving transitions. (#10)
- Refined the AI contributor guidance, aligning repository and planning documentation. (#9)
- Introduced execution planning guidelines for complex changes. (#8)
- Simplified the wineshow results experience and prepared for winemaker-specific filters. (#7)
- Added a repository-wide agent guide with coding conventions. (#6)
- Refreshed competition results data and consolidated wineshow styling into the global stylesheet. (#3, b32fa06)

## 2025-10-17
- Enhanced the wineshow results metadata for better SEO previews and social sharing. (#13)
- Documented the refreshed event feed outputs and data pipeline expectations in the README. (#12)
- Added support for filtering wineshow results by winemaker via the query string. (#11)
