// Loads all league data. Cached in memory for the page lifetime.
const DataStore = {
  league: null,
  teams: null,
  schedule: null,
  manifest: null,
  scoresByWeek: {}, // week -> data
  recapsByWeek: {}, // week -> data

  async loadAll() {
    const [league, teams, schedule, manifest] = await Promise.all([
      fetch('data/league.json').then(r => r.json()),
      fetch('data/teams.json').then(r => r.json()),
      fetch('data/schedule.json').then(r => r.json()),
      fetch('data/manifest.json').then(r => r.json()),
    ]);
    this.league = league;
    this.teams = teams.teams;
    this.schedule = schedule.schedule;
    this.manifest = manifest;

    // Load all weekly score files listed in the manifest
    const scoreLoads = manifest.weeksWithScores.map(w =>
      fetch(`data/scores/week-${w}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) this.scoresByWeek[w] = d; })
    );
    const recapLoads = manifest.weeksWithRecaps.map(w =>
      fetch(`data/recaps/week-${w}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) this.recapsByWeek[w] = d; })
    );
    await Promise.all([...scoreLoads, ...recapLoads]);
    return this;
  },

  teamById(id) {
    return this.teams.find(t => t.id === id);
  },

  playerById(id) {
    for (const t of this.teams) {
      const p = t.players.find(p => p.id === id);
      if (p) return { ...p, teamId: t.id, teamName: t.name };
    }
    return null;
  },
};
