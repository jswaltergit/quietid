# QuietID website

Static HTML build of the QuietID site (a Veilant product). This is the design prototype that will be converted into a WordPress block theme.

## Structure

- `index.html` — Home page
- `assets/css/quietid.css` — styles; the custom properties at the top map to the future `theme.json` tokens
- `assets/js/site.js` — page-load motion, scroll reveals, counters, menus, hero scan demo
- `assets/img/` — logo set, favicons, radar mark, hero background

## Fonts

`assets/fonts/` holds Basier Square (400, 500, 600, 700) and Carta Noir (700) as WOFF2, licensed to Veilant. Carta Noir is used only for the hero headline, always in caps.

## Preview

Run a local server from the repo root, for example `python3 -m http.server`, then open http://localhost:8000.

## Still to build

Plans (Individuals & families, Enterprise), Pricing, How it works, About us, Login, Sign up.
