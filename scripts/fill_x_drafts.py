#!/usr/bin/env python3
"""Fill official 10-point drafts from harvested X posts.

Never invent a village. Unmentioned questions stay not_mentioned.
Never pin. ingestStatus stays draft / no_village until a human accepts.
Posts before 15 August 2026 are dropped, including Dipke.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
from harvest_x import is_after_launch  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
HARVEST = ROOT / "data" / "x-harvest"
OUT = HARVEST / "drafts.json"
OFFICIAL_USERS = {"cockroachisback", "abhijeet_dipke", "schoolthikkaro_"}

QUESTIONS = [
    "q1_water",
    "q2_toilets",
    "q3_electricity",
    "q4_buildings",
    "q5_playground",
    "q6_ptr",
    "q7_timetable",
    "q8_attendance",
    "q9_blackboards",
    "q10_clerk",
    "q11_textbooks",
    "q12_scholarships",
    "q13_meals_regular",
    "q14_meals_hygiene",
    "q15_safety",
    "q16_safety_resources",
    "q17_safety_resources_repeat",
    "q18_accessibility",
    "q19_library",
    "q20_computers",
]

CAMPAIGN_RE = re.compile(
    r"school\s*thik\s*karo|स्कूल\s*ठीक|#schoolthikkaro|"
    r"zilla parishad|\bzp school\b|govt school|government school|"
    r"mid[- ]day|UDISE|सरकारी स्कूल",
    re.I,
)

NO_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("q1_water", re.compile(r"no (safe |drinking )?water|पानी नहीं|unsafe drinking water", re.I)),
    ("q2_toilets", re.compile(r"toilet|washroom|urinal|शौचालय", re.I)),
    ("q3_electricity", re.compile(r"no (electricity|power|fan)|बिजली नहीं", re.I)),
    ("q4_buildings", re.compile(r"broken window|collapse|caved|dilapidat|slab|roof|unsafe building", re.I)),
    ("q5_playground", re.compile(r"playground|boundary wall|मैदान", re.I)),
    ("q13_meals_regular", re.compile(r"mid[- ]day meal|mdm|kitchen|खाना", re.I)),
    ("q15_safety", re.compile(r"collapse|fire|structural|unsafe|snake", re.I)),
    ("q18_accessibility", re.compile(r"ramp|disabled|accessib|no road", re.I)),
    ("q19_library", re.compile(r"no library|without books", re.I)),
    ("q20_computers", re.compile(r"no computer|defunct computer|कंप्यूटर नहीं", re.I)),
]

DISTRICTS = {
    "Hingoli": "Maharashtra",
    "Latur": "Maharashtra",
    "Solapur": "Maharashtra",
    "Chhatrapati Sambhajinagar": "Maharashtra",
    "Raigad": "Maharashtra",
    "Meerut": "Uttar Pradesh",
    "Siddharthnagar": "Uttar Pradesh",
    "Pratapgarh": "Uttar Pradesh",
    "Morena": "Madhya Pradesh",
    "Balaghat": "Madhya Pradesh",
    "Pakur": "Jharkhand",
    "Simdega": "Jharkhand",
    "Bankura": "West Bengal",
    "Siwan": "Bihar",
    "Faridabad": "Haryana",
    "Jaipur": "Rajasthan",
    "Dima Hasao": "Assam",
    "Bengaluru": "Karnataka",
}

NAMED_VILLAGES = {
    "Santuk Pimpri": ("Hingoli", "Maharashtra"),
    "Limbala Makta": ("Hingoli", "Maharashtra"),
    "Dhegaj": ("Hingoli", "Maharashtra"),
    "Ujani": ("Latur", "Maharashtra"),
    "Ekambi": ("Latur", "Maharashtra"),
    "Donwada Yelthi": ("Chhatrapati Sambhajinagar", "Maharashtra"),
    "Kondivade": ("Raigad", "Maharashtra"),
    "Masina Khas": ("Siddharthnagar", "Uttar Pradesh"),
    "Kadipur": ("Pratapgarh", "Uttar Pradesh"),
    "Patharwada": ("Balaghat", "Madhya Pradesh"),
    "Rampura Kanwarpura": ("Jaipur", "Rajasthan"),
    "Rampura": ("Jaipur", "Rajasthan"),
    "Kanwarpura": ("Jaipur", "Rajasthan"),
    "Bagru": ("Jaipur", "Rajasthan"),
    "Khedi Kalan": ("Faridabad", "Haryana"),
    "Atmadpur": ("Faridabad", "Haryana"),
}

VILLAGE_RE = re.compile(
    r"(?:in|at|from)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s+village",
    re.I,
)
VILLAGE_STOP = {
    "kids",
    "still",
    "primary",
    "government",
    "govt",
    "school",
    "zilla",
    "parishad",
    "native",
    "his",
    "her",
    "the",
    "this",
    "that",
    "our",
    "your",
    "their",
    "a",
    "an",
}


def empty_answers() -> dict[str, str]:
    return {key: "not_mentioned" for key in QUESTIONS}


def is_campaign(text: str, user: str) -> bool:
    blob = text or ""
    if re.search(r"jail\s*thik\s*karo", blob, re.I):
        return False
    if re.search(r"strategy meet|recruitment exam|JPSC|JSSC|MMRDA|degree", blob, re.I):
        if not re.search(r"school thik karo|स्कूल ठीक|#SchoolThikKaro|govt school|government school", blob, re.I):
            return False
    if CAMPAIGN_RE.search(blob):
        return True
    if (user or "").lower() in OFFICIAL_USERS and re.search(r"school|स्कूल|शिक्षा", blob, re.I):
        return True
    return False


def place_of(text: str) -> tuple[str | None, str | None, str | None]:
    blob = text or ""
    for village, (district, state) in NAMED_VILLAGES.items():
        if re.search(re.escape(village), blob, re.I):
            return village, district, state
    for district, state in DISTRICTS.items():
        if re.search(rf"\b{re.escape(district)}\b", blob, re.I):
            village_match = VILLAGE_RE.search(blob)
            village = village_match.group(1).strip() if village_match else None
            if village and village.lower() in VILLAGE_STOP:
                village = None
            return village, district, state
    village_match = VILLAGE_RE.search(blob)
    if village_match:
        village = village_match.group(1).strip()
        if village.lower() not in VILLAGE_STOP and "school" not in village.lower():
            return village, None, None
    return None, None, None


def answers_from(text: str) -> dict[str, str]:
    answers = empty_answers()
    blob = text or ""
    toilet_problem = re.search(r"(dirty|filthy|locked|broken|no ).{0,12}(toilet|washroom)|toilet.{0,16}(dirty|locked|no water)", blob, re.I)
    if toilet_problem:
        answers["q2_toilets"] = "no"
    for key, pat in NO_PATTERNS:
        if key == "q2_toilets":
            continue
        if pat.search(blob):
            # Mention of a facility is not automatically a NO unless a failure word is nearby
            if key in {"q5_playground", "q13_meals_regular"} and not re.search(
                r"no |not |without |broken |dirty |waterlog", blob, re.I
            ):
                continue
            answers[key] = "no"
    return answers


def main() -> None:
    path = HARVEST / "tweets.jsonl"
    if not path.exists():
        print("no tweets.jsonl yet")
        return
    drafts = []
    no_village = 0
    skipped_unrelated = 0
    skipped_prelaunch = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        if not is_after_launch(row.get("created_at"), row.get("id")):
            skipped_prelaunch += 1
            continue
        text = row.get("text") or ""
        user = row.get("user") or ""
        if not is_campaign(text, user):
            skipped_unrelated += 1
            continue
        village, district, state = place_of(text)
        answers = answers_from(text)
        status = "draft" if (village or district) else "no_village"
        if status == "no_village":
            no_village += 1
        drafts.append(
            {
                "id": f"x-{row['id']}",
                "ingestStatus": status,
                "schoolName": None,
                "udiseCode": None,
                "surveyorName": user,
                "village": village,
                "gramPanchayat": None,
                "district": district,
                "state": state,
                "classesCovered": None,
                "studentCount": None,
                "teacherCount": None,
                "observedOn": row.get("created_at"),
                "timeOfVisit": None,
                "answers": answers,
                "overallCondition": "not_mentioned",
                "evidencePhotos": "yes" if row.get("media") else "not_mentioned",
                "topConcerns": [None, None, None],
                "additionalComments": text,
                "agentReasoning": (
                    "Filled only from the tweet text. Unmentioned official-form "
                    "boxes left blank. Not a pin."
                ),
                "proofUrls": [row.get("url")],
                "sourceId": row.get("id"),
                "sourceUser": user,
                "sourceCreatedAt": row.get("created_at"),
            }
        )
    summary = {
        "campaignPosts": len(drafts),
        "withPlace": sum(1 for d in drafts if d["ingestStatus"] == "draft"),
        "noVillage": no_village,
        "skippedUnrelated": skipped_unrelated,
        "skippedPreLaunch": skipped_prelaunch,
        "pinned": 0,
        "note": "Drafts are not map pins. Place is taken from the tweet text only. Nothing is accepted or pinned here.",
    }
    OUT.write_text(json.dumps({"summary": summary, "drafts": drafts}, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
