# Bogey's and Beers Golf League (BBGL)

Static website for the BBGL — Friday nights at Audubon Golf Course, Buffalo NY. Now in its 5th season.

No build step, no backend, no monthly fee. Just a folder of files served by GitHub Pages.

## Open items to fix before season starts

These came from Brian's emails — confirm and fill in:

- **Handicaps** are all set to 0. After the May 1 handicap round, fill in actual handicaps in `data/teams.json`.
- **Drew & Buddy** — Drew Sive's partner is still TBD.
- **Wagner & Jamie** — needs a team nickname; also confirm Jamie's last name.
- **Tokin' & Strokin'** — confirm Matt's last name.
- **Squatch & The Setup** — confirm Stowe's first name.
- **Big Fred & Jack** — needs a team nickname (Fred swapped Timmy for Jack Sommer per his April 20 email).
- **Timmy** is currently unmatched — Brian asked the group on April 24 if anyone wanted to pair with him.
- **Throuple & Squatch** are 3-man teams. The score-entry form lets you pick the 2 playing each Friday from a dropdown.

## Features

- **Leaderboard** — recomputes every time scores are committed
- **Teams** — 8 teams with nicknames and handicaps
- **Schedule** — full 14-week double round-robin from May 8 through August 14
- **Stats** — low gross, low net, match-play wins, season averages per player
- **Recaps** — weekly writeup + photos
- **Score Entry** — picks the lineup (handles 3-player teams), enters scores, generates the JSON to drop into the repo

## Scoring rules (built into the engine)

Each weekly match between two teams is worth **5 points**:

- 2 individual pairings, each worth 2 points: 1 for match play, 1 for stroke play (lower net)
- 1 point for the lower combined team net score
- Ties split 0.5 / 0.5

---

## Step-by-step deploy to GitHub Pages

### One-time setup

1. **Create a GitHub account** at https://github.com if you don't have one. The free plan covers everything you need.

2. **Create a new repository.**
   - Go to https://github.com/new
   - Repository name: `bbgl` (or whatever you like — this becomes part of the URL)
   - Visibility: **Public** (required for free GitHub Pages)
   - Do NOT check "Add a README" or "Add .gitignore" — we already have those
   - Click **Create repository**

3. **Install git** if it's not already installed.
   - Mac: open Terminal and run `git --version`. If not found, it'll prompt you to install Xcode Command Line Tools — accept.
   - Windows: download from https://git-scm.com/download/win

4. **Open a terminal in the project folder.**
   - Mac: open Terminal, then `cd` into wherever you put this folder (e.g. `cd ~/Desktop/audubon-golf-league`)
   - Windows: open Git Bash in the folder (right-click → "Git Bash Here")

5. **Push to GitHub.** Run these commands one at a time. Replace `YOUR-USERNAME` with your GitHub username and `bbgl` with the repo name you picked:

   ```bash
   git init
   git add .
   git commit -m "Initial BBGL site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/bbgl.git
   git push -u origin main
   ```

   First push will prompt you to authenticate. Use a **Personal Access Token** (not your password): https://github.com/settings/tokens → Generate new token (classic) → check `repo` scope → copy it and paste when git asks for a password.

6. **Turn on GitHub Pages.**
   - On GitHub, go to your repo → **Settings** (top nav) → **Pages** (left sidebar).
   - Under "Build and deployment" → **Source** → pick **Deploy from a branch**.
   - **Branch** → `main`, folder `/ (root)`. Click **Save**.
   - Wait about a minute. Refresh the Pages settings — at the top you'll see a green box: **"Your site is live at https://YOUR-USERNAME.github.io/bbgl/"**.

7. **Open the link.** The site is live. Share it with the league.

### Custom domain (optional)

If you want `bbgl.com` or similar, buy a domain (Namecheap, Porkbun, etc.), then in GitHub Pages settings under "Custom domain", enter the domain and follow the DNS instructions GitHub gives you.

---

## Brian's weekly workflow

After Friday rounds:

1. Pull the latest changes from GitHub (skip on first time):
   ```bash
   cd path/to/bbgl
   git pull
   ```
2. Open the site in your browser → **Score Entry** page.
3. Pick this week from the dropdown.
4. For each match: pick the two players who actually played (this matters for Throuple and Squatch), enter gross score and confirm handicap, pick the match-play winner of each pairing (or "Halved").
5. Click **Generate JSON**. Verify the points preview looks right. Click **Copy to Clipboard**.
6. In your code editor (or just TextEdit / Notepad), create a new file at `data/scores/week-N.json` (the page tells you the filename) and paste in the JSON.
7. Open `data/manifest.json` and add the week number to `weeksWithScores`:
   ```json
   { "weeksWithScores": [1], "weeksWithRecaps": [] }
   ```
8. Commit and push:
   ```bash
   git add data/
   git commit -m "Week 1 scores"
   git push
   ```
9. Site updates within a minute.

### Adding a recap

1. Create `data/recaps/week-N.json`:
   ```json
   {
     "week": 1,
     "date": "2026-05-08",
     "title": "Season opener at Auddy",
     "body": "Free-form text here. Use \\n for line breaks.",
     "photos": []
   }
   ```
2. Add the week number to `weeksWithRecaps` in `data/manifest.json`.
3. Commit and push.

### Adding photos

1. Drop image files (jpg / png, ideally resized to ~1200px wide) into `photos/`.
2. List the filenames in the recap JSON's `photos` array.
3. Commit and push.

---

## Running locally

The site loads JSON via `fetch()`, which doesn't work over `file://`. Run a quick local server:

```bash
cd bbgl
python3 -m http.server 8000
# then open http://localhost:8000
```

Or with Node:

```bash
npx serve .
```

## File structure

```
bbgl/
├── index.html              Leaderboard (home page)
├── teams.html
├── schedule.html
├── stats.html
├── recaps.html
├── score-entry.html
├── README.md
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── data.js         Loads JSON files
│       ├── scoring.js      The 5-point engine
│       └── ui.js           Shared UI helpers
├── data/
│   ├── league.json         League name, course, season
│   ├── teams.json          Teams + players + handicaps + nicknames
│   ├── schedule.json       14-week double round-robin
│   ├── manifest.json       Which weeks have scores/recaps committed
│   ├── scores/
│   │   └── week-N.json     One file per week (added each Friday)
│   └── recaps/
│       └── week-N.json     Optional weekly writeup
└── photos/                 Drop weekly photos here
```

## Customizing

- **Colors**: search for `emerald` in the HTML files and swap to any Tailwind color.
- **More than 8 teams** or different team sizes: just edit `teams.json` and re-run the schedule generator (or hand-edit `schedule.json`).
- **Different scoring**: edit `assets/js/scoring.js`. The `scoreMatch` function is small and well-commented.

## Roadmap ideas

- Player profile pages with round-by-round chart
- Custom domain (point a real URL at GitHub Pages)
- Lightweight password gate on Score Entry so only Brian sees it
- Move to Supabase free tier when player self-entry becomes valuable
- Switch to Astro once you want components and Markdown for recaps
