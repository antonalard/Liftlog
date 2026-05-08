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

function percentToFloat(raw) {
  if (!raw || raw === "-") return 0;
  const s = String(raw).replace("%", "").replace(",", ".").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function buildOmxSvg(values) {
  const width = 520;
  const height = 140;
  const pad = 24;
  const labels = ["1d", "1v", "1m"];
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const zeroY = height / 2;
  const step = (width - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * step;
    const y = zeroY - (v / maxAbs) * (height * 0.32);
    return { x, y, v };
  });
  const path = points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  const circles = points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#8ed5ff" />`).join("");
  const marks = points.map((p, i) => `<text x="${p.x}" y="${height - 10}" text-anchor="middle" fill="#b7cef0" font-size="12">${labels[i]}</text>`).join("");
  const vals = points.map((p, i) => `<text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="#dfeeff" font-size="11">${values[i].toFixed(2)}%</text>`).join("");
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#0f1d3f"/>
      <line x1="${pad}" y1="${zeroY}" x2="${width - pad}" y2="${zeroY}" stroke="#4b648d" stroke-width="1"/>
      <path d="${path}" fill="none" stroke="#6ec3ff" stroke-width="3" />
      ${circles}
      ${marks}
      ${vals}
    </svg>
  `;
}

function buildGreeting() {
  const now = new Date();
  const hour = now.getHours();
  let title = "God dag!";
  if (hour >= 5 && hour < 10) title = "God morgon!";
  else if (hour >= 10 && hour < 14) title = "Lunchdags!";
  else if (hour >= 14 && hour < 18) title = "God eftermiddag!";
  else if (hour >= 18 && hour < 23) title = "God kväll!";
  else title = "Godnatt!";

  const specialDays = {
    "01-01": "Gott nytt år!",
    "02-14": "Alla hjärtans dag",
    "03-08": "Internationella kvinnodagen",
    "04-01": "April, april!",
    "05-01": "Första maj",
    "06-06": "Sveriges nationaldag",
    "10-04": "Kanelbullens dag",
    "10-31": "Halloween",
    "11-11": "Singles Day",
    "12-13": "Lucia",
    "12-24": "Julafton",
    "12-31": "Nyårsafton"
  };

  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dayText = specialDays[mmdd] || "";

  const kindLines = [
    "Du ser pigg ut idag!", "Looking gooood!", "Hej snygging!", "Wow wow wow!", "Du lyser upp rummet.",
    "Du är en legend.", "Du fixar mer än du tror.", "Din energi smittar.", "Snygg timing idag.", "Toppen att du är här.",
    "Du har grym stil.", "Du har bra vibe idag.", "Du gör det svårt att inte le.", "Du är starkare än du vet.",
    "Du är skarpare än kaffe.", "Vilken stjärna du är.", "Du har en vinnaraura.", "Du är riktigt imponerande.",
    "Du gör vardagen roligare.", "Du levererar alltid.", "Du är ett helt mood.", "Du ser fokuserad ut.", "Du är guld värd.",
    "Du är otrolig.", "Det här blir din dag.", "Du har bra flow.", "Du har huvudrolls-energi.", "Du är ett powerhouse.",
    "Du gör saker snyggt.", "Du är smart och snabb.", "Din närvaro gör skillnad.", "Du är en favoritperson.", "Du är i zonen.",
    "Du har bra smak.", "Du gör det enkelt att heja.", "Du är 10/10 idag.", "Din humor sitter.", "Du är magisk.",
    "Du är kreativ på riktigt.", "Du känns ostoppbar.", "Du får saker att hända.", "Du är en game changer.", "Du är glödhet idag.",
    "Du höjer nivån.", "Du är bättre än bra.", "Du har rätt känsla.", "Du är klass.", "Du ser stark ut.",
    "Du ger huvudperson-vibbar.", "Du är inspirerande.", "Du är snygg inifrån och ut.", "Du är stabil.", "Du är en riktig hjälte.",
    "Du har pondus.", "Du är färgstark.", "Du är cool utan att försöka.", "Du är en frisk fläkt.", "Du är fantastisk.",
    "Du gör andra bättre.", "Du är supervass.", "Du är en ikon.", "Du är så bra på att vara du.", "Du är en naturkraft.",
    "Du är varm och skarp.", "Du är stark och snäll.", "Du är älskvärd.", "Du är bländande.", "Du är en favorit i repris.",
    "Du är smartare än du anar.", "Du är en raket.", "Du har pondus och hjärta.", "Du har fin energi.", "Du ser ut att må bra.",
    "Du är ett kap.", "Du är elegant och trygg.", "Du är next level.", "Du är en klass för sig.", "Du är proffsig.",
    "Du är vänlig och vass.", "Du är dagens stjärna.", "Du gör bra val.", "Du är full av möjligheter.", "Du är målmedveten.",
    "Du är en sann vinnare.", "Du är briljant.", "Du är värd allt gott.", "Du gör det med stil.", "Du är på topp.",
    "Du är stark i motvind.", "Du är riktigt charmig.", "Du gör skillnad varje dag.", "Du är glimrande.", "Du har wow-faktor.",
    "Du är ett original.", "Du är sevärd.", "Du är trygg och modig.", "Du är en solstråle.", "Du är helt enkelt grym."
  ];

  const index = now.getDate() % kindLines.length;
  const kind = kindLines[index];

  const titleEl = document.getElementById("greeting-title");
  const dayEl = document.getElementById("greeting-day");
  const kindEl = document.getElementById("greeting-kind");
  if (titleEl) titleEl.textContent = title;
  if (dayEl) dayEl.textContent = dayText;
  if (kindEl) kindEl.textContent = kind;
}

async function loadWeather() {
  try {
    const data = await getJson("data/weather.json");
    const today = data.today || {};
    const week = data.week || [];
    const wrap = document.getElementById("wx-week");
    const weekdaySv = new Date().toLocaleDateString("sv-SE", { weekday: "long" });
    document.getElementById("wx-day").textContent = weekdaySv;
    document.getElementById("wx-temp").textContent = typeof today.temp === "number" ? `${today.temp}°` : "--°";
    document.getElementById("wx-meta").textContent = `${weatherSymbolGlyph(today.symbol_code)} ${today.meta || "Ingen vädertext tillgänglig."}`;
    const iconEl = document.getElementById("wx-icon");
    if (iconEl) iconEl.textContent = weatherSymbolGlyph(today.symbol_code);
    document.getElementById("wx-updated").textContent = `Uppdaterad: ${data.updated || "-"}`;
    wrap.innerHTML = "";
    week.slice(0, 3).forEach((day) => {
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
    const chart = document.getElementById("omx-week-chart");
    const values = [
      percentToFloat(data.change_percent),
      percentToFloat(data.week_percent),
      percentToFloat(data.month_percent)
    ];
    if (chart) chart.innerHTML = buildOmxSvg(values);
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
    const linkEl = document.getElementById("pogo-community-link");
    if (data.community_day_image) {
      img.src = data.community_day_image;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
    titleEl.textContent = data.community_day_title || "Nästa Community Day hittades inte ännu.";
    if (linkEl && data.community_day_link) linkEl.href = data.community_day_link;
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
buildGreeting();
