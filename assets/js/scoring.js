// Scoring engine for BBGL (2026 format).
//
// Each player earns individual points hole-by-hole based on net score vs par:
//   Hole-in-one (gross = 1): 5
//   Albatross  (net 3 under par): 4
//   Eagle      (net 2 under par): 3
//   Birdie     (net 1 under par): 2
//   Par        (net even):        1
//   Bogey      (net 1 over):      0.5
//   Double     (net 2 over):      0
//   Triple+    (net 3+ over):     -0.5
//   Show-up bonus (player participated): +1
//
// Handicap stored in teams.json is the player's 9-HOLE handicap (BBGL only
// plays 9 each week). Strokes are allocated to the lowest-indexed holes within
// the 9 played; players with 9-hole handicap > 9 get base strokes on every
// hole plus extras on the hardest ones.
//
// Team matchup: each team's players' individual points are summed.
//   Higher total → 3 team points (split 1.5/1.5 if both played, all 3 to a solo winner).
//   Tied → 1.5 / 1.5.
//
// Each player's *individual* season total = sum of hole points + show-up bonus
// + share of team points for matches they played in.

const Scoring = {
  // Returns { holeNumber → strokes received } for the 9 holes played.
  // `handicap` is the player's 9-hole handicap (BBGL doesn't use 18-hole handicaps).
  strokesByHole(handicap, nine, scorecard) {
    const nh = Math.max(0, handicap || 0);
    const startIdx = nine === 'back' ? 9 : 0;
    const holes = scorecard.holes.slice(startIdx, startIdx + 9);

    // Rank the 9 holes from hardest (lowest hcpIndex) to easiest within just this 9.
    const sorted = [...holes].sort((a, b) => a.hcpIndex - b.hcpIndex);

    // Distribute strokes: floor(nh/9) per hole, plus 1 extra to the lowest-index `nh % 9` holes.
    const base = Math.floor(nh / 9);
    const extra = nh % 9;

    const map = {};
    holes.forEach(h => { map[h.hole] = base; });
    for (let i = 0; i < extra; i++) {
      map[sorted[i].hole] += 1;
    }
    return map;
  },

  // Compute points earned for one player's 9-hole round.
  // grossScores: array of 9 numbers (or nulls). Index 0 = first hole of the nine played.
  // handicap: 9-hole handicap.
  pointsForRound(grossScores, handicap, nine, scorecard) {
    const strokes = this.strokesByHole(handicap, nine, scorecard);
    const startIdx = nine === 'back' ? 9 : 0;
    const holes = scorecard.holes.slice(startIdx, startIdx + 9);

    let total = 0;
    const detail = [];
    let holesPlayed = 0;

    holes.forEach((h, i) => {
      const gross = grossScores ? grossScores[i] : null;
      if (gross == null || gross === '' || gross === 0) {
        detail.push({ hole: h.hole, par: h.par, gross: null, net: null, toPar: null, points: 0 });
        return;
      }
      const g = Number(gross);
      const s = strokes[h.hole] || 0;
      const net = g - s;
      const toPar = net - h.par;

      let pts;
      if (g === 1) pts = 5;            // Hole-in-one (always)
      else if (toPar <= -3) pts = 4;   // Albatross (or better, net)
      else if (toPar === -2) pts = 3;  // Eagle
      else if (toPar === -1) pts = 2;  // Birdie
      else if (toPar === 0) pts = 1;   // Par
      else if (toPar === 1) pts = 0.5; // Bogey
      else if (toPar === 2) pts = 0;   // Double bogey
      else pts = -0.5;                  // Triple or worse

      detail.push({ hole: h.hole, par: h.par, gross: g, strokes: s, net, toPar, points: pts });
      total += pts;
      holesPlayed += 1;
    });

    return { holePoints: detail, total, holesPlayed };
  },

  // Score one match.
  // match: {
  //   teamA, teamB, nine,
  //   participants: [{ teamId, playerId, isSub, subName, handicap, holes }]
  // }
  scoreMatch(match, scorecard) {
    const nine = match.nine || 'front';

    const results = (match.participants || []).map(p => {
      const r = this.pointsForRound(p.holes, p.handicap, nine, scorecard);
      const showed = r.holesPlayed > 0;
      return {
        teamId: p.teamId,
        playerId: p.playerId,
        isSub: !!p.isSub,
        subName: p.subName || null,
        handicap: p.handicap,
        holes: p.holes,
        holePoints: r.holePoints,
        rawPoints: r.total,
        showupBonus: showed ? 1 : 0,
        individualPoints: showed ? r.total + 1 : 0,
        holesPlayed: r.holesPlayed,
      };
    });

    const aPlayers = results.filter(r => r.teamId === match.teamA);
    const bPlayers = results.filter(r => r.teamId === match.teamB);
    const aActive = aPlayers.filter(r => r.holesPlayed > 0);
    const bActive = bPlayers.filter(r => r.holesPlayed > 0);

    const teamATotal = aActive.reduce((s, r) => s + r.individualPoints, 0);
    const teamBTotal = bActive.reduce((s, r) => s + r.individualPoints, 0);

    let teamAPoints = 0, teamBPoints = 0, outcome = 'tie';
    if (aActive.length === 0 && bActive.length === 0) {
      // Nobody showed: no team points awarded.
    } else if (aActive.length === 0) {
      teamBPoints = 3; outcome = 'B-forfeit-win';
    } else if (bActive.length === 0) {
      teamAPoints = 3; outcome = 'A-forfeit-win';
    } else if (teamATotal > teamBTotal) {
      teamAPoints = 3; outcome = 'A';
    } else if (teamBTotal > teamATotal) {
      teamBPoints = 3; outcome = 'B';
    } else {
      teamAPoints = 1.5; teamBPoints = 1.5; outcome = 'tie';
    }

    // Distribute team points equally among the players who played.
    if (aActive.length > 0) {
      const share = teamAPoints / aActive.length;
      aActive.forEach(r => { r.teamPointsShare = share; });
    }
    aPlayers.filter(r => r.holesPlayed === 0).forEach(r => { r.teamPointsShare = 0; });
    if (bActive.length > 0) {
      const share = teamBPoints / bActive.length;
      bActive.forEach(r => { r.teamPointsShare = share; });
    }
    bPlayers.filter(r => r.holesPlayed === 0).forEach(r => { r.teamPointsShare = 0; });

    return {
      teamA: match.teamA, teamB: match.teamB, nine,
      teamATotal, teamBTotal,
      teamAPoints, teamBPoints, outcome,
      playerResults: results,
    };
  },

  // Compute the season's team and individual standings.
  computeSeason(teams, scoresByWeek, scorecard) {
    const teamStandings = {};
    const playerStandings = {};

    teams.forEach(t => {
      teamStandings[t.id] = {
        teamId: t.id, teamName: t.name,
        teamPoints: 0,
        wins: 0, losses: 0, ties: 0,
        matchesPlayed: 0,
      };
      t.players.forEach(p => {
        playerStandings[p.id] = this.makePlayerStanding(p.id, p.name, t.id, t.name, false);
      });
    });

    const weeks = {};
    const weekNums = Object.keys(scoresByWeek).map(Number).sort((a, b) => a - b);

    weekNums.forEach(w => {
      const wk = scoresByWeek[w];
      const matches = wk.matches.map(m => this.scoreMatch({ ...m, nine: wk.nine || m.nine }, scorecard));
      weeks[w] = { week: w, date: wk.date, nine: wk.nine, matches };

      matches.forEach(sm => {
        const tA = teamStandings[sm.teamA];
        const tB = teamStandings[sm.teamB];
        if (tA) {
          tA.teamPoints += sm.teamAPoints;
          tA.matchesPlayed += 1;
        }
        if (tB) {
          tB.teamPoints += sm.teamBPoints;
          tB.matchesPlayed += 1;
        }
        if (sm.teamAPoints > sm.teamBPoints) {
          if (tA) tA.wins += 1;
          if (tB) tB.losses += 1;
        } else if (sm.teamBPoints > sm.teamAPoints) {
          if (tB) tB.wins += 1;
          if (tA) tA.losses += 1;
        } else if (sm.teamAPoints > 0 || sm.teamBPoints > 0) {
          if (tA) tA.ties += 1;
          if (tB) tB.ties += 1;
        }

        sm.playerResults.forEach(pr => {
          let p = playerStandings[pr.playerId];
          if (!p) {
            const displayName = pr.subName || pr.playerId;
            p = playerStandings[pr.playerId] = this.makePlayerStanding(
              pr.playerId, displayName, null, 'Sub', true
            );
          }
          if (pr.holesPlayed === 0) return;
          p.weeksPlayed += 1;
          p.holePoints += pr.rawPoints;
          p.showupBonus += pr.showupBonus;
          p.teamPointsShare += pr.teamPointsShare || 0;
          p.totalPoints = +(p.holePoints + p.showupBonus + p.teamPointsShare).toFixed(2);

          pr.holePoints.forEach(hp => {
            if (hp.gross === 1) p.holeInOnes += 1;
            if (hp.toPar === -2) p.eagles += 1;
            else if (hp.toPar === -1) p.birdies += 1;
            else if (hp.toPar === 0) p.pars += 1;
            else if (hp.toPar === 1) p.bogeys += 1;
          });
        });
      });
    });

    return {
      weeks,
      teamStandings: Object.values(teamStandings).sort((a, b) => b.teamPoints - a.teamPoints),
      playerStandings: Object.values(playerStandings).sort((a, b) => b.totalPoints - a.totalPoints),
    };
  },

  makePlayerStanding(id, name, teamId, teamName, isSub) {
    return {
      playerId: id, name, teamId, teamName, isSub,
      weeksPlayed: 0,
      holePoints: 0, showupBonus: 0, teamPointsShare: 0, totalPoints: 0,
      holeInOnes: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0,
    };
  },
};
