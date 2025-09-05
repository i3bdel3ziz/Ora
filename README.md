# Timesheet App — V1.6

![Version](https://img.shields.io/badge/version-1.6-blue) ![Status](https://img.shields.io/badge/status-stable-brightgreen)

Live-HTML app for monthly hour tracking with a Sun–Thu workweek (Fri+Sat weekend).

## What's new in V1.6
- One "Long day" picker (Sun–Thu) that fills to **9.5 h** by default
- Persisted "Long day" in local storage
- "Fill all" now uses **9.5 h** for that weekday and **8 h** for others

## Core features
- Fixed daily target: **8 h**
- Fixed weekend: **Fri + Sat**
- Sun–Thu daily entry grid, weekly subtotals
- **CSV export** (Excel-friendly)
- **PDF export** (print-ready report)
- Trend chart & progress ring
- Month navigation + Reset
- Local storage persistence (data stays in your browser)

## Deploy on GitHub Pages
1. Upload `index.html` to your repo root (main branch).
2. Enable GitHub Pages from Settings → Pages (Branch: main, Folder: /).
3. Visit `https://<your-username>.github.io/Timesheet_App/?_v=1.6`.
   - If the page shows an older version, hard refresh (Ctrl/Cmd + Shift + R) or change the cache-buster `?_v=` value.
