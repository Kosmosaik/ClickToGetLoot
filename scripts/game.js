// scripts/game.js
// Adds: Quality RNG, random stat rolls (scaled by quality), and stacking by item name.
console.log("game.js loaded v0.19 - Trying quality range and tooltip + colored rarity + other fixes");
const lootButton = document.getElementById("loot-button");
const progressBar = document.getElementById("progress");
const progressContainer = document.getElementById("progress-container");
const inventoryPanel = document.getElementById("inventory-panel");
const inventoryList = document.getElementById("inventory-list");
const inventoryButton = document.getElementById("inventory-btn");

let inventoryUnlocked = false;

// Inventory is a map by item name: { qty: number, items: [instances...] }
const inventory = Object.create(null);

// ---- Helpers: RNG + Quality
const TIER_ORDER = ["F","E","D","C","B","A","S"];
const TIER_WEIGHTS = { F: 9, E: 7, D: 5, C: 3, B: 2, A: 1, S: 0.6 };

// 9 is worst (most common), 1 is best (rarest)
function sublevelWeight(n) { return (n === 9) ? 10 : (10 - n); }

function pickWeighted(pairs) {
  const total = pairs.reduce((s,p)=>s+p.weight,0);
  let r = Math.random() * total;
  for (const p of pairs) { if ((r -= p.weight) <= 0) return p.item; }
  return pairs[pairs.length - 1].item;
}

function rollQuality() {
  const tier = pickWeighted(TIER_ORDER.map(t => ({ item: t, weight: TIER_WEIGHTS[t] })));
  const sub = pickWeighted(Array.from({length:9}, (_,i) => {
    const n = 9 - i; // 9..1
    return { item: n, weight: sublevelWeight(n) };
  }));
  return `${tier}${sub}`; // e.g., "E7"
}

// Map quality to a stat multiplier (tweak anytime): 0.75..1.8
function qualityMultiplier(q) {
  const tier = q[0];
  const sub = parseInt(q.slice(1), 10); // 9..1
  const tierIdx = TIER_ORDER.indexOf(tier); // 0..6
  const totalSteps = TIER_ORDER.length * 9; // 63
  const step = tierIdx * 9 + (10 - sub); // 0..62
  const t = step / (totalSteps - 1); // 0..1
  const min = 0.75, max = 1.8;
  return min + (max - min) * t;
}

function randFloat(min, max) { return Math.random() * (max - min) + min; }

// Map rarity -> CSS class suffix
function rarityClass(rarity = "") {
  switch ((rarity || "").toLowerCase()) {
    case "abundant": return "r-abundant";
    case "common": return "r-common";
    case "uncommon": return "r-uncommon";
    case "rare": return "r-rare";
    case "exotic": return "r-exotic";
    default: return "r-common";
  }
}

function span(text, className = "", titleText = "") {
  const s = document.createElement("span");
  s.textContent = text;
  if (className) s.className = className;
  if (titleText) s.title = titleText; // native tooltip
  return s;
}


// Roll stats from statRanges and scale by quality multiplier.
// Integers if both endpoints are integers; decimals kept to 2 places otherwise.
function rollStats(statRanges, mult) {
  const out = {};
  for (const [key, range] of Object.entries(statRanges)) {
    const [a,b] = range;
    const base = randFloat(a, b) * mult;
    const intEndpoints = Number.isInteger(a) && Number.isInteger(b);
    out[key] = intEndpoints ? Math.round(base) : parseFloat(base.toFixed(2));
  }
  return out;
}

// ---- UI events
lootButton.addEventListener("click", startLoot);
inventoryButton.addEventListener("click", () => {
  inventoryPanel.style.display = (inventoryPanel.style.display === "block") ? "none" : "block";
});

// ---- Loot flow with progress bar
function startLoot() {
  lootButton.disabled = true;
  progressContainer.style.display = "block";
  let time = 0;
  const duration = 1; // seconds

  const interval = setInterval(() => {
    time += 0.1;
    progressBar.style.width = `${(time / duration) * 100}%`;
    if (time >= duration) {
      clearInterval(interval);
      progressBar.style.width = "0%";
      progressContainer.style.display = "none";
      lootButton.disabled = false;

      const template = getRandomItem();           // rarity-weighted
      const quality = rollQuality();              // new
      const mult = qualityMultiplier(quality);    // new

      // If item defines statRanges, roll stats; else leave empty object
      const stats = template.statRanges ? rollStats(template.statRanges, mult) : {};

      const instance = {
        name: template.name,
        category: template.category,
        description: template.description,
        rarity: template.rarity,
        usage: template.usage,
        quality,   // e.g., "F9" → "S1"
        stats,     // rolled + scaled
      };

      addToInventory(instance);

      // Unlock inventory after first loot
      if (!inventoryUnlocked) {
        inventoryUnlocked = true;
        inventoryButton.style.display = "block";
      }
    }
  }, 100);
}

// ---- Inventory (stack by item name)
function addToInventory(inst) {
  if (!inventory[inst.name]) {
    inventory[inst.name] = { qty: 0, items: [] };
  }
  inventory[inst.name].qty += 1;
  inventory[inst.name].items.push(inst); // keep variants internally for future details
  renderInventory();
}

// Quality helpers (same tier order you use elsewhere)
const TIER_ORDER = ["F","E","D","C","B","A","S"];

function qualityStep(q) {
  const tier = q[0];
  const sub = parseInt(q.slice(1), 10); // 9..1
  const tierIdx = TIER_ORDER.indexOf(tier); // 0..6
  return tierIdx * 9 + (10 - sub); // 0..62 (higher = better)
}

function summarizeQualityRange(items = []) {
  if (!items.length) return "";
  let minQ = items[0].quality, maxQ = items[0].quality;
  let minS = qualityStep(minQ), maxS = minS;
  for (let i = 1; i < items.length; i++) {
    const s = qualityStep(items[i].quality);
    if (s < minS) { minS = s; minQ = items[i].quality; }
    if (s > maxS) { maxS = s; maxQ = items[i].quality; }
  }
  return `[${minQ} - ${maxQ}]`;
}

// Map rarity -> CSS class suffix
function rarityClass(rarity = "") {
  switch ((rarity || "").toLowerCase()) {
    case "abundant": return "r-abundant";
    case "common": return "r-common";
    case "uncommon": return "r-uncommon";
    case "rare": return "r-rare";
    case "exotic": return "r-exotic";
    default: return "r-common";
  }
}

function span(text, className = "", titleText = "") {
  const s = document.createElement("span");
  s.textContent = text;
  if (className) s.className = className;
  if (titleText) s.title = titleText; // native tooltip
  return s;
}

function renderInventory() {
  inventoryList.innerHTML = "";
  const names = Object.keys(inventory).sort();
  if (!names.length) return;

  names.forEach(name => {
    const stack = inventory[name];
    const rarity = stack.items[0]?.rarity || "";

    // <details> wrapper for expand/collapse
    const details = document.createElement("details");
    details.className = "inventory-stack";

    // <summary> shows the compact line (Name [Rarity] xQty)
    const summary = document.createElement("summary");
    
    // Tooltip for the whole stack: use the first item’s description (they share it)
    const first = stack.items[0] || {};
    summary.title = `${name}\n${first.description || ""}`.trim();
    
    // Build: <name> <rarity-span> xQty <qRange>
    summary.appendChild(document.createTextNode(`${name} `));
    const rarSpan = span(`[${rarity}]`, `rarity ${rarityClass(rarity)}`);
    summary.appendChild(rarSpan);
    
    summary.appendChild(document.createTextNode(` x${stack.qty} `));
    const qRange = summarizeQualityRange(stack.items); // you already added this
    if (qRange) summary.appendChild(document.createTextNode(qRange));
    summary.textContent = `${name} [${rarity}] x${stack.qty} ${qRange}`;
    details.appendChild(summary);

    // Variants container (indented list)
    const variantsWrap = document.createElement("div");
    variantsWrap.className = "stack-variants";

    stack.items.forEach((inst, idx) => {
      variantsWrap.appendChild(makeVariantLine(inst, idx));
    });

    details.appendChild(variantsWrap);
    inventoryList.appendChild(details);
  });
}

// Helper: make one variant line like:
// • [Common] Q:E7 { damage:5, attackSpeed:1.1 }
function makeVariantLine(inst, idx) {
  const div = document.createElement("div");
  div.className = "meta";

  const statStr = formatStats(inst.stats);

  // Tooltip: full info on hover
  div.title = [
    inst.name,
    inst.description,
    `Quality: ${inst.quality}`,
    statStr ? `Stats: ${statStr}` : ""
  ].filter(Boolean).join("\n");

  // Build: "• " + [rarity colored] + " Q:XX { stats }"
  const bullet = document.createTextNode("• ");
  const rar = span(`[${inst.rarity}]`, `rarity ${rarityClass(inst.rarity)}`);
  const qualityTxt = document.createTextNode(` Q:${inst.quality}`);
  const statsTxt = statStr ? document.createTextNode(` { ${statStr} }`) : null;

  div.appendChild(bullet);
  div.appendChild(rar);
  div.appendChild(qualityTxt);
  if (statsTxt) div.appendChild(statsTxt);

  return div;
}


function formatStats(stats = {}) {
  const keys = Object.keys(stats);
  if (!keys.length) return "";
  return keys
    .map(k => `${k}:${fmt(stats[k])}`)
    .join(", ");
}

function fmt(v) {
  return (typeof v === "number" && !Number.isInteger(v)) ? v.toFixed(2) : v;
}
