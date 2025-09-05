# Timesheet App — V1.7.6

A lightweight web app to track working hours in Qatar’s Sun–Thu week (Fri+Sat weekend).
Built with **React + Tailwind**, runs fully client-side, no backend required.

---

## 🚀 Features (as of V1.7.6)
- Fixed **Qatar weekend (Fri+Sat excluded)**.
- **8h daily target** with one configurable **Long Day (9.5h)**.
- **Fill all / Clear all** buttons (Fill respects Long Day).
- **Trend Chart** with dashed 8h line.
- **Progress Ring** showing completion %.
- **Weekly subtotals & averages** displayed below each week.
- **Quick month jump** dropdown + Reset + Prev/Next navigation.
- **Export options**:
  - CSV (spreadsheet-ready)
  - PDF (printable report)
  - JSON (backup/restore timesheet data)
- **Mobile sticky totals bar** for quick glance.
- **LocalStorage persistence** — data stays in your browser.
- **Footer** with version + build number + last updated timestamp.

---

## 📦 Deploy
Upload `index.html` to your GitHub Pages repo, then visit:

```
https://<your-username>.github.io/Timesheet_App/?_v=1.7.6
```

Hard refresh (`Ctrl+Shift+R`) may be needed after redeploy.

---

## 📜 License
MIT — free to use & modify.
