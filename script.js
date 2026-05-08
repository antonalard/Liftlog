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

async function loadWeather() {
  try {
    const lat = 57.58;
    const lon = 12.08;
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Väderfel");
    const data = await res.json();
    const now = data?.properties?.timeseries?.[0]?.data?.instant?.details;
    const symbol = data?.properties?.timeseries?.[0]?.data?.next_1_hours?.summary?.symbol_code || "okänt";
    document.getElementById("wx-day").textContent = new Date().toLocaleDateString("sv-SE", { weekday: "long" });
    document.getElementById("wx-temp").textContent = `${Math.round(now?.air_temperature ?? 0)}°`;
    document.getElementById("wx-meta").textContent = `${symbol.replaceAll("_", " ")} • Vind ${Math.round(now?.wind_speed ?? 0)} m/s`;
    document.getElementById("wx-updated").textContent = `Uppdaterad: ${new Date().toLocaleString("sv-SE")}`;
  } catch {
    document.getElementById("wx-meta").textContent = "Kunde inte läsa väderdata just nu.";
  }
}

async function loadOmx() {
  try {
    const src = "https://www.avanza.se/index/om-indexet.html/18988/omx-stockholm-pi";
    const res = await fetch(`https://r.jina.ai/http://${src.replace("https://", "")}`);
    if (!res.ok) throw new Error("OMX-fel");
    const txt = await res.text();
    const m = txt.match(/OMX Stockholm PI[\s\S]{0,200}([\d\s]+,\d+|[\d\s]+\.\d+)/i);
    document.getElementById("omx-price").textContent = m ? m[1].trim() : "Data hittad, men utan tydligt indexvärde";
    document.getElementById("omx-meta").textContent = "Källa: Avanza (tolkad textdata)";
    document.getElementById("omx-updated").textContent = `Uppdaterad: ${new Date().toLocaleString("sv-SE")}`;
  } catch {
    document.getElementById("omx-price").textContent = "Ej tillgänglig";
    document.getElementById("omx-meta").textContent = "Avanza blockerar direktläsning ibland.";
  }
}

async function loadPokemon() {
  try {
    const feedUrl = "https://pokemongohub.net/post/category/event/feed/";
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
    if (!res.ok) throw new Error("RSS-fel");
    const data = await res.json();
    const items = (data.items || []).slice(0, 5);
    const list = document.getElementById("pogo-list");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = "<li>Inga events hittades.</li>";
    } else {
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item.title;
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
