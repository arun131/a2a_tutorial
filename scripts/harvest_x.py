#!/usr/bin/env python3
"""Harvest real School Thik Karo posts from the official X API.

Rules:
- X_BEARER_TOKEN required. Never invent a row.
- Every post must be on or after 15 August 2026 00:00 UTC (campaign launch),
  including Dipke.
- Target is 600 proven posts. Stop at that cap. Do not pad.
- Official-account timelines after launch are taken in full first; remaining
  slots go to campaign posts that name a place, then the hashtag stream.
- Payment-required / credit errors stop the run. No retry loop.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "x-harvest"
OUT_DIR.mkdir(parents=True, exist_ok=True)

API = "https://api.x.com/2"
UA = "SchoolThikKaroFieldMap/0.3 (+https://github.com/arun131/a2a_tutorial; civic archive)"
TARGET = 600
START_TIME = "2026-08-15T00:00:00.000Z"
CAMPAIGN_START = datetime(2026, 8, 15, tzinfo=timezone.utc)
# Twitter snowflake for 2026-08-15T00:00:00.000Z
MIN_SNOWFLAKE = 2088415371064246272

TWEET_FIELDS = ",".join(
    [
        "created_at",
        "author_id",
        "conversation_id",
        "in_reply_to_user_id",
        "lang",
        "public_metrics",
        "entities",
        "referenced_tweets",
        "geo",
        "source",
        "note_tweet",
    ]
)
USER_FIELDS = "username,name,location,protected"
MEDIA_FIELDS = "type,url,preview_image_url,alt_text"
EXPANSIONS = "author_id,attachments.media_keys,geo.place_id,referenced_tweets.id"
PLACE_FIELDS = "full_name,country,country_code,place_type,geo"

OFFICIAL_USERS = [
    ("abhijeet_dipke", "timeline:abhijeet_dipke"),
    ("Cockroachisback", "timeline:Cockroachisback"),
    ("SchoolThikKaro_", "timeline:SchoolThikKaro_"),
]

PLACE_QUERY = (
    "("
    "Hingoli OR Latur OR Solapur OR Meerut OR Jaipur OR Faridabad OR "
    "Bankura OR Siwan OR Pakur OR Simdega OR Morena OR Balaghat OR "
    "Raigad OR Pratapgarh OR Siddharthnagar OR Bengaluru OR "
    '"Santuk Pimpri" OR "Limbala Makta" OR "Zilla Parishad" OR '
    '"ZP school" OR गांव OR ग्राम OR village OR जिला'
    ") "
    '(#SchoolThikKaro OR "School Thik Karo" OR "स्कूल ठीक करो") '
    "-is:retweet"
)

FILL_QUERIES = [
    ("#SchoolThikKaro -is:retweet", "search:#SchoolThikKaro"),
    ('"स्कूल ठीक करो" -is:retweet', "search:hindi-phrase"),
    ('"School Thik Karo" -is:retweet', "search:english-phrase"),
]


class HarvestStop(RuntimeError):
    """Unrecoverable API condition — do not retry in a loop."""


def parse_created_at(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return parsedate_to_datetime(raw)
    except (TypeError, ValueError, IndexError):
        pass
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


def snowflake_time(status_id: str | int) -> datetime | None:
    try:
        sid = int(status_id)
    except (TypeError, ValueError):
        return None
    if sid < 1000:
        return None
    ms = (sid >> 22) + 1288834974657
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


def is_after_launch(created_at: str | None, status_id: str | int | None = None) -> bool:
    dt = parse_created_at(created_at)
    if dt is not None:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt >= CAMPAIGN_START
    if status_id is not None:
        try:
            return int(status_id) >= MIN_SNOWFLAKE
        except (TypeError, ValueError):
            return False
    return False


def bearer_token() -> str:
    token = os.environ.get("X_BEARER_TOKEN", "").strip()
    if not token:
        raise HarvestStop("X_BEARER_TOKEN is not set")
    return token


def api_get(path: str, params: dict[str, str]) -> dict:
    url = API + path + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {bearer_token()}",
            "User-Agent": UA,
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        if exc.code in {401, 402, 403}:
            raise HarvestStop(f"X API {exc.code}: {body[:400]}") from exc
        if exc.code == 429:
            reset = exc.headers.get("x-rate-limit-reset")
            wait_s = 30
            if reset:
                try:
                    wait_s = max(15, int(reset) - int(time.time()) + 3)
                except ValueError:
                    wait_s = 30
            wait_s = min(wait_s, 960)
            print(f"rate limited; sleeping {wait_s}s", flush=True)
            time.sleep(wait_s)
            return api_get(path, params)
        raise HarvestStop(f"X API {exc.code}: {body[:400]}") from exc


def users_by_id(includes: dict) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for user in includes.get("users") or []:
        out[str(user.get("id"))] = user
    return out


def media_by_key(includes: dict) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for item in includes.get("media") or []:
        key = item.get("media_key")
        if key:
            out[key] = item
    return out


def slim_tweet(
    tweet: dict,
    users: dict[str, dict],
    media: dict[str, dict],
    via: str,
    fallback_user: str | None = None,
) -> dict | None:
    status_id = str(tweet.get("id") or "")
    created = tweet.get("created_at")
    if not status_id or not is_after_launch(created, status_id):
        return None
    if any(ref.get("type") == "retweeted" for ref in tweet.get("referenced_tweets") or []):
        return None
    author = users.get(str(tweet.get("author_id") or ""), {})
    user = author.get("username") or fallback_user or "unknown"
    note = (tweet.get("note_tweet") or {}).get("text")
    text = (note or tweet.get("text") or "").replace("\u2028", "\n").replace("\u2029", "\n")
    media_keys = (tweet.get("attachments") or {}).get("media_keys") or []
    media_items = [media[key] for key in media_keys if key in media]
    return {
        "id": status_id,
        "user": user,
        "user_name": author.get("name"),
        "url": f"https://x.com/{user}/status/{status_id}",
        "created_at": created,
        "text": text,
        "conversation_id": tweet.get("conversation_id"),
        "lang": tweet.get("lang"),
        "metrics": tweet.get("public_metrics"),
        "via": [via],
        "media": media_items or None,
        "place": (tweet.get("geo") or {}).get("place_id"),
        "source": "x_api_v2",
    }


def ingest_payload(
    payload: dict,
    via: str,
    found: dict[str, dict],
    limit: int | None,
    fallback_user: str | None = None,
) -> int:
    added = 0
    users = users_by_id(payload.get("includes") or {})
    media = media_by_key(payload.get("includes") or {})
    for tweet in payload.get("data") or []:
        row = slim_tweet(tweet, users, media, via, fallback_user=fallback_user)
        if row is None:
            continue
        existing = found.get(row["id"])
        if existing:
            if via not in existing["via"]:
                existing["via"].append(via)
            continue
        found[row["id"]] = row
        added += 1
        if limit is not None and len(found) >= limit:
            break
    return added


def common_params(max_results: int = 100) -> dict[str, str]:
    return {
        "start_time": START_TIME,
        "max_results": str(max_results),
        "tweet.fields": TWEET_FIELDS,
        "expansions": EXPANSIONS,
        "user.fields": USER_FIELDS,
        "media.fields": MEDIA_FIELDS,
        "place.fields": PLACE_FIELDS,
    }


def lookup_user(username: str) -> dict:
    payload = api_get(
        f"/users/by/username/{urllib.parse.quote(username)}",
        {"user.fields": "id,username,name,public_metrics"},
    )
    data = payload.get("data")
    if not data:
        raise HarvestStop(f"user lookup failed for {username}: {payload}")
    return data


def user_timeline(username: str, via: str, found: dict[str, dict]) -> int:
    user = lookup_user(username)
    added = 0
    params = common_params(100)
    params["exclude"] = "retweets"
    pages = 0
    path = f"/users/{user['id']}/tweets"
    while True:
        payload = api_get(path, params)
        pages += 1
        added += ingest_payload(payload, via, found, None, fallback_user=username)
        meta = payload.get("meta") or {}
        print(
            f"  {via} page {pages} +{added} unique={len(found)} result_count={meta.get('result_count')}",
            flush=True,
        )
        nxt = meta.get("next_token")
        if not nxt:
            break
        params["pagination_token"] = nxt
        time.sleep(0.2)
    return added


def search_all(query: str, via: str, found: dict[str, dict], limit: int | None = None) -> int:
    added = 0
    params = common_params(500)
    params["query"] = query
    pages = 0
    while True:
        if limit is not None and len(found) >= limit:
            break
        try:
            payload = api_get("/tweets/search/all", params)
        except HarvestStop as exc:
            if "max_results" in str(exc).lower() and params["max_results"] != "100":
                print("search/all rejected 500; retrying at 100", flush=True)
                params["max_results"] = "100"
                payload = api_get("/tweets/search/all", params)
            else:
                raise
        pages += 1
        added += ingest_payload(payload, via, found, limit)
        meta = payload.get("meta") or {}
        nxt = meta.get("next_token")
        print(
            f"  {via} page {pages} +{added} unique={len(found)} result_count={meta.get('result_count')}",
            flush=True,
        )
        write_outputs(found, extra={"partial": True})
        if not nxt or (limit is not None and len(found) >= limit):
            break
        params["next_token"] = nxt
        time.sleep(12)
    return added


def write_outputs(found: dict[str, dict], extra: dict | None = None) -> None:
    rows = sorted(found.values(), key=lambda r: r["id"])
    tweets_path = OUT_DIR / "tweets.jsonl"
    with tweets_path.open("w", encoding="utf-8") as fh:
        for row in rows:
            if isinstance(row.get("text"), str):
                row["text"] = row["text"].replace("\u2028", "\n").replace("\u2029", "\n")
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    ids = {
        row["id"]: {
            "id": row["id"],
            "user": row["user"],
            "via": row["via"],
            "url": row["url"],
        }
        for row in rows
    }
    (OUT_DIR / "ids.json").write_text(
        json.dumps({"count": len(ids), "ids": ids}, indent=2),
        encoding="utf-8",
    )
    summary = {
        "compiledOn": time.strftime("%Y-%m-%d"),
        "requested": TARGET,
        "fetched": len(rows),
        "uniqueIdsSeen": len(rows),
        "cutoff": START_TIME,
        "source": "x_api_v2_search_all",
        "invented": 0,
        "note": (
            "600 is the harvest target, not a number to invent. "
            "tweets.jsonl is only posts the official X API returned "
            "on or after 15 August 2026."
        ),
    }
    if extra:
        summary.update(extra)
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)


def collect() -> dict[str, dict]:
    found: dict[str, dict] = {}
    for username, via in OFFICIAL_USERS:
        print(f"wave official {via}", flush=True)
        user_timeline(username, via, found)
        write_outputs(found, extra={"partial": True})
    print(f"after official unique={len(found)}", flush=True)
    if len(found) < TARGET:
        print("wave place-named campaign posts", flush=True)
        search_all(PLACE_QUERY, "search:place", found, limit=TARGET)
    if len(found) < TARGET:
        for query, via in FILL_QUERIES:
            if len(found) >= TARGET:
                break
            print(f"wave fill {via}", flush=True)
            search_all(query, via, found, limit=TARGET)
    if len(found) > TARGET:
        # Official first, then the rest in id order, hard cap 600.
        official = [row for row in found.values() if any(v.startswith("timeline:") for v in row["via"])]
        official_ids = {row["id"] for row in official}
        others = [row for row in found.values() if row["id"] not in official_ids]
        official.sort(key=lambda r: r["id"])
        others.sort(key=lambda r: r["id"])
        keep = official[:TARGET]
        room = TARGET - len(keep)
        keep.extend(others[:room])
        found = {row["id"]: row for row in keep}
    return found


def main() -> int:
    if not os.environ.get("X_BEARER_TOKEN", "").strip():
        print("X_BEARER_TOKEN missing; refusing to invent rows", flush=True)
        return 2
    try:
        found = collect()
    except HarvestStop as exc:
        print(f"stopped: {exc}", flush=True)
        existing = {}
        path = OUT_DIR / "tweets.jsonl"
        if path.exists():
            for line in path.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    row = json.loads(line)
                    if is_after_launch(row.get("created_at"), row.get("id")):
                        existing[str(row["id"])] = row
        write_outputs(existing, extra={"stopped": str(exc)})
        return 1
    write_outputs(found)
    pre = [row for row in found.values() if not is_after_launch(row.get("created_at"), row.get("id"))]
    if pre:
        raise HarvestStop(f"date cap failed: {len(pre)} pre-launch rows")
    if len(found) > TARGET:
        raise HarvestStop(f"cap failed: {len(found)} > {TARGET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
