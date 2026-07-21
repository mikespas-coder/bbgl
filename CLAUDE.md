# BBGL — Claude Code Project Context

## What this is
Static GitHub Pages site for the **Bogey's and Beers Golf League** (BBGL), a 2-man team match-play golf league. No build step — everything is plain HTML/JS/JSON. Repo: `mikespas-coder/bbgl`.

## Pushing to GitHub
The Claude Code web session's GitHub MCP token is **read-only**. To push:
1. User generates a GitHub PAT: github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → check `repo` → generate.
2. User pastes the `ghp_...` token here.
3. Run: `git remote set-url origin https://mikespas-coder:TOKEN@github.com/mikespas-coder/bbgl.git && git push origin claude/access-bbgl-cowork-ovGDg:main && git remote set-url origin https://github.com/mikespas-coder/bbgl.git`
4. User revokes the PAT immediately after.

**Always push to `main`** (not the working branch). The working branch is `claude/access-bbgl-cowork-ovGDg`.

## Key data files
- `data/teams.json` — rosters and 9-hole handicaps
- `data/schedule.json` — 14-week schedule (weeks 1–14, Fridays, skipping July 3)
- `data/scores/week-N.json` — scores for week N
- `data/manifest.json` — lists which weeks have scores/recaps; **must be updated** when adding a new week's scores

## Adding weekly scores
1. Write `data/scores/week-N.json` (match the format of existing files)
2. Add `N` to `weeksWithScores` in `data/manifest.json`
3. Commit and push

## Nine (front/back) alternation rule
The course alternates front/back every week **regardless of whether the league plays** (e.g. holiday skips still consume a slot). Week 6 (June 26) = back. July 3 = skip (front consumed). Week 7 (July 10) = back. Pattern continues alternating from there.

Current schedule nines: W1=front, W2=back, W3=front, W4=back, W5=front, W6=back, W7=back, W8=front, W9=back, W10=front, W11=back, W12=front, W13=back, W14=front.

## Handicap system
- 9-hole handicaps stored in `teams.json`
- Computed as rolling average of (gross score − par) across all rounds played, capped 0–18
- Updated periodically (last updated through Week 6 of 2026 season)

## Scoring logic
See `scoring.js`. Match play: best net score per hole wins the hole. Team score = combined net of both players. Points awarded per hole won/halved/lost.

## Teams (2026 season)
| ID | Name | Players |
|----|------|---------|
| golfin-guidos | Golfin' Guidos | Spas (13), CK (16) |
| timmy-paul | Timmy & Paul B | Timmy (17), Paul B (14) |
| bt-boys | BT Boys | Big Fred (18), Jack (18) |
| kevin-brian | 2 Birdies, 1 Putt | Kevin (13), Brian (18) |
| vito-hannigan | Vito, Hannigan & Chad | Vito (18), Hannigan (16), Chad (18) — 3-man roster |
| birdie-hunters | Birdie Hunters | Drew (6), Jamie (13) |
| joe-adam | Joe Czelusta & Adam | Joeyso (18), Datti (18) |
| cole-matt | Cole, Matt & Zack | Cole (18), Matt (14), Zack (18) — 3-man roster |

## Score entry UI
`score-entry.html` — password is `bbgl2026`. The nine-picker override works: changing the week resets to scheduled nine, but manually overriding nine after that is preserved.
