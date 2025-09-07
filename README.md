# ⏱️ ORA — V1.9 (React UMD bundle)

**ORA** is a lightweight time-tracking and hours management app designed for Sun–Thu working weeks (Fri+Sat weekend). It helps you manage daily entries, track shortages/exceeding hours, and visualize your month with smart insights.

---

## 🌟 Features in V1.9

- **Weekly Summary Cards**  
  Clear totals and daily averages per week.

- **Editable Holidays**  
  Toggle holidays per day, add holiday names, auto-counted as 8h, persisted across sessions and exported.

- **Advanced Charts**  
  - Weekly stacked bar (target vs actual)  
  - Cumulative vs Target chart with **5-day rolling average**

- **Goal Projection Calculator**  
  Ask: *“If I work X h/day, when will I reach the target?”*

- **Overtime Tracker**  
  Sum of hours worked beyond 8h/day.

- **AI Q&A Assistant (local)**  
  Query your data in plain text:  
  - *“Overtime?”*  
  - *“Shortage?”*  
  - *“Forecast?”*  
  - *“Remaining working days?”*  
  - *“Best weekday?”*

- **Compact Mode** (smaller paddings, mobile friendly)

- **Keyboard Shortcuts**  
  - `F` = Fill all  
  - `C` = Clear all  
  - `H` = Toggle today holiday

- **Exports**  
  Export to CSV, Excel, PDF, JSON (backup/restore).

---

## 🚀 Usage

Open directly via GitHub Pages:  
👉 [ORA on GitHub Pages](https://i3bdel3ziz.github.io/Timesheet_App/)

Data is stored **locally in your browser** (no server required).

---

## 🛠️ Developer Notes
- Built with React 18 UMD (production build, no JSX in browser).  
- Styling via TailwindCSS CDN (for simplicity).  
- Ready-to-deploy `index.html` + `app.bundle.js` bundle.  
