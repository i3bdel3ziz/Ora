# ⏱️ ORA ![Made with Love](https://img.shields.io/badge/made%20with-❤️-red.svg)

![Version](https://img.shields.io/badge/version-1.9-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-CDN-38B2AC?logo=tailwind-css&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222?logo=github&logoColor=white)
![Repo Size](https://img.shields.io/github/repo-size/i3bdel3ziz/Timesheet_App)
![Last Commit](https://img.shields.io/github/last-commit/i3bdel3ziz/Timesheet_App)
![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)


**ORA** is a lightweight time-tracking and hours management app designed for Sun–Thu working weeks (Fri+Sat weekend). It helps you manage daily entries, track shortages/exceeding hours, and visualize your month with smart insights.

---


## 📌 Release Timeline


## New in 1.9.1 — (Current)**
📆 *Leave balances panel (year-based)*
  - Annual leave: **30 workdays** + **carry‑in (up to 10)** — configurable per year.
  - Sick leave total: **10 workdays** across both types.
  - Sick leave without medical certificate: **max 3 workdays** (subset of total 10).
  - Auto-calculates **used year-to-date** by scanning all months saved for the selected year.
  - Displays **remaining balances** live.
  - Daily leave tagging (tracking + optional auto-hours) Per day: cycle **None → Annual → Sick (MC) → Sick (No MC)**.
  - Toggle **“Leave sets 8h”** in the header to automatically set **8h** for any day marked as leave.
  - CSV/Excel/PDF exports include **leave type** and **holiday name**.

### **V1.9 — (Current)**
✨ *Smarter insights & AI boost*  
- Weekly summary cards (totals + averages)  
- Editable holidays (toggle + name)  
- Advanced charts → stacked weekly bar + cumulative w/ rolling avg  
- Goal projection calculator  
- Overtime tracker  
- AI Q&A assistant (forecast, shortage, best weekday, etc.)  
- AI insights digest + anomaly hints  
- Compact mode for mobile  
- Keyboard shortcuts (F/C/H)  
- Exports: CSV, Excel, PDF, JSON  


### **V1.8**
📊 *Bringing intelligence & visuals*  
- Heatmap for daily hours (Sun–Thu)  
- Cumulative vs Target chart  
- Productivity insights (weekday averages)  
- AI Q&A panel (local queries)  
- Monthly summary + forecast  
- In-app alerts for low progress (removed in 1.8.3 for clarity)  


### **V1.7**
🛠️ *Projections & automation*  
- Holiday toggle (auto 8h)  
- Long-day option (9.5h)  
- Compact exports (CSV/PDF)  
- Charts section introduced  
- Data restore/import (JSON backup)  
- Mobile sticky totals bar  


### **V1.6 and below**
🏗️ *Core functionality built*  
- Sun–Thu workweek (Fri+Sat weekends excluded)  
- Daily entries grid (8h/day default)  
- Fill all / Clear all buttons  
- Shortage/exceed calculator (with HH:MM support)  
- Target vs Actual summary  
- LocalStorage persistence (data saved in browser)  

---

## 🚀 Usage

Open directly via GitHub Pages: 👉 [ORA on GitHub Pages](https://i3bdel3ziz.github.io/Ora/)

Data is stored **locally in your browser** (no server required).

---

## 🛠️ Developer Notes
- Built with React 18 UMD (production build, no JSX in browser).  
- Styling via TailwindCSS CDN (for simplicity).  
- Ready-to-deploy `index.html` + `app.bundle.js` bundle.  
