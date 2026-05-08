const reveals = Array.from(document.querySelectorAll("[data-reveal]"));
const progressBar = document.getElementById("scroll-progress-bar");
const parallaxSections = Array.from(document.querySelectorAll("[data-parallax]"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
);

reveals.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 45, 320)}ms`;
  revealObserver.observe(item);
});

const tilts = Array.from(document.querySelectorAll(".tilt"));
tilts.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * 4;
    const ry = (px - 0.5) * 5;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

window.addEventListener("pointermove", (event) => {
  const x = (event.clientX / window.innerWidth) * 100;
  const y = (event.clientY / window.innerHeight) * 100;
  document.body.style.setProperty("--mx", `${x}%`);
  document.body.style.setProperty("--my", `${y}%`);
});

function onScrollMotion() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;

  parallaxSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = (window.innerHeight / 2 - center) / window.innerHeight;
    const y = distance * 22;
    const opacity = Math.max(0.72, 1 - Math.abs(distance) * 0.35);
    section.style.transform = `translateY(${y}px)`;
    section.style.opacity = `${opacity}`;
  });
}

window.addEventListener("scroll", onScrollMotion, { passive: true });
window.addEventListener("resize", onScrollMotion);
onScrollMotion();

async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function firstOkJson(urls) {
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, 9000);
      if (!res.ok) continue;
      return await res.json();
    } catch {}
  }
  throw new Error("No JSON source worked");
}

async function firstOkText(urls) {
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, 9000);
      if (!res.ok) continue;
      return await res.text();
    } catch {}
  }
  throw new Error("No text source worked");
}

async function loadWeather() {
  try {
    const lat = 57.58;
    const lon = 12.08;
    const weatherUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
    const data = await firstOkJson([
      `https://api.allorigins.win/raw?url=${encodeURIComponent(weatherUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(weatherUrl)}`
    ]);
    const series = data?.properties?.timeseries || [];
    const now = series?.[0]?.data?.instant?.details;
    const symbol = data?.properties?.timeseries?.[0]?.data?.next_1_hours?.summary?.symbol_code || "okänt";
    document.getElementById("wx-day").textContent = new Date().toLocaleDateString("sv-SE", { weekday: "long" });
    document.getElementById("wx-temp").textContent = `${Math.round(now?.air_temperature ?? 0)}°`;
    document.getElementById("wx-meta").textContent = `${symbol.replaceAll("_", " ")} • Vind ${Math.round(now?.wind_speed ?? 0)} m/s`;
    document.getElementById("wx-updated").textContent = `Uppdaterad: ${new Date().toLocaleString("sv-SE")}`;
    const byDay = {};
    series.forEach((row) => {
      const d = row.time.slice(0, 10);
      const t = row?.data?.instant?.details?.air_temperature;
      if (typeof t !== "number") return;
      byDay[d] = byDay[d] || [];
      byDay[d].push(t);
    });
    const week = Object.entries(byDay).slice(0, 7);
    const wrap = document.getElementById("wx-week");
    wrap.innerHTML = "";
    week.forEach(([date, temps]) => {
      const min = Math.round(Math.min(...temps));
      const max = Math.round(Math.max(...temps));
      const wd = new Date(date).toLocaleDateString("sv-SE", { weekday: "short" });
      const chip = document.createElement("div");
      chip.className = "day-chip";
      chip.textContent = `${wd}: ${min}° / ${max}°`;
      wrap.appendChild(chip);
    });
  } catch {
    document.getElementById("wx-meta").textContent = "Kunde inte läsa väderdata just nu.";
  }
}

async function loadOmx() {
  try {
    const src = "https://www.avanza.se/index/om-indexet.html/18988/omx-stockholm-pi";
    const txt = await firstOkText([
      `https://r.jina.ai/http://${src.replace("https://", "")}`,
      `https://r.jina.ai/http://r.jina.ai/http://${src.replace("https://", "")}`
    ]);
    const pct = txt.match(/[+-]\d+,\d+%/);
    const idx = txt.match(/OMX Stockholm PI[\s\S]{0,220}?(\d[\d\s.,]*)/i);
    document.getElementById("omx-price").textContent = pct ? `Idag: ${pct[0]}` : "Idag: ej hittad";
    document.getElementById("omx-meta").textContent = idx ? `Index: ${idx[1].trim()} • Källa Avanza` : "Källa: Avanza";
    document.getElementById("omx-updated").textContent = `Uppdaterad: ${new Date().toLocaleString("sv-SE")}`;
  } catch {
    document.getElementById("omx-price").textContent = "Ej tillgänglig";
    document.getElementById("omx-meta").textContent = "Kunde inte läsa OMX-data just nu.";
  }
}

async function loadPokemon() {
  try {
    const feedUrl = "https://pokemongohub.net/post/category/event/feed/";
    const data = await firstOkJson([
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`)}`
    ]);
    const normalized = data.items ? data : JSON.parse(data.contents || "{}");
    const items = (normalized.items || []).slice(0, 5);
    const list = document.getElementById("pogo-list");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = "<li>Inga events hittades.</li>";
    } else {
      items.forEach((item) => {
        const li = document.createElement("li");
        const d = item.pubDate ? new Date(item.pubDate).toLocaleDateString("sv-SE") : "";
        li.innerHTML = `<strong>${item.title}</strong><br><span class="muted">${d}</span>`;
        list.appendChild(li);
      });
    }
    document.getElementById("pogo-updated").textContent = `Uppdaterad: ${new Date().toLocaleString("sv-SE")}`;
  } catch {
    document.getElementById("pogo-list").innerHTML = "<li>Kunde inte läsa Pokémon-events just nu.</li>";
  }
}

loadWeather();
loadOmx();
loadPokemon();
