# Timesheet App — V1.7

![Version](https://img.shields.io/badge/version-1.7-blue) ![Status](https://img.shields.io/badge/status-stable-brightgreen)

Live-HTML app for monthly hour tracking with a Sun–Thu workweek (Fri+Sat weekend).

## What's new in V1.7
- Visual highlight for the **Long day** column (Sun–Thu) with a small pill (9.5h).
- **Weekly averages** shown next to weekly subtotals.
- **Color-coded summary**: Green ≥100%, Amber 90–99%, Red <90%.
- **Backup JSON** and **Restore JSON** (export/import your data).
- **Mobile sticky totals** banner (Target / Actual / Diff).
- **Quick month jump** dropdown (last 24 months and next 12).

## Core features kept from V1.6
- Fixed daily target: **8 h**, with one Long day at **9.5 h** for Fill all.
- Fixed weekend: **Fri + Sat** (Sun–Thu working grid).
- Trend chart & progress ring.
- CSV & PDF export.
- Fill all / Clear all.
- Month navigation + Reset.
- Local storage persistence (data stays in your browser).

## Deploy on GitHub Pages
1. Upload `index.html` to your repo root (main branch).
2. Enable GitHub Pages from Settings → Pages (Branch: main, Folder: /).
3. Visit `https://<your-username>.github.io/Timesheet_App/?_v=1.7`.
   - If the page shows an older version, hard refresh (Ctrl/Cmd + Shift + R) or change the cache-buster `?_v=` value.

## Local use
Just open `index.html` in a browser (double-click). No server required.
