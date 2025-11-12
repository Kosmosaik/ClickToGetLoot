// scripts/game.js
console.log("game.js loaded v0.31 - Changed hover tooltip text positions. Added rarity color to tooltip.");

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
const TIER_WEIGHTS = { F: 100, E: 80, D: 60, C: 40, B: 20, A: 10, S: 1 };

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
      setTimeout(() => inventoryButton.classList.remove("inventory-unlock"), 3000);

      // optional: focus it for keyboard users (helps discovery)
      setTimeout(() => inventoryButton.focus(), 200);
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

function statsEqual(a = {}, b = {}) {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

// Stable signature for stats (for grouping)
function statsSignature(stats = {}) {
  const keys = Object.keys(stats).sort();
  return keys.map(k => `${k}:${stats[k]}`).join("|"); // e.g., "attackSpeed:1.1|damage:5"
}

// Group items by identical (quality + stats)
function groupByIdentical(items = []) {
  const map = new Map();
  for (const it of items) {
    const sig = `${it.quality}__${statsSignature(it.stats)}`;
    if (!map.has(sig)) map.set(sig, { quality: it.quality, items: [] });
    map.get(sig).items.push(it);
  }
  // sort groups by quality (worst → best), then by count desc
  const arr = Array.from(map.values());
  arr.sort((A, B) => {
    const q = qualityStep(A.quality) - qualityStep(B.quality);
    if (q !== 0) return q;
    return B.items.length - A.items.length;
  });
  return arr;
}

function removeOneFromGroup(itemName, quality, stats) {
  const stack = inventory[itemName];
  if (!stack) return;

  // find an index of an item with same quality AND same stats
  const idx = stack.items.findIndex(it => it.quality === quality && statsEqual(it.stats, stats));
  if (idx !== -1) {
    stack.items.splice(idx, 1);
    stack.qty -= 1;
    if (stack.items.length === 0) {
      delete inventory[itemName];
    }
    renderInventory();
  }
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
      // Desired layout (no blank between name/rarity; quality line directly below rarity;
      // one blank line before description)
      const lines = [
        `<strong>${name}</strong>`,
        `<span class="rarity ${rarityClass(rarity)}">${rarity}</span>`,
      ];
      const qRange = summarizeQualityRange(stack.items);
      if (qRange) lines.push(`Quality Range: ${qRange}`);
      // blank line before description
      if (first.description) {
        lines.push("");
        lines.push(first.description);
      }
      // join while preserving intentional blank lines
      return lines
        .filter(v => v !== undefined && v !== null)
        .join("<br>");
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
    const groups = groupByIdentical(stack.items);
    groups.forEach(group => {
      variantsWrap.appendChild(makeIdenticalGroupLine(name, rarity, group));
    });
    details.appendChild(variantsWrap);

    inventoryList.appendChild(details);
  });
}


function makeIdenticalGroupLine(itemName, rarity, group) {
  const div = document.createElement("div");
  div.className = "meta";

  const count = group.items.length;
  const rep = group.items[0]; // representative instance
  const quality = group.quality;

  // Row text: [Rarity] - Name - Quality xN
  const rarSpan = span(`[${rarity}]`, `rarity ${rarityClass(rarity)}`);
  const t1 = document.createTextNode(" - ");
  const nameNode = document.createTextNode(itemName);
  const t2 = document.createTextNode(" - ");
  const qualNode = document.createTextNode(quality);
  const countNode = document.createTextNode(count > 1 ? ` x${count}` : "");

  div.appendChild(rarSpan);
  div.appendChild(t1);
  div.appendChild(nameNode);
  div.appendChild(t2);
  div.appendChild(qualNode);
  if (count > 1) div.appendChild(countNode);

  // Tooltip (Name, Rarity (colored), Quality; blank; Description; blank; then stats stacked)
  Tooltip.bind(div, () => {
    const lines = [
      `<strong>${itemName}</strong>`,
      `<span class="rarity ${rarityClass(rarity)}">${rarity}</span>`,
      `Quality: ${quality}`,
    ];

    // blank line before description
    if (rep.description) {
      lines.push("");
      lines.push(rep.description);
    }

    const stats = rep.stats || {};
    const statKeys = Object.keys(stats);
    if (statKeys.length) {
      lines.push(""); // exactly one blank line before stats
      statKeys.forEach(k => {
        const label = STAT_LABELS[k] ?? k;
        lines.push(`<span>${label}: ${fmt(stats[k])}</span>`);
      });
    }

    // join while preserving intentional blank lines
    return lines
      .filter(v => v !== undefined && v !== null)
      .join("<br>");
  });

  // Trash button (removes ONE item from this identical group)
  const trashBtn = document.createElement("button");
  trashBtn.className = "trash-btn";
  trashBtn.textContent = "Trash";
  trashBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // don’t toggle <details>
    removeOneFromGroup(itemName, quality, rep.stats);
  });
  // a little space before the button
  div.appendChild(document.createTextNode(" "));
  div.appendChild(trashBtn);

  return div;
}
