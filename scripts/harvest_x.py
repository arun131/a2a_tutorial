#!/usr/bin/env python3
"""Harvest public School Thik Karo posts from X via search + fxtwitter.

Does not invent tweets. Writes whatever unique status IDs it can prove.
Target requested by the field map: 600 posts. Actual count is whatever
search and snowballing return.
"""

from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "x-harvest"
OUT_DIR.mkdir(parents=True, exist_ok=True)

UA = "SchoolThikKaroFieldMap/0.1 (+https://github.com/arun131/a2a_tutorial; civic archive)"
STATUS_RE = re.compile(
    r"(?:https?://(?:www\.)?(?:x|twitter)\.com/|/)?([A-Za-z0-9_]+)/status(?:es)?/(\d{5,})"
)
ID_RE = re.compile(r"/status(?:es)?/(\d{5,})")

SEED_IDS = {
    "2088531713156903305",
    "2088811021456593279",
    "2088046771515625741",
    "2088811151190856017",
    "2088565905123106989",
    "2088063887791051062",
    "2088540563918508247",
}

ACCOUNTS = [
    "Cockroachisback",
    "abhijeet_dipke",
    "SchoolThikKaro_",
    "Schoolthikkaro",
    "SchoolThikKaroo",
    "SchoolThikKroJP",
    "AskAmbedkar",
]

SEARCH_QUERIES = [
    "site:x.com SchoolThikKaro",
    "site:twitter.com SchoolThikKaro",
    "site:x.com #SchoolThikKaro",
    "site:x.com from:Cockroachisback School",
    "site:x.com from:abhijeet_dipke SchoolThikKaro",
    "site:x.com from:SchoolThikKaro_",
    "site:x.com Cockroachisback school",
    "site:x.com abhijeet_dipke ZP school",
    "site:x.com \"School Thik Karo\"",
    "site:x.com \"स्कूल ठीक करो\"",
    "site:x.com Cockroach Janta Party school audit",
    "site:x.com Santuk Pimpri school",
    "site:x.com Hingoli ZP school Dipke",
    "site:x.com Limbala Makta school",
    "site:x.com Ausa Ujani school",
    "site:x.com \"Zilla Parishad\" Cockroach",
    "SchoolThikKaro x.com",
    "SchoolThikKaro twitter",
    '"School Thik Karo" site:x.com village',
    '"School Thik Karo" site:x.com district',
    "Cockroachisback status school",
    "abhijeet_dipke status SchoolThikKaro",
]

NEWS_URLS = [
    "https://timesofindia.indiatimes.com/city/aurangabad/school-thik-karo-abhijeet-dipkes-1st-school-audit-flags-lack-of-basic-amenities-in-hingoli-govt-school-watch/articleshow/133257562.cms",
    "https://news.careers360.com/cjp-school-thik-karo-1500-audit-govt-schools-find-neglect-toilets-teacher-infra-shortage-maharashtra-up-mp-assam-jharkhand-bihar",
    "https://www.hindustantimes.com/india-news/windows-cctv-being-replaced-repair-work-begins-at-school-in-abhijeet-dipkes-village-amid-school-thik-karo-campaign-101786981688624.html",
]


def fetch(url: str, timeout: int = 25, data: bytes | None = None) -> tuple[int, str]:
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/json,*/*",
        },
        method="POST" if data else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", "replace")
            return resp.status, body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        return exc.code, body
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
    _, body = fetch("https://html.duckduckgo.com/html/", data=data)
    return body


def bing_search(query: str) -> str:
    url = "https://www.bing.com/search?" + urllib.parse.urlencode({"q": query, "count": 50})
    _, body = fetch(url)
    return body


def brave_search(query: str) -> str:
    url = "https://search.brave.com/search?" + urllib.parse.urlencode({"q": query})
    _, body = fetch(url)
    return body


def wayback_cdx(account: str) -> str:
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
                    "limit": 400,
                    "filter": "statuscode:200",
                }
            )
        )
        _, body = fetch(url, timeout=40)
        parts.append(body)
    return "\n".join(parts)


def fx_tweet(user: str, status_id: str) -> dict | None:
    for host in ("api.fxtwitter.com", "api.vxtwitter.com"):
        url = f"https://{host}/{user}/status/{status_id}"
        code, body = fetch(url, timeout=20)
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


def fx_profile(user: str) -> dict | None:
    code, body = fetch(f"https://api.fxtwitter.com/{user}", timeout=15)
    if code != 200:
        return None
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return None


def snowball_from_tweet(tweet: dict, found: dict[str, dict]) -> None:
    blob = json.dumps(tweet, ensure_ascii=False)
    extract_statuses(blob, "snowball", found)
    for key in ("replying_to_status", "in_reply_to_status_id_str", "quoted_tweet"):
        val = tweet.get(key)
        if isinstance(val, dict):
            tid = str(val.get("id") or val.get("id_str") or "")
            user = val.get("author", {}).get("screen_name") if isinstance(val.get("author"), dict) else val.get("screen_name")
            if tid:
                add_status(found, user or "unknown", tid, "quoted")
        elif val:
            add_status(found, tweet.get("author", {}).get("screen_name") or "unknown", str(val), "reply")


def main() -> None:
    found: dict[str, dict] = {}
    for status_id in SEED_IDS:
        add_status(found, "unknown", status_id, "seed")

    profiles = {}
    for account in ACCOUNTS:
        profile = fx_profile(account)
        profiles[account] = {
            "ok": bool(profile),
            "tweets": (profile or {}).get("user", {}).get("tweets") if profile else None,
            "media_count": (profile or {}).get("user", {}).get("media_count") if profile else None,
            "followers": (profile or {}).get("user", {}).get("followers") if profile else None,
        }
        print(f"profile {account}: {profiles[account]}", flush=True)
        time.sleep(0.3)

    for account in ACCOUNTS:
        print(f"wayback {account}", flush=True)
        body = wayback_cdx(account)
        n = extract_statuses(body, f"wayback:{account}", found)
        print(f"  +{n} total={len(found)}", flush=True)
        time.sleep(0.6)

    for query in SEARCH_QUERIES:
        print(f"ddg {query}", flush=True)
        n = extract_statuses(ddg_search(query), f"ddg:{query}", found)
        print(f"  +{n} total={len(found)}", flush=True)
        time.sleep(0.8)
        print(f"bing {query}", flush=True)
        n = extract_statuses(bing_search(query), f"bing:{query}", found)
        print(f"  +{n} total={len(found)}", flush=True)
        time.sleep(0.8)

    for url in NEWS_URLS:
        print(f"news {url}", flush=True)
        _, body = fetch(url)
        n = extract_statuses(body, f"news:{url}", found)
        print(f"  +{n} total={len(found)}", flush=True)

    tweets_path = OUT_DIR / "tweets.jsonl"
    index_path = OUT_DIR / "index.json"
    fetched: list[dict] = []
    fetched_ids = set()

    # Fetch newest-looking (larger snowflake) first
    ordered = sorted(found.values(), key=lambda r: int(r["id"]), reverse=True)
    print(f"fetching {len(ordered)} unique status ids via fxtwitter", flush=True)

    for rec in ordered:
        if rec["id"] in fetched_ids:
            continue
        tweet = fx_tweet(rec["user"] if rec["user"] != "unknown" else "i", rec["id"])
        if tweet is None and rec["user"] != "unknown":
            tweet = fx_tweet("i", rec["id"])
        if tweet is None:
            rec["fetch"] = "miss"
            continue
        rec["fetch"] = "ok"
        rec["user"] = (
            (tweet.get("author") or {}).get("screen_name")
            or tweet.get("user_screen_name")
            or rec["user"]
        )
        rec["url"] = f"https://x.com/{rec['user']}/status/{rec['id']}"
        rec["text"] = tweet.get("text") or tweet.get("full_text") or ""
        rec["created_at"] = tweet.get("created_at") or tweet.get("date")
        rec["raw"] = tweet
        fetched.append(rec)
        fetched_ids.add(rec["id"])
        snowball_from_tweet(tweet, found)
        if len(fetched) % 10 == 0:
            print(f"  fetched {len(fetched)} / known {len(found)}", flush=True)
        time.sleep(0.25)

    # Second pass for IDs discovered during snowball
    extra = [r for r in found.values() if r["id"] not in fetched_ids]
    extra.sort(key=lambda r: int(r["id"]), reverse=True)
    print(f"snowball pass {len(extra)} leftover ids", flush=True)
    for rec in extra:
        tweet = fx_tweet(rec["user"] if rec["user"] != "unknown" else "i", rec["id"])
        if tweet is None:
            rec["fetch"] = rec.get("fetch") or "miss"
            continue
        rec["fetch"] = "ok"
        rec["user"] = (
            (tweet.get("author") or {}).get("screen_name")
            or tweet.get("user_screen_name")
            or rec["user"]
        )
        rec["url"] = f"https://x.com/{rec['user']}/status/{rec['id']}"
        rec["text"] = tweet.get("text") or tweet.get("full_text") or ""
        rec["created_at"] = tweet.get("created_at") or tweet.get("date")
        rec["raw"] = tweet
        fetched.append(rec)
        fetched_ids.add(rec["id"])
        time.sleep(0.25)

    slim = []
    with tweets_path.open("w", encoding="utf-8") as fh:
        for rec in fetched:
            row = {
                "id": rec["id"],
                "user": rec["user"],
                "url": rec["url"],
                "created_at": rec.get("created_at"),
                "text": rec.get("text"),
                "via": rec.get("via"),
                "quote_count": (rec.get("raw") or {}).get("quote_count"),
                "reply_count": (rec.get("raw") or {}).get("replies"),
                "media": (rec.get("raw") or {}).get("media"),
            }
            slim.append(row)
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    summary = {
        "compiledOn": time.strftime("%Y-%m-%d"),
        "requested": 600,
        "uniqueIdsSeen": len(found),
        "fetched": len(fetched),
        "missed": sum(1 for r in found.values() if r.get("fetch") != "ok"),
        "profiles": profiles,
        "accounts": ACCOUNTS,
        "note": (
            "600 is the harvest target, not a number to invent. "
            "This file is only posts we could prove from public search, Wayback, or fxtwitter."
        ),
    }
    index_path.write_text(json.dumps({"summary": summary, "ids": list(found.values())}, indent=2, default=str), encoding="utf-8")
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
