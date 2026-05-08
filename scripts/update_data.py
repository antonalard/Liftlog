import datetime as dt
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
TZ = ZoneInfo("Europe/Stockholm")


def now_local():
    return dt.datetime.now(TZ)


def ts():
    return now_local().strftime("%Y-%m-%d %H:%M %Z")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "alard.se-data-bot/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="replace")


def update_weather():
    lat, lon = 57.58, 12.08
    raw = fetch(f"https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={lat}&lon={lon}")
    payload = json.loads(raw)
    series = payload["properties"]["timeseries"]
    now = series[0]["data"]["instant"]["details"]
    symbol = series[0]["data"].get("next_1_hours", {}).get("summary", {}).get("symbol_code", "okänt")
    by_day = {}
    symbol_by_day = {}
    for row in series:
        d = row["time"][:10]
        hour = int(row["time"][11:13])
        t = row["data"]["instant"]["details"].get("air_temperature")
        if isinstance(t, (int, float)):
            by_day.setdefault(d, []).append(t)
        summary = (
            row["data"].get("next_1_hours", {}).get("summary", {}).get("symbol_code")
            or row["data"].get("next_6_hours", {}).get("summary", {}).get("symbol_code")
            or row["data"].get("next_12_hours", {}).get("summary", {}).get("symbol_code")
        )
        if summary and d not in symbol_by_day:
            symbol_by_day[d] = summary
        if summary and 10 <= hour <= 14:
            symbol_by_day[d] = summary
    days = []
    for d, temps in list(by_day.items())[:7]:
        weekday = dt.datetime.fromisoformat(d).strftime("%a").lower()
        days.append(
            {
                "weekday": weekday,
                "night": round(min(temps)),
                "day": round(max(temps)),
                "symbol_code": symbol_by_day.get(d, "clearsky_day"),
            }
        )
    out = {
        "updated": ts(),
        "today": {
            "weekday": now_local().strftime("%A").lower(),
            "temp": round(now.get("air_temperature", 0)),
            "meta": f"{symbol.replace('_', ' ')} • Vind {round(now.get('wind_speed', 0))} m/s",
            "symbol_code": symbol,
        },
        "week": days,
    }
    (DATA / "weather.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


def update_market():
    src = "https://www.avanza.se/index/om-indexet.html/18988/omx-stockholm-pi"
    txt = fetch(f"https://r.jina.ai/http://{src.replace('https://', '')}")
    day = re.search(r"1 d\.\s*([+\-\u2212?]?\d+,\d+%)", txt, re.IGNORECASE)
    week = re.search(r"1 v\.\s*([+\-\u2212?]?\d+,\d+%)", txt, re.IGNORECASE)
    month = re.search(r"1 m\.\s*([+\-\u2212?]?\d+,\d+%)", txt, re.IGNORECASE)
    latest = re.search(r"Senaste kurs\s*([0-9][0-9\s.,]*)\s*SEK", txt, re.IGNORECASE)
    change_percent = day.group(1).strip() if day else "-"
    week_percent = week.group(1).strip() if week else "-"
    month_percent = month.group(1).strip() if month else "-"
    # In Avanza text dumps, unicode minus may degrade to "?".
    if change_percent.startswith("?"):
      change_percent = f"-{change_percent[1:]}"
    if week_percent.startswith("?"):
      week_percent = f"-{week_percent[1:]}"
    if month_percent.startswith("?"):
      month_percent = f"-{month_percent[1:]}"
    change_percent = change_percent.replace("\u2212", "-")
    week_percent = week_percent.replace("\u2212", "-")
    month_percent = month_percent.replace("\u2212", "-")
    out = {
        "updated": ts(),
        "source": "Avanza",
        "index_value": latest.group(1).strip() if latest else "-",
        "change_percent": change_percent,
        "week_percent": week_percent,
        "month_percent": month_percent,
    }
    (DATA / "market.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


def update_pokemon():
    rss = fetch("https://pokemongohub.net/post/category/event/feed/")
    root = ET.fromstring(rss)
    items = []
    community_title = ""
    community_image = ""
    community_link = ""
    for item in root.findall("./channel/item")[:10]:
        title = (item.findtext("title") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        date = pub[:16] if pub else ""
        if title:
            items.append({"title": title, "date": date})
        if not community_title and "community day" in title.lower():
            community_title = title
            link = (item.findtext("link") or "").strip()
            community_link = link
            # Try media RSS image first.
            media = item.find("{http://search.yahoo.com/mrss/}content")
            if media is not None and media.attrib.get("url"):
                community_image = media.attrib.get("url", "")
            # Fallback: parse first <img src="..."> in item XML.
            if not community_image:
                item_xml = ET.tostring(item, encoding="unicode")
                img_match = re.search(r'<img[^>]+src="([^"]+)"', item_xml, re.IGNORECASE)
                if img_match:
                    community_image = img_match.group(1)
            # Final fallback: parse article page for og:image.
            if not community_image and link:
                try:
                    html = fetch(link)
                    og = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html, re.IGNORECASE)
                    if og:
                        community_image = og.group(1)
                except Exception:
                    pass
    out = {
        "updated": ts(),
        "community_day_title": community_title,
        "community_day_image": community_image,
        "community_day_link": community_link,
        "items": items,
    }
    (DATA / "pokemon.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    DATA.mkdir(parents=True, exist_ok=True)
    errors = []
    for fn in (update_weather, update_market, update_pokemon):
        try:
            fn()
        except Exception as exc:
            errors.append(f"{fn.__name__}: {exc}")
    if errors:
        print("Non-fatal feed update errors:")
        for err in errors:
            print(f"- {err}")
