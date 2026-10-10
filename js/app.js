// ============================================================
// MALAYSIA FUEL PRICES (RM per litre) - From Setel (Oct 2026)
// ============================================================
const FUEL_PRICES = {
  ron95:    { market: 4.67, subsidised: 1.99, label: "RON 95" },
  ron97:    { market: 5.15, subsidised: 5.15, label: "RON 97" },
  diesel:   { market: 5.27, subsidised: 2.10, label: "Diesel" },
  dieselb7: { market: 5.47, subsidised: 5.47, label: "Diesel B7" }
};

// ============================================================
// MULTI-CAR STATE
// ============================================================
const CAR_PHOTOS = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1400&q=85"
];

const state = {
  cars: [
    {
      id: "car-1",
      name: "Primary Car",
      emoji: "🚗",
      color: "#16734a",
      photo: CAR_PHOTOS[0],
      caption: "Every litre tells a story.",
      isDefault: true,
      details: { brand: "—", model: "—", type: "sedan", engine: "—", year: "—", condition: "good" },
      history: [],
      habits: {
        purpose: "commuting",
        tripType: "mixed",
        traffic: "often",
        style: "smooth",
        idling: "medium"
      }
    }
  ],
  activeCarId: "car-1",
  distance: 120,
  litres: 12,
  fuelType: "ron95",
  fuelPrice: 4.67,
  subsidised: false,
  condition: "traffic",
  latest: 10,
  extraCost: 0,
  baseline: 7,
  hasHistory: false
};

const CAR_COLORS = ["#16734a", "#d97732", "#3b6fb5", "#8e44ad", "#c0392b", "#16a085"];
const CAR_EMOJIS = ["🚗", "🚙", "🚕", "🏎️", "🚐", "🛻"];

const actionDetails = {
  traffic: { title: "Reduce unnecessary idling", description: "Plan your journey around expected congestion and avoid unnecessary idling.", probability: 0.78, savingRate: 0.35, icon: "↔️" },
  tyres:   { title: "Check tyre pressure", description: "Check tyre pressure when cold and follow your vehicle manufacturer's guidance.", probability: 0.70, savingRate: 0.25, icon: "◉" },
  smooth:  { title: "Drive more smoothly", description: "Accelerate gradually, anticipate traffic, and avoid rapid braking.", probability: 0.88, savingRate: 0.40, icon: "⌁" },
  monitor: { title: "Monitor and inspect", description: "Record several journeys. If high consumption persists, see a mechanic.", probability: 0.55, savingRate: 0.20, icon: "✓" },
  ac:      { title: "Reduce air-conditioning load", description: "Use the AC more efficiently on short trips — it can increase consumption by up to 15%.", probability: 0.65, savingRate: 0.15, icon: "❄" },
  weight:  { title: "Remove unnecessary weight", description: "Clear heavy items from the boot. Every extra 50 kg adds roughly 2% to fuel use.", probability: 0.72, savingRate: 0.10, icon: "⚖" },
  carpool: { title: "Carpool or use public transport", description: "Switch 2–3 trips per week to carpooling, LRT/MRT, or buses. Reduces both fuel cost and wear on your car.", probability: 0.82, savingRate: 0.45, icon: "🚌" }
};

// ============================================================
// HELPERS
// ============================================================
function getActiveCar() {
  return state.cars.find((c) => c.id === state.activeCarId) || state.cars[0];
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (pageId === "fuel-input") {
    document.getElementById("active-car-name").textContent = getActiveCar().name;
    updateFuelPriceHint();
  }
  if (pageId === "habits") {
    document.getElementById("habits-car-name").textContent = getActiveCar().name;
    loadHabitsIntoForm();
  }
  if (pageId === "home") {
    updateHomeImage();
  }
}

function formatRM(value) {
  return "RM " + value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateHomeImage() {
  const car = getActiveCar();
  const img = document.getElementById("home-car-image");
  const caption = document.getElementById("home-car-caption");
  if (img && car.photo) {
    img.style.opacity = "0";
    setTimeout(() => {
      img.src = car.photo;
      img.onload = () => { img.style.opacity = "1"; };
    }, 150);
  }
  if (caption) caption.textContent = car.caption || "Every litre tells a story.";
}

// ============================================================
// FUEL PRICE + SUBSIDY LOGIC
// ============================================================
function updateFuelPriceHint() {
  const fuelType = document.getElementById("fuel-type").value;
  const isCitizen = document.getElementById("citizen").checked;
  const subsidyRow = document.getElementById("subsidy-row");
  const subsidyCheckbox = document.getElementById("subsidy");
  const subsidyHint = document.getElementById("subsidy-hint");

  const supportsSubsidy = fuelType === "ron95" || fuelType === "diesel";

  if (!isCitizen) {
    subsidyCheckbox.checked = false;
    subsidyCheckbox.disabled = true;
    subsidyRow.style.opacity = "0.55";
    subsidyHint.textContent = 'Tick "Malaysian citizen" above to unlock this.';
  } else if (!supportsSubsidy) {
    subsidyCheckbox.checked = false;
    subsidyCheckbox.disabled = true;
    subsidyRow.style.opacity = "0.55";
    subsidyHint.textContent = `${FUEL_PRICES[fuelType].label} has no BUDI subsidy — market price applies.`;
  } else {
    subsidyCheckbox.disabled = false;
    subsidyRow.style.opacity = "1";
    subsidyHint.textContent = "I qualify for the Malaysian BUDI subsidy programme.";
  }

  const subsidyChecked = subsidyCheckbox.checked;
  const priceInput = document.getElementById("fuel-price");
  const hint = document.getElementById("fuel-price-hint");

  const info = FUEL_PRICES[fuelType];
  const canSubsidise = isCitizen && subsidyChecked && supportsSubsidy;
  const price = canSubsidise ? info.subsidised : info.market;

  priceInput.value = price.toFixed(2);

  if (canSubsidise) {
    hint.textContent = `BUDI subsidised ${info.label} price: RM ${info.subsidised.toFixed(2)}/L`;
  } else {
    hint.textContent = `Pump price for ${info.label}: RM ${info.market.toFixed(2)}/L`;
  }
}

document.getElementById("fuel-type").addEventListener("change", updateFuelPriceHint);
document.getElementById("citizen").addEventListener("change", updateFuelPriceHint);
document.getElementById("subsidy").addEventListener("change", updateFuelPriceHint);

// ============================================================
// CAR RENDERING
// ============================================================
function renderCars() {
  const list = document.getElementById("cars-list");
  const count = document.getElementById("cars-count");
  count.textContent = state.cars.length + (state.cars.length === 1 ? " car" : " cars");

  list.innerHTML = state.cars.map((car) => {
    const active = car.id === state.activeCarId;
    const logs = car.history.length;
    const logLabel = logs === 0 ? "No logs yet" : `${logs} log${logs > 1 ? "s" : ""}`;
    const d = car.details;
    const detailLine = d.brand && d.brand !== "—"
      ? `${d.brand} ${d.model} · ${d.type.toUpperCase()} · ${d.year}`
      : `${car.habits.style} · ${car.habits.tripType} trips`;

    return `
      <button class="car-card ${active ? "active" : ""}"
              onclick="selectCar('${car.id}')"
              style="--car-color: ${car.color}">
        <div class="car-avatar" style="background:${car.color}">${car.emoji}</div>
        <div class="car-info">
          <strong>${car.name}</strong>
          <small>${logLabel} · ${detailLine}</small>
        </div>
      </button>
    `;
  }).join("");
}

function selectCar(carId) {
  state.activeCarId = carId;
  renderCars();
  updateHomeImage();
}

// ============================================================
// ADD CAR MODAL
// ============================================================
function openAddCarModal() {
  document.getElementById("car-modal").classList.add("open");
  document.getElementById("add-car-form").reset();
  document.getElementById("new-car-condition").value = "good";
  document.getElementById("new-car-type").value = "sedan";
}

function closeAddCarModal(event) {
  if (event) event.stopPropagation();
  document.getElementById("car-modal").classList.remove("open");
}

document.getElementById("add-car-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("new-car-name").value.trim();
  const brand = document.getElementById("new-car-brand").value;
  const model = document.getElementById("new-car-model").value.trim();
  const type = document.getElementById("new-car-type").value;
  const engine = document.getElementById("new-car-engine").value;
  const year = document.getElementById("new-car-year").value.trim();
  const condition = document.getElementById("new-car-condition").value;

  if (!name || !brand || !model || !engine || !year) {
    alert("Please fill in all fields.");
    return;
  }

  const index = state.cars.length;
  const newCar = {
    id: "car-" + Date.now(),
    name: name,
    emoji: CAR_EMOJIS[index % CAR_EMOJIS.length],
    color: CAR_COLORS[index % CAR_COLORS.length],
    photo: CAR_PHOTOS[index % CAR_PHOTOS.length],
    caption: `${name} · ${brand} ${model}`,
    isDefault: false,
    details: { brand, model, type, engine, year, condition },
    history: [],
    habits: {
      purpose: "mixed",
      tripType: "mixed",
      traffic: "sometimes",
      style: "smooth",
      idling: "medium"
    }
  };

  state.cars.push(newCar);
  state.activeCarId = newCar.id;
  renderCars();
  updateHomeImage();
  closeAddCarModal();
});

// ============================================================
// FUEL FORM
// ============================================================
document.getElementById("fuel-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const distance = Number(document.getElementById("distance").value);
  const litres = Number(document.getElementById("litres").value);
  const fuelPrice = Number(document.getElementById("fuel-price").value);
  const fuelType = document.getElementById("fuel-type").value;
  const subsidised = document.getElementById("subsidy").checked;

  if (
    !Number.isFinite(distance) ||
    !Number.isFinite(litres) ||
    !Number.isFinite(fuelPrice) ||
    distance <= 0 ||
    litres <= 0 ||
    fuelPrice <= 0
  ) {
    alert("Please enter valid positive numbers in all fields.");
    return;
  }

  const car = getActiveCar();
  const latest = (litres / distance) * 100;

  let baseline;
  let hasHistory = car.history.length > 0;

  if (hasHistory) {
    const recent = car.history.slice(-5);
    const sum = recent.reduce((s, e) => s + e.l100, 0);
    baseline = sum / recent.length;
  } else {
    baseline = latest;
  }

  car.history.push({ distance, litres, l100: latest, fuelType });

  state.distance = distance;
  state.litres = litres;
  state.fuelPrice = fuelPrice;
  state.fuelType = fuelType;
  state.subsidised = subsidised;
  state.condition = document.getElementById("condition").value;
  state.latest = latest;
  state.baseline = baseline;
  state.hasHistory = hasHistory;

  const extraLitres = Math.max(0, ((latest - baseline) / 100) * distance);
  state.extraCost = extraLitres * fuelPrice;

  renderInvestigation();
  showPage("investigation");
});

// ============================================================
// INVESTIGATION
// ============================================================
function renderInvestigation() {
  const car = getActiveCar();
  const difference = state.hasHistory
    ? ((state.latest - state.baseline) / state.baseline) * 100
    : 0;
  const abnormal = difference >= 15;

  document.getElementById("latest-metric").textContent = state.latest.toFixed(1);
  document.getElementById("baseline-metric").textContent = state.baseline.toFixed(1);
  document.getElementById("extra-cost").textContent = formatRM(state.extraCost);

  const recentHistory = car.history.slice(-5);
  const chartValues = recentHistory.map((h) => h.l100);
  if (chartValues.length === 1) chartValues.unshift(state.baseline);

  drawFuelChart("fuel-chart", chartValues, state.baseline, "Latest", abnormal);

  const message = document.getElementById("anomaly-message");

  if (!state.hasHistory) {
    message.className = "anomaly-card normal";
    message.innerHTML = `<h3>First log recorded for ${car.name}</h3><p>Your baseline is now saved. Log another journey to start spotting patterns and getting tailored savings suggestions.</p>`;
  } else if (abnormal) {
    message.className = "anomaly-card warning";
    message.innerHTML = `<h3>⚠ Fuel consumption is higher than your usual level</h3><p>Your latest reading is ${difference.toFixed(1)}% above your recent average. This is worth investigating.</p>`;
  } else if (difference > 0) {
    message.className = "anomaly-card normal";
    message.innerHTML = `<h3>Fuel consumption is slightly above your usual level</h3><p>Your latest reading is ${difference.toFixed(1)}% above your recent average.</p>`;
  } else {
    message.className = "anomaly-card normal";
    message.innerHTML = `<h3>Your latest reading is within or below your usual level</h3><p>Keep recording journeys to understand your longer-term pattern.</p>`;
  }

  const normalBlock = document.getElementById("normal-message");
  const analysisBlock = document.getElementById("analysis-block");
  const title = document.getElementById("investigation-title");
  const subtitle = document.getElementById("investigation-subtitle");
  const normalTitle = document.getElementById("normal-title");
  const normalText = document.getElementById("normal-text");

  const isFirstLog = !state.hasHistory;
  const isNormal = state.hasHistory && !abnormal;

  if (isFirstLog) {
    normalBlock.style.display = "flex";
    analysisBlock.style.display = "none";
    title.textContent = "First log recorded.";
    subtitle.textContent = "Your baseline has been saved. Log another journey to unlock insights.";
    normalTitle.textContent = "Journey saved successfully";
    normalText.textContent = "Come back after your next fuel-up — EcoDrive will start spotting patterns and suggesting ways to save.";
    fetchAICoach({ car, difference, isFirstLog: true });
    return;
  }

  if (isNormal) {
    normalBlock.style.display = "flex";
    analysisBlock.style.display = "none";
    title.textContent = "Your fuel use looks normal.";
    subtitle.textContent = "Nothing to worry about — keep logging journeys to track any changes.";
    normalTitle.textContent = "Your fuel use looks normal";
    normalText.textContent = "No action needed right now. Keep logging journeys to spot any future changes.";
    fetchAICoach({ car, difference, isFirstLog: false });
    return;
  }

  // Abnormal → full analysis
  normalBlock.style.display = "none";
  analysisBlock.style.display = "block";
  title.textContent = "Here's what we found.";
  subtitle.textContent = "Based on your logged data, here are the likely causes and suggested actions.";

  document.getElementById("investigation-summary").innerHTML = `
    <h2>⚠ A noticeable change in your fuel use</h2>
    <p>Your latest reading is ${state.latest.toFixed(1)} L/100 km, which is
    ${difference.toFixed(1)}% above your recent average of
    ${state.baseline.toFixed(1)} L/100 km.</p>
  `;

  const causes = getPossibleCauses(car, difference);
  document.getElementById("cause-list").innerHTML = causes.map((c, i) => `
    <article class="cause-card">
      <div class="cause-number">${i + 1}</div>
      <div>
        <h3>${c.title}</h3>
        <p>${c.description}</p>
        <span class="cause-confidence">${c.evidence}</span>
      </div>
    </article>
  `).join("");

  const suggestions = pickSuggestions(car, difference, state.condition);
  const JOURNEYS_PER_MONTH = 20;
  const monthlyExtraCost = state.extraCost * JOURNEYS_PER_MONTH;

  document.getElementById("action-panel").innerHTML = suggestions.map((key, i) => {
    const action = actionDetails[key];
    const monthlySaving = Math.max(monthlyExtraCost * action.savingRate, 30);
    const probabilityPercent = Math.round(action.probability * 100);

    return `
      <div class="action-panel-card" style="margin-bottom: 18px;">
        <div class="action-panel-header">
          <span class="action-icon">${action.icon}</span>
          <div>
            <h3>${i + 1}. ${action.title}</h3>
            <p>${action.description}</p>
          </div>
        </div>
        <div class="impact-grid">
          <div class="impact-box highlight">
            <span class="impact-label">Potential monthly saving</span>
            <strong>${formatRM(monthlySaving)}</strong>
          </div>
          <div class="impact-box">
            <span class="impact-label">Probability of success</span>
            <strong>${probabilityPercent}%</strong>
          </div>
        </div>
        <div class="probability-bar-wrapper">
          <div class="probability-bar">
            <div class="probability-fill" style="width: ${probabilityPercent}%"></div>
          </div>
          <span class="probability-label">
            ${probabilityPercent}% likely to help based on your driving profile
          </span>
        </div>
      </div>
    `;
  }).join("");

  fetchAICoach({ car, difference, isFirstLog: false });
}

function getConditionSummary() {
  const summaries = {
    traffic: "You reported heavy traffic and frequent stopping.",
    normal: "You reported normal traffic conditions.",
    highway: "You reported mostly highway driving.",
    short: "You reported making many short trips."
  };
  return summaries[state.condition] || "";
}

function getPossibleCauses(car, difference) {
  const causes = [];

  if (state.condition === "traffic") {
    causes.push({
      title: "Stop-start traffic and idling",
      description: "Repeated stopping and accelerating increases fuel use per kilometre. Compare a similar route during less congested periods.",
      evidence: "Matches reported driving conditions"
    });
  }
  if (state.condition === "short") {
    causes.push({
      title: "Frequent short journeys",
      description: "An engine uses more fuel before reaching its normal operating temperature. Many short trips add up.",
      evidence: "Matches reported driving conditions"
    });
  }
  if (state.condition === "highway") {
    causes.push({
      title: "Highway speed, wind or gradients",
      description: "Higher speeds, strong headwinds, and gradients can all push consumption up.",
      evidence: "Possible route-related explanation"
    });
  }
  if (car.habits.style === "rapid") {
    causes.push({
      title: "Aggressive acceleration & braking",
      description: "Rapid acceleration burns significantly more fuel. Smoother driving is one of the biggest wins.",
      evidence: "Matches your driving style"
    });
  }
  if (car.habits.idling === "high") {
    causes.push({
      title: "Frequent engine idling",
      description: "Idling wastes fuel with no distance gained. Turning off the engine when parked saves real money.",
      evidence: "Matches your idling habit"
    });
  }
  if (car.habits.traffic === "often" && state.condition !== "traffic") {
    causes.push({
      title: "Recurring congestion patterns",
      description: "You usually drive in heavy traffic. Time-of-day changes can reduce exposure to jams.",
      evidence: "Matches your traffic habits"
    });
  }
  causes.push({
    title: "Tyre pressure & maintenance",
    description: "Under-inflated tyres or a worn air filter can quietly raise fuel use by 5-10%.",
    evidence: "Worth a quick check"
  });
  causes.push({
    title: "Extra weight in the car",
    description: "Heavy items left in the boot add rolling resistance and increase consumption.",
    evidence: "Simple to fix"
  });
  if (difference >= 15) {
    causes.push({
      title: "Sudden jump in consumption",
      description: "A sharp spike is often mechanical — oxygen sensor, spark plugs, or fuel injectors are common culprits.",
      evidence: "Consider a mechanic inspection"
    });
  }
  return causes.slice(0, 4);
}

function pickSuggestions(car, difference, condition) {
  const suggestions = [];
  if (difference >= 15) {
    suggestions.push("carpool");
    suggestions.push("monitor");
  }
  if (condition === "traffic") suggestions.push("traffic");
  if (car.habits.style === "rapid") suggestions.push("smooth");
  if (car.habits.idling === "high") suggestions.push("traffic");
  if (condition === "short") suggestions.push("weight");
  if (car.habits.traffic === "often" && !suggestions.includes("traffic")) {
    suggestions.push("traffic");
  }
  if (!suggestions.includes("smooth")) suggestions.push("smooth");
  if (!suggestions.includes("tyres")) suggestions.push("tyres");
  if (!suggestions.includes("ac")) suggestions.push("ac");

  const unique = [...new Set(suggestions)];
  return unique.slice(0, 3);
}

// ============================================================
// AI COACH — Calls Flask backend
// ============================================================
async function fetchAICoach({ car, difference, isFirstLog }) {
  const aiText = document.getElementById("ai-coach-text");
  const aiCard = document.getElementById("ai-coach-card");
  if (!aiText || !aiCard) return;

  aiCard.style.display = "block";
  aiText.classList.add("loading");
  aiText.textContent = "Thinking";

  const payload = {
    // User's actual journey data
    distance:   state.distance,
    litres:     state.litres,
    latest:     state.latest,
    baseline:   state.baseline,
    difference: difference,
    condition:  state.condition,
    fuelType:   state.fuelType,
    subsidised: state.subsidised,
    extraCost:  state.extraCost,
    isFirstLog: isFirstLog,

    // Car features for ML
    car_type:      car.details.type || "sedan",
    car_condition: car.details.condition || "good",
    engine_cc:     parseInt(car.details.engine) || 1500,
    year:          parseInt(car.details.year) || 2020,
    purpose:       car.habits.purpose,
    trip_type:     car.habits.tripType,
    traffic:       car.habits.traffic,
    style:         car.habits.style,
    idling:        car.habits.idling
  };

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();
    aiText.classList.remove("loading");

    if (data.ai_advice) {
      aiText.style.opacity = "0";
      aiText.textContent = data.ai_advice;
      setTimeout(() => { aiText.style.opacity = "1"; }, 50);
    } else {
      aiText.textContent = "AI advice unavailable right now.";
    }
  } catch (err) {
    console.error("[AI Coach] Error:", err);
    aiText.classList.remove("loading");
    aiText.textContent = "Couldn't reach the AI coach. Check that Flask is running.";
  }
}

// ============================================================
// CHART
// ============================================================
function drawFuelChart(containerId, values, baseline, lastLabel, abnormal) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 680;
  const height = 240;
  const left = 48;
  const right = 20;
  const top = 20;
  const bottom = 36;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const maxValue = Math.max(baseline, ...values) * 1.25;
  const minValue = 0;
  const x = (i) => left + (plotWidth * i) / Math.max(1, values.length - 1);
  const y = (v) => top + plotHeight - ((v - minValue) / (maxValue - minValue)) * plotHeight;

  const points = values.map((value, i) => ({ x: x(i), y: y(value) }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const totalLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return sum + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0);

  const grid = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const gridY = top + plotHeight * fraction;
    const label = (maxValue * (1 - fraction)).toFixed(1);
    return `
      <line x1="${left}" y1="${gridY}" x2="${width - right}"
        y2="${gridY}" stroke="#e9eee9" stroke-dasharray="4 5" />
      <text x="${left - 10}" y="${gridY + 4}" text-anchor="end"
        fill="#829087" font-size="10">${label}</text>
    `;
  }).join("");

  const labels = points.map((p, i) => {
    const label = i === points.length - 1 ? lastLabel : `Log ${i + 1}`;
    return `
      <text x="${p.x}" y="${height - 10}" text-anchor="middle"
        fill="#829087" font-size="10">${label}</text>
    `;
  }).join("");

  const lineColor = abnormal ? "#c0392b" : "#16734a";
  const lastDotColor = abnormal ? "#c0392b" : "#d97732";

  const dots = points.map((p, i) => {
    const last = i === points.length - 1;
    const dotColor = last ? lastDotColor : lineColor;
    const delay = 0.15 * i + 0.3;
    const cls = last ? 'class="last-dot"' : "";
    const r = last ? 6 : 4;
    return `
      <circle ${cls} cx="${p.x}" cy="${p.y}" r="${r}"
        fill="${dotColor}" stroke="#ffffff" stroke-width="2"
        style="opacity:0; animation: dotFadeIn 0.4s ease forwards ${delay}s" />
    `;
  }).join("");

  const baselineY = y(baseline);

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img"
      aria-label="Fuel consumption trend chart">
      <defs>
        <style>
          @keyframes drawLine {
            from { stroke-dashoffset: ${totalLength}; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes dotFadeIn {
            from { opacity: 0; transform: scale(0.4); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes pulseLast {
            0%,100% { r: 6; opacity: 1; }
            50%     { r: 9; opacity: 0.75; }
          }
          .chart-line {
            stroke-dasharray: ${totalLength};
            stroke-dashoffset: ${totalLength};
            animation: drawLine 1.4s ease-out forwards;
          }
          .chart-line.abnormal {
            filter: drop-shadow(0 0 6px rgba(192, 57, 43, 0.45));
          }
          .last-dot {
            animation: dotFadeIn 0.4s ease forwards 1.4s,
                       pulseLast 1.6s ease-in-out infinite 2s;
          }
        </style>
      </defs>
      ${grid}
      <line x1="${left}" y1="${baselineY}" x2="${width - right}"
        y2="${baselineY}" stroke="#16734a" stroke-width="1.5"
        stroke-dasharray="5 5" />
      <polyline class="chart-line ${abnormal ? "abnormal" : ""}"
        points="${polyline}" fill="none"
        stroke="${lineColor}" stroke-width="3"
        stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${labels}
    </svg>
  `;
}

// ============================================================
// HABITS
// ============================================================
function loadHabitsIntoForm() {
  const car = getActiveCar();
  document.getElementById("purpose").value = car.habits.purpose;
  document.getElementById("trip-type").value = car.habits.tripType;
  document.getElementById("traffic-frequency").value = car.habits.traffic;
  document.getElementById("driving-style").value = car.habits.style;
  document.getElementById("idling").value = car.habits.idling;
}

document.getElementById("habits-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const car = getActiveCar();
  car.habits.purpose = document.getElementById("purpose").value;
  car.habits.tripType = document.getElementById("trip-type").value;
  car.habits.traffic = document.getElementById("traffic-frequency").value;
  car.habits.style = document.getElementById("driving-style").value;
  car.habits.idling = document.getElementById("idling").value;

  renderCars();
  alert(`Driving habits saved for ${car.name}.`);
  showPage("home");
});

function startNewJourney() {
  document.getElementById("fuel-form").reset();
  showPage("fuel-input");
}

// ============================================================
// INIT
// ============================================================
renderCars();
updateHomeImage();
updateFuelPriceHint();