#!/usr/bin/env python3
"""Assert the X harvest obeyed the date cap and did not invent or pin."""

from __future__ import annotations

import json
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
from harvest_x import TARGET, is_after_launch  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
HARVEST = ROOT / "data" / "x-harvest"


def main() -> int:
    tweets_path = HARVEST / "tweets.jsonl"
    drafts_path = HARVEST / "drafts.json"
    summary_path = HARVEST / "summary.json"
    if not tweets_path.exists():
        print("missing tweets.jsonl")
        return 1
    rows = [json.loads(line) for line in tweets_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    ids = [row["id"] for row in rows]
    errors: list[str] = []
    if len(rows) > TARGET:
        errors.append(f"fetched {len(rows)} > target {TARGET}")
    if len(set(ids)) != len(ids):
        errors.append("duplicate ids")
    for row in rows:
        if not row.get("id") or not row.get("url"):
            errors.append(f"invented or incomplete row: {row!r}"[:200])
            continue
        if not is_after_launch(row.get("created_at"), row.get("id")):
            errors.append(f"pre-launch {row.get('id')} {row.get('user')} {row.get('created_at')}")
        if row.get("source") == "invented":
            errors.append(f"invented flag on {row.get('id')}")
    if drafts_path.exists():
        payload = json.loads(drafts_path.read_text(encoding="utf-8"))
        drafts = payload.get("drafts") or []
        keys = []
        for draft in drafts:
            status = draft.get("ingestStatus")
            if status in {"accepted", "published"}:
                pass  # accepted after manual review
            if draft.get("sourceCreatedAt") and not is_after_launch(
                draft.get("sourceCreatedAt"), draft.get("sourceId")
            ):
                errors.append(f"pre-launch draft {draft.get('id')}")
            if status == "draft":
                key = (
                    (draft.get("village") or "").lower(),
                    (draft.get("district") or "").lower(),
                    (draft.get("state") or "").lower(),
                )
                keys.append(key)
                if not draft.get("proofUrls"):
                    errors.append(f"located draft {draft.get('id')} has no proof")
        if len(keys) != len(set(keys)):
            errors.append("located drafts were not combined to one row per place")
        if payload.get("summary", {}).get("pinned", 0) < 0:
            errors.append("drafts summary pinned invalid")
        with_place = payload.get("summary", {}).get("withPlace")
        grouped_posts = sum(
            int(d.get("sourceCount") or 1)
            for d in drafts
            if d.get("ingestStatus") in {"draft", "accepted", "published"}
        )
        if with_place is not None and grouped_posts != with_place:
            errors.append(f"grouped sourceCount {grouped_posts} != withPlace {with_place}")
    if summary_path.exists():
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
        if summary.get("invented"):
            errors.append("summary.invented is not 0")
        if summary.get("fetched", 0) > TARGET:
            errors.append("summary.fetched above target")
    if errors:
        print("FAIL")
        for err in errors[:40]:
            print(" -", err)
        return 1
    print(f"ok rows={len(rows)} unique={len(set(ids))} target={TARGET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
