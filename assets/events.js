(() => {
    const EVENTS_JSON_URL = '/assets/events.json';
    const ICS_URL = '/assets/sawc-events.ics';
    const TZ = 'Australia/Sydney';
  
    // ---------- Time helpers ----------
    const toSydneyDate = (dateish) => {
      const d = typeof dateish === 'string' ? new Date(dateish) : dateish;
      // Rebuild using Sydney TZ to avoid client local-tz skew
      return new Date(d.toLocaleString('en-AU', { timeZone: TZ }));
    };
  
    const nowSydney = () => new Date(new Date().toLocaleString('en-AU', { timeZone: TZ }));
  
    const fmtDate = (iso) =>
      new Intl.DateTimeFormat('en-AU', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: TZ })
        .format(new Date(iso));
  
    const fmtTime = (iso) =>
      new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ })
        .format(new Date(iso));
  
    // ---------- JSON-LD ----------
    const appendJsonLd = (container, data) => {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      // Avoid literal "</script>" in the payload
      s.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
      container.appendChild(s);
    };
  
    const buildEventLD = (e) => {
      const parts = [];
      if (e.description) parts.push(e.description);
      if (e.meetingActivity) parts.push(`Meeting activity: ${e.meetingActivity}`);
      if (e.miniCompetition) parts.push(`Mini competition: ${e.miniCompetition}`);
      if (e.comments) parts.push(`Notes: ${e.comments}`);
  
      return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: e.title,
        startDate: e.start,
        endDate: e.end || e.start,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: e.location || 'TBA',
          address: e.location || 'Sydney, NSW',
        },
        description: parts.join('\n\n') || '',
      };
    };
  
    // ---------- Render helpers ----------
    const el = (tag, attrs = {}, ...children) => {
      const n = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => {
        if (v == null) return;
        if (k === 'class') n.className = v;
        else if (k === 'html') n.innerHTML = v;
        else n.setAttribute(k, v);
      });
      children.flat().forEach((c) => {
        if (c == null) return;
        n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
      return n;
    };
  
    const row = (label, value) =>
      el('div', { class: 'ev-row' },
        el('span', { class: 'ev-label' }, label),
        el('span', { class: 'ev-val' }, value),
      );
  
    const renderDetails = (e) => {
      const kids = [];
      if (e.meetingActivity) kids.push(row('Meeting Activity', e.meetingActivity));
      if (e.miniCompetition) kids.push(row('Mini Competition', e.miniCompetition));
      if (e.comments) kids.push(row('Comments', e.comments));
      return kids.length ? el('div', { class: 'ev-extra' }, kids) : null;
    };
  
    const renderEvent = (e) => {
      const art = el('article', {
        class: 'event-item',
        itemscope: '',
        itemtype: 'https://schema.org/Event',
      });
  
      art.appendChild(el('h3', { itemprop: 'name' }, e.title));
  
      const when = el('p', { class: 'ev-when' },
        el('time', { itemprop: 'startDate', datetime: e.start },
          `${fmtDate(e.start)} — ${fmtTime(e.start)}`
        )
      );
      if (e.end) {
        when.appendChild(document.createTextNode(' to '));
        when.appendChild(el('time', { itemprop: 'endDate', datetime: e.end }, fmtTime(e.end)));
      }
      art.appendChild(when);
  
      if (e.location) art.appendChild(el('p', { class: 'ev-loc', itemprop: 'location' }, e.location));
      if (e.description) art.appendChild(el('p', { class: 'ev-desc', itemprop: 'description' }, e.description));
  
      const details = renderDetails(e);
      if (details) art.appendChild(details);
  
      art.appendChild(
        el('p', { class: 'ev-subscribe' },
          el('a', { href: ICS_URL, 'aria-label': `Subscribe to calendar for ${e.title}` }, 'Add to Calendar')
        )
      );
  
      appendJsonLd(art, buildEventLD(e));
      return art;
    };
  
    const groupByMonth = (events) => {
      const groups = new Map();
      for (const e of events) {
        const key = new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric', timeZone: TZ }).format(new Date(e.start));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(e);
      }
      return groups;
    };
  
    const renderUpcoming = (container, events) => {
      container.textContent = ''; // clear
      if (!events.length) {
        container.appendChild(el('p', {}, 'No upcoming events. Check back soon!'));
        return;
      }
      const groups = groupByMonth(events);
      for (const [label, list] of groups.entries()) {
        const block = el('div', { class: 'event-month' },
          el('h4', {}, label),
          list.map(renderEvent)
        );
        container.appendChild(block);
      }
    };
  
    const renderPast = (container, wrapper, events) => {
      if (!events.length) {
        if (wrapper) wrapper.style.display = 'none';
        return;
      }
      container.textContent = '';
      for (const e of events) container.appendChild(renderEvent(e));
    };
  
    // ---------- Boot ----------
    const init = async () => {
      const listEl = document.getElementById('events-list');
      const pastEl = document.getElementById('past-events');
      const pastWrap = document.getElementById('past-wrapper');
      if (!listEl) return;
  
      try {
        const res = await fetch(EVENTS_JSON_URL, { cache: 'no-store' });
        const all = await res.json();
  
        // sort ascending by start
        all.sort((a, b) => new Date(a.start) - new Date(b.start));
  
        const now = nowSydney();
        const upcoming = all.filter(e => toSydneyDate(e.end || e.start) >= now);
        const past = all.filter(e => toSydneyDate(e.end || e.start) < now).reverse();
  
        renderUpcoming(listEl, upcoming);
        if (pastEl && pastWrap) renderPast(pastEl, pastWrap, past);
      } catch (err) {
        console.error(err);
        listEl.textContent = 'Sorry, we couldn’t load events right now.';
      }
    };
  
    // If loaded with `defer`, DOM is ready; otherwise wait.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
  