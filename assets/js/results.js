(function () {
  const DATA_BASE_PATH = '/assets/data';
  const RESULTS_INDEX_URL = `${DATA_BASE_PATH}/results_index.json`;
  const RESULTS_ENTRIES_URL = `${DATA_BASE_PATH}/results_entries.json`;
  const STATE = {
    index: {},
    entries: [],
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
      const [indexData, entriesData] = await Promise.all([
        fetchJson(RESULTS_INDEX_URL),
        fetchJson(RESULTS_ENTRIES_URL)
      ]);
      STATE.index = indexData || {};
      STATE.entries = Array.isArray(entriesData?.entries) ? entriesData.entries : [];
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
    const years = Object.keys(STATE.index)
      .map((year) => parseInt(year, 10))
      .filter((value) => !Number.isNaN(value))
      .sort((a, b) => b - a);

    if (!years.length) {
      renderErrorState('No years available in the results index.');
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
    if (refs.subtitleYear) {
      refs.subtitleYear.textContent = STATE.year;
    }
    if (refs.subtitleShowNumber) {
      refs.subtitleShowNumber.textContent = ordinalShowNumber(STATE.year);
    }
    const title = `SAWC Show Results — ${STATE.year}`;
    document.title = title;
  }

  function populateClassSelect() {
    if (!refs.classSelect) return;
    const classes = STATE.index[STATE.year]?.classes || {};
    const options = [
      '<option value="">All classes</option>',
      ...Object.keys(classes)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map((classNo) => `<option value="${classNo}">${classNo}</option>`)
    ];
    refs.classSelect.innerHTML = options.join('');
  }

  function renderChampions() {
    if (!refs.champions) return;
    const champions = STATE.index[STATE.year]?.champions || [];
    if (!champions.length) {
      refs.champions.innerHTML = `
        <h2>Champions</h2>
        <p class="empty-state">Champions will be announced soon. Check back later.</p>
      `;
      return;
    }

    const listItems = champions
      .map((champion) => {
        const details = [
          champion.wineType ? `<span>${champion.wineType}</span>` : '',
          champion.classNo ? `<span>Class ${champion.classNo}</span>` : '',
          champion.score != null ? `<span>Score ${formatScore(champion.score)}</span>` : ''
        ]
          .filter(Boolean)
          .join(' · ');
        return `
          <li class="champion-item">
            <strong>${escapeHtml(champion.winemaker || 'Unnamed entry')}</strong>
            <span class="champion-meta">${details}</span>
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
    const leaderboards = STATE.index[STATE.year]?.leaderboards || {};
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
    const classes = STATE.index[STATE.year]?.classes || {};
    const classKeys = Object.keys(classes).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    if (!classKeys.length) {
      refs.bestInClass.innerHTML = `
        <h2>Best in Class</h2>
        <p class="empty-state">Class winners will be announced soon.</p>
      `;
      return;
    }

    const listItems = classKeys
      .map((classNo) => {
        const entries = classes[classNo]?.bestInClass || [];
        if (!entries.length) {
          return `
            <li>
              <div class="class-heading">Class ${classNo}</div>
              <p class="empty-state">No best in class recorded.</p>
            </li>
          `;
        }
        const winners = entries
          .map((entry) => `
            <div>
              <strong>${escapeHtml(entry.winemaker || 'Unnamed entrant')}</strong>
              <div class="class-meta">
                ${entry.wineType ? `<span>${escapeHtml(entry.wineType)}</span>` : ''}
                ${entry.score != null ? `<span>Score ${formatScore(entry.score)}</span>` : ''}
              </div>
            </div>
          `)
          .join('');
        return `
          <li>
            <div class="class-heading">Class ${classNo}</div>
            ${winners}
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
    const filtered = STATE.entries
      .filter((entry) => entry.year === STATE.year)
      .filter((entry) => {
        if (!STATE.classNo) return true;
        return String(entry.classNo) === STATE.classNo;
      })
      .filter((entry) => {
        if (!STATE.search) return true;
        const haystack = `${entry.winemaker || ''} ${entry.wineType || ''}`.toLowerCase();
        return haystack.includes(STATE.search.toLowerCase());
      })
      .sort((a, b) => {
        const scoreA = Number(a.score) || 0;
        const scoreB = Number(b.score) || 0;
        if (scoreA === scoreB) {
          return (a.entryNo || 0) - (b.entryNo || 0);
        }
        return scoreB - scoreA;
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
        const flagMarkup = flags.length
          ? `<div class="flag-group">${flags.join('')}</div>`
          : '<span class="empty-state">—</span>';
        return `
          <tr>
            <td data-title="Class">${escapeHtml(String(entry.classNo ?? ''))}</td>
            <td data-title="Entry">${escapeHtml(String(entry.entryNo ?? ''))}</td>
            <td data-title="Winemaker">${escapeHtml(entry.winemaker || '')}</td>
            <td data-title="Wine">${escapeHtml(entry.wineType || '')}</td>
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
    const classSegment = STATE.classNo ? `Class ${STATE.classNo}` : 'all classes';
    const searchSegment = STATE.search ? ` matching “${STATE.search}”` : '';
    const plural = count === 1 ? 'entry' : 'entries';
    refs.entriesSummary.textContent = `${count} ${plural} from ${STATE.year} in ${classSegment}${searchSegment}.`;
  }

  function updateJsonLd() {
    if (!refs.jsonLd) return;
    const json = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `Sydney Amateur Winemakers Club — ${ordinalShowNumber(STATE.year)} Annual Wineshow ${STATE.year}`,
      eventStatus: 'https://schema.org/EventCompleted',
      location: {
        '@type': 'Place',
        name: 'Club Rivers, Riverwood NSW'
      },
      startDate: `${STATE.year}-09-01`,
      endDate: `${STATE.year}-09-30`,
      url: `${window.location.origin}${window.location.pathname}?year=${STATE.year}`,
      organizer: {
        '@type': 'Organization',
        name: 'Sydney Amateur Winemakers Club'
      }
    };
    refs.jsonLd.textContent = JSON.stringify(json, null, 2);
  }

  function ordinalShowNumber(year) {
    const baseYear = 1975; // First show year assumption for numbering continuity
    const showNumber = Math.max(1, year - baseYear + 1);
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
