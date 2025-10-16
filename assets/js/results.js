(function () {
  const DATA_BASE_PATH = '/assets/data';
  const RESULTS_DATA_URL = `${DATA_BASE_PATH}/results.json`;
  const STATE = {
    resultsByYear: {},
    year: null,
    classNo: '',
    search: '',
    activeLeaderboard: 'averageScore'
  };

  const refs = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheDom();
    attachEventListeners();
    try {
      const resultsData = await fetchJson(RESULTS_DATA_URL);
      STATE.resultsByYear = buildYearCache(resultsData || {});
      initYearSelect();
      initLeaderboardTabs();
    } catch (error) {
      console.error('Unable to load results data', error);
      renderErrorState();
    }
  }

  function cacheDom() {
    refs.yearSelect = document.getElementById('yearSelect');
    refs.classSelect = document.getElementById('classSelect');
    refs.searchBox = document.getElementById('searchBox');
    refs.champions = document.getElementById('champions');
    refs.bestInClass = document.getElementById('bestInClass');
    refs.entriesTableBody = document.querySelector('#entriesTable tbody');
    refs.entriesSummary = document.getElementById('entriesSummary');
    refs.subtitleYear = document.querySelector('[data-year-label]');
    refs.subtitleShowNumber = document.querySelector('[data-show-number]');
    refs.leaderboardPanels = document.getElementById('leaderboardPanels');
    refs.leaderboardTabs = document.getElementById('leaderboardTabs');
    refs.jsonLd = document.getElementById('resultsJsonLd');
  }

  function attachEventListeners() {
    refs.yearSelect?.addEventListener('change', onYearChange);
    refs.classSelect?.addEventListener('change', (event) => {
      STATE.classNo = event.target.value;
      renderEntries();
      pushDataLayer('filter_change', { classNo: STATE.classNo || null });
    });
    refs.searchBox?.addEventListener('input', onSearchInput);
    refs.leaderboardTabs?.addEventListener('click', onLeaderboardTabClick);
    refs.leaderboardTabs?.addEventListener('keydown', onLeaderboardTabKeydown);
  }

  function onSearchInput(event) {
    STATE.search = event.target.value.trim();
    renderEntries();
    pushDataLayer('search', { query: STATE.search || null });
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response.json();
  }

  function initYearSelect() {
    const years = Object.keys(STATE.resultsByYear)
      .map((year) => parseInt(year, 10))
      .filter((value) => !Number.isNaN(value))
      .sort((a, b) => b - a);

    if (!years.length) {
      renderErrorState('No years available in the results dataset.');
      return;
    }

    const urlYear = parseInt(new URLSearchParams(window.location.search).get('year'), 10);
    const defaultYear = years.includes(urlYear) ? urlYear : years[0];

    refs.yearSelect.innerHTML = years
      .map((year) => `<option value="${year}" ${year === defaultYear ? 'selected' : ''}>${year}</option>`)
      .join('');

    STATE.year = defaultYear;
    updateYearDependentUi();
    pushDataLayer('results_view', {});
  }

  function initLeaderboardTabs() {
    const defaultTab = refs.leaderboardTabs?.querySelector('[data-metric="averageScore"]');
    if (defaultTab) {
      defaultTab.setAttribute('aria-selected', 'true');
      defaultTab.setAttribute('tabindex', '0');
      refs.leaderboardTabs.querySelectorAll('[role="tab"]').forEach((tab) => {
        if (tab !== defaultTab) {
          tab.setAttribute('aria-selected', 'false');
          tab.setAttribute('tabindex', '-1');
        }
      });
    }
  }

  function onYearChange(event) {
    const selectedYear = parseInt(event.target.value, 10);
    if (Number.isNaN(selectedYear)) {
      return;
    }
    STATE.year = selectedYear;
    STATE.classNo = '';
    refs.classSelect.value = '';
    refs.searchBox.value = '';
    STATE.search = '';
    updateYearDependentUi();
    pushDataLayer('filter_change', { classNo: null });
  }

  function updateYearDependentUi() {
    updateUrlQuery();
    updateSubtitleYear();
    populateClassSelect();
    renderChampions();
    renderLeaderboards();
    renderBestInClass();
    renderEntries();
    updateJsonLd();
  }

  function updateUrlQuery() {
    const params = new URLSearchParams(window.location.search);
    params.set('year', STATE.year);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }

  function updateSubtitleYear() {
    const yearData = getYearData(STATE.year);
    const show = yearData?.raw?.show || {};
    const displayYear = show.year || STATE.year;
    if (refs.subtitleYear) {
      refs.subtitleYear.textContent = displayYear || '';
    }
    if (refs.subtitleShowNumber) {
      refs.subtitleShowNumber.textContent = getEditionDisplay(show, displayYear || STATE.year);
    }
    const editionLabel = resolveEditionLabel(show, displayYear || STATE.year);
    const titleYear = displayYear || STATE.year;
    const title = `SAWC Show Results — ${editionLabel} ${titleYear}`;
    document.title = title;
  }

  function populateClassSelect() {
    if (!refs.classSelect) return;
    const yearData = getYearData(STATE.year);
    const classes = Array.isArray(yearData?.classes) ? yearData.classes.slice() : [];
    if (!classes.length) {
      refs.classSelect.innerHTML = '<option value="">All classes</option>';
      return;
    }
    classes.sort((a, b) => {
      const orderA = typeof a?.sort_order === 'number' ? a.sort_order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b?.sort_order === 'number' ? b.sort_order : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      const codeA = String(a?.code ?? '');
      const codeB = String(b?.code ?? '');
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });
    const options = ['<option value="">All classes</option>'];
    classes.forEach((classInfo) => {
      const code = classInfo?.code != null ? String(classInfo.code) : '';
      const name = classInfo?.name ? ` — ${escapeHtml(classInfo.name)}` : '';
      options.push(`<option value="${escapeHtml(code)}">${escapeHtml(code)}${name}</option>`);
    });
    refs.classSelect.innerHTML = options.join('');
  }

  function renderChampions() {
    if (!refs.champions) return;
    const champions = getYearData(STATE.year)?.champions || [];
    if (!champions.length) {
      refs.champions.innerHTML = `
        <h2>Champions</h2>
        <p class="empty-state">Champions will be announced soon. Check back later.</p>
      `;
      return;
    }

    const listItems = champions
      .map((champion) => {
        const details = [];
        if (champion.wineType) {
          details.push(`<span>${escapeHtml(champion.wineType)}</span>`);
        } else if (champion.wineName) {
          details.push(`<span>${escapeHtml(champion.wineName)}</span>`);
        }
        if (champion.wineVintage) {
          details.push(`<span>Vintage ${escapeHtml(String(champion.wineVintage))}</span>`);
        }
        if (champion.classNo) {
          details.push(`<span>Class ${escapeHtml(String(champion.classNo))}</span>`);
        }
        if (champion.medal && champion.medal !== 'No Award') {
          details.push(`<span>${escapeHtml(champion.medal)} Medal</span>`);
        }
        if (champion.score != null) {
          details.push(`<span>Score ${formatScore(champion.score)}</span>`);
        }
        const detailMarkup = details.filter(Boolean).join(' · ');
        return `
          <li class="champion-item">
            <strong>${escapeHtml(champion.winemaker || 'Unnamed entry')}</strong>
            <span class="champion-meta">${detailMarkup}</span>
          </li>
        `;
      })
      .join('');

    refs.champions.innerHTML = `
      <h2>Champions</h2>
      <ul>${listItems}</ul>
    `;
  }

  function renderLeaderboards() {
    if (!refs.leaderboardPanels) return;
    const leaderboards = getYearData(STATE.year)?.leaderboards || {};
    const metrics = [
      { key: 'averageScore', label: 'Average Score', valueKey: 'score', formatter: formatScore },
      { key: 'medianScore', label: 'Median Score', valueKey: 'score', formatter: formatScore },
      { key: 'sumTop5', label: 'Sum of Top 5', valueKey: 'sumTop5', formatter: formatScore }
    ];

    metrics.forEach(({ key, label, valueKey, formatter }) => {
      const panel = document.getElementById(`panel-${metricPanelKey(key)}`);
      if (!panel) return;
      const rows = Array.isArray(leaderboards[key]) ? leaderboards[key].slice(0, 10) : [];
      if (!rows.length) {
        panel.innerHTML = `<p class="empty-state">${label} leaderboard will be published soon.</p>`;
        panel.hidden = STATE.activeLeaderboard !== key;
        return;
      }

      const tableRows = rows
        .map((row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(row.winemaker || 'Unnamed entrant')}</td>
            <td>${row[valueKey] != null ? formatter(row[valueKey]) : '—'}</td>
          </tr>
        `)
        .join('');

      panel.innerHTML = `
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Winemaker</th>
              <th scope="col">${label === 'Sum of Top 5' ? 'Total' : 'Score'}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
      panel.hidden = STATE.activeLeaderboard !== key;
    });
  }

  function onLeaderboardTabClick(event) {
    if (event.target?.matches('[role="tab"]')) {
      const metric = event.target.getAttribute('data-metric');
      if (!metric || metric === STATE.activeLeaderboard) return;
      STATE.activeLeaderboard = metric;
      const tabs = refs.leaderboardTabs.querySelectorAll('[role="tab"]');
      tabs.forEach((tab) => {
        const isActive = tab.getAttribute('data-metric') === metric;
        tab.setAttribute('aria-selected', String(isActive));
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      event.target.focus();
      const panels = refs.leaderboardPanels.querySelectorAll('[role="tabpanel"]');
      panels.forEach((panel) => {
        const panelMetric = panel.id.replace('panel-', '');
        const normalizedMetric = normalizeMetricKey(metric);
        panel.hidden = panelMetric !== normalizedMetric;
      });
      pushDataLayer('leaderboard_tab_view', { tab: metric });
    }
  }

  function onLeaderboardTabKeydown(event) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const tabs = Array.from(refs.leaderboardTabs.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    const currentIndex = tabs.findIndex((tab) => tab.getAttribute('data-metric') === STATE.activeLeaderboard);
    let newIndex = currentIndex;
    if (event.key === 'ArrowLeft') {
      newIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
    } else if (event.key === 'ArrowRight') {
      newIndex = currentIndex >= tabs.length - 1 ? 0 : currentIndex + 1;
    } else if (event.key === 'Home') {
      newIndex = 0;
    } else if (event.key === 'End') {
      newIndex = tabs.length - 1;
    }
    const nextTab = tabs[newIndex];
    if (nextTab) {
      nextTab.click();
    }
  }

  function normalizeMetricKey(metric) {
    if (metric === 'sumTop5') return 'top5';
    if (metric === 'averageScore') return 'average';
    if (metric === 'medianScore') return 'median';
    return metric;
  }

  function metricPanelKey(metric) {
    return normalizeMetricKey(metric);
  }

  function renderBestInClass() {
    if (!refs.bestInClass) return;
    const yearData = getYearData(STATE.year);
    const classes = Array.isArray(yearData?.classes) ? yearData.classes.slice() : [];
    if (!classes.length) {
      refs.bestInClass.innerHTML = `
        <h2>Best in Class</h2>
        <p class="empty-state">Class winners will be announced soon.</p>
      `;
      return;
    }
    classes.sort((a, b) => {
      const orderA = typeof a?.sort_order === 'number' ? a.sort_order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b?.sort_order === 'number' ? b.sort_order : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      const codeA = String(a?.code ?? '');
      const codeB = String(b?.code ?? '');
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });

    const listItems = classes
      .map((classInfo) => {
        const winners = (yearData?.bestInClassEntries || []).filter((entry) => entry.classId === classInfo.id);
        if (!winners.length) {
          return `
            <li>
              <div class="class-heading">Class ${escapeHtml(String(classInfo.code ?? ''))}</div>
              <p class="empty-state">No best in class recorded.</p>
            </li>
          `;
        }
        const winnerMarkup = winners
          .map((entry) => {
            const details = [];
            if (entry.wineType) {
              details.push(`<span>${escapeHtml(entry.wineType)}</span>`);
            } else if (entry.wineName) {
              details.push(`<span>${escapeHtml(entry.wineName)}</span>`);
            }
            if (entry.medal && entry.medal !== 'No Award') {
              details.push(`<span>${escapeHtml(entry.medal)} Medal</span>`);
            }
            if (entry.score != null) {
              details.push(`<span>Score ${formatScore(entry.score)}</span>`);
            }
            return `
              <div>
                <strong>${escapeHtml(entry.winemaker || 'Unnamed entrant')}</strong>
                <div class="class-meta">${details.filter(Boolean).join(' · ')}</div>
              </div>
            `;
          })
          .join('');
        return `
          <li>
            <div class="class-heading">Class ${escapeHtml(String(classInfo.code ?? ''))}</div>
            ${winnerMarkup}
          </li>
        `;
      })
      .join('');

    refs.bestInClass.innerHTML = `
      <h2>Best in Class</h2>
      <ul class="best-list">${listItems}</ul>
    `;
  }

  function renderEntries() {
    if (!refs.entriesTableBody) return;
    const entries = getEntriesForYear(STATE.year);
    const filtered = entries
      .filter((entry) => {
        if (!STATE.classNo) return true;
        return String(entry.classNo) === STATE.classNo;
      })
      .filter((entry) => {
        if (!STATE.search) return true;
        const haystack = `${entry.winemaker || ''} ${entry.wineType || ''} ${entry.wineName || ''}`.toLowerCase();
        return haystack.includes(STATE.search.toLowerCase());
      })
      .sort((a, b) => {
        const scoreA = typeof a.score === 'number' ? a.score : -Infinity;
        const scoreB = typeof b.score === 'number' ? b.score : -Infinity;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        const classOrderA = typeof a.classSortOrder === 'number' ? a.classSortOrder : Number.MAX_SAFE_INTEGER;
        const classOrderB = typeof b.classSortOrder === 'number' ? b.classSortOrder : Number.MAX_SAFE_INTEGER;
        if (classOrderA !== classOrderB) {
          return classOrderA - classOrderB;
        }
        return String(a.entryNo ?? '').localeCompare(String(b.entryNo ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      });

    if (!filtered.length) {
      refs.entriesTableBody.innerHTML = `
        <tr>
          <td colspan="6">No results match your filters yet. Try a different class or search term.</td>
        </tr>
      `;
      updateEntriesSummary(filtered.length);
      return;
    }

    refs.entriesTableBody.innerHTML = filtered
      .map((entry) => {
        const flags = [];
        if (entry.bestInClass) {
          flags.push('<span>BIC</span>');
        }
        if (entry.champFlag) {
          flags.push('<span>Champion</span>');
        }
        if (entry.medal && entry.medal !== 'No Award') {
          flags.push(`<span>${escapeHtml(entry.medal)}</span>`);
        }
        const flagMarkup = flags.length
          ? `<div class="flag-group">${flags.join('')}</div>`
          : '<span class="empty-state">—</span>';
        const wineLabelParts = [];
        if (entry.wineName) {
          wineLabelParts.push(entry.wineName);
        } else if (entry.wineType) {
          wineLabelParts.push(entry.wineType);
        }
        if (entry.wineVintage) {
          wineLabelParts.push(`(${entry.wineVintage})`);
        }
        const wineLabel = wineLabelParts.filter(Boolean).join(' ');
        return `
          <tr>
            <td data-title="Class">${escapeHtml(String(entry.classNo ?? ''))}</td>
            <td data-title="Entry">${escapeHtml(String(entry.entryNo ?? ''))}</td>
            <td data-title="Winemaker">${escapeHtml(entry.winemaker || '')}</td>
            <td data-title="Wine">${escapeHtml(wineLabel || entry.wineType || '')}</td>
            <td data-title="Score">${formatScore(entry.score)}</td>
            <td data-title="Flags">${flagMarkup}</td>
          </tr>
        `;
      })
      .join('');

    updateEntriesSummary(filtered.length);
  }

  function updateEntriesSummary(count) {
    if (!refs.entriesSummary) return;
    const yearData = getYearData(STATE.year);
    const classSegment = STATE.classNo
      ? formatClassSummary(yearData, STATE.classNo)
      : 'all classes';
    const searchSegment = STATE.search ? ` matching “${STATE.search}”` : '';
    const plural = count === 1 ? 'entry' : 'entries';
    const showYear = yearData?.raw?.show?.year || STATE.year;
    refs.entriesSummary.textContent = `${count} ${plural} from ${showYear} in ${classSegment}${searchSegment}.`;
  }

  function updateJsonLd() {
    if (!refs.jsonLd) return;
    const yearData = getYearData(STATE.year);
    const show = yearData?.raw?.show || {};
    const displayYear = show.year || STATE.year;
    const dateRange = show.date_range || {};
    const editionLabel = resolveEditionLabel(show, displayYear || STATE.year);
    const baseName = show.name || 'Sydney Amateur Winemakers Club';
    const eventName = `${baseName} — ${editionLabel} ${displayYear}`;
    const json = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: eventName,
      eventStatus: 'https://schema.org/EventCompleted',
      location: {
        '@type': 'Place',
        name: show.location || 'Club Rivers, Riverwood NSW'
      },
      startDate: dateRange.start || `${displayYear}-09-01`,
      endDate: dateRange.end || dateRange.start || `${displayYear}-09-30`,
      url: `${window.location.origin}${window.location.pathname}?year=${displayYear}`,
      organizer: {
        '@type': 'Organization',
        name: show.organizer?.name || 'Sydney Amateur Winemakers Club'
      }
    };
    if (show.organizer?.website) {
      json.organizer.url = show.organizer.website;
    }
    refs.jsonLd.textContent = JSON.stringify(json, null, 2);
  }

  function ordinalShowNumber(year) {
    const baseYear = 1975; // First show year assumption for numbering continuity
    if (typeof year !== 'number' || Number.isNaN(year)) {
      return '1st';
    }
    const showNumber = Math.max(1, Math.round(year - baseYear + 1));
    const suffix = getOrdinalSuffix(showNumber);
    return `${showNumber}${suffix}`;
  }

  function getOrdinalSuffix(n) {
    const rem10 = n % 10;
    const rem100 = n % 100;
    if (rem10 === 1 && rem100 !== 11) return 'st';
    if (rem10 === 2 && rem100 !== 12) return 'nd';
    if (rem10 === 3 && rem100 !== 13) return 'rd';
    return 'th';
  }

  function buildYearCache(rawData) {
    const cache = {};
    if (!rawData || typeof rawData !== 'object') {
      return cache;
    }

    Object.keys(rawData).forEach((yearKey) => {
      const yearNumber = parseInt(yearKey, 10);
      if (Number.isNaN(yearNumber)) {
        return;
      }
      const yearPayload = rawData[yearKey] || {};
      const classes = Array.isArray(yearPayload.classes) ? yearPayload.classes.slice() : [];
      const entrants = Array.isArray(yearPayload.entrants) ? yearPayload.entrants.slice() : [];
      const entrantsById = entrants.reduce((accumulator, entrant) => {
        if (entrant?.id) {
          accumulator[entrant.id] = entrant;
        }
        return accumulator;
      }, {});
      const classesById = {};
      const classesByCode = {};
      classes.forEach((classInfo) => {
        if (classInfo?.id) {
          classesById[classInfo.id] = classInfo;
        }
        if (classInfo?.code != null) {
          classesByCode[String(classInfo.code)] = classInfo;
        }
      });
      const entriesRaw = Array.isArray(yearPayload.entries) ? yearPayload.entries : [];
      const entries = entriesRaw.map((entry) => {
        const classInfo = classesById[entry?.class_id] || {};
        const entrantInfo = entrantsById[entry?.entrant_id] || {};
        const numericScore = typeof entry?.judging?.Score === 'number'
          ? entry.judging.Score
          : Number(entry?.judging?.Score);
        const score = Number.isNaN(numericScore) ? null : numericScore;
        const trophies = Array.isArray(entry?.judging?.trophies) ? entry.judging.trophies : [];
        const bestInClass = trophies.some((trophy) => typeof trophy === 'string' && trophy.toLowerCase().includes('best in class'));
        const champion = trophies.some((trophy) => typeof trophy === 'string' && trophy.toLowerCase().includes('best in show'));
        const components = entry?.components || {};
        const score100 = typeof entry?.judging?.Score100 === 'number'
          ? entry.judging.Score100
          : score != null
            ? score * 5
            : null;
        return {
          id: entry?.id || null,
          year: yearNumber,
          classId: entry?.class_id || null,
          classNo: classInfo?.code != null ? String(classInfo.code) : '',
          className: classInfo?.name || '',
          classSortOrder: typeof classInfo?.sort_order === 'number' ? classInfo.sort_order : Number.MAX_SAFE_INTEGER,
          entryNo: entry?.exhibit_number || entry?.entry_number || '',
          winemaker: entrantInfo?.display_name || entrantInfo?.name || 'Unnamed entrant',
          winemakerId: entry?.entrant_id || null,
          entrantClub: entrantInfo?.club || null,
          wineName: entry?.wine?.name || '',
          wineType: entry?.wine?.style || entry?.wine?.name || '',
          wineVintage: entry?.wine?.vintage ?? null,
          wineColour: entry?.wine?.colour || '',
          wineRegion: entry?.wine?.region || '',
          wineCountry: entry?.wine?.country || '',
          score,
          score100,
          medal: entry?.judging?.Medal || null,
          aroma: components?.aroma ?? null,
          colour: components?.colour ?? null,
          taste: components?.taste ?? null,
          bestInClass,
          champFlag: champion,
          trophies,
          rankInClass: entry?.judging?.rank_in_class ?? null,
          panel: entry?.judging?.panel || null,
          flight: entry?.judging?.flight || null,
          raw: entry
        };
      });
      const validEntries = entries.filter((entry) => entry);

      cache[yearNumber] = {
        raw: yearPayload,
        classes,
        classesById,
        classesByCode,
        entrants,
        entrantsById,
        entries: validEntries,
        champions: validEntries.filter((entry) => entry.champFlag),
        bestInClassEntries: validEntries.filter((entry) => entry.bestInClass),
        leaderboards: computeLeaderboards(validEntries)
      };
    });

    return cache;
  }

  function getYearData(year) {
    if (year == null) return null;
    return STATE.resultsByYear[year] || null;
  }

  function getEntriesForYear(year) {
    const yearData = getYearData(year);
    return Array.isArray(yearData?.entries) ? yearData.entries : [];
  }

  function computeLeaderboards(entries) {
    if (!Array.isArray(entries) || !entries.length) {
      return {};
    }
    const map = new Map();
    entries.forEach((entry) => {
      if (typeof entry?.score !== 'number') return;
      const key = entry.winemakerId || entry.winemaker;
      if (!map.has(key)) {
        map.set(key, { winemaker: entry.winemaker, scores: [] });
      }
      map.get(key).scores.push(entry.score);
    });
    const rows = Array.from(map.values());
    if (!rows.length) {
      return {};
    }
    rows.forEach((row) => row.scores.sort((a, b) => b - a));
    const averageScore = rows
      .map((row) => ({
        winemaker: row.winemaker,
        score: row.scores.reduce((sum, value) => sum + value, 0) / row.scores.length
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const medianScore = rows
      .map((row) => ({ winemaker: row.winemaker, score: median(row.scores) }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const sumTop5 = rows
      .map((row) => ({
        winemaker: row.winemaker,
        sumTop5: row.scores.slice(0, 5).reduce((sum, value) => sum + value, 0)
      }))
      .sort((a, b) => (b.sumTop5 ?? 0) - (a.sumTop5 ?? 0));
    return { averageScore, medianScore, sumTop5 };
  }

  function median(values) {
    if (!Array.isArray(values) || !values.length) {
      return null;
    }
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  function formatClassSummary(yearData, classCode) {
    if (!classCode) {
      return 'the selected class';
    }
    const classInfo = yearData?.classesByCode?.[String(classCode)] || null;
    if (!classInfo) {
      return `Class ${classCode}`;
    }
    return classInfo.name ? `Class ${classCode} — ${classInfo.name}` : `Class ${classCode}`;
  }

  function getEditionDisplay(show, fallbackYear) {
    if (typeof show?.edition_number === 'number') {
      return formatOrdinal(show.edition_number);
    }
    const ordinal = extractOrdinalFromEdition(show?.edition);
    if (ordinal) {
      return ordinal;
    }
    return ordinalShowNumber(fallbackYear);
  }

  function resolveEditionLabel(show, fallbackYear) {
    if (show?.edition) {
      return show.edition;
    }
    if (typeof show?.edition_number === 'number') {
      return `${formatOrdinal(show.edition_number)} Annual Wine Show`;
    }
    return `${ordinalShowNumber(fallbackYear)} Annual Wine Show`;
  }

  function formatOrdinal(value) {
    if (value == null) return '';
    const number = Number(value);
    if (Number.isNaN(number)) return '';
    return `${number}${getOrdinalSuffix(number)}`;
  }

  function extractOrdinalFromEdition(value) {
    if (typeof value !== 'string') return null;
    const match = value.trim().match(/^(\d+(?:st|nd|rd|th))/i);
    return match ? match[1] : null;
  }

  function renderErrorState(message = 'We were unable to load the show results. Please refresh to try again.') {
    if (refs.champions) {
      refs.champions.innerHTML = `<h2>Champions</h2><p class="empty-state">${escapeHtml(message)}</p>`;
    }
    if (refs.bestInClass) {
      refs.bestInClass.innerHTML = `<h2>Best in Class</h2><p class="empty-state">${escapeHtml(message)}</p>`;
    }
    if (refs.entriesTableBody) {
      refs.entriesTableBody.innerHTML = `<tr><td colspan="6">${escapeHtml(message)}</td></tr>`;
    }
    if (refs.entriesSummary) {
      refs.entriesSummary.textContent = message;
    }
    if (refs.leaderboardPanels) {
      refs.leaderboardPanels.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
        panel.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
      });
    }
  }

  function formatScore(score) {
    if (score == null || score === '') return '—';
    const number = Number(score);
    if (Number.isNaN(number)) return String(score);
    return number % 1 === 0 ? number.toFixed(0) : number.toFixed(1);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pushDataLayer(eventName, additional = {}) {
    if (!window.dataLayer || typeof window.dataLayer.push !== 'function') {
      return;
    }
    window.dataLayer.push({
      event: eventName,
      year: STATE.year,
      ...additional
    });
  }
})();
