# Element Structure

[Open the website](https://reiddollent.github.io/element-explorer/)

118 elements with electron configurations, shell diagrams, interactive s/p/d/f orbital shapes, and 17 compound examples. English and 中文; English is the default.

## Run locally

Open `dist/index.html`, or run `node server.cjs` and visit http://127.0.0.1:4173.

## Edit and publish

- `dist/app.js`: interactions and diagrams
- `dist/i18n.js`: language selection and English compound text
- `dist/index.html` / `styles.css`: page content and layout
- `dist/data.js`: compound structures and Chinese text
- `scripts/build-elements.cjs`: regenerate element data from the saved source

Run `node verify.cjs` before pushing. Changes on `main` deploy through GitHub Pages.

## Data and models

Reference data: PubChem, with the lawrencium configuration from NIST. Predictions and missing values are labelled. Diagrams are schematic, not quantum-chemistry calculations. See [sources](sources/README.md) for details.
