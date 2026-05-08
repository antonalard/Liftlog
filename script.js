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
