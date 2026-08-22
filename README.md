# School Thik Karo Field Map

A public field record of government-school visits made during Cockroach Janta Party’s **School Thik Karo** campaign, and of news reporting that named the same places.

The campaign posts are scattered across Instagram and X. This page puts the visits that can be named from public sources on one sheet of India — a drawn map, a synced list, and a dossier that says what was found and what was not confirmed.

It is **not** an official CJP product. CJP has said 1,200–1,500 people joined the first wave of audits. This file only maps visits that a newsroom or a named campaign account tied to a place. A thin map is more honest than a guessed one.

## What a record contains

- School name, or a clear note that the name was not published
- Village / block / district / state
- Approximate coordinates, with the precision labelled
- A plain-language summary
- Checklist categories marked **problem**, **not mentioned**, or **reported as all right** — silence is never treated as a pass
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

## Add a sighting

Use **Add a sighting** in the app, or edit `src/data/visits.ts` and open a pull request. Do not invent a school name, a coordinate tighter than the source supports, or a checklist problem the source did not state.

## Map drawing

`public/india-states.json` is a heavily simplified state outline derived from [geohacker/india](https://github.com/geohacker/india). Andaman & Nicobar and Lakshadweep are left off so the mainland and the Northeast can share one plate. The file uses older names (Orissa, Uttaranchal) and does not split Telangana from Andhra Pradesh; pins use latitude and longitude, not those polygons.
