// Shared UI helpers: nav rendering, page header, simple format helpers.

const UI = {
  formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  },

  formatPoints(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  },

  el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  },

  renderHeader(active) {
    const links = [
      ['index.html', 'Leaderboard'],
      ['teams.html', 'Teams'],
      ['schedule.html', 'Schedule'],
      ['stats.html', 'Stats'],
      ['recaps.html', 'Recaps'],
      ['score-entry.html', 'Score Entry'],
    ];
    const header = document.getElementById('app-header');
    if (!header) return;
    header.innerHTML = `
      <div class="bg-emerald-800 text-white">
        <div class="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <a href="index.html" class="block">
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">${DataStore.league?.name || 'Audubon Friday Night League'}</h1>
              <p class="text-emerald-200 text-sm">${DataStore.league?.course || ''} &middot; ${DataStore.league?.location || ''} &middot; ${DataStore.league?.season || ''} season</p>
            </a>
          </div>
        </div>
        <nav class="bg-emerald-900">
          <div class="max-w-5xl mx-auto px-2 flex flex-wrap">
            ${links.map(([href, label]) => `
              <a href="${href}" class="px-3 py-2 text-sm sm:text-base ${active === href ? 'bg-emerald-700 text-white' : 'text-emerald-100 hover:bg-emerald-800'}">${label}</a>
            `).join('')}
          </div>
        </nav>
      </div>
    `;
  },

  showError(msg) {
    const main = document.getElementById('app-main');
    if (main) {
      main.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-800 p-4 rounded">${msg}</div>`;
    }
  },
};
