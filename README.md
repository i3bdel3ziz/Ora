# Timesheet App — V1.5

![Version](https://img.shields.io/badge/version-1.5-blue) ![Status](https://img.shields.io/badge/status-stable-brightgreen)

Live-HTML app for monthly hour tracking with a Sun–Thu workweek (Fri+Sat weekend).

## What's in V1.5
- Version badge in header, About footer with repo link
- Fixed daily target: **8 h**
- Fixed weekend: **Fri + Sat**
- Sun–Thu daily entry grid, weekly subtotals
- **CSV export** (Excel-friendly)
- **PDF export** (print-ready report)
- Trend chart & progress ring
- Month navigation + month/year pickers
- Local storage persistence (data stays in your browser)

## Deploy on GitHub Pages
1. Create or open your repo (e.g., `Timesheet_App`) and ensure the **main** branch exists.
2. Upload `index.html` to the root (drag & drop).
3. Go to **Settings → Pages** and select either:
   - **Deploy from a branch** → **Branch: main** and **Folder: /** → **Save**, or
   - **GitHub Actions** → choose the static site workflow.
4. Visit `https://<your-username>.github.io/Timesheet_App/?_v=1.5`.
   - If the page still shows an older version, hard refresh (Ctrl/Cmd + Shift + R) or change the cache-buster after `?_v=`.

## Local use
Just open `index.html` in a browser (double-click). No server required.

## Changelog
See `CHANGELOG.md`.
