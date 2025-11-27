// scripts/inventory/inventory.data.js
// Helper + data functions used by the inventory UI.

// Helper: rarity → CSS class
function rarityClass(rarity = "") {
  switch ((rarity || "").toLowerCase()) {
    case "abundant": return "r-abundant";
    case "common":   return "r-common";
    case "uncommon": return "r-uncommon";
    case "rare":     return "r-rare";
    case "exotic":   return "r-exotic";
    case "unique":   return "r-unique";
    default:         return "r-common";
  }
}

function span(text, className = "", titleText = "") {
  const s = document.createElement("span");
  s.textContent = text;
  if (className) s.className = className;
  if (titleText) s.title = titleText;
  return s;
}

// Formatting helpers
function fmt(v) {
  return (typeof v === "number" && !Number.isInteger(v)) ? v.toFixed(2) : v;
}

const STAT_LABELS = {
  damage: "Damage",
  attackSpeed: "Attack Speed",
  block: "Block",
  staminaUse: "Stamina Use",
  critChance: "Critical Chance",
  lootFind: "Loot Find",
};

// --- Tooltip helpers ---
function formatDelta(candidate, current) {
  const delta = candidate - current;
  if (!delta || Math.abs(delta) < 0.0001) return "";
  const sign = delta > 0 ? "+" : "";
  return ` <span class="meta">(${sign}${fmt(delta)})</span>`;
}

function inferWeaponTypeFromItem(item) {
  if (!item) return "unarmed";
  if (item.weaponType) return item.weaponType;

  const name = (item.name || "").toLowerCase();
  const atkType = (item.attackType || "").toLowerCase();

  if (atkType === "ranged") return "bow";
  if (name.includes("dagger")) return "dagger";
  if (name.includes("sword")) return "sword";
  if (name.includes("club")) return "club";
  if (name.includes("axe") || name.includes("hatchet")) return "axe";

  return "sword";
}

// Quality helpers (uses global TIER_ORDER from quality.js)
function qualityStep(q) {
  const tier = q[0];                         // "F", "E", "D", ..., "S"
  const sub = parseInt(q.slice(1), 10);      // 0..9
  const tierIdx = TIER_ORDER.indexOf(tier);  // 0..6, from quality.js
  const stepsPerTier =
    (typeof SUBLEVELS_PER_TIER === "number")
      ? SUBLEVELS_PER_TIER
      : 10;

  // Turn e.g. "F0".."F9","E0".. into a single linear scale
  return tierIdx * stepsPerTier + sub;       // e.g. 0..69 for F0..S9
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
  return keys.map(k => `${k}:${stats[k]}`).join("|");
}

// Group items by identical (quality + stats)
function groupByIdentical(items = []) {
  const map = new Map();
  for (const it of items) {
    const sig = `${it.quality}__${statsSignature(it.stats)}`;
    if (!map.has(sig)) map.set(sig, { quality: it.quality, items: [] });
    map.get(sig).items.push(it);
  }
  const arr = Array.from(map.values());
  arr.sort((A, B) => {
    const q = qualityStep(B.quality) - qualityStep(A.quality);
    if (q !== 0) return q;
    return B.items.length - A.items.length;
  });
  return arr;
}

// Category label helper for headers
function categoryHeaderLabel(category = "Other") {
  const map = {
    "Material": "MATERIALS",
    "Crafting Component": "CRAFTING COMPONENTS",
    "Resource": "RESOURCES",
    "Weapon": "WEAPONS",
    "Tool": "TOOLS",
    "Wood": "WOOD",
    "Food": "FOOD",
  };
  return map[category] || (category || "OTHER").toUpperCase();
}
