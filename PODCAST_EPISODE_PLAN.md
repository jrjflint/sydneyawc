# Add a Podcast Feature for James and Dario

This plan describes where and how to add the Spotify Wine Chat with Cal episode featuring James and Dario discussing the Sydney Amateur Winemakers Club, while noting James has an upcoming appearance on The Wined Up podcast. After the change, a visitor who lands on the homepage can quickly discover the Wine Chat with Cal interview, understand why it is relevant to the club, and open it on Spotify without having to search social posts or external channels. The recommended placement is on the homepage immediately after the existing About Us section and before the Next Meeting section, because the episode is best used as social proof and an orientation story before asking a newcomer to attend a meeting or join a channel.

## Progress

- [x] Reviewed the homepage structure and identified the best insertion point between the About Us section in `index.html` lines 67-76 and the Next Meeting section in `index.html` lines 77-90.
- [x] Reviewed the existing call-to-action cards in `index.html` lines 92-121 so the podcast feature can reuse familiar card and button patterns instead of introducing a new component style.
- [x] Reviewed repository constraints in `README.md` lines 3-39 and `PRD.md` lines 18-30, confirming the site is a static GitHub Pages site whose homepage should support prospective members with concise joining and meeting information.
- [x] Checked the supplied Spotify episode URL. The page title exposed by Spotify is “Extra Curricular: Australian Amateur Winemaker's Club - Wine Chat with Cal (and Cam) | Podcast on Spotify” at `https://open.spotify.com/episode/4lLnzMdFcoFpWtWMJAC4M9?si=owF6-pMkR3SFlALz-X0rSg`.
- [x] Decided on a recommended placement and implementation pattern, recorded in the Decision Log below.
- [x] Implemented the homepage feature as a podcast feature card using the updated supplied Spotify URL and added the Wined Up coming-soon note.
- [x] Updated `style.css` with minimal spacing and label styles, and changed `CHANGELOG.md` from a planned note to an added feature note.

## Decision Log

- Decision: Add the episode as a dedicated homepage feature immediately after About Us and before Next Meeting. Rationale: the current homepage first explains who the club is, then moves directly into meeting logistics. The podcast belongs between those two moments because it gives prospective members a richer, human introduction before they consider attending.
- Decision: Prefer a lightweight text card with a prominent Spotify link over an embedded Spotify iframe for the first release. Rationale: a link card keeps the static page fast, avoids third-party embed layout and privacy concerns, and follows existing button patterns in `index.html` lines 97-118 and `.btn` styles in `style.css` lines 160-172. A future enhancement can replace or supplement the link with an iframe if the club wants inline playback.
- Decision: Use wording that names James and Dario, identifies the linked episode as Wine Chat with Cal, and separately notes James' upcoming appearance on The Wined Up podcast. Rationale: the user clarified the linked Spotify episode is Wine Chat with Cal and that The Wined Up podcast item should be presented as coming soon.
- Decision: Track the outbound link with a `data-gtm` value such as `listen-podcast-spotify`. Rationale: existing homepage calls to action already use `data-gtm` attributes for click tracking, as seen in `index.html` lines 97-118.

## Outcomes & Retrospective

This plan has now been implemented on the live homepage. A visitor can open the homepage, read the About Us copy, see a clearly labelled podcast feature before meeting logistics, and click through to the supplied Spotify episode.

## Context and Orientation

The Sydney Amateur Winemakers Club site is a static HTML, CSS, and JavaScript website hosted on GitHub Pages. The README describes the project as a static site with `index.html`, `results.html`, and `404.html` as entry points, global styles in `style.css`, and supporting assets under `assets/`; it also states that local preview can be done with `python -m http.server 8000` from the repository root. This matters because the podcast addition should be plain HTML and CSS, not a server-side feature or build-pipeline change.

The homepage currently starts with metadata and analytics, then shows the main heading, an About Us section, a Next Meeting section, a two-card call-to-action grid, an Upcoming Events section, and a footer. The About Us section in `index.html` lines 67-76 describes the club as a welcoming educational community for home winemakers. The Next Meeting section in `index.html` lines 77-90 shows Club Rivers meeting logistics, and the call-to-action grid in `index.html` lines 92-121 offers mailing-list and Facebook links. This means the cleanest podcast location is not in the footer or events list; it should sit in the main content where newcomers are learning what the club is.

The PRD says the homepage should answer the questions “What is the club?”, “When and where is the next meeting?”, and “How can I join or follow updates?” It also says the site should help prospective members and maintain accessible, responsive presentation. A podcast feature supports the first question by letting visitors hear a real conversation about the club, but it should not interrupt the meeting and joining flow.

The existing styles include a `.cta-grid` for paired cards, a `.card` border and padding style, and a `.btn` style for prominent links. Reusing these patterns will keep the page visually consistent. If a new single full-width feature is needed, add a small `.podcast-feature` wrapper in `style.css` near the CTA styles so it remains easy to find.

## Plan of Work

First, add a new semantic section in `index.html` immediately after the closing `</section>` for About Us and before the existing `<section class="meeting-info">`. Give it an `id` such as `podcast` and a class such as `podcast-feature card`. Use a heading like “James and Dario on Wine Chat with Cal”. The body copy should say that James and Dario had a Wine Chat with Cal about the Sydney Amateur Winemakers Club and what makes the amateur winemaking community welcoming, plus note that James will be on The Wined Up podcast soon. Include one button-style link to the Spotify episode URL supplied by the user.

Second, add tracking and safe external-link attributes to the Spotify anchor. Use `data-gtm="listen-podcast-spotify"`, `target="_blank"`, and `rel="noopener"`. The link text should be concise, for example “Listen on Spotify”. Add a `title` attribute that includes the Spotify episode title if desired.

Third, add minimal CSS only if the existing `.card` style is not enough. The recommended CSS is a `.podcast-feature` block near the existing CTA styles in `style.css` with `margin: 2rem 0;` and any optional accent border or background. Keep it mobile-first and avoid fixed heights. Do not add JavaScript.

Fourth, update `CHANGELOG.md` under `[Unreleased]` with a short line such as “Added a homepage podcast feature linking James and Dario's Wine Chat with Cal episode and noting James' upcoming Wined Up appearance.”

## Concrete Steps

From the repository root, open `index.html` and locate the About Us section. Insert this section after the About Us closing tag and before the Next Meeting section:

    <section id="podcast" class="podcast-feature card" aria-labelledby="podcast-heading">
      <p class="eyebrow">Podcast features</p>
      <h2 id="podcast-heading">James and Dario on Wine Chat with Cal</h2>
      <p>James and Dario had a Wine Chat with Cal about the Sydney Amateur Winemakers Club, the people behind it, and why amateur winemaking is such a rewarding shared craft.</p>
      <p>James will also be on The Wined Up podcast soon — watch this space for more details.</p>
      <p>
        <a class="btn"
           data-gtm="listen-podcast-spotify"
           href="https://open.spotify.com/episode/4lLnzMdFcoFpWtWMJAC4M9?si=owF6-pMkR3SFlALz-X0rSg"
           target="_blank" rel="noopener"
           title="Listen to James and Dario on Wine Chat with Cal on Spotify">
          Listen on Spotify
        </a>
      </p>
    </section>

Then open `style.css` and place the optional styling near the existing CTA card styles:

    .podcast-feature {
      margin: 2rem 0;
    }

If the club wants inline playback later, replace the button-only approach with Spotify's episode embed after testing the page on mobile. Use an iframe only if the club accepts the third-party embed loading directly on page view.

## Validation and Acceptance

Preview the site locally from the repository root with `python -m http.server 8000`, then open `http://localhost:8000/`. The podcast feature should appear after the About Us text and before Next Meeting. The feature should read naturally on desktop and mobile widths, link to the Wine Chat with Cal Spotify episode, note that James will be on The Wined Up podcast soon, and the Spotify button should open the supplied episode in a new tab.

Run `python -m json.tool assets/events.json` only if event data is touched; this podcast plan does not require editing JSON feeds. No build command is required because the site is static.

The change is accepted because the homepage has one discoverable podcast feature, the link uses the exact Spotify episode URL supplied by the user, no existing meeting or event rendering is broken, and `CHANGELOG.md` records the user-visible update.
