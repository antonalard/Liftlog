import datetime as dt
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


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
    for row in series:
        d = row["time"][:10]
        t = row["data"]["instant"]["details"].get("air_temperature")
        if isinstance(t, (int, float)):
            by_day.setdefault(d, []).append(t)
    days = []
    for d, temps in list(by_day.items())[:7]:
        weekday = dt.datetime.fromisoformat(d).strftime("%a").lower()
        days.append({"weekday": weekday, "min": round(min(temps)), "max": round(max(temps))})
    out = {
        "updated": dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "today": {
            "weekday": dt.datetime.now().strftime("%A").lower(),
            "temp": round(now.get("air_temperature", 0)),
            "meta": f"{symbol.replace('_', ' ')} • Vind {round(now.get('wind_speed', 0))} m/s",
        },
        "week": days,
    }
    (DATA / "weather.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


def update_market():
    src = "https://www.avanza.se/index/om-indexet.html/18988/omx-stockholm-pi"
    txt = fetch(f"https://r.jina.ai/http://{src.replace('https://', '')}")
    pct = re.search(r"[+-]\d+,\d+%", txt)
    idx = re.search(r"OMX Stockholm PI[\s\S]{0,240}?(\d[\d\s.,]*)", txt, re.IGNORECASE)
    out = {
        "updated": dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "source": "Avanza",
        "index_value": idx.group(1).strip() if idx else "-",
        "change_percent": pct.group(0) if pct else "-",
    }
    (DATA / "market.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


def update_pokemon():
    rss = fetch("https://pokemongohub.net/post/category/event/feed/")
    root = ET.fromstring(rss)
    items = []
    for item in root.findall("./channel/item")[:6]:
        title = (item.findtext("title") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        date = pub[:16] if pub else ""
        if title:
            items.append({"title": title, "date": date})
    out = {
        "updated": dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "items": items,
    }
    (DATA / "pokemon.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    DATA.mkdir(parents=True, exist_ok=True)
    update_weather()
    update_market()
    update_pokemon()
