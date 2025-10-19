# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
- Added dedicated mead landing and prototype recipe builder pages to support the upcoming metric calculator work.
- Refined the mead recipe builder layout for mobile responsiveness and clearer data entry cards.
- Scoped mead builder styling into a dedicated stylesheet to reduce merge conflicts with site-wide rules.

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
