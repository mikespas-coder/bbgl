// Hand-checked sanity test for the new scoring engine.
// Run: node test-scoring.js

const fs = require('fs');
const path = require('path');

// Hack-load the browser-style script in node:
const vm = require('vm');
const code = fs.readFileSync(path.join(__dirname, 'assets/js/scoring.js'), 'utf8');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(code + '\nglobalThis.Scoring = Scoring;', ctx);
const Scoring = ctx.Scoring;

const scorecard = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/scorecard.json'), 'utf8'));

function assertEq(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  if (!ok) process.exitCode = 1;
}

// NOTE: As of 2026, all handicaps are 9-hole handicaps directly (no halving).

// --- Test 1: strokesByHole for a 3-handicap (9-hole) on the front 9 ---
// Front-9 hcp indexes per hole: 1->11, 2->3, 3->13, 4->5, 5->1, 6->9, 7->7, 8->15, 9->17.
// Sorted by index ascending within front 9: hole 5 (idx 1), hole 2 (idx 3), hole 4 (idx 5), hole 7 (idx 7), hole 6 (idx 9), hole 1 (idx 11), hole 3 (idx 13), hole 8 (idx 15), hole 9 (idx 17).
// 3 strokes → distributed to holes 5, 2, 4.
const s3front = Scoring.strokesByHole(3, 'front', scorecard);
assertEq(s3front, { 1: 0, 2: 1, 3: 0, 4: 1, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 }, '3-HCP (9h) front 9 strokes');

// --- Test 2: 10-handicap on the back 9 (gets 10 strokes — wraps around) ---
// Base = floor(10/9) = 1 per hole, plus 1 extra to lowest-index 1 hole.
// Back-9 indexes: 10->2, 11->18, 12->12, 13->8, 14->6, 15->16, 16->14, 17->4, 18->10.
// Lowest index on back = hole 10 (idx 2) → gets 2 strokes; others get 1.
const s10back = Scoring.strokesByHole(10, 'back', scorecard);
assertEq(s10back, { 10: 2, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1 }, '10-HCP (9h) back 9 strokes');

// --- Test 3: per-hole points for a clean scorecard ---
// Scratch player (HCP 0) on front 9. Pars: 4,4,3,4,4,3,4,5,4
// If they shoot par exactly on every hole: net = par → 1 pt each, 9 pts total.
const parRound = Scoring.pointsForRound([4, 4, 3, 4, 4, 3, 4, 5, 4], 0, 'front', scorecard);
assertEq(parRound.total, 9, 'Scratch player making par on every front 9 hole = 9 pts');
assertEq(parRound.holesPlayed, 9, 'Scratch player 9 holes counted');

// --- Test 4: a mixed round, scratch player on front 9 ---
// Scores: 3 (birdie, par 4), 4 (par), 2 (birdie, par 3), 5 (bogey, par 4), 3 (birdie, par 4),
//         3 (par), 4 (par), 5 (par 5), 1 (hole-in-one!)
// Points: 2 + 1 + 2 + 0.5 + 2 + 1 + 1 + 1 + 5 = 15.5
const mixed = Scoring.pointsForRound([3, 4, 2, 5, 3, 3, 4, 5, 1], 0, 'front', scorecard);
assertEq(mixed.total, 15.5, 'Mixed round points');

// --- Test 5: handicap takes a bogey to a par ---
// 3-HCP (9-hole) player who shoots 5 (bogey) on hole 5 (par 4) gets 1 stroke → net 4 → par → 1 pt.
// Same player shoots 5 on hole 1 (par 4), 0 strokes → net 5 → bogey → 0.5 pts.
const hcpRound = Scoring.pointsForRound([5, 4, 3, 4, 5, 3, 4, 5, 4], 3, 'front', scorecard);
// Hole 1 (par 4, 0 strokes): gross 5 → net 5 → bogey → 0.5
// Hole 2 (par 4, 1 stroke):  gross 4 → net 3 → birdie → 2
// Hole 3 (par 3, 0):         gross 3 → par → 1
// Hole 4 (par 4, 1):         gross 4 → net 3 → birdie → 2
// Hole 5 (par 4, 1):         gross 5 → net 4 → par → 1
// Hole 6 (par 3, 0):         gross 3 → par → 1
// Hole 7 (par 4, 0):         gross 4 → par → 1
// Hole 8 (par 5, 0):         gross 5 → par → 1
// Hole 9 (par 4, 0):         gross 4 → par → 1
// Total: 0.5 + 2 + 1 + 2 + 1 + 1 + 1 + 1 + 1 = 10.5
assertEq(hcpRound.total, 10.5, '3-HCP (9h) player mixed round with stroke allocation');

// --- Test 6: full match with team points ---
// Match: Guidos (Spas + CK) vs Zach & Matt. Both teams play front 9.
// Spas: 9h HCP 3, shoots [5,4,3,4,5,3,4,5,4] → 10.5 (from above) + 1 showup = 11.5
// CK: 9h HCP 4, shoots [4,4,3,4,4,3,4,5,4] (par round). Strokes go to 5,2,4,7.
//   H1 (par 4, 0): 4 = par = 1
//   H2 (par 4, 1): 4-1=3 = birdie = 2
//   H3 (par 3, 0): 3 = par = 1
//   H4 (par 4, 1): 4-1=3 = birdie = 2
//   H5 (par 4, 1): 4-1=3 = birdie = 2
//   H6 (par 3, 0): 3 = par = 1
//   H7 (par 4, 1): 4-1=3 = birdie = 2
//   H8 (par 5, 0): 5 = par = 1
//   H9 (par 4, 0): 4 = par = 1
// Total: 1+2+1+2+2+1+2+1+1 = 13 + 1 showup = 14
// Guidos team total: 11.5 + 14 = 25.5
//
// Zach: 9h HCP 6, strokes go to 5,2,4,7,6,1: shoots [5,5,4,5,5,4,5,6,5]
//   H1 (par 4, 1): 5-1=4 = par = 1
//   H2 (par 4, 1): 5-1=4 = par = 1
//   H3 (par 3, 0): 4 = bogey = 0.5
//   H4 (par 4, 1): 5-1=4 = par = 1
//   H5 (par 4, 1): 5-1=4 = par = 1
//   H6 (par 3, 1): 4-1=3 = par = 1
//   H7 (par 4, 1): 5-1=4 = par = 1
//   H8 (par 5, 0): 6 = bogey = 0.5
//   H9 (par 4, 0): 5 = bogey = 0.5
// Total: 7.5 + 1 showup = 8.5
//
// Matt didn't show. Sub Tom plays in his place. 9h HCP 5, strokes to 5,2,4,7,6.
// Tom shoots [4,5,3,4,4,3,4,5,4]:
//   H1 (par 4, 0): 4 = par = 1
//   H2 (par 4, 1): 5-1=4 = par = 1
//   H3 (par 3, 0): 3 = par = 1
//   H4 (par 4, 1): 4-1=3 = birdie = 2
//   H5 (par 4, 1): 4-1=3 = birdie = 2
//   H6 (par 3, 1): 3-1=2 = birdie = 2
//   H7 (par 4, 1): 4-1=3 = birdie = 2
//   H8 (par 5, 0): 5 = par = 1
//   H9 (par 4, 0): 4 = par = 1
// Total: 13 + 1 showup = 14
//
// Zach & Matt team total: 8.5 + 14 = 22.5
// Guidos win 25.5 vs 22.5 → 3 team points to Guidos (split 1.5/1.5)
const match = {
  teamA: 'golfin-guidos',
  teamB: 'zach-matt',
  nine: 'front',
  participants: [
    { teamId: 'golfin-guidos', playerId: 'spas',     isSub: false, handicap: 3, holes: [5,4,3,4,5,3,4,5,4] },
    { teamId: 'golfin-guidos', playerId: 'ckheinle', isSub: false, handicap: 4, holes: [4,4,3,4,4,3,4,5,4] },
    { teamId: 'zach-matt',     playerId: 'zach-john',isSub: false, handicap: 6, holes: [5,5,4,5,5,4,5,6,5] },
    { teamId: 'zach-matt',     playerId: 'sub-tom',  isSub: true,  subName: 'Tom', handicap: 5, holes: [4,5,3,4,4,3,4,5,4] },
  ],
};
const result = Scoring.scoreMatch(match, scorecard);
assertEq(result.teamATotal, 25.5, 'Guidos team total');
assertEq(result.teamBTotal, 22.5, 'Zach & Matt team total');
assertEq(result.teamAPoints, 3, 'Guidos win 3 team points');
assertEq(result.teamBPoints, 0, 'Losers get 0 team points');
assertEq(result.playerResults[0].individualPoints, 11.5, 'Spas individual points');
assertEq(result.playerResults[1].individualPoints, 14, 'CK individual points');
assertEq(result.playerResults[0].teamPointsShare, 1.5, 'Spas team share');
assertEq(result.playerResults[3].isSub, true, 'Tom flagged as sub');
assertEq(result.playerResults[3].individualPoints, 14, 'Sub Tom individual points');

// --- Test 7: solo player (regular partner absent, no sub) wins all 3 team points ---
const soloMatch = {
  teamA: 'golfin-guidos',
  teamB: 'zach-matt',
  nine: 'front',
  participants: [
    { teamId: 'golfin-guidos', playerId: 'spas', isSub: false, handicap: 3, holes: [5,4,3,4,5,3,4,5,4] }, // 11.5
    { teamId: 'zach-matt',     playerId: 'zach-john', isSub: false, handicap: 6, holes: [5,5,4,5,5,4,5,6,5] }, // 8.5
  ],
};
const soloResult = Scoring.scoreMatch(soloMatch, scorecard);
assertEq(soloResult.teamATotal, 11.5, 'Solo Spas team total');
assertEq(soloResult.teamBTotal, 8.5, 'Solo Zach team total');
assertEq(soloResult.teamAPoints, 3, 'Solo winner gets full 3 team points');
assertEq(soloResult.playerResults[0].teamPointsShare, 3, 'Solo player gets all 3 team points');

// --- Test 8: tied match ---
const tieMatch = {
  teamA: 'a', teamB: 'b', nine: 'front',
  participants: [
    { teamId: 'a', playerId: 'p1', isSub: false, handicap: 0, holes: [4,4,3,4,4,3,4,5,4] }, // par round = 9+1=10
    { teamId: 'b', playerId: 'p2', isSub: false, handicap: 0, holes: [4,4,3,4,4,3,4,5,4] }, // par round = 10
  ],
};
const tieRes = Scoring.scoreMatch(tieMatch, scorecard);
assertEq(tieRes.teamAPoints, 1.5, 'Tie awards 1.5');
assertEq(tieRes.teamBPoints, 1.5, 'Tie awards 1.5');

console.log('\nAll tests:', process.exitCode === 1 ? 'SOME FAILED' : 'PASSED');
