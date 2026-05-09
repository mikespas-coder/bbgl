// Scoring engine for the Audubon Friday Night League.
// Each match between two teams is worth 5 points:
//   - 1 point per pairing for match play (2 pairings -> 2 points)
//   - 1 point per pairing for stroke play, decided by lower NET score (2 points)
//   - 1 point for the lower combined team NET score
// Ties are split 0.5 / 0.5.

const Scoring = {
  net(p) {
    return p.gross - p.handicap;
  },

  scoreMatch(match) {
    let aPts = 0, bPts = 0;
    const detail = { pairings: [], teamNetA: 0, teamNetB: 0, teamNetWinner: null };

    for (const p of match.pairings) {
      const netA = p.playerAGross - p.playerAHandicap;
      const netB = p.playerBGross - p.playerBHandicap;
      detail.teamNetA += netA;
      detail.teamNetB += netB;

      // Match play
      let mp;
      if (p.matchPlayWinner === p.playerA) { aPts += 1; mp = 'A'; }
      else if (p.matchPlayWinner === p.playerB) { bPts += 1; mp = 'B'; }
      else { aPts += 0.5; bPts += 0.5; mp = 'halved'; }

      // Stroke play (lower net)
      let sp;
      if (netA < netB) { aPts += 1; sp = 'A'; }
      else if (netB < netA) { bPts += 1; sp = 'B'; }
      else { aPts += 0.5; bPts += 0.5; sp = 'halved'; }

      detail.pairings.push({
        playerA: p.playerA, playerB: p.playerB,
        playerAGross: p.playerAGross, playerBGross: p.playerBGross,
        playerAHandicap: p.playerAHandicap, playerBHandicap: p.playerBHandicap,
        netA, netB,
        matchPlay: mp, strokePlay: sp,
      });
    }

    // Team cumulative net
    if (detail.teamNetA < detail.teamNetB) { aPts += 1; detail.teamNetWinner = 'A'; }
    else if (detail.teamNetB < detail.teamNetA) { bPts += 1; detail.teamNetWinner = 'B'; }
    else { aPts += 0.5; bPts += 0.5; detail.teamNetWinner = 'halved'; }

    return {
      teamA: match.teamA,
      teamB: match.teamB,
      pointsA: aPts,
      pointsB: bPts,
      detail,
    };
  },

  // Returns { weeks: { weekN: { matches: [scoredMatches] } }, standings: [{ teamId, points, matches, ... }] }
  computeSeason(teams, scoresByWeek) {
    const standings = {};
    teams.forEach(t => {
      standings[t.id] = {
        teamId: t.id, teamName: t.name,
        points: 0, wins: 0, losses: 0, halves: 0,
        matchesPlayed: 0,
      };
    });

    const weeks = {};
    Object.keys(scoresByWeek).map(Number).sort((a,b)=>a-b).forEach(w => {
      const wk = scoresByWeek[w];
      const scoredMatches = wk.matches.map(m => this.scoreMatch(m));
      weeks[w] = { week: w, date: wk.date, matches: scoredMatches };

      scoredMatches.forEach(sm => {
        standings[sm.teamA].points += sm.pointsA;
        standings[sm.teamB].points += sm.pointsB;
        standings[sm.teamA].matchesPlayed += 1;
        standings[sm.teamB].matchesPlayed += 1;
        if (sm.pointsA > sm.pointsB) {
          standings[sm.teamA].wins += 1;
          standings[sm.teamB].losses += 1;
        } else if (sm.pointsB > sm.pointsA) {
          standings[sm.teamB].wins += 1;
          standings[sm.teamA].losses += 1;
        } else {
          standings[sm.teamA].halves += 1;
          standings[sm.teamB].halves += 1;
        }
      });
    });

    const standingsList = Object.values(standings).sort((a,b) => b.points - a.points);
    return { weeks, standings: standingsList };
  },

  // Per-player stats across the season.
  computePlayerStats(teams, scoresByWeek) {
    const stats = {};
    teams.forEach(t => t.players.forEach(p => {
      stats[p.id] = {
        playerId: p.id, name: p.name, teamId: t.id, teamName: t.name,
        rounds: 0, totalGross: 0, totalNet: 0,
        lowGross: null, lowNet: null,
        matchPlayWins: 0, matchPlayHalves: 0, matchPlayLosses: 0,
        strokePlayWins: 0, strokePlayHalves: 0, strokePlayLosses: 0,
      };
    }));

    Object.keys(scoresByWeek).map(Number).sort((a,b)=>a-b).forEach(w => {
      const wk = scoresByWeek[w];
      wk.matches.forEach(m => {
        m.pairings.forEach(p => {
          const sA = stats[p.playerA], sB = stats[p.playerB];
          if (!sA || !sB) return;
          const netA = p.playerAGross - p.playerAHandicap;
          const netB = p.playerBGross - p.playerBHandicap;

          [sA, sB].forEach((s, i) => {
            const gross = i === 0 ? p.playerAGross : p.playerBGross;
            const net   = i === 0 ? netA : netB;
            s.rounds += 1;
            s.totalGross += gross;
            s.totalNet += net;
            s.lowGross = (s.lowGross == null) ? gross : Math.min(s.lowGross, gross);
            s.lowNet   = (s.lowNet   == null) ? net   : Math.min(s.lowNet,   net);
          });

          // Match play
          if (p.matchPlayWinner === p.playerA) { sA.matchPlayWins++; sB.matchPlayLosses++; }
          else if (p.matchPlayWinner === p.playerB) { sB.matchPlayWins++; sA.matchPlayLosses++; }
          else { sA.matchPlayHalves++; sB.matchPlayHalves++; }

          // Stroke play
          if (netA < netB) { sA.strokePlayWins++; sB.strokePlayLosses++; }
          else if (netB < netA) { sB.strokePlayWins++; sA.strokePlayLosses++; }
          else { sA.strokePlayHalves++; sB.strokePlayHalves++; }
        });
      });
    });

    return Object.values(stats);
  },
};
