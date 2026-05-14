# Bogey's and Beers Golf League (BBGL)

Static website for the BBGL — Friday nights at Audubon Golf Course, Amherst NY. Now in its 5th season.

No build step, no backend, no monthly fee. Just a folder of files served by GitHub Pages.

## 2026 format (new this year)

Brian rewrote the league format on 5/14/2026 to simplify admin and accommodate subs more cleanly. The site reflects the new format.

### Weekly play
- 2-man teams, 9 holes per week, alternating front 9 and back 9.
- Real scoring begins **Friday May 22, 2026**. May 15 is a handicap-setting round.

### Individual scoring (per hole, net to par)
- Hole-in-one: **5 pts**
- Albatross (3 under): **4**
- Eagle (2 under): **3**
- Birdie (1 under): **2**
- Par (net even): **1**
- Bogey (1 over): **0.5**
- Double bogey (2 over): **0**
- Triple or worse: **-0.5**
- Show-up bonus (per player who participated): **+1**

Net score uses each player's strokes received on that hole based on the Audubon scorecard's handicap stroke indexes. 9-hole handicap = round(full handicap / 2), strokes allocated to the lowest-indexed holes in the 9 being played.

### Team matchup
- Each team's two individual point totals are summed.
- Higher team total -> **3 team points** to the winning team (split 1.5 / 1.5 between the players who played).
- A solo player whose partner is absent (no sub) wins all 3 team points if their team wins.
- Tied total -> 1.5 / 1.5.

### Standings
- **Individual Standings** (the home page leaderboard) accumulates each player's hole points + show-up bonus + their share of team points. Winner takes the Season Points Leader prize.
- **Team Standings** accumulate the 3 weekly team points. Winner takes the Season Team Champions prize. Playoff seeding is by team total.

### Subs
- Welcome any week -- text Brian at 716-622-7356 first.
- Earn individual points like a roster player and share team points with their playing partner.
- Subs appear on the individual leaderboard tagged "(sub)" once they play.
- Sub eligibility for playoffs: must have played at least 2 regular season rounds.

### Playoffs
- Same per-hole individual scoring. Show-up bonus still applies. Team matchup points (the 3) are NOT awarded in playoffs.
- Head-to-head, single elimination. Higher combined individual points wins.
- Tiebreakers in order: (1) higher single individual score; (2) best single-hole net; (3) sudden-death random hole, best ball.

### Fees
- $50 / player season fee -- prizes + end-of-season party.
- $5 / player weekly skins + CTP (optional).

## Open items

These need confirmation:

- **Handicaps** are all 0 until the 5/15 handicap-setting round finalizes them. Update `data/teams.json`.
- **Big Fred & buddy** -- Fred K. Heinle's partner is still TBD.
- **Subs registry** -- add a `subs.json` if you want to track season-long sub stats with stable IDs (optional; the current setup auto-creates IDs from sub names on the fly).

## Teams (2026)

1. **Golfin' Guidos** -- Michael Spasiano + Christopher Karl Heinle
2. **Timmy & Paul B** -- Timmy + Paul B (new this year)
3. **Big Fred & buddy** -- Fred K. Heinle + TBD
4. **Kevin & Brian** -- Kevin + Brian Burkhardt
5. **Vito & Hannigan** -- Vito Gigante + Mark Hannigan
6. **Drew & Jamie** -- Drew Sive + Jamie
7. **Joe Czelusta & Adam** -- Joe Czelusta + Adam Burkhardt
8. **Zach & Matt** -- Zach John + Matt

## Audubon scorecard (Men's tees)

| Hole | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 |
|------|---|---|---|---|---|---|---|---|---|----|----|----|----|----|----|----|----|----|
| Par  | 4 | 4 | 3 | 4 | 4 | 3 | 4 | 5 | 4 | 4  | 4  | 5  | 4  | 4  | 3  | 4  | 4  | 4  |
| HCP  | 11| 3 |13 | 5 | 1 | 9 | 7 |15 |17 | 2  | 18 | 12 | 8  | 6  | 16 | 14 | 4  | 10 |

Front par 35, back par 36, total 71.

## Weekly workflow

After Friday's round:

1. Open `score-entry.html` in a browser (locally or on the live site).
2. Pick the week. The "nine" field defaults from the schedule; override if needed.
3. For each match, enter the 9 hole scores per player + their full 18-hole handicap. The per-row points preview as you type.
4. Add subs with "+ Add sub" if anyone played as a fill-in. Clear a regular player's row with the x button if they didn't play.
5. Click "Generate JSON & Preview". Confirm point totals look right.
6. Click "Copy JSON".
7. In your repo, save it to `data/scores/week-N.json`, add `N` to `weeksWithScores` in `data/manifest.json`, then:
   ```sh
   git add data/
   git commit -m "Week N scores"
   git push
   ```
8. Live site updates in ~60 seconds.

## Project layout

```
.
├── index.html            Leaderboard (individual + team standings + last week's results)
├── teams.html            Rosters
├── schedule.html         Full season schedule with front/back markers
├── stats.html            Accolades (Season Points Leader, most birdies, etc.)
├── recaps.html           Weekly write-ups
├── score-entry.html      The one Brian uses each Friday -- hole-by-hole grid
├── README.md             You are here
├── data/
│   ├── league.json       Name, season, format description
│   ├── teams.json        Roster
│   ├── schedule.json     14 weeks of matchups + which nine each week
│   ├── scorecard.json    Audubon's par and HCP index per hole
│   ├── manifest.json     Which week JSONs to load
│   ├── scores/week-N.json   Per-week scores (Brian creates these)
│   └── recaps/week-N.json   Per-week recap blurbs (optional)
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── data.js       Data loader
│       ├── scoring.js    The new scoring engine
│       └── ui.js         Header + helpers
└── test-scoring.js       Sanity tests (run: `node test-scoring.js`)
```

## Running locally

```sh
cd bbgl
python3 -m http.server
open http://localhost:8000
```
