#!/usr/bin/env python3
"""Hand-reviewed batch 2: remaining 257 campaign posts (posts read one-by-one)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HARVEST = ROOT / "data" / "x-harvest"
MANUAL = HARVEST / "manual-locations.json"
REVIEW = HARVEST / "review-posts.json"

SANTUK = dict(village="Santuk Pimpri", block=None, district="Hingoli", state="Maharashtra")
KARISHUNDA = dict(village="Karishunda", block=None, district="Bankura", state="West Bengal")
LATUR = dict(village=None, block=None, district="Latur", state="Maharashtra")
RAMPURA = dict(village="Rampura Kanwarpura", block="Bagru", district="Jaipur", state="Rajasthan")
BAGRU = dict(village="Bagru", block="Bagru", district="Jaipur", state="Rajasthan")
JAIPUR = dict(village=None, block=None, district="Jaipur", state="Rajasthan")
RAJASTHAN = dict(village=None, block=None, district="Rajasthan", state="Rajasthan")
HANSI = dict(village=None, block=None, district="Hansi", state="Haryana")

# Explicit per-post decisions from reading every remaining tweet.
PLACED: dict[str, dict] = {
    # Dipke / CJP — native village Santuk Pimpri (Hingoli)
    "2088470202149224941": SANTUK,
    "2088503145093849247": SANTUK,
    "2088531713156903305": SANTUK,
    "2088554472771576302": SANTUK,
    "2089198982962778301": SANTUK,
    "2089619227712147926": SANTUK,
    "2089636270234563025": SANTUK,
    "2090402251341025751": SANTUK,
    "2090432312064549051": SANTUK,
    "2090555438232428753": SANTUK,  # India TV at Dipke's village
    "2090632335335313688": SANTUK,
    "2090638703874183482": SANTUK,
    "2090771952814170559": SANTUK,
    "2091034276498387185": SANTUK,
    "2091055085753393516": SANTUK,
    "2091152236466573766": SANTUK,
    # Abdul / Bankura
    "2088870575989293149": KARISHUNDA,
    "2089309888145244192": KARISHUNDA,
    "2089311678437662978": KARISHUNDA,
    "2089315352614506703": KARISHUNDA,
    "2089317661914386529": KARISHUNDA,
    "2089323841126388130": KARISHUNDA,
    "2089324019942314174": KARISHUNDA,
    "2090893624729104453": KARISHUNDA,
    # Latur district schools / FIR
    "2090435545621266788": LATUR,
    "2090656810961162492": LATUR,
    "2090710421573599731": LATUR,
    "2090771616510734444": LATUR,
    "2090783463654019484": LATUR,
    "2090979635177857509": LATUR,
    "2091204034472669615": LATUR,
    # Rampura Kanwarpura — buffalo-shed school incident village
    "2090732038819373509": RAMPURA,
    "2090732473173057971": RAMPURA,
    "2090741056652677262": RAMPURA,
    "2090743166593102203": RAMPURA,
    "2090765807139914236": RAMPURA,
    "2090770562541040108": RAMPURA,
    "2090786682673209794": RAMPURA,
    "2090791320952729866": RAMPURA,
    "2090815714982875481": RAMPURA,
    "2091150742845313238": RAMPURA,
    "2091223016038678902": RAMPURA,
    # Bagru tehsil — Jaipur clash coverage naming Bagru
    "2090745664053653565": BAGRU,
    "2090747707979599984": BAGRU,
    "2090749301882527921": BAGRU,
    # Jaipur district (news / hashtags, village not named in text)
    "2090664488383193569": JAIPUR,
    "2090668029676044403": JAIPUR,
    "2090674003241287724": JAIPUR,
    "2090679224093061457": JAIPUR,
    "2090681757620465719": JAIPUR,
    "2090681884271595733": JAIPUR,
    "2090684867243634782": JAIPUR,
    "2090686555270852656": JAIPUR,
    "2090687394215514181": JAIPUR,
    "2090687902481314276": JAIPUR,
    "2090689553497833932": JAIPUR,
    "2090690690762281433": JAIPUR,
    "2090694655331696697": JAIPUR,
    "2090695546948214864": JAIPUR,
    "2090696301633769822": JAIPUR,
    "2090696378913849661": JAIPUR,
    "2090696662809559436": JAIPUR,
    "2090696880590311594": JAIPUR,
    "2090706377799070134": JAIPUR,
    "2090707024875327611": JAIPUR,
    "2090708093495812431": JAIPUR,
    "2090711865961938984": JAIPUR,
    "2090725284123496592": JAIPUR,
    "2090725724797927486": JAIPUR,
    "2090726894794870949": JAIPUR,
    "2090728742767538614": JAIPUR,
    "2090733696458559824": JAIPUR,
    "2090733748702855435": JAIPUR,
    "2090733850364096529": JAIPUR,
    "2090735161961029836": JAIPUR,
    "2090736259237134730": JAIPUR,
    "2090737346048299308": JAIPUR,
    "2090744469469749686": JAIPUR,
    "2090745012233625976": JAIPUR,
    "2090745101182284132": JAIPUR,
    "2090745211693695407": JAIPUR,
    "2090745786137223629": JAIPUR,
    "2090752391327199528": JAIPUR,
    "2090752763131281485": JAIPUR,
    "2090753725753360487": JAIPUR,
    "2090756969762328763": JAIPUR,
    "2090757529861054514": JAIPUR,
    "2090758399717970372": JAIPUR,
    "2090758568454877257": JAIPUR,
    "2090758837624308163": JAIPUR,
    "2090760017930830025": JAIPUR,
    "2090760255739412913": JAIPUR,
    "2090762269110231130": JAIPUR,
    "2090762311032279400": JAIPUR,
    "2090763009866215554": JAIPUR,
    "2090763272610103573": JAIPUR,
    "2090763575954669643": JAIPUR,
    "2090766477536436426": JAIPUR,
    "2090766965799583919": JAIPUR,
    "2090768701888880864": JAIPUR,
    "2090768880876585291": JAIPUR,
    "2090770604626735464": JAIPUR,
    "2090779192594137111": JAIPUR,
    "2090779906926141815": JAIPUR,
    "2090780505893699956": JAIPUR,
    "2090782222530089176": JAIPUR,
    "2090785641881800937": JAIPUR,
    "2090786174269096207": JAIPUR,
    "2090791894234333292": JAIPUR,
    "2090793027056910588": JAIPUR,
    "2090793542662901999": JAIPUR,
    "2090794071413641386": JAIPUR,
    "2090794543008682128": JAIPUR,
    "2090798850755977496": JAIPUR,
    "2090808435315298620": JAIPUR,
    "2090814173156606070": JAIPUR,
    "2090815273502941647": JAIPUR,
    "2090824427986706797": JAIPUR,
    "2090865463593177397": JAIPUR,
    "2090867917051383948": JAIPUR,
    "2090984517750452552": JAIPUR,
    "2090992447316963593": JAIPUR,
    "2091015117043650607": JAIPUR,
    "2091039070466322451": JAIPUR,
    "2091040921462923613": JAIPUR,
    "2091085521426825282": JAIPUR,
    "2091141808550293909": JAIPUR,
    "2091163359555248587": JAIPUR,
    # Rajasthan state-level (no Jaipur/Bagru named)
    "2090156116269531475": RAJASTHAN,
    "2090647694494900685": RAJASTHAN,
    "2090726617811501081": RAJASTHAN,
    "2091045702629786103": RAJASTHAN,
    "2091087896380051836": RAJASTHAN,
    "2091089009988813153": RAJASTHAN,
    # Hansi, Haryana — govt order on school entry
    "2091058532842168328": HANSI,
}

SKIP_REASON = "no_named_place_in_text"


def main() -> None:
    reviews = json.loads(REVIEW.read_text(encoding="utf-8"))
    manual = json.loads(MANUAL.read_text(encoding="utf-8"))
    seen = {str(m.get("postId") or m.get("id")) for m in manual}
    added_placed = 0
    added_skip = 0
    for post in reviews:
        pid = str(post["id"])
        if pid in seen:
            continue
        if pid in PLACED:
            place = PLACED[pid]
            manual.append(
                {
                    "postId": pid,
                    "url": post.get("url"),
                    **place,
                    "skip": False,
                    "quote": (post.get("text") or "")[:200],
                }
            )
            added_placed += 1
        else:
            manual.append(
                {
                    "postId": pid,
                    "url": post.get("url"),
                    "village": None,
                    "block": None,
                    "district": None,
                    "state": None,
                    "skip": True,
                    "skipReason": SKIP_REASON,
                    "quote": (post.get("text") or "")[:200],
                }
            )
            added_skip += 1
        seen.add(pid)
    MANUAL.write_text(json.dumps(manual, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "totalManual": len(manual),
                "addedPlaced": added_placed,
                "addedSkip": added_skip,
                "expected": 257,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
