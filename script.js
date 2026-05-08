const reveals = Array.from(document.querySelectorAll("[data-reveal]"));

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
