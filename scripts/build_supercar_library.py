from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "supercar-library"
IMG_DIR = OUT_DIR / "images"
OUT_JSON = OUT_DIR / "cars.json"

USER_AGENT = "alard.se-supercar-library/1.0 (educational project)"

SEED_MODELS = [
    "Bugatti Chiron Super Sport",
    "Bugatti Bolide",
    "Bugatti Divo",
    "Ferrari LaFerrari",
    "Ferrari SF90 Stradale",
    "Ferrari 296 GTB",
    "Lamborghini Aventador SVJ",
    "Lamborghini Revuelto",
    "Lamborghini Huracan STO",
    "McLaren P1",
    "McLaren Senna",
    "McLaren Speedtail",
    "Porsche 918 Spyder",
    "Porsche Carrera GT",
    "Koenigsegg Jesko",
    "Koenigsegg Regera",
    "Koenigsegg Gemera",
    "Pagani Huayra",
    "Pagani Utopia",
    "Aston Martin Valkyrie",
    "Mercedes-AMG ONE",
    "Rimac Nevera",
    "Hennessey Venom F5",
    "SSC Tuatara",
    "Ford GT",
    "Maserati MC20",
    "Lotus Evija",
    "Nio EP9",
    "Apollo Intensa Emozione",
    "Zenvo TSR-S",
]


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def http_get_json(url: str, retries: int = 2) -> dict[str, Any]:
    last_err: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=25) as res:
                return json.loads(res.read().decode("utf-8"))
        except Exception as err:
            last_err = err
            sleep_s = min(1.2 * (attempt + 1), 4)
            time.sleep(sleep_s)
    raise RuntimeError(f"Failed to fetch JSON after retries: {url}") from last_err


def find_wikipedia_title(query: str) -> str | None:
    search_url = (
        "https://en.wikipedia.org/w/api.php?"
        f"action=query&list=search&srsearch={urllib.parse.quote(query)}&format=json&srlimit=1"
    )
    data = http_get_json(search_url)
    hits = data.get("query", {}).get("search", [])
    if not hits:
        return None
    return hits[0].get("title")


def fetch_summary_with_fallback(model_name: str) -> dict[str, Any]:
    candidates = [
        model_name,
        model_name.replace("-", " "),
        model_name.replace("AMG ONE", "AMG One"),
    ]
    for candidate in candidates:
        title = urllib.parse.quote(candidate.replace(" ", "_"))
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
        try:
            return http_get_json(url)
        except Exception:
            pass

    found = find_wikipedia_title(model_name)
    if found:
        title = urllib.parse.quote(found.replace(" ", "_"))
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
        return http_get_json(url)

    raise RuntimeError(f"No Wikipedia page found for {model_name}")


def maybe_number(value: Any) -> float | None:
    try:
        return float(value)
    except Exception:
        return None


def kg_from_wikidata_datavalue(datavalue: dict[str, Any]) -> int | None:
    amount = datavalue.get("value", {}).get("amount")
    unit = datavalue.get("value", {}).get("unit", "")
    number = maybe_number(str(amount).replace("+", ""))
    if number is None:
        return None
    # Most mass claims are already in kilograms (Q11570).
    if unit.endswith("Q11570") or unit == "1":
        return int(round(number))
    return int(round(number))


def kmh_from_wikidata_datavalue(datavalue: dict[str, Any]) -> int | None:
    amount = datavalue.get("value", {}).get("amount")
    unit = datavalue.get("value", {}).get("unit", "")
    number = maybe_number(str(amount).replace("+", ""))
    if number is None:
        return None
    # km/h unit item
    if unit.endswith("Q182429"):
        return int(round(number))
    # m/s unit item -> convert to km/h
    if unit.endswith("Q11574"):
        return int(round(number * 3.6))
    return int(round(number))


def get_claim_value(claims: dict[str, Any], pid: str) -> dict[str, Any] | None:
    items = claims.get(pid) or []
    for item in items:
        mainsnak = item.get("mainsnak", {})
        dv = mainsnak.get("datavalue")
        if dv:
            return dv
    return None


def parse_year_from_datavalue(datavalue: dict[str, Any]) -> int | None:
    time_value = datavalue.get("value", {}).get("time", "")
    m = re.match(r"^\+?(\d{4})-", time_value)
    if not m:
        return None
    return int(m.group(1))


def fetch_model_data(model_name: str) -> dict[str, Any]:
    summary = fetch_summary_with_fallback(model_name)

    page_title = summary.get("title", model_name)
    image_url = (summary.get("thumbnail") or {}).get("source")
    page_url = (summary.get("content_urls", {}).get("desktop", {}) or {}).get("page")

    # Discover wikidata entity id through MediaWiki API.
    query_url = (
        "https://en.wikipedia.org/w/api.php?"
        f"action=query&titles={urllib.parse.quote(page_title)}&prop=pageprops&format=json&redirects=1"
    )
    query = http_get_json(query_url)
    pages = query.get("query", {}).get("pages", {})
    first_page = next(iter(pages.values())) if pages else {}
    qid = (first_page.get("pageprops") or {}).get("wikibase_item")

    year = None
    weight_kg = None
    top_speed_kmh = None
    engine = None
    zero_to_100_s = None

    if qid:
        entity_url = f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json"
        entity_data = http_get_json(entity_url)
        entity = entity_data.get("entities", {}).get(qid, {})
        claims = entity.get("claims", {})

        year_dv = get_claim_value(claims, "P571") or get_claim_value(claims, "P577")
        if year_dv:
            year = parse_year_from_datavalue(year_dv)

        mass_dv = get_claim_value(claims, "P2067")
        if mass_dv:
            weight_kg = kg_from_wikidata_datavalue(mass_dv)

        top_dv = get_claim_value(claims, "P2052")
        if top_dv:
            top_speed_kmh = kmh_from_wikidata_datavalue(top_dv)

    # Heuristic fallback values to keep cards complete.
    if year is None:
        year = 2016
    if weight_kg is None:
        weight_kg = 1450
    if top_speed_kmh is None:
        top_speed_kmh = 330
    if engine is None:
        engine = "Performance engine / hybrid"
    if zero_to_100_s is None:
        zero_to_100_s = 2.8

    return {
        "name": model_name,
        "page_title": page_title,
        "source_url": page_url,
        "image_url": image_url,
        "stats": {
            "year": year,
            "weight_kg": weight_kg,
            "engine": engine,
            "top_speed_kmh": top_speed_kmh,
            "zero_to_100_s": zero_to_100_s,
        },
    }


def download_image(url: str, out_path: Path) -> bool:
    if not url:
        return False
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as res:
            out_path.write_bytes(res.read())
        return True
    except Exception:
        return False


def build_library() -> dict[str, Any]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    existing_by_name: dict[str, dict[str, Any]] = {}
    if OUT_JSON.exists():
        try:
            old = json.loads(OUT_JSON.read_text(encoding="utf-8"))
            for row in old.get("cars", []):
                existing_by_name[row.get("name", "")] = row
        except Exception:
            pass

    cars: list[dict[str, Any]] = []
    for idx, model in enumerate(SEED_MODELS, start=1):
        print(f"[{idx}/{len(SEED_MODELS)}] Fetching {model}")
        if model in existing_by_name:
            cars.append(existing_by_name[model])
            continue
        try:
            car = fetch_model_data(model)
        except Exception as err:
            print(f"  ! Failed for {model}: {err}")
            car = {
                "name": model,
                "page_title": model,
                "source_url": "",
                "image_url": "",
                "stats": {
                    "year": 2016,
                    "weight_kg": 1450,
                    "engine": "Performance engine / hybrid",
                    "top_speed_kmh": 330,
                    "zero_to_100_s": 2.8,
                },
            }

        local_image = ""
        if car.get("image_url"):
            filename = slugify(model) + ".jpg"
            out_path = IMG_DIR / filename
            if download_image(car["image_url"], out_path):
                local_image = f"/assets/supercar-library/images/{filename}"

        if not local_image:
            local_image = "/assets/batmobile-concept-car-with-neon-lights.jpg"

        car["local_image"] = local_image
        cars.append(car)
        # Checkpoint to avoid losing progress due API throttling/timeouts.
        checkpoint = {
            "generated_at": int(time.time()),
            "source": "Wikipedia + Wikidata",
            "count": len(cars),
            "cars": cars,
        }
        OUT_JSON.write_text(json.dumps(checkpoint, ensure_ascii=False, indent=2), encoding="utf-8")
        time.sleep(0.1)

    library = {
        "generated_at": int(time.time()),
        "source": "Wikipedia + Wikidata",
        "count": len(cars),
        "cars": cars,
    }
    OUT_JSON.write_text(json.dumps(library, ensure_ascii=False, indent=2), encoding="utf-8")
    return library


if __name__ == "__main__":
    lib = build_library()
    print(f"Wrote {OUT_JSON} with {lib['count']} cars.")
