# Timesheet_App (GitHub Pages Ready)

Single-file React app with Tailwind CSS. Features:
- Sun–Thu working days (Fri+Sat weekend, Qatar)
- Fixed 8h/day target
- Weekly subtotals, running total
- Per-day highlighting: >8h (green), <8h (amber)
- Keyboard navigation (Enter/Tab/Arrows)
- Dark mode toggle (persisted)
- CSV import/export

## Deploy on GitHub Pages
1) Create/Use public repo `Timesheet_App`.
2) Upload `index.html` to the **root**.
3) If using *Deploy from a branch*: Settings → Pages → Branch `main` + Folder `/ (root)` → Save.
4) Or add a GitHub Actions workflow at `.github/workflows/pages.yml` (see below).

## Optional Actions workflow
```
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Upload static site
        uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
