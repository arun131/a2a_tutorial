#!/usr/bin/env python3
"""Append accepted X-harvest locations to visits.ts as map pins."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ACCEPTED = ROOT / "data" / "x-harvest" / "accepted.json"
VISITS = ROOT / "src" / "data" / "visits.ts"

COORDS = {
    ("Santuk Pimpri", "Hingoli", "Maharashtra"): (19.72, 77.11, "village_approx"),
    ("Limbala Makta", "Hingoli", "Maharashtra"): (19.68, 77.05, "village_approx"),
    ("Limbala", "Hingoli", "Maharashtra"): (19.68, 77.05, "village_approx"),
    ("Kadoli", "Hingoli", "Maharashtra"): (19.70, 77.08, "village_approx"),
    ("Kaimri", "Hisar", "Haryana"): (28.75, 75.55, "village_approx"),
    ("Ujani", "Latur", "Maharashtra"): (18.24, 76.50, "village_approx"),
    ("Jawali", "Latur", "Maharashtra"): (18.25, 76.48, "village_approx"),
    (None, "Latur", "Maharashtra"): (18.41, 76.56, "district_approx"),
    ("Rampura Kanwarpura", "Jaipur", "Rajasthan"): (26.81, 75.545, "village_approx"),
    ("Bagru", "Jaipur", "Rajasthan"): (26.82, 75.54, "village_approx"),
    (None, "Jaipur", "Rajasthan"): (26.92, 75.79, "city_approx"),
    ("Karishunda", "Bankura", "West Bengal"): (23.15, 87.62, "village_approx"),
    ("Gangala", "Barmer", "Rajasthan"): (25.75, 71.38, "village_approx"),
    ("Dagadga", "Alwar", "Rajasthan"): (27.55, 76.65, "village_approx"),
    ("Jodhawas", "Alwar", "Rajasthan"): (27.56, 76.64, "village_approx"),
    ("Adarsh Nagar", "Hisar", "Haryana"): (29.15, 75.72, "village_approx"),
    ("Pawana", "Nanded", "Maharashtra"): (19.45, 77.55, "village_approx"),
    ("Chhatarpur", "South Delhi", "Delhi"): (28.50, 77.18, "city_approx"),
    ("Baz-Baj", "South 24 Parganas", "West Bengal"): (22.47, 88.32, "village_approx"),
    ("Bandi", None, "Jharkhand"): (23.35, 85.33, "village_approx"),
    ("Padru", None, "Jharkhand"): (23.40, 85.30, "village_approx"),
    (None, "Simdega", "Jharkhand"): (22.66, 84.93, "block_approx"),
    (None, "Madhubani", "Bihar"): (26.35, 86.07, "block_approx"),
    (None, "Siddharthnagar", "Uttar Pradesh"): (27.27, 82.93, "district_approx"),
    (None, "Jhunjhunu", "Rajasthan"): (28.13, 75.40, "district_approx"),
    (None, "Bareilly", "Uttar Pradesh"): (28.37, 79.43, "district_approx"),
    (None, "Bharatpur", "Rajasthan"): (27.22, 77.49, "district_approx"),
    (None, "Jodhpur", "Rajasthan"): (26.24, 73.02, "city_approx"),
    (None, "Jhajjar", "Haryana"): (28.61, 76.66, "district_approx"),
    (None, "Chhatrapati Sambhajinagar", "Maharashtra"): (19.876, 75.343, "city_approx"),
    (None, "Dima Hasao", "Assam"): (25.17, 93.02, "district_approx"),
    (None, "Meerut", "Uttar Pradesh"): (28.985, 77.706, "city_approx"),
    (None, "Pakur", "Jharkhand"): (24.634, 87.849, "district_approx"),
    (None, "Morena", "Madhya Pradesh"): (26.495, 78.001, "district_approx"),
    ("Masina Khas", "Siddharthnagar", "Uttar Pradesh"): (27.18, 82.93, "village_approx"),
    (None, "Bankura", "West Bengal"): (23.23, 87.07, "district_approx"),
    (None, "Rajasthan", "Rajasthan"): (27.02, 74.22, "district_approx"),
    (None, "Hingoli", "Maharashtra"): (19.72, 77.15, "district_approx"),
    (None, "Hansi", "Haryana"): (29.10, 75.96, "district_approx"),
}

# If a visit id already exists for this place, only add X sources — do not duplicate pin.
EXISTING = {
    ("Santuk Pimpri", "Hingoli", "Maharashtra"): "santuk-pimpri-zp",
    ("Masina Khas", "Siddharthnagar", "Uttar Pradesh"): "masina-khas-primary",
    (None, "Chhatrapati Sambhajinagar", "Maharashtra"): "sambhajinagar-municipal-primary",
    (None, "Meerut", "Uttar Pradesh"): "meerut-govt",
    (None, "Pakur", "Jharkhand"): "pakur-govt",
    (None, "Simdega", "Jharkhand"): "bano-tarpaulin",
    (None, "Dima Hasao", "Assam"): "dima-hasao-govt",
    (None, "Morena", "Madhya Pradesh"): "morena-primary",
    ("Rampura Kanwarpura", "Jaipur", "Rajasthan"): "rampura-kanwarpura",
}


def slugify(village, district, state):
    parts = [p for p in (village, district, state) if p]
    slug = "-".join(re.sub(r"[^a-z0-9]+", "-", p.lower()).strip("-") for p in parts)
    return f"x-{slug}"


def answers_ts(answers: dict) -> str:
    items = ", ".join(f'{k}: "{v}"' for k, v in sorted(answers.items()) if v != "not_mentioned")
    return f"withAnswers({{{items}}})" if items else "withAnswers({})"


def source_ts(url: str) -> str:
    return (
        '{ title: "School Thik Karo post on X", publisher: "X", url: "'
        + url.replace('"', '\\"')
        + '" }'
    )


def visit_block(loc: dict) -> str:
    village = loc.get("village")
    district = loc.get("district")
    state = loc.get("state")
    block = loc.get("block")
    key = (village, district, state)
    lat, lng, precision = COORDS.get(key, COORDS.get((None, district, state), (0.0, 0.0, "district_approx")))
    vid = EXISTING.get(key) or slugify(village, district, state)
    if vid in EXISTING.values() and vid != EXISTING.get(key):
        vid = slugify(village, district, state)
    school = (
        f"Government school, {village}"
        if village
        else f"Government school ({district}, name not published)"
    )
    proof = loc.get("proofUrls") or []
    first = proof[0] if proof else ""
    summary = (
        f"Accepted from {loc.get('sourceCount', 1)} X posts that explicitly named "
        f"{', '.join(p for p in (village, block, district, state) if p)}. "
        "Official-form boxes are filled only where the posts stated them."
    )
    comments = (loc.get("additionalComments") or "").replace("`", "'").replace("\\", "\\\\")
    if len(comments) > 500:
        comments = comments[:500] + "…"
    sources = ",\n      ".join(source_ts(u) for u in proof[:8])
    more = ""
    if len(proof) > 8:
        more = f"\n      // +{len(proof) - 8} more X proof URLs in data/x-harvest/accepted.json"
    return f"""  {{
    id: "{vid}",
    recordKind: "x_draft",
    ingestStatus: "accepted",
    schoolName: {json.dumps(school)},
    schoolNameKnown: {str(bool(village)).lower()},
    village: {json.dumps(village)},
    block: {json.dumps(block)},
    district: {json.dumps(district)},
    state: {json.dumps(state)},
    lat: {lat},
    lng: {lng},
    coordinatePrecision: "{precision}",
    observedOn: {json.dumps((loc.get("observedOn") or "2026-08-20")[:10])},
    datePrecision: "day",
    visitor: {json.dumps(loc.get("surveyorName") or "X campaign posts")},
    sourceKind: "x_post",
    auditStatus: "partial",
    answers: {answers_ts(loc.get("answers") or {})},
    summary: {json.dumps(summary)},
    findings: [{json.dumps("Named in campaign posts on X. See proof URLs.")}],
    unknowns: [{json.dumps("Other official-form items were not stated in the compiled X posts.")}],
    criticalNotes: [],
    followUp: "none_reported",
    followUpNote: null,
    additionalComments: {json.dumps(comments)},
    agentReasoning: {json.dumps(loc.get("agentReasoning"))},
    sources: [
      {sources}
    ],
  }}"""


def main() -> None:
    payload = json.loads(ACCEPTED.read_text(encoding="utf-8"))
    locations = payload["locations"]
    text = VISITS.read_text(encoding="utf-8")
    existing_ids = set(re.findall(r'id:\s*"([^"]+)"', text))
    new_blocks = []
    for loc in locations:
        village = loc.get("village")
        district = loc.get("district")
        state = loc.get("state")
        key = (village, district, state)
        if EXISTING.get(key) in existing_ids:
            continue
        block = visit_block(loc)
        vid = re.search(r'id:\s*"([^"]+)"', block).group(1)
        if vid in existing_ids:
            continue
        new_blocks.append(block)
        existing_ids.add(vid)
    if not new_blocks:
        print("no new visit blocks")
        return
    insert = ",\n".join(new_blocks)
    text = text.replace("] as Placed[]).map(placed);", insert + ",\n] as Placed[]).map(placed);")
    VISITS.write_text(text, encoding="utf-8")
    print(f"appended {len(new_blocks)} accepted X visits")


if __name__ == "__main__":
    main()
