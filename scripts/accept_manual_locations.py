#!/usr/bin/env python3
"""Accept manually reviewed X locations and build one pin per named place.

Reads hand-curated per-post reviews (no regex place guessing).
Groups proof URLs on one official-form row per location.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
from fill_x_drafts import merge_answers, merge_located, place_slug  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
HARVEST = ROOT / "data" / "x-harvest"
MANUAL = HARVEST / "manual-locations.json"
TWEETS = HARVEST / "tweets.jsonl"
DRAFTS = HARVEST / "drafts.json"
ACCEPTED = HARVEST / "accepted.json"
VISITS_TS = ROOT / "src" / "data" / "visits.ts"

# Canonical spellings for keys seen in manual review.
ALIASES = {
    ("santuk pimpri", "hingoli", "maharashtra"): ("Santuk Pimpri", None, "Hingoli", "Maharashtra"),
    ("santuk pimpari", "hingoli", "maharashtra"): ("Santuk Pimpri", None, "Hingoli", "Maharashtra"),
    ("limbala makta", "hingoli", "maharashtra"): ("Limbala Makta", None, "Hingoli", "Maharashtra"),
    ("limbala", "hingoli", "maharashtra"): ("Limbala", None, "Hingoli", "Maharashtra"),
    ("kadoli", "hingoli", "maharashtra"): ("Kadoli", None, "Hingoli", "Maharashtra"),
    ("kaimri", "hisar", "haryana"): ("Kaimri", "Nalwa", "Hisar", "Haryana"),
    ("kaimri", "nalwa", "hisar", "haryana"): ("Kaimri", "Nalwa", "Hisar", "Haryana"),
    ("camri", "hisar", "haryana"): ("Kaimri", "Nalwa", "Hisar", "Haryana"),
    ("ujani", "latur", "maharashtra"): ("Ujani", "Ausa", "Latur", "Maharashtra"),
    ("ujani", "ausa", "latur", "maharashtra"): ("Ujani", "Ausa", "Latur", "Maharashtra"),
    ("jawali", "latur", "maharashtra"): ("Jawali", "Ausa", "Latur", "Maharashtra"),
    ("jawali", "ausa", "latur", "maharashtra"): ("Jawali", "Ausa", "Latur", "Maharashtra"),
    ("ausa", "latur", "maharashtra"): (None, "Ausa", "Latur", "Maharashtra"),
    ("ausa", None, "latur", "maharashtra"): (None, "Ausa", "Latur", "Maharashtra"),
    ("rampura kanwarpura", "jaipur", "rajasthan"): ("Rampura Kanwarpura", "Bagru", "Jaipur", "Rajasthan"),
    ("rampura-kanwarpura", "jaipur", "rajasthan"): ("Rampura Kanwarpura", "Bagru", "Jaipur", "Rajasthan"),
    ("rampura", "jaipur", "rajasthan"): ("Rampura Kanwarpura", "Bagru", "Jaipur", "Rajasthan"),
    ("kanwarpura", "jaipur", "rajasthan"): ("Rampura Kanwarpura", "Bagru", "Jaipur", "Rajasthan"),
    ("bagru", "jaipur", "rajasthan"): ("Bagru", "Bagru", "Jaipur", "Rajasthan"),
    ("bagaru", "jaipur", "rajasthan"): ("Bagru", "Bagru", "Jaipur", "Rajasthan"),
    ("karishunda", "bankura", "west bengal"): ("Karishunda", None, "Bankura", "West Bengal"),
    ("gangala", "barmer", "rajasthan"): ("Gangala", None, "Barmer", "Rajasthan"),
    ("dagadga", "alwar", "rajasthan"): ("Dagadga", "Raini", "Alwar", "Rajasthan"),
    ("jodhawas", "alwar", "rajasthan"): ("Jodhawas", None, "Alwar", "Rajasthan"),
    ("adarsh nagar", "hisar", "haryana"): ("Adarsh Nagar", None, "Hisar", "Haryana"),
    ("pawana", "nanded", "maharashtra"): ("Pawana", "Himayatnagar", "Nanded", "Maharashtra"),
    ("pawana", "himayatnagar", "nanded", "maharashtra"): ("Pawana", "Himayatnagar", "Nanded", "Maharashtra"),
    ("chhatarpur village (bhati mines)", None, None, "delhi"): ("Chhatarpur", None, "South Delhi", "Delhi"),
    ("kotlamubarak", None, None, "delhi"): ("Kotlamubarak", None, "South Delhi", "Delhi"),
    ("baz-baj", "south 24 parganas", "west bengal"): ("Baz-Baj", None, "South 24 Parganas", "West Bengal"),
    ("bandi", None, None, "jharkhand"): ("Bandi", None, None, "Jharkhand"),
    ("padru", None, None, None): ("Padru", None, None, "Jharkhand"),
    (None, "bano", None, "jharkhand"): (None, "Bano", "Simdega", "Jharkhand"),
    (None, "bise pip", "madhubani", "bihar"): (None, "Bise Pip", "Madhubani", "Bihar"),
    (None, None, "siddharthnagar", "uttar pradesh"): (None, None, "Siddharthnagar", "Uttar Pradesh"),
    (None, None, "jhunjhunu", "rajasthan"): (None, None, "Jhunjhunu", "Rajasthan"),
    (None, None, "bareilly", "uttar pradesh"): (None, None, "Bareilly", "Uttar Pradesh"),
    (None, None, "bharatpur", "rajasthan"): (None, None, "Bharatpur", "Rajasthan"),
    (None, None, "jodhpur", "rajasthan"): (None, None, "Jodhpur", "Rajasthan"),
    (None, None, "jhajjar", "haryana"): (None, None, "Jhajjar", "Haryana"),
    (None, None, "jaipur", "rajasthan"): (None, None, "Jaipur", "Rajasthan"),
    (None, "bagru", "jaipur", "rajasthan"): ("Bagru", "Bagru", "Jaipur", "Rajasthan"),
    (None, None, "latur", "maharashtra"): (None, None, "Latur", "Maharashtra"),
    (None, "ausa", "latur", "maharashtra"): (None, "Ausa", "Latur", "Maharashtra"),
}

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
    ("Kotlamubarak", "South Delhi", "Delhi"): (28.51, 77.19, "city_approx"),
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
}

EXISTING_VISIT_IDS = {
    "santuk-pimpri-zp",
    "sambhajinagar-municipal-primary",
    "masina-khas-primary",
    "meerut-govt",
    "pakur-govt",
    "bano-tarpaulin",
    "dima-hasao-govt",
    "morena-primary",
    "rampura-kanwarpura",
    "bankura-indus",
    "siwan-former-school",
}


def norm(value: str | None) -> str | None:
    if not value:
        return None
    return re.sub(r"\s+", " ", value.strip())


def canonical(village, block, district, state):
    key = tuple(
        (norm(x) or "").lower() if x is not None else None
        for x in (village, block, district, state)
    )
    # trim trailing Nones for alias lookup variants
    while key and key[-1] is None:
        key = key[:-1]
    if key in ALIASES:
        return ALIASES[key]
  # try without block
    short = (key[0] if len(key) > 0 else None, key[-2] if len(key) >= 2 else None, key[-1] if len(key) >= 1 else None)
    if len(key) >= 3:
        short2 = (key[0], key[-2], key[-1])
        if short2 in ALIASES:
            return ALIASES[short2]
    village = norm(village)
    block = norm(block)
    district = norm(district)
    state = norm(state)
    return village, block, district, state


def location_key(village, block, district, state):
    village, block, district, state = canonical(village, block, district, state)
    # Group on village+district+state only (block is metadata, not a separate pin).
    return (
        (village or "").lower(),
        (district or "").lower(),
        (state or "").lower(),
    )


def tweet_index() -> dict[str, dict]:
    out = {}
    for line in TWEETS.read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            out[str(row["id"])] = row
    return out


def row_from_review(rec: dict, tweets: dict[str, dict]) -> dict | None:
    if rec.get("skip") or rec.get("skipReason"):
        return None
    village = rec.get("village")
    block = rec.get("block")
    district = rec.get("district")
    state = rec.get("state")
    if not any([village, block, district, state]):
        return None
    village, block, district, state = canonical(village, block, district, state)
    post_id = str(rec.get("postId") or rec.get("id") or "")
    tweet = tweets.get(post_id, {})
    text = tweet.get("text") or rec.get("quote") or ""
    return {
        "id": f"x-{post_id}",
        "ingestStatus": "draft" if (village or district) else "no_village",
        "village": village,
        "district": district,
        "state": state,
        "block": block,
        "observedOn": tweet.get("created_at"),
        "answers": {},
        "evidencePhotos": "yes" if tweet.get("media") else "not_mentioned",
        "additionalComments": text,
        "proofUrls": [tweet.get("url") or rec.get("url")],
        "sourceId": post_id,
        "sourceUser": tweet.get("user"),
        "sourceCreatedAt": tweet.get("created_at"),
        "quote": rec.get("quote"),
    }


def load_reviews() -> list[dict]:
    if MANUAL.exists():
        return json.loads(MANUAL.read_text(encoding="utf-8"))
    files = sorted(HARVEST.glob("manual-review-*.json"))
    merged = []
    for path in files:
        merged.extend(json.loads(path.read_text(encoding="utf-8")))
    return merged


def main() -> None:
    reviews = load_reviews()
    tweets = tweet_index()
    rows = []
    for rec in reviews:
        row = row_from_review(rec, tweets)
        if row:
            rows.append(row)
    grouped: dict[tuple, list[dict]] = {}
    for row in rows:
        key = location_key(row["village"], row.get("block"), row["district"], row["state"])
        grouped.setdefault(key, []).append(row)
    accepted = []
    for key, group in sorted(grouped.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        village, block, district, state = canonical(
            group[0]["village"], group[0].get("block"), group[0]["district"], group[0]["state"]
        )
        draft = merge_located(group)
        draft["village"] = village
        draft["block"] = block
        draft["district"] = district
        draft["state"] = state
        draft["ingestStatus"] = "accepted"
        draft["agentReasoning"] = (
            f"Accepted from manual post-by-post review. {len(group)} X posts name this place. "
            "Official 10-point form filled only from tweet text."
        )
        accepted.append(draft)
    OUT = {
        "summary": {
            "manualPostsReviewed": len(reviews),
            "postsWithNamedPlace": len(rows),
            "locationGroups": len(accepted),
            "accepted": len(accepted),
            "note": "Each row is one named place from explicit post text. Not invented.",
        },
        "locations": accepted,
    }
    ACCEPTED.write_text(json.dumps(OUT, indent=2, ensure_ascii=False), encoding="utf-8")
    # refresh drafts.json accepted view
    DRAFTS.write_text(
        json.dumps(
            {
                "summary": {
                    **OUT["summary"],
                    "withPlace": len(rows),
                    "pinned": len(accepted),
                    "groupedByLocation": True,
                },
                "drafts": accepted,
                "unlocated": [],
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    summary_path = HARVEST / "summary.json"
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    summary.update(
        {
            "withPlace": len(rows),
            "locationGroups": len(accepted),
            "accepted": len(accepted),
            "pinned": len(accepted),
            "manualReview": True,
            "campaignPosts": 530,
        }
    )
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(OUT["summary"], indent=2))
    for loc in accepted:
        print(
            f"  {loc['sourceCount']:3}  {loc.get('village') or '—'}, "
            f"{loc.get('district') or '—'}, {loc.get('state') or '—'}",
            flush=True,
        )


if __name__ == "__main__":
    main()
