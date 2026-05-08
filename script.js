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

async function getJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

function weatherSymbolGlyph(code) {
  const key = (code || "").toLowerCase();
  if (key.includes("thunder")) return "⛈️";
  if (key.includes("sleet")) return "🌨️";
  if (key.includes("snow")) return "❄️";
  if (key.includes("rainshowers")) return "🌦️";
  if (key.includes("heavyrain") || key.includes("rain")) return "🌧️";
  if (key.includes("fog")) return "🌫️";
  if (key.includes("partlycloudy")) return "⛅";
  if (key.includes("cloudy")) return "☁️";
  if (key.includes("fair")) return "🌤️";
  if (key.includes("clearsky_night")) return "🌙";
  if (key.includes("clearsky")) return "☀️";
  return "🌡️";
}

async function loadWeather() {
  try {
    const data = await getJson("data/weather.json");
    const today = data.today || {};
    const week = data.week || [];
    const wrap = document.getElementById("wx-week");
    document.getElementById("wx-day").textContent = today.weekday || "-";
    document.getElementById("wx-temp").textContent = typeof today.temp === "number" ? `${today.temp}°` : "--°";
    document.getElementById("wx-meta").textContent = `${weatherSymbolGlyph(today.symbol_code)} ${today.meta || "Ingen vädertext tillgänglig."}`;
    document.getElementById("wx-updated").textContent = `Uppdaterad: ${data.updated || "-"}`;
    wrap.innerHTML = "";
    week.forEach((day) => {
      const chip = document.createElement("div");
      chip.className = "day-chip";
      chip.innerHTML = `<span class="day-chip-top">${weatherSymbolGlyph(day.symbol_code)} ${day.weekday}</span><span class="day-chip-temp">Dag ${day.day}° • Natt ${day.night}°</span>`;
      wrap.appendChild(chip);
    });
  } catch {
    document.getElementById("wx-meta").textContent = "Kunde inte läsa väderdata just nu.";
  }
}

async function loadOmx() {
  try {
    const data = await getJson("data/market.json");
    document.getElementById("omx-price").textContent = `Idag: ${data.change_percent || "-"}`;
    document.getElementById("omx-meta").textContent = `Index: ${data.index_value || "-"} • Källa: ${data.source || "okänd"}`;
    document.getElementById("omx-updated").textContent = `Uppdaterad: ${data.updated || "-"}`;
  } catch {
    document.getElementById("omx-price").textContent = "Ej tillgänglig";
    document.getElementById("omx-meta").textContent = "Kunde inte läsa OMX-data just nu.";
  }
}

async function loadPokemon() {
  try {
    const data = await getJson("data/pokemon.json");
    const items = (data.items || []).slice(0, 5);
    const img = document.getElementById("pogo-community-image");
    const titleEl = document.getElementById("pogo-community-title");
    if (data.community_day_image) {
      img.src = data.community_day_image;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
    titleEl.textContent = data.community_day_title || "Nästa Community Day hittades inte ännu.";
    const list = document.getElementById("pogo-list");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = "<li>Inga events hittades.</li>";
    } else {
      items.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${item.title}</strong><br><span class="muted">${item.date || ""}</span>`;
        list.appendChild(li);
      });
    }
    document.getElementById("pogo-updated").textContent = `Uppdaterad: ${data.updated || "-"}`;
  } catch {
    document.getElementById("pogo-list").innerHTML = "<li>Kunde inte läsa Pokémon-events just nu.</li>";
  }
}

loadWeather();
loadOmx();
loadPokemon();
