# School Thik Karo Field Map

A public field record of government-school visits made during Cockroach Janta Party’s **School Thik Karo** campaign, and of news reporting that named the same places.

The campaign posts are scattered across Instagram and X. This page puts the visits that can be named from public sources on one sheet of India — a drawn map, a synced list, and a dossier that says what was found and what was not confirmed.

It is **not** an official CJP product. CJP has said 1,200–1,500 people joined the first wave of audits. This file only maps visits that a newsroom or a named campaign account tied to a place. A thin map is more honest than a guessed one.

## What a record contains

- School name, or a clear note that the name was not published
- Village / block / district / state
- Approximate coordinates, with the precision labelled
- A plain-language summary
- The official CJP 10-point / 20-question survey form (YES / NO / N/A). Silence stays **not mentioned** — it is never treated as a pass
- Place identification from page 1 of that form: school, UDISE, village, gram panchayat, district, classes, students, teachers
- A link back to the article or post

## Run it

```bash
npm install
npm test
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

A static copy of the last build lives in `docs/` so it can be opened from a CDN or GitHub Pages.

## Add a sighting

Use **Add a sighting** in the app, or edit `src/data/visits.ts` and open a pull request. Do not invent a school name, a coordinate tighter than the source supports, or mark a form box the source did not show.

X harvest lives in `data/x-harvest/`. `scripts/harvest_x.py` pulls public posts. Drafts are only filled where a village or district is in the post. The harvest target is 600 posts — that number is not invented if search returns fewer.

## Map drawing

`public/india-states.json` follows the official map of India as recognised by the Government of India / Survey of India (Jammu & Kashmir and Ladakh in full official extent; Lakshadweep and the Andaman & Nicobar Islands as insets). Source geometry: [india-official-geojson](https://github.com/AbhinavSwami28/india-official-geojson). Pins use latitude and longitude, not the polygons.
