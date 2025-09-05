# Timesheet App — V1.4

![Version](https://img.shields.io/badge/version-1.4-blue) ![Status](https://img.shields.io/badge/status-stable-brightgreen)

Live-HTML app for monthly hour tracking with a Sun–Thu workweek (Fri+Sat weekend).

## What’s in V1.4
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

4. Visit `https://<your-username>.github.io/Timesheet_App/?_v=1.4`.
   - If the page still shows an older version, hard refresh (Ctrl/Cmd + Shift + R) or change the cache-buster after `?_v=`.

## Local use
Just open `index.html` in a browser (double-click). No server required.

## Changelog
### 1.4 — 2025-09-05
- ✅ Fixed light-only design (removed dark mode)
- ✅ Fixed weekend hard-coded to **Fri+Sat** and target to **8h/day**
- ✅ Kept **Fill all**, **Clear all**, monthly navigation
- ✅ Added **CSV** & **PDF** exports
- ✅ Added trend chart & progress ring summary
- ✅ Improved reliability and simplified code

### 1.3
- Initial simplified build with shortage/exceed summary and daily grid.

---

If you’d like a logo or your company name in the PDF header, open an issue or ask in chat.
