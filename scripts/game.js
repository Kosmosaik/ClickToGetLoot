// scripts/game.js
console.log("game.js loaded v0.28 - Added feature unlock animation.");

const lootButton = document.getElementById("loot-button");
const progressBar = document.getElementById("progress");
const progressContainer = document.getElementById("progress-container");
const inventoryPanel = document.getElementById("inventory-panel");
const inventoryList = document.getElementById("inventory-list");
const inventoryButton = document.getElementById("inventory-btn");

let inventoryUnlocked = false;
const inventory = Object.create(null);

// ---- RNG + Quality
const TIER_ORDER = ["F","E","D","C","B","A","S"];
const TIER_WEIGHTS = { F: 9, E: 7, D: 5, C: 3, B: 2, A: 1, S: 0.6 };

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
  return `${tier}${sub}`;
}

function fmt(v) {
  return (typeof v === "number" && !Number.isInteger(v)) ? v.toFixed(2) : v;
}

const STAT_LABELS = {
  damage: "Damage",
  attackSpeed: "Attack Speed",
  block: "Block",
  staminaUse: "Stamina Use",
};

function formatStatsReadable(stats = {}) {
  if (!stats || typeof stats !== "object") return "";
  const keys = Object.keys(stats);
  if (!keys.length) return "";
  return keys
    .map(k => `${STAT_LABELS[k] ?? k}: ${fmt(stats[k])}`)
    .join(" , ");
}

function qualityMultiplier(q) {
  const tier = q[0];
  const sub = parseInt(q.slice(1), 10);
  const tierIdx = TIER_ORDER.indexOf(tier);
  const totalSteps = TIER_ORDER.length * 9;
  const step = tierIdx * 9 + (10 - sub);
  const t = step / (totalSteps - 1);
  const min = 0.75, max = 1.8;
  return min + (max - min) * t;
}

function randFloat(min, max) { return Math.random() * (max - min) + min; }

// Rarity → CSS class
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
  if (titleText) s.title = titleText;
  return s;
}

// Roll stats (no clamp; can exceed max if your multiplier pushes it)
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

// --- Tooltip system (custom, styled)
const Tooltip = (() => {
  const el = document.createElement("div");
  el.id = "tooltip";
  document.body.appendChild(el);

  let visible = false;
  function show(html, x, y) {
    el.innerHTML = html; // allow HTML + line breaks
    el.style.left = (x + 12) + "px";
    el.style.top  = (y + 12) + "px";
    el.classList.add("show");
    visible = true;
  }
  
  function move(x, y) {
    if (!visible) return;
    el.style.left = (x + 12) + "px";
    el.style.top  = (y + 12) + "px";
  }
  
  function hide() {
    el.classList.remove("show");
    visible = false;
  }

  window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
  return {
    bind(elm, textOrFn) {
      const getText = (typeof textOrFn === "function") ? textOrFn : () => textOrFn;
      elm.addEventListener("mouseenter", e => show(getText(), e.clientX, e.clientY));
      elm.addEventListener("mousemove",  e => move(e.clientX, e.clientY));
      elm.addEventListener("mouseleave", hide);
    }
  };
})();

// UI events
lootButton.addEventListener("click", startLoot);
inventoryButton.addEventListener("click", () => {
  inventoryPanel.style.display = (inventoryPanel.style.display === "block") ? "none" : "block";
});

// Loot flow
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

      const template = getRandomItem();        // from items.js
      const quality = rollQuality();
      const mult = qualityMultiplier(quality);
      const stats = template.statRanges ? rollStats(template.statRanges, mult) : {};

      const instance = {
        name: template.name,
        category: template.category,
        description: template.description,
        rarity: template.rarity,
        usage: template.usage,
        quality,
        stats,
      };

      addToInventory(instance);

      if (!inventoryUnlocked) {
        inventoryUnlocked = true;
        inventoryButton.style.display = "block";

      // trigger the attention effect
      inventoryButton.classList.add("inventory-unlock");

      // remove the class after the animation so it can be retriggered later if needed
      setTimeout(() => inventoryButton.classList.remove("inventory-unlock"), 1500);

      // optional: focus it for keyboard users (helps discovery)
      // setTimeout(() => inventoryButton.focus(), 200);
      }
    }
  }, 100);
}

// Inventory
function addToInventory(inst) {
  if (!inventory[inst.name]) {
    inventory[inst.name] = { qty: 0, items: [] };
  }
  inventory[inst.name].qty += 1;
  inventory[inst.name].items.push(inst);
  renderInventory();
}

// Quality range helpers
function qualityStep(q) {
  const tier = q[0];
  const sub = parseInt(q.slice(1), 10);
  const tierIdx = TIER_ORDER.indexOf(tier);
  return tierIdx * 9 + (10 - sub); // 0..62
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

function groupByQuality(items = []) {
  const g = {};
  for (const it of items) (g[it.quality] ||= []).push(it);
  // sort qualities from worst → best for stable UI
  const keys = Object.keys(g).sort((a,b) => qualityStep(a) - qualityStep(b));
  return keys.map(k => [k, g[k]]);
}

function statsEqual(a = {}, b = {}) {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

function statsAllSame(arr) {
  if (arr.length <= 1) return true;
  for (let i = 1; i < arr.length; i++) if (!statsEqual(arr[0].stats, arr[i].stats)) return false;
  return true;
}

function renderInventory() {
  inventoryList.innerHTML = "";
  const names = Object.keys(inventory).sort();
  if (!names.length) return;

  names.forEach(name => {
    const stack = inventory[name];
    const rarity = stack.items[0]?.rarity || "";

    const details = document.createElement("details");
    details.className = "inventory-stack";

    const summary = document.createElement("summary");
    // tooltip for the stack
    const first = stack.items[0] || {};
    Tooltip.bind(summary, () => {
      const lines = [
        `<strong>${name}</strong>`,
        `<span>${rarity}</span>`,                       // (optional) show rarity line under name
        first.description || "",
      ];
    
      const qRange = summarizeQualityRange(stack.items);
      if (qRange) lines.push(`Quality Range: ${qRange}`);
    
      return lines.filter(Boolean).join("<br>");
    });

    // Build: <name> <rarity-span> xQty <qRange>
    summary.appendChild(document.createTextNode(`${name} `));
    const rarSpan = span(`[${rarity}]`, `rarity ${rarityClass(rarity)}`);
    summary.appendChild(rarSpan);
    summary.appendChild(document.createTextNode(` x${stack.qty}`));

    const qRange = summarizeQualityRange(stack.items);
    if (qRange) summary.appendChild(document.createTextNode(` ${qRange}`));

    details.appendChild(summary);

    const variantsWrap = document.createElement("div");
    variantsWrap.className = "stack-variants";
    const groups = groupByQuality(stack.items);
    groups.forEach(([q, arr]) => {
      variantsWrap.appendChild(makeQualityGroupLine(rarity, q, arr));
    });
    details.appendChild(variantsWrap);

    inventoryList.appendChild(details);
  });
}

function makeQualityGroupLine(rarity, quality, items) {
  const div = document.createElement("div");
  div.className = "meta";

  const rarSpan = span(`[${rarity}]`, `rarity ${rarityClass(rarity)}`);
  const dash1 = document.createTextNode(" - ");
  const qtxt  = document.createTextNode(quality);

  const count = items.length;
  const countTxt = document.createTextNode(count > 1 ? ` x${count}` : "");

  // If all rolled stats are identical, print them; else say varied
  const same = statsAllSame(items);
  const statsPretty = same ? formatStatsReadable(items[0].stats) : "";
  const tail = same
    ? (statsPretty ? document.createTextNode(` - ${statsPretty}`) : null)
    : document.createTextNode(count > 1 ? " - (varied stats)" : "");

  div.appendChild(rarSpan);
  div.appendChild(dash1);
  div.appendChild(qtxt);
  div.appendChild(countTxt);
  if (tail) div.appendChild(tail);

  // Tooltip (this is Step 3)
  const first = items[0];
  Tooltip.bind(div, () => {
    const lines = [
      `<strong>${first.name}</strong>`,
      `<span>${rarity}</span>`,                   // rarity directly under name
      first.description || "",
      `Quality: ${quality}`,
    ];

    // One blank line before stats (if there are stats)
    const statLines = same
      ? Object.entries(first.stats || {}).map(([k, v]) =>
          `<span>${STAT_LABELS[k] ?? k}: ${fmt(v)}</span>`
        )
      : [];

    if (statLines.length) lines.push("");         // <-- exactly one blank line
    lines.push(...statLines);                     // Damage, Attack Speed on consecutive lines

    return lines.filter(Boolean).join("<br>");
  });

  return div;
}


// Variant line
function makeVariantLine(inst, idx) {
  const div = document.createElement("div");
  div.className = "meta";

  // Build: [Common] - F6 - Damage: 3 , Attack Speed: 0.83
  const rar = span(`[${inst.rarity}]`, `rarity ${rarityClass(inst.rarity)}`);
  const dash1 = document.createTextNode(" - ");
  const qtxt  = document.createTextNode(inst.quality);
  const dash2 = document.createTextNode(" - ");

  const statsPretty = formatStatsReadable(inst.stats);
  const statsNode = statsPretty ? document.createTextNode(statsPretty) : document.createTextNode("");

  // assemble
  div.appendChild(rar);
  div.appendChild(dash1);
  div.appendChild(qtxt);
  if (statsPretty) {
    div.appendChild(dash2);
    div.appendChild(statsNode);
  }

  // Custom tooltip with full info (same style as stack)
  Tooltip.bind(div, () => {
    const lines = [];
    lines.push(`<strong>${inst.name}</strong>`);
    if (inst.description) lines.push(inst.description);
    lines.push(`<span>Quality: ${inst.quality}</span>`);
  
    // split each stat to its own line
    const statLines = Object.entries(inst.stats || {})
      .map(([k,v]) => {
        const label = STAT_LABELS[k] ?? k;
        return `<span>${label}: ${fmt(v)}</span>`;
      });
    lines.push(...statLines);
  
    // join lines with <br>
    return lines.join("<br>");
  });

  return div;
}
