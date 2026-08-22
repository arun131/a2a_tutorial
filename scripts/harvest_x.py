#!/usr/bin/env python3
"""Harvest public School Thik Karo posts from X.

Writes incrementally. Target is 600 proven posts — never invented.
"""

from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "x-harvest"
OUT_DIR.mkdir(parents=True, exist_ok=True)

UA = "SchoolThikKaroFieldMap/0.2 (+https://github.com/arun131/a2a_tutorial; civic archive)"
STATUS_RE = re.compile(
    r"(?:https?://(?:www\.)?(?:x|twitter)\.com/|/)?([A-Za-z0-9_]+)/status(?:es)?/(\d{5,})"
)

SEED_IDS = {
    "2088531713156903305": "abhijeet_dipke",
    "2088811021456593279": "Schoolthikkaro",
    "2088046771515625741": "SchoolThikKaro_",
    "2088811151190856017": "Schoolthikkaro",
    "2088565905123106989": "SchoolThikKaro_",
    "2088063887791051062": "Schoolthikkaro",
    "2088540563918508247": "AskAmbedkar",
}

# AskAmbedkar is only a seed, not a full-timeline scrape.
PRIORITY_ACCOUNTS = [
    "Cockroachisback",
    "abhijeet_dipke",
    "SchoolThikKaro_",
]

SEARCH_QUERIES = [
    "site:x.com SchoolThikKaro",
    "site:twitter.com #SchoolThikKaro",
    "site:x.com from:Cockroachisback school",
    "site:x.com from:abhijeet_dipke SchoolThikKaro",
    "site:x.com \"School Thik Karo\"",
    "site:x.com \"स्कूल ठीक करो\"",
    "site:x.com Santuk Pimpri school",
    "site:x.com Hingoli Dipke school",
    "site:x.com \"Zilla Parishad\" SchoolThikKaro",
    "SchoolThikKaro twitter.com",
]


def fetch(url: str, timeout: int = 10, data: bytes | None = None) -> tuple[int, str]:
    req = urllib.request.Request(
        url,
        data=data,
        headers={"User-Agent": UA, "Accept": "text/html,application/json,*/*"},
        method="POST" if data else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", "replace")
    except Exception as exc:
        return 0, str(exc)


def add_status(found: dict[str, dict], user: str, status_id: str, via: str) -> None:
    rec = found.setdefault(
        status_id,
        {"id": status_id, "user": user, "via": [], "url": f"https://x.com/{user}/status/{status_id}"},
    )
    if user and rec.get("user") in ("", "unknown"):
        rec["user"] = user
        rec["url"] = f"https://x.com/{user}/status/{status_id}"
    if via not in rec["via"]:
        rec["via"].append(via)


def extract_statuses(text: str, via: str, found: dict[str, dict]) -> int:
    before = len(found)
    for user, status_id in STATUS_RE.findall(text):
        if user.lower() in {"i", "intent", "share", "hashtag", "search", "explore"}:
            continue
        add_status(found, user, status_id, via)
    return len(found) - before


def ddg_search(query: str) -> str:
    data = urllib.parse.urlencode({"q": query}).encode()
    _, body = fetch("https://html.duckduckgo.com/html/", data=data, timeout=15)
    return body


def wayback_cdx(account: str, limit: int = 400) -> str:
    parts = []
    for host in ("x.com", "twitter.com"):
        url = (
            "https://web.archive.org/cdx/search/cdx?"
            + urllib.parse.urlencode(
                {
                    "url": f"{host}/{account}/status/*",
                    "output": "json",
                    "fl": "original",
                    "collapse": "urlkey",
                    "limit": limit,
                    "filter": "statuscode:200",
                    "from": "20260801",
                }
            )
        )
        _, body = fetch(url, timeout=25)
        parts.append(body)
    return "\n".join(parts)


def fx_tweet(user: str, status_id: str) -> dict | None:
    for handle in (user if user not in ("", "unknown") else "i", "i"):
        url = f"https://api.fxtwitter.com/{handle}/status/{status_id}"
        code, body = fetch(url, timeout=8)
        if code != 200:
            continue
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            continue
        tweet = payload.get("tweet") or payload
        if isinstance(tweet, dict) and (tweet.get("text") or tweet.get("id")):
            return tweet
    return None


def load_existing() -> dict[str, dict]:
    path = OUT_DIR / "tweets.jsonl"
    rows: dict[str, dict] = {}
    if not path.exists():
        return rows
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        rows[str(row["id"])] = row
    return rows


def append_tweet(row: dict) -> None:
    with (OUT_DIR / "tweets.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(row, ensure_ascii=False) + "\n")


def slim_row(rec: dict, tweet: dict) -> dict:
    user = (
        (tweet.get("author") or {}).get("screen_name")
        or tweet.get("user_screen_name")
        or rec.get("user")
        or "unknown"
    )
    return {
        "id": rec["id"],
        "user": user,
        "url": f"https://x.com/{user}/status/{rec['id']}",
        "created_at": tweet.get("created_at") or tweet.get("date"),
        "text": tweet.get("text") or tweet.get("full_text") or "",
        "via": rec.get("via"),
        "media": tweet.get("media"),
    }


def collect_ids() -> dict[str, dict]:
    found: dict[str, dict] = {}
    for status_id, user in SEED_IDS.items():
        add_status(found, user, status_id, "seed")

    for account in PRIORITY_ACCOUNTS:
        print(f"wayback {account}", flush=True)
        n = extract_statuses(wayback_cdx(account), f"wayback:{account}", found)
        print(f"  +{n} total={len(found)}", flush=True)

    for query in SEARCH_QUERIES:
        print(f"ddg {query}", flush=True)
        n = extract_statuses(ddg_search(query), f"ddg:{query}", found)
        print(f"  +{n} total={len(found)}", flush=True)
        time.sleep(0.4)

    (OUT_DIR / "ids.json").write_text(
        json.dumps({"count": len(found), "ids": found}, indent=2),
        encoding="utf-8",
    )
    return found


def fetch_all(found: dict[str, dict]) -> None:
    existing = load_existing()
    todo = [rec for rec in found.values() if rec["id"] not in existing]
    print(f"already have {len(existing)}; fetching {len(todo)}", flush=True)
    fetched = len(existing)
    misses = 0

    def work(rec: dict) -> tuple[dict, dict | None]:
        return rec, fx_tweet(rec["user"], rec["id"])

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(work, rec) for rec in todo]
        for fut in as_completed(futures):
            rec, tweet = fut.result()
            if tweet is None:
                misses += 1
                continue
            row = slim_row(rec, tweet)
            append_tweet(row)
            existing[row["id"]] = row
            fetched += 1
            extract_statuses(json.dumps(tweet), "snowball", found)
            if fetched % 25 == 0:
                print(f"  fetched {fetched} misses {misses} known {len(found)}", flush=True)

    # One snowball pass for new ids
    extra = [rec for rec in found.values() if rec["id"] not in existing]
    print(f"snowball leftover {len(extra)}", flush=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(work, rec) for rec in extra]
        for fut in as_completed(futures):
            rec, tweet = fut.result()
            if tweet is None:
                misses += 1
                continue
            row = slim_row(rec, tweet)
            append_tweet(row)
            existing[row["id"]] = row
            fetched += 1

    summary = {
        "compiledOn": time.strftime("%Y-%m-%d"),
        "requested": 600,
        "uniqueIdsSeen": len(found),
        "fetched": len(existing),
        "missesThisRun": misses,
        "note": (
            "600 is the harvest target, not a number to invent. "
            "tweets.jsonl is only posts fxtwitter actually returned."
        ),
    }
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)


def main() -> None:
    found = collect_ids()
    fetch_all(found)


if __name__ == "__main__":
    main()
