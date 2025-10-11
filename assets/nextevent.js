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
  
    const buildLocation = (section, ev) => {
      const dataset = section.dataset || {};
      const fallbackName = dataset.defaultLocationName || 'TBA';
      const fallbackAddr = dataset.defaultLocationAddress || '';

      const defaultAddress = {
        street: dataset.defaultLocationStreet || '',
        locality: dataset.defaultLocationLocality || '',
        region: dataset.defaultLocationRegion || '',
        postcode: dataset.defaultLocationPostcode || '',
        country: dataset.defaultLocationCountry || ''
      };

      const rawLocation = (ev.location && ev.location.trim()) || '';
      const lower = rawLocation.toLowerCase();

      let name = fallbackName;
      if (rawLocation) {
        if (lower === 'tba' || lower === 'to be announced') {
          name = 'To be announced';
        } else if (fallbackName && rawLocation.startsWith(fallbackName)) {
          name = fallbackName;
        } else {
          name = rawLocation;
        }
      }

      const needsAddress = name === fallbackName && fallbackAddr;
      const displayAddress = needsAddress ? fallbackAddr : '';

      const structuredAddress = needsAddress ? (() => {
        const addr = { '@type': 'PostalAddress' };
        const street = defaultAddress.street || '';
        if (street) addr.streetAddress = street;
        if (defaultAddress.locality) addr.addressLocality = defaultAddress.locality;
        if (defaultAddress.region) addr.addressRegion = defaultAddress.region;
        if (defaultAddress.postcode) addr.postalCode = defaultAddress.postcode;
        addr.addressCountry = defaultAddress.country || 'AU';
        return addr;
      })() : undefined;

      return { name, displayAddress, structuredAddress };
    };

    const updateStructuredData = (section, ev) => {
      const { name, structuredAddress } = buildLocation(section, ev);
      const startISO = ev.start;
      const endISO = ev.end || new Date(effectiveEnd(ev)).toISOString();

      const meetingActivity = ev.meetingActivity && ev.meetingActivity.trim();
      const title = ev.title && ev.title.trim();
      const descriptionParts = [ev.description, ev.comments].filter(Boolean).map((s) => s.trim()).filter(Boolean);

      const eventData = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: meetingActivity || title || 'Sydney Amateur Winemakers Club Meeting',
        description: descriptionParts.join('\n') || 'Sydney Amateur Winemakers Club monthly meeting.',
        startDate: startISO,
        endDate: endISO,
        url: 'https://www.sydneyawc.com/',
        isAccessibleForFree: true,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        organizer: {
          '@type': 'Organization',
          name: 'Sydney Amateur Winemakers Club',
          url: 'https://www.sydneyawc.com/',
          email: 'mailto:sydneyawclub@gmail.com'
        },
        performer: {
          '@type': 'Organization',
          name: 'Sydney Amateur Winemakers Club'
        },
        location: {
          '@type': 'Place',
          name,
          ...(structuredAddress ? { address: structuredAddress } : {})
        },
        image: ['https://www.sydneyawc.com/og-image.png'],
        offers: [{
          '@type': 'Offer',
          url: 'https://www.sydneyawc.com/',
          price: 0,
          priceCurrency: 'AUD',
          availability: 'https://schema.org/InStock',
          validFrom: startISO
        }]
      };

      const scriptId = 'next-event-jsonld';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = scriptId;
        document.head.appendChild(script);
      }

      script.textContent = JSON.stringify(eventData, null, 2);
    };

    const removeStructuredData = () => {
      const script = document.getElementById('next-event-jsonld');
      if (script) {
        script.remove();
      }
    };

    const renderIntoSection = (section, ev) => {
      const time = fmtTime(ev.start);
      const { weekday, dayNum, month, year } = partsForDate(ev.start);
      const dateLine = `${time} ${weekday} ${ordinal(dayNum)} ${month} ${year}`;

      const { name, displayAddress } = buildLocation(section, ev);

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
        <p><strong>${esc(name)}</strong>${displayAddress ? `<br>${esc(displayAddress)}` : ''}</p>
      `;

      updateStructuredData(section, ev);
    };

    const renderNoUpcoming = (section) => {
      section.innerHTML = `
        <h2>Next Meeting</h2>
        <p><strong>No upcoming meeting scheduled</strong></p>
        <p>Please check back soon.</p>
      `;

      removeStructuredData();
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
  