const STORAGE_KEY = "traningsapp_v2";
const STEP_WEIGHT = 0.5;

const seedPasses = [
  {
    id: "upper",
    name: "Överkroppspass",
    exercises: [
      { id: crypto.randomUUID(), name: "Skivstångscurl", warmup: { reps: 10, weight: 35 }, work: { sets: 3, reps: 8, weight: 40 } },
      { id: crypto.randomUUID(), name: "Hantelpressar", warmup: { reps: 8, weight: 28 }, work: { sets: 3, reps: 8, weight: 33 } },
      { id: crypto.randomUUID(), name: "Mag curls", warmup: { reps: 0, weight: 0 }, work: { sets: 2, reps: 22, weight: 0 } },
      { id: crypto.randomUUID(), name: "Magrullaren", warmup: { reps: 0, weight: 0 }, work: { sets: 2, reps: 20, weight: 0 } },
      { id: crypto.randomUUID(), name: "Sittande rodd", warmup: { reps: 12, weight: 70 }, work: { sets: 3, reps: 10, weight: 80 } },
      { id: crypto.randomUUID(), name: "Latsdrag", warmup: { reps: 12, weight: 50 }, work: { sets: 3, reps: 10, weight: 65 } },
      { id: crypto.randomUUID(), name: "Lutande bänkpress", warmup: { reps: 12, weight: 50 }, work: { sets: 3, reps: 8, weight: 55 } }
    ]
  },
  {
    id: "legs-shoulders",
    name: "Ben och axelpass",
    exercises: [
      { id: crypto.randomUUID(), name: "Knäböj", warmup: { reps: 12, weight: 60 }, work: { sets: 3, reps: 8, weight: 90 } },
      { id: crypto.randomUUID(), name: "Benpress", warmup: { reps: 12, weight: 100 }, work: { sets: 3, reps: 10, weight: 140 } },
      { id: crypto.randomUUID(), name: "Drag till hakan", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 35 } },
      { id: crypto.randomUUID(), name: "Marklyft", warmup: { reps: 12, weight: 60 }, work: { sets: 3, reps: 8, weight: 90 } },
      { id: crypto.randomUUID(), name: "Axellyft fram", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 17 } },
      { id: crypto.randomUUID(), name: "Militärpress", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 28 } }
    ]
  },
  {
    id: "full",
    name: "Helkroppspass",
    exercises: [
      { id: crypto.randomUUID(), name: "Skivstångscurl", warmup: { reps: 10, weight: 35 }, work: { sets: 3, reps: 8, weight: 40 } },
      { id: crypto.randomUUID(), name: "Hantelpressar", warmup: { reps: 8, weight: 28 }, work: { sets: 3, reps: 8, weight: 33 } },
      { id: crypto.randomUUID(), name: "Mag curls", warmup: { reps: 0, weight: 0 }, work: { sets: 2, reps: 22, weight: 0 } },
      { id: crypto.randomUUID(), name: "Magrullaren", warmup: { reps: 0, weight: 0 }, work: { sets: 2, reps: 20, weight: 0 } },
      { id: crypto.randomUUID(), name: "Sittande rodd", warmup: { reps: 12, weight: 70 }, work: { sets: 3, reps: 10, weight: 80 } },
      { id: crypto.randomUUID(), name: "Latsdrag", warmup: { reps: 12, weight: 50 }, work: { sets: 3, reps: 10, weight: 65 } },
      { id: crypto.randomUUID(), name: "Lutande bänkpress", warmup: { reps: 12, weight: 50 }, work: { sets: 3, reps: 8, weight: 55 } },
      { id: crypto.randomUUID(), name: "Knäböj", warmup: { reps: 12, weight: 60 }, work: { sets: 3, reps: 8, weight: 90 } },
      { id: crypto.randomUUID(), name: "Benpress", warmup: { reps: 12, weight: 100 }, work: { sets: 3, reps: 10, weight: 140 } },
      { id: crypto.randomUUID(), name: "Drag till hakan", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 35 } },
      { id: crypto.randomUUID(), name: "Marklyft", warmup: { reps: 12, weight: 60 }, work: { sets: 3, reps: 8, weight: 90 } },
      { id: crypto.randomUUID(), name: "Axellyft fram", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 17 } },
      { id: crypto.randomUUID(), name: "Militärpress", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 28 } }
    ]
  }
];

const seedData = {
  activePersonId: "anton",
  meta: {},
  people: [
    { id: "anton", name: "Anton", passes: seedPasses, logs: [], passHistory: [], personalBests: {} },
    { id: "person-2", name: "Person 2", passes: [], logs: [], passHistory: [], personalBests: {} }
  ]
};

function normalizeState(raw) {
  if (raw?.people && Array.isArray(raw.people)) {
    raw.meta = raw.meta && typeof raw.meta === "object" ? raw.meta : {};
    raw.people = raw.people.map((p) => ({
      ...p,
      logs: Array.isArray(p.logs) ? p.logs : [],
      passHistory: Array.isArray(p.passHistory) ? p.passHistory : [],
      personalBests: p.personalBests && typeof p.personalBests === "object" ? p.personalBests : {}
    }));
    return raw;
  }
  if (raw?.passes && Array.isArray(raw.passes)) {
    return {
      activePersonId: "anton",
      people: [
        { id: "anton", name: "Anton", passes: raw.passes, logs: [], passHistory: [], personalBests: {} },
        { id: "person-2", name: "Person 2", passes: [], logs: [], passHistory: [], personalBests: {} }
      ]
    };
  }
  return seedData;
}

const state = normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));

let activeTab = "start";
let activePassId = null;
let editing = null;

function currentPerson() {
  return state.people.find((p) => p.id === state.activePersonId) || state.people[0];
}

function currentPasses() {
  return currentPerson().passes;
}

function currentLogs() {
  return currentPerson().logs;
}

function currentPassHistory() {
  return currentPerson().passHistory;
}

function currentPersonalBests() {
  return currentPerson().personalBests || {};
}

function passTheme(pass) {
  if (pass.id === "upper") return { tone: "pass-upper", icon: "assets/Icons/Överkroppspass.png", bodyTheme: "theme-pass-upper" };
  if (pass.id === "legs-shoulders") return { tone: "pass-lower", icon: "assets/Icons/Benpass.png", bodyTheme: "theme-pass-lower" };
  if (pass.id === "full") return { tone: "pass-full", icon: "assets/Icons/Helkroppspass.png", bodyTheme: "theme-pass-full" };
  return { tone: "pass-custom", icon: "assets/Icons/Extrapass.png", bodyTheme: "theme-pass-custom" };
}

function setActivePerson(id) {
  if (!state.people.some((p) => p.id === id)) return;
  state.activePersonId = id;
  activePassId = null;
  passDetail.classList.add("hidden");
  passListCard?.classList.remove("hidden");
  persist();
  renderPersonUI();
  renderPassList();
  renderHistory();
  renderProgress();
}

function ensureAntonFullPass() {
  state.meta = state.meta && typeof state.meta === "object" ? state.meta : {};
  if (state.meta.antonFullPassConfigured) return;

  const anton = state.people.find((p) => p.name.toLowerCase() === "anton");
  if (!anton) return;
  const full = anton.passes.find((p) => p.id === "full");
  if (!full) return;

  full.exercises = [
    { id: crypto.randomUUID(), name: "Skivstångscurl", warmup: { reps: 10, weight: 35 }, work: { sets: 3, reps: 8, weight: 40 } },
    { id: crypto.randomUUID(), name: "Benspark", warmup: { reps: 8, weight: 7 }, work: { sets: 3, reps: 3, weight: 10 } },
    { id: crypto.randomUUID(), name: "Hantelpressar", warmup: { reps: 8, weight: 28 }, work: { sets: 3, reps: 8, weight: 33 } },
    { id: crypto.randomUUID(), name: "Bencurl", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 10, weight: 0 } },
    { id: crypto.randomUUID(), name: "Sittande rodd", warmup: { reps: 12, weight: 70 }, work: { sets: 3, reps: 10, weight: 80 } },
    { id: crypto.randomUUID(), name: "Drag till hakan", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 35 } },
    { id: crypto.randomUUID(), name: "Axellyft fram", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 17 } },
    { id: crypto.randomUUID(), name: "Militärpress", warmup: { reps: 0, weight: 0 }, work: { sets: 3, reps: 8, weight: 28 } }
  ];

  state.meta.antonFullPassConfigured = true;
}


const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabPages = {
  start: document.getElementById("tab-start"),
  history: document.getElementById("tab-history"),
  progress: document.getElementById("tab-progress"),
  more: document.getElementById("tab-more")
};

const passList = document.getElementById("pass-list");
const passListCard = passList.closest(".card");
const stepsCard = document.getElementById("steps-card");
const passDetail = document.getElementById("pass-detail");
const detailTitle = document.getElementById("detail-title");
const exerciseList = document.getElementById("exercise-list");
const addExerciseBtn = document.getElementById("add-exercise-btn");
const addPassBtn = document.getElementById("add-pass-btn");
const donePassBtn = document.getElementById("done-pass-btn");
const deletePassBtn = document.getElementById("delete-pass-btn");
const activePersonNameEl = document.getElementById("active-person-name");
const personListEl = document.getElementById("person-list");
const addPersonBtn = document.getElementById("add-person-btn");
const deletePersonBtn = document.getElementById("delete-person-btn");

const volumeEl = document.getElementById("progress-volume");
const prList = document.getElementById("pr-list");
const historyList = document.getElementById("history-list");
const progressExerciseLegend = document.getElementById("progress-exercise-legend");
const progressPassLegend = document.getElementById("progress-pass-legend");
const progressPassChart = document.getElementById("progress-pass-chart");
const progressPassChartEmpty = document.getElementById("progress-pass-chart-empty");
const progressChart = document.getElementById("progress-chart");
const progressChartEmpty = document.getElementById("progress-chart-empty");
const hiddenPassSeries = new Set();
const hiddenExerciseSeries = new Set();

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const closeModalBtn = document.getElementById("close-modal");
const deleteExerciseBtn = document.getElementById("delete-exercise");
const editName = document.getElementById("edit-name");

const stepperValues = {
  warmupReps: 0,
  warmupWeight: 0,
  workSets: 0,
  workReps: 0,
  workWeight: 0
};

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getPassById(id) {
  return currentPasses().find((p) => p.id === id);
}

function formatWeight(weight) {
  if (!weight) return "kroppsvikt";
  return `${weight} kg`;
}

function workVolume(ex) {
  return (Number(ex.work.sets) || 0) * (Number(ex.work.reps) || 0) * (Number(ex.work.weight) || 0);
}

function getExerciseVisual(name) {
  const key = name.toLowerCase();
  const map = {
    "skivstångscurl": "assets/exercise-icons/Skivstångscurl.png",
    "hantelpressar": "assets/exercise-icons/Hantelpressar.png",
    "mag curls": "assets/exercise-icons/Mag curls.png",
    "magrullaren": "assets/exercise-icons/Magrullaren.png",
    "sittande rodd": "assets/exercise-icons/Sittande rodd.png",
    "latsdrag": "assets/exercise-icons/Latsdrag.png",
    "lutande bänkpress": "assets/exercise-icons/Lutande bänkpress.png",
    "knäböj": "assets/exercise-icons/Knäböj.png",
    "benpress": "assets/exercise-icons/Benpress.png",
    "drag till hakan": "assets/exercise-icons/Drag till hakan.png",
    "marklyft": "assets/exercise-icons/Marklyft.png",
    "axellyft fram": "assets/exercise-icons/Axellyft fram.png",
    "militärpress": "assets/exercise-icons/Militärpress.png",
    "benspark": "assets/exercise-icons/Benspark.png",
    "bencurl": "assets/exercise-icons/Bencurl.png"
  };

  if (map[key]) return { image: map[key], tone: "tone-green" };
  if (key.includes("press")) return { image: "assets/exercise-icons/Hantelpressar.png", tone: "tone-red" };
  return { image: "assets/ex-curl.svg", tone: "tone-orange" };
}

function switchTab(tab) {
  activeTab = tab;
  Object.entries(tabPages).forEach(([key, el]) => el.classList.toggle("is-active", key === tab));
  tabButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tab === tab));
  if (tab === "start" && activePassId) {
    activePassId = null;
    passDetail.classList.add("hidden");
    passListCard?.classList.remove("hidden");
    stepsCard?.classList.remove("hidden");
    document.body.classList.remove("theme-pass-upper", "theme-pass-lower", "theme-pass-full", "theme-pass-custom");
  }
  if (tab === "history") renderHistory();
  if (tab === "progress") renderProgress();
}

function renderPassList() {
  passList.innerHTML = "";
  currentPasses().forEach((pass) => {
    const btn = document.createElement("button");
    const theme = passTheme(pass);
    const tone = theme.tone;
    const icon = theme.icon;
    btn.className = `pass-card ${tone}`;
    const volume = pass.exercises.reduce((sum, ex) => sum + workVolume(ex), 0);
    btn.innerHTML = `
      <div class="pass-cover"><img src="${icon}" alt="${pass.name}" loading="lazy"></div>
      <div class="pass-info">
        <strong>${pass.name}</strong>
        <small>${pass.exercises.length} övningar • Volym ${Math.round(volume)} kg</small>
      </div>
    `;
    btn.addEventListener("click", () => {
      activePassId = pass.id;
      renderPassDetail();
    });
    passList.appendChild(btn);
  });
}

function exerciseText(ex) {
  const warm = ex.warmup.reps > 0 || ex.warmup.weight > 0
    ? `Uppvärmning: ${ex.warmup.reps} reps • ${formatWeight(ex.warmup.weight)}`
    : "Uppvärmning: -";
  const work = `Arbete: ${ex.work.sets} set • ${ex.work.reps} reps • ${formatWeight(ex.work.weight)}`;
  return `${warm}<br>${work}`;
}

function moveExercise(exId, direction) {
  const pass = getPassById(activePassId);
  const idx = pass.exercises.findIndex((e) => e.id === exId);
  const next = idx + direction;
  if (idx < 0 || next < 0 || next >= pass.exercises.length) return;
  const [item] = pass.exercises.splice(idx, 1);
  pass.exercises.splice(next, 0, item);
  persist();
  renderPassDetail();
  renderPassList();
  renderProgress();
}

function renderPassDetail() {
  const pass = getPassById(activePassId);
  if (!pass) {
    passDetail.classList.add("hidden");
    passListCard?.classList.remove("hidden");
    stepsCard?.classList.remove("hidden");
    document.body.classList.remove("theme-pass-upper", "theme-pass-lower", "theme-pass-full", "theme-pass-custom");
    return;
  }
  document.body.classList.remove("theme-pass-upper", "theme-pass-lower", "theme-pass-full", "theme-pass-custom");
  document.body.classList.add(passTheme(pass).bodyTheme);
  passListCard?.classList.add("hidden");
  stepsCard?.classList.add("hidden");
  passDetail.classList.remove("hidden");
  detailTitle.textContent = pass.name;
  exerciseList.innerHTML = "";

  if (!pass.exercises.length) {
    exerciseList.innerHTML = "<li class='muted'>Inga övningar tillagda ännu.</li>";
    return;
  }

  pass.exercises.forEach((ex, idx) => {
    const visual = getExerciseVisual(ex.name);
    const li = document.createElement("li");
    li.className = `exercise-item ${visual.tone}`;
    li.innerHTML = `
      <div class="exercise-card-row">
        <div class="exercise-thumb"><img src="${visual.image}" alt="${ex.name}" loading="lazy"></div>
        <div class="exercise-info">
          <div class="exercise-name">${idx + 1}. ${ex.name}</div>
          <div class="exercise-meta">${exerciseText(ex)}</div>
        </div>
        <div class="exercise-actions-col">
          <button data-action="edit" data-id="${ex.id}">Redigera</button>
          <button class="ghost" data-action="up" data-id="${ex.id}">Upp</button>
          <button class="ghost" data-action="down" data-id="${ex.id}">Ner</button>
        </div>
      </div>
    `;
    exerciseList.appendChild(li);
  });
}

function metricRow(label, value) {
  const div = document.createElement("div");
  div.className = "metric";
  div.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
  return div;
}

function renderProgress() {
  volumeEl.innerHTML = "";
  currentPasses().forEach((pass) => {
    const volume = pass.exercises.reduce((sum, ex) => sum + workVolume(ex), 0);
    volumeEl.appendChild(metricRow(pass.name, `${Math.round(volume)} kg`));
  });

  const exerciseNames = Array.from(new Set(currentPasses().flatMap((pass) => pass.exercises.map((ex) => ex.name))))
    .sort((a, b) => a.localeCompare(b, "sv"));

  prList.innerHTML = "";
  if (!exerciseNames.length) {
    prList.innerHTML = "<li class='muted'>Inga PR att visa ännu.</li>";
  } else {
    const pb = currentPersonalBests();
    exerciseNames.forEach((name) => {
      const li = document.createElement("li");
      li.className = "pr-item";
      const value = Number(pb[name]) || 0;
      li.innerHTML = `
        <div class="pr-row">
          <span>${name}</span>
          <input
            class="pr-input"
            data-action="pb-input"
            data-name="${name}"
            type="number"
            min="0"
            step="0.5"
            value="${value > 0 ? value : ""}"
            placeholder="-"
          />
        </div>
      `;
      prList.appendChild(li);
    });
  }

  drawPassProgressChart();

  drawProgressChart();
}

function drawPassProgressChart() {
  const ctx = progressPassChart.getContext("2d");
  const history = currentPassHistory();
  const dateKeys = Array.from(new Set(history.map((h) => h.date))).sort();

  const dpr = window.devicePixelRatio || 1;
  const width = progressPassChart.clientWidth || 300;
  const height = progressPassChart.clientHeight || 220;
  progressPassChart.width = Math.floor(width * dpr);
  progressPassChart.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (dateKeys.length < 1) {
    progressPassChart.classList.add("hidden");
    progressPassChartEmpty.classList.remove("hidden");
    return;
  }

  progressPassChart.classList.remove("hidden");
  progressPassChartEmpty.classList.add("hidden");

  const pad = { l: 38, r: 12, t: 14, b: 34 };
  const chartW = width - pad.l - pad.r;
  const chartH = height - pad.t - pad.b;

  const lines = currentPasses().map((pass) => {
    const passKey = pass.id === "upper" || pass.id === "legs-shoulders" || pass.id === "full" ? pass.id : "custom";
    const values = dateKeys.map((date) => {
      const row = history.find((h) => h.passId === pass.id && h.date === date);
      return row ? Number(row.totalWeight) || 0 : null;
    });
    return { pass, values, passKey };
  });

  const visibleLines = lines.filter((l) => !hiddenPassSeries.has(l.passKey));
  const allValues = visibleLines.flatMap((l) => l.values.filter((v) => v !== null));
  if (!allValues.length) {
    progressPassChart.classList.add("hidden");
    progressPassChartEmpty.classList.remove("hidden");
    progressPassChartEmpty.textContent = "Alla passlinjer är dolda i legend.";
    return;
  }
  progressPassChartEmpty.textContent = "Ingen körd passhistorik ännu.";
  const minY = Math.min(...allValues, 0);
  const maxY = Math.max(...allValues, 1);
  const ySpan = Math.max(1, maxY - minY);
  const isSingleDate = dateKeys.length === 1;

  ctx.strokeStyle = "rgba(157,176,206,.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t + chartH);
  ctx.lineTo(width - pad.r, pad.t + chartH);
  ctx.stroke();

  const colorByPass = (pass) => {
    if (pass.id === "upper") return "#63dd6e";
    if (pass.id === "legs-shoulders") return "#4ea2ff";
    if (pass.id === "full") return "#ff6b6b";
    return "#bb86fc";
  };

  const xForIndex = (i, count) => {
    if (count <= 1) return pad.l + chartW / 2;
    return pad.l + (i / (count - 1)) * chartW;
  };

  visibleLines.forEach((line) => {
    ctx.strokeStyle = colorByPass(line.pass);
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    line.values.forEach((value, i) => {
      if (value === null) return;
      const x = xForIndex(i, dateKeys.length);
      const y = pad.t + chartH - ((value - minY) / ySpan) * chartH;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = colorByPass(line.pass);
    line.values.forEach((value, i) => {
      if (value === null) return;
      const x = xForIndex(i, dateKeys.length);
      const y = pad.t + chartH - ((value - minY) / ySpan) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.fillStyle = "#c7dcff";
  ctx.font = "11px Segoe UI";
  if (isSingleDate) {
    const onlyDate = dateKeys[0];
    const tw = ctx.measureText(onlyDate).width;
    ctx.fillText(onlyDate, pad.l + (chartW - tw) / 2, height - 10);
  } else {
    ctx.fillText(dateKeys[0], pad.l, height - 10);
    const endTxt = dateKeys[dateKeys.length - 1];
    const tw = ctx.measureText(endTxt).width;
    ctx.fillText(endTxt, width - pad.r - tw, height - 10);
  }
}

function renderHistory() {
  if (!historyList) return;
  historyList.innerHTML = "";

  const history = currentPassHistory();
  if (!history.length) {
    historyList.innerHTML = "<li class='muted'>Ingen historik ännu.</li>";
    return;
  }

  currentPasses().forEach((pass) => {
    const uniqueDates = Array.from(new Set(history.filter((h) => h.passId === pass.id).map((h) => h.date))).sort().reverse();
    const li = document.createElement("li");
    li.className = "pr-item";
    li.innerHTML = `<strong>${pass.name}</strong><br><span class="muted">${uniqueDates.length ? uniqueDates.join(", ") : "-"}</span>`;
    historyList.appendChild(li);
  });
}

function drawProgressChart() {
  const ctx = progressChart.getContext("2d");
  const history = currentPassHistory();
  const dateKeys = Array.from(new Set(history.map((h) => h.date))).sort();
  const exerciseNames = Array.from(
    new Set(history.flatMap((h) => Object.keys(h.exerciseTotals || {})))
  ).sort((a, b) => a.localeCompare(b, "sv"));

  const dpr = window.devicePixelRatio || 1;
  const width = progressChart.clientWidth || 300;
  const height = progressChart.clientHeight || 220;
  progressChart.width = Math.floor(width * dpr);
  progressChart.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (!dateKeys.length || !exerciseNames.length) {
    progressChart.classList.add("hidden");
    progressChartEmpty.classList.remove("hidden");
    if (progressExerciseLegend) progressExerciseLegend.innerHTML = "";
    return;
  }

  progressChart.classList.remove("hidden");
  progressChartEmpty.classList.add("hidden");

  const pad = { l: 38, r: 12, t: 14, b: 34 };
  const chartW = width - pad.l - pad.r;
  const chartH = height - pad.t - pad.b;
  const isSinglePoint = dateKeys.length === 1;
  const colorForIndex = (i) => `hsl(${(i * 47) % 360} 80% 65%)`;
  const series = exerciseNames.map((name, i) => {
    const valuesByDate = dateKeys.map((date) => {
      let total = 0;
      history.forEach((entry) => {
        if (entry.date !== date) return;
        total += Number(entry.exerciseTotals?.[name]) || 0;
      });
      return total;
    });
    return { name, values: valuesByDate, color: colorForIndex(i) };
  });
  const visibleSeries = series.filter((s) => !hiddenExerciseSeries.has(s.name));
  const values = visibleSeries.flatMap((s) => s.values);
  if (!values.length) {
    progressChart.classList.add("hidden");
    progressChartEmpty.classList.remove("hidden");
    progressChartEmpty.textContent = "Alla övningslinjer är dolda i legend.";
    if (progressExerciseLegend) {
      progressExerciseLegend.innerHTML = "";
      series.forEach((line) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `legend-item ${hiddenExerciseSeries.has(line.name) ? "is-muted" : ""}`;
        item.dataset.exerciseName = line.name;
        item.innerHTML = `<i class="legend-dot" style="color:${line.color};background:${line.color}"></i>${line.name}`;
        progressExerciseLegend.appendChild(item);
      });
    }
    return;
  }
  progressChartEmpty.textContent = "Ingen loggad data för övningar ännu.";
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  let minY = rawMin;
  let maxY = rawMax;
  if (isSinglePoint) {
    const padY = Math.max(5, Math.round((rawMax || 1) * 0.1));
    minY = Math.max(0, rawMin - padY);
    maxY = rawMax + padY;
  }
  const ySpan = Math.max(1, maxY - minY);

  ctx.strokeStyle = "rgba(157,176,206,.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t + chartH);
  ctx.lineTo(width - pad.r, pad.t + chartH);
  ctx.stroke();

  const xForIndex = (i, count) => {
    if (count <= 1) return pad.l + chartW / 2;
    return pad.l + (i / (count - 1)) * chartW;
  };

  visibleSeries.forEach((line) => {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    line.values.forEach((value, i) => {
      const x = xForIndex(i, dateKeys.length);
      const y = pad.t + chartH - ((value - minY) / ySpan) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = line.color;
    line.values.forEach((value, i) => {
      const x = xForIndex(i, dateKeys.length);
      const y = pad.t + chartH - ((value - minY) / ySpan) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.fillStyle = "#c7dcff";
  ctx.font = "11px Segoe UI";
  const firstDate = dateKeys[0];
  const lastDate = dateKeys[dateKeys.length - 1];
  if (isSinglePoint) {
    const tw = ctx.measureText(firstDate).width;
    ctx.fillText(firstDate, pad.l + (chartW - tw) / 2, height - 10);
  } else {
    ctx.fillText(firstDate, pad.l, height - 10);
    const tw = ctx.measureText(lastDate).width;
    ctx.fillText(lastDate, width - pad.r - tw, height - 10);
  }
  ctx.fillText(`${minY} kg`, 4, pad.t + chartH);
  ctx.fillText(`${maxY} kg`, 4, pad.t + 10);

  if (progressExerciseLegend) {
    progressExerciseLegend.innerHTML = "";
    series.forEach((line) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `legend-item ${hiddenExerciseSeries.has(line.name) ? "is-muted" : ""}`;
      item.dataset.exerciseName = line.name;
      item.innerHTML = `<i class="legend-dot" style="color:${line.color};background:${line.color}"></i>${line.name}`;
      progressExerciseLegend.appendChild(item);
    });
  }
}

function setupStepper(el, key, step, min) {
  el.innerHTML = "";
  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "-";
  const out = document.createElement("input");
  out.type = "number";
  out.step = String(step);
  out.min = String(min);
  out.inputMode = step === 1 ? "numeric" : "decimal";
  out.className = "stepper-output";
  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";

  function normalizeValue(raw) {
    const num = Number(raw);
    if (!Number.isFinite(num)) return min;
    const clamped = Math.max(min, num);
    return step === 1 ? Math.round(clamped) : Math.round(clamped * 10) / 10;
  }

  function draw() {
    out.value = Number.isInteger(stepperValues[key]) ? String(stepperValues[key]) : stepperValues[key].toFixed(1);
  }

  minus.addEventListener("click", () => {
    stepperValues[key] = Math.max(min, Math.round((stepperValues[key] - step) * 10) / 10);
    draw();
  });
  plus.addEventListener("click", () => {
    stepperValues[key] = Math.round((stepperValues[key] + step) * 10) / 10;
    draw();
  });
  out.addEventListener("change", () => {
    stepperValues[key] = normalizeValue(out.value);
    draw();
  });
  out.addEventListener("blur", () => {
    stepperValues[key] = normalizeValue(out.value);
    draw();
  });

  el.append(minus, out, plus);
  draw();
}

function openEditModal(exId) {
  const pass = getPassById(activePassId);
  const ex = pass.exercises.find((item) => item.id === exId);
  if (!ex) return;

  editing = { passId: pass.id, exId: ex.id };
  editName.value = ex.name;
  stepperValues.warmupReps = Number(ex.warmup.reps) || 0;
  stepperValues.warmupWeight = Number(ex.warmup.weight) || 0;
  stepperValues.workSets = Number(ex.work.sets) || 0;
  stepperValues.workReps = Number(ex.work.reps) || 0;
  stepperValues.workWeight = Number(ex.work.weight) || 0;

  document.querySelectorAll(".stepper").forEach((el) => {
    const key = el.dataset.field;
    const isWeight = key.toLowerCase().includes("weight");
    setupStepper(el, key, isWeight ? STEP_WEIGHT : 1, 0);
  });

  editModal.showModal();
}

function closeEditModal() {
  editing = null;
  editModal.close();
}

function addPass() {
  const name = prompt("Namn på nytt pass?");
  if (!name || !name.trim()) return;
  const newPass = {
    id: `pass-${crypto.randomUUID()}`,
    name: name.trim(),
    exercises: []
  };
  currentPasses().push(newPass);
  persist();
  renderPassList();
  renderProgress();
}

function addPerson() {
  const name = prompt("Namn på ny person?");
  if (!name || !name.trim()) return;
  const id = `person-${crypto.randomUUID()}`;
  const anton = state.people.find((p) => p.name.toLowerCase() === "anton");
  const sourcePasses = anton?.passes || [];
  const clonedPasses = sourcePasses.map((pass) => ({
    id: pass.id,
    name: pass.name,
    exercises: pass.exercises.map((ex) => ({
      id: crypto.randomUUID(),
      name: ex.name,
      warmup: { reps: ex.warmup.reps, weight: 0 },
      work: { sets: ex.work.sets, reps: ex.work.reps, weight: 0 }
    }))
  }));
  state.people.push({ id, name: name.trim(), passes: clonedPasses, logs: [], passHistory: [], personalBests: {} });
  setActivePerson(id);
}

function deleteActivePerson() {
  if (state.people.length <= 1) {
    alert("Det måste finnas minst en person.");
    return;
  }
  const person = currentPerson();
  const ok = confirm(`Radera ${person.name}?`);
  if (!ok) return;
  state.people = state.people.filter((p) => p.id !== state.activePersonId);
  state.activePersonId = state.people[0].id;
  activePassId = null;
  passDetail.classList.add("hidden");
  passListCard?.classList.remove("hidden");
  document.body.classList.remove("theme-pass-upper", "theme-pass-lower", "theme-pass-full", "theme-pass-custom");
  persist();
  renderPersonUI();
  renderPassList();
  renderProgress();
}

function renderPersonUI() {
  const person = currentPerson();
  if (activePersonNameEl) activePersonNameEl.textContent = person.name;
  if (!personListEl) return;
  personListEl.innerHTML = "";
  state.people.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = `person-btn ${p.id === state.activePersonId ? "is-active" : "ghost"}`;
    btn.textContent = p.name;
    btn.addEventListener("click", () => setActivePerson(p.id));
    personListEl.appendChild(btn);
  });
}

function addExerciseToActivePass() {
  const pass = getPassById(activePassId);
  if (!pass) return;

  const ex = {
    id: crypto.randomUUID(),
    name: "Ny övning",
    warmup: { reps: 0, weight: 0 },
    work: { sets: 3, reps: 3, weight: 10 }
  };

  pass.exercises.push(ex);
  persist();
  renderPassDetail();
  renderPassList();
  renderProgress();
  openEditModal(ex.id);
}

exerciseList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const exId = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "up") moveExercise(exId, -1);
  if (action === "down") moveExercise(exId, 1);
  if (action === "edit") openEditModal(exId);
});

prList.addEventListener("change", (e) => {
  const input = e.target.closest("input[data-action='pb-input']");
  if (!input) return;
  const name = input.dataset.name;
  const raw = input.value;
  const value = Number(String(raw).replace(",", "."));
  const pb = currentPersonalBests();
  if (!raw.trim() || !Number.isFinite(value) || value <= 0) {
    delete pb[name];
    input.value = "";
  } else {
    pb[name] = Math.round(value * 10) / 10;
    input.value = String(pb[name]);
  }
  persist();
});

editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!editing) return;
  const pass = getPassById(editing.passId);
  const ex = pass.exercises.find((item) => item.id === editing.exId);
  if (!ex) return;

  ex.name = editName.value.trim() || ex.name;
  ex.warmup.reps = stepperValues.warmupReps;
  ex.warmup.weight = stepperValues.warmupWeight;
  ex.work.sets = stepperValues.workSets;
  ex.work.reps = stepperValues.workReps;
  ex.work.weight = stepperValues.workWeight;
  currentLogs().push({
    passId: pass.id,
    passName: pass.name,
    exerciseName: ex.name,
    weight: Number(ex.work.weight) || 0,
    timestamp: new Date().toISOString()
  });

  persist();
  renderPassDetail();
  renderPassList();
  renderHistory();
  renderProgress();
  closeEditModal();
});

deleteExerciseBtn.addEventListener("click", () => {
  if (!editing) return;
  const ok = confirm("Ta bort övningen?");
  if (!ok) return;
  const pass = getPassById(editing.passId);
  pass.exercises = pass.exercises.filter((item) => item.id !== editing.exId);
  persist();
  renderPassDetail();
  renderPassList();
  renderHistory();
  renderProgress();
  closeEditModal();
});

closeModalBtn.addEventListener("click", closeEditModal);
addExerciseBtn?.addEventListener("click", addExerciseToActivePass);
addPassBtn?.addEventListener("click", addPass);
addPersonBtn?.addEventListener("click", addPerson);
deletePersonBtn?.addEventListener("click", deleteActivePerson);
donePassBtn?.addEventListener("click", () => {
  if (activePassId) {
    const pass = getPassById(activePassId);
    if (pass) {
      const date = new Date().toLocaleDateString("sv-SE");
      const totalWeight = pass.exercises.reduce((sum, ex) => sum + workVolume(ex), 0);
      const exerciseTotals = {};
      pass.exercises.forEach((ex) => {
        exerciseTotals[ex.name] = (exerciseTotals[ex.name] || 0) + workVolume(ex);
      });
      const existing = currentPassHistory().find((h) => h.passId === pass.id && h.date === date);
      if (existing) {
        existing.totalWeight = totalWeight;
        existing.exerciseTotals = exerciseTotals;
        existing.timestamp = new Date().toISOString();
      } else {
        currentPassHistory().push({
          passId: pass.id,
          passName: pass.name,
          date,
          timestamp: new Date().toISOString(),
          totalWeight,
          exerciseTotals
        });
      }
      persist();
      renderHistory();
      renderProgress();
    }
  }
  activePassId = null;
  passDetail.classList.add("hidden");
  passListCard?.classList.remove("hidden");
  stepsCard?.classList.remove("hidden");
  document.body.classList.remove("theme-pass-upper", "theme-pass-lower", "theme-pass-full", "theme-pass-custom");
});
deletePassBtn?.addEventListener("click", () => {
  if (!activePassId) return;
  const pass = getPassById(activePassId);
  if (!pass) return;
  const ok = confirm(`Radera passet "${pass.name}"?`);
  if (!ok) return;
  const person = currentPerson();
  person.passes = person.passes.filter((p) => p.id !== activePassId);
  person.logs = person.logs.filter((l) => l.passId !== activePassId);
  person.passHistory = person.passHistory.filter((h) => h.passId !== activePassId);
  activePassId = null;
  passDetail.classList.add("hidden");
  passListCard?.classList.remove("hidden");
  stepsCard?.classList.remove("hidden");
  document.body.classList.remove("theme-pass-upper", "theme-pass-lower", "theme-pass-full", "theme-pass-custom");
  persist();
  renderPassList();
  renderHistory();
  renderProgress();
});

tabButtons.forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
progressPassLegend?.addEventListener("click", (e) => {
  const item = e.target.closest("[data-pass-id]");
  if (!item) return;
  const key = item.dataset.passId;
  if (hiddenPassSeries.has(key)) hiddenPassSeries.delete(key); else hiddenPassSeries.add(key);
  item.classList.toggle("is-muted", hiddenPassSeries.has(key));
  if (activeTab === "progress") drawPassProgressChart();
});
progressExerciseLegend?.addEventListener("click", (e) => {
  const item = e.target.closest("[data-exercise-name]");
  if (!item) return;
  const key = item.dataset.exerciseName;
  if (hiddenExerciseSeries.has(key)) hiddenExerciseSeries.delete(key); else hiddenExerciseSeries.add(key);
  if (activeTab === "progress") drawProgressChart();
});
window.addEventListener("resize", () => {
  if (activeTab === "progress") {
    drawPassProgressChart();
    drawProgressChart();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
}

persist();
ensureAntonFullPass();
persist();
renderPersonUI();
renderPassList();
renderHistory();
renderProgress();
switchTab("start");
