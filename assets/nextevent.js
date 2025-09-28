(() => {
    const EVENTS_JSON_URL = '/assets/events.json';
    const TZ = 'Australia/Sydney';
  
    // --- formatting helpers (Sydney-aware for display only) ---
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
      const weekday = new Intl.DateTimeFormat('en-AU', { weekday: 'long', timeZone: TZ }).format(d);   // Thursday
      const dayNum  = Number(new Intl.DateTimeFormat('en-AU', { day: 'numeric', timeZone: TZ }).format(d)); // 2
      const month   = new Intl.DateTimeFormat('en-AU', { month: 'long', timeZone: TZ }).format(d);     // October
      const year    = new Intl.DateTimeFormat('en-AU', { year: 'numeric', timeZone: TZ }).format(d);    // 2025
      return { weekday, dayNum, month, year };
    };
  
    // --- logic helpers ---
    // If no explicit end, consider the event active until 23:59:59 of its start day
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
  
    // --- renderer ---
    const renderIntoSection = (section, ev) => {
      const title = ev.title || 'Next Meeting';
      const time = fmtTime(ev.start);
      const { weekday, dayNum, month, year } = partsForDate(ev.start);
      const dateLine = `${time} ${weekday} ${ordinal(dayNum)} ${month} ${year}`;
  
      // Location: prefer event.location; fall back to data attributes on the section; else keep a default “TBA”
      const fallbackName = section.dataset.defaultLocationName || 'TBA';
      const fallbackAddr = section.dataset.defaultLocationAddress || '';
      const locName = (ev.location && ev.location.trim()) || fallbackName;
      const locAddr = (ev.location && ev.location.trim() && fallbackAddr) ? '' : (fallbackAddr || '');
  
      // Build new HTML (keeps your structure, just updates content)
      section.innerHTML = `
        <h2>Next Meeting</h2>
        <p><strong>${dateLine}</strong></p>
        ${ev.meetingActivity ? `<p>${ev.meetingActivity}</p>` : `<p></p>`}
        <p><strong>${locName}</strong>${locAddr ? `<br>${locAddr}` : ''}</p>
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
  