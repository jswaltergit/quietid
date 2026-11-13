# QuietID website

Static HTML build of the QuietID site (a Veilant product). This is the design prototype that will be converted into a WordPress block theme.

## Structure

- `index.html` — Home
- `plans-individuals.html`, `plans-enterprise.html` — Plans (Individuals & families, Enterprise with demo form)
- `pricing.html` — plan cards, monthly/annual toggle, comparison table
- `how-it-works.html` — process, timeline, what we can and can't remove
- `about.html` — story, principles, `#security`, `#contact` form
- `login.html`, `signup.html` — account pages; sign-up runs scan › results › plan › account › done on one page
- `privacy.html`, `terms.html` — placeholders for Veilant's legal text
- `docs/QuietID_Site_Architecture_and_Content.docx` — architecture and copy for every page, by section ID
- `assets/css/quietid.css` — styles; the custom properties at the top map to the future `theme.json` tokens
- `assets/js/site.js` — page-load motion, scroll reveals, counters, menus, hero scan demo
- `assets/img/` — logo set, favicons, radar mark, hero background

## Fonts

`assets/fonts/` holds Basier Square (400, 500, 600, 700) and Carta Noir (700) as WOFF2, licensed to Veilant. Carta Noir is used only for the hero headline, always in caps.

## Preview

Run a local server from the repo root, for example `python3 -m http.server`, then open http://localhost:8000.

## Placeholders

Dashed boxes (`.qid-tbd`) mark facts Veilant must confirm: prices, timing, coverage counts, enterprise features, support, legal.
Forms (demo, contact, login, sign-up) have no backend yet; they show their thank-you or next step in place.

## Photography

Photo frames (`.qid-photo`) hold placeholders with the shot description. Replace the placeholder `<div class="qid-photo__ph">…</div>` with `<img src="assets/img/…" alt="…">`; the house grade (natural colour, slightly muted, cool blue-leaning shadows) is applied by CSS. Use licensed images only. Shot list: content doc, GLOBAL-4.

## Editing interior pages

All pages share the Home page's header, footer and icon set. Keep them in sync when the nav or footer changes.
