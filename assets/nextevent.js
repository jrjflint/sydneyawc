(() => {
    const EVENTS_JSON_URL = '/assets/events.json';
    const TZ = 'Australia/Sydney';
  
    // --- formatting helpers (Sydney-aware for display) ---
    const fmtTime = (iso) =>
      new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ })
        .format(new Date(iso))
        .replace('am', 'AM')
        .replace('pm', 'PM');
  
    const ordinal = (n) => {
      const s = ['th','st','nd','rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
  
    const partsForDate = (iso) => {
      const d = new Date(iso);
      const weekday = new Intl.DateTimeFormat('en-AU', { weekday: 'long', timeZone: TZ }).format(d);
      const dayNum  = Number(new Intl.DateTimeFormat('en-AU', { day: 'numeric', timeZone: TZ }).format(d));
      const month   = new Intl.DateTimeFormat('en-AU', { month: 'long', timeZone: TZ }).format(d);
      const year    = new Intl.DateTimeFormat('en-AU', { year: 'numeric', timeZone: TZ }).format(d);
      return { weekday, dayNum, month, year };
    };
  
    // --- logic helpers ---
    const effectiveEnd = (e) => {
      if (e.end) return new Date(e.end);
      const start = new Date(e.start);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return end;
    };
  
    const findNextEvent = (events) => {
      const now = new Date();
      const upcoming = events
        .filter((e) => effectiveEnd(e) >= now)
        .sort((a, b) => new Date(a.start) - new Date(b.start));
      return upcoming[0] || null;
    };
  
    // --- rendering helpers ---
    const esc = (s) => String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
    const row = (label, value) =>
      `<div class="ev-row"><span class="ev-label">${esc(label)}</span><span class="ev-val">${value}</span></div>`;
  
    const renderIntoSection = (section, ev) => {
      const time = fmtTime(ev.start);
      const { weekday, dayNum, month, year } = partsForDate(ev.start);
      const dateLine = `${time} ${weekday} ${ordinal(dayNum)} ${month} ${year}`;
  
      const fallbackName = section.dataset.defaultLocationName || 'TBA';
      const fallbackAddr = section.dataset.defaultLocationAddress || '';
      const locName = (ev.location && ev.location.trim()) || fallbackName;
      const locAddr = (ev.location && ev.location.trim() && fallbackAddr) ? '' : (fallbackAddr || '');
  
      const details = [];
      if (ev.meetingActivity) {
        details.push(row('Meeting Activity', esc(ev.meetingActivity)));
      }
      if (ev.miniCompetition) {
        details.push(row('Mini Competition', esc(ev.miniCompetition)));
      }
      if (ev.comments) {
        const commentsHTML = esc(ev.comments).replace(/\n/g, '<br>');
        details.push(row('Comments', commentsHTML));
      }
      const detailsBlock = details.length ? `<div class="ev-extra">${details.join('')}</div>` : '';
  
      section.innerHTML = `
        <h2>Next Meeting</h2>
        <p><strong>${esc(dateLine)}</strong></p>
        ${detailsBlock}
        <p><strong>${esc(locName)}</strong>${locAddr ? `<br>${esc(locAddr)}` : ''}</p>
      `;
    };
  
    const renderNoUpcoming = (section) => {
      section.innerHTML = `
        <h2>Next Meeting</h2>
        <p><strong>No upcoming meeting scheduled</strong></p>
        <p>Please check back soon.</p>
      `;
    };
  
    // --- boot ---
    const init = async () => {
      const section = document.querySelector('section.meeting-info');
      if (!section) return;
  
      try {
        const res = await fetch(EVENTS_JSON_URL, { cache: 'no-store' });
        const data = await res.json();
        const next = findNextEvent(data || []);
        if (next) renderIntoSection(section, next);
        else renderNoUpcoming(section);
      } catch (err) {
        console.error('next event load error', err);
        renderNoUpcoming(section);
      }
    };
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
  