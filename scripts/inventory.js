// scripts/inventory.js

// DOM reference
const inventoryList = document.getElementById("inventory-list");

// Inventory data
const inventory = Object.create(null);

// Sorting state for inventory
let inventorySort = {
  key: GAME_CONFIG.inventory.defaultSortKey, // "name" | "rarity" | "qty"
  dir: GAME_CONFIG.inventory.defaultSortDir, // "asc" | "desc"
};

// Rarity sort order
const RARITY_ORDER = GAME_CONFIG.raritySortOrder.slice();
function raritySortValue(r) {
  const idx = RARITY_ORDER.indexOf(r);
  return idx === -1 ? RARITY_ORDER.length : idx;
}

// Remember which stacks and categories are expanded/collapsed
const openStacks = new Set();
const collapsedCategories = new Set();

// Helper: rarity → CSS class
function rarityClass(rarity = "") {
  switch ((rarity || "").toLowerCase()) {
    case "abundant": return "r-abundant";
    case "common":   return "r-common";
    case "uncommon": return "r-uncommon";
    case "rare":     return "r-rare";
    case "exotic":   return "r-exotic";
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
};

// Quality helpers (uses global TIER_ORDER from quality.js)
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
    const q = qualityStep(A.quality) - qualityStep(B.quality);
    if (q !== 0) return q;
    return B.items.length - A.items.length;
  });
  return arr;
}

// Sorting compare for stacks
function compareStacks(A, B) {
  const { key, dir } = inventorySort;
  const mul = dir === "asc" ? 1 : -1;

  if (key === "name") {
    return A.name.localeCompare(B.name) * mul;
  }

  if (key === "qty") {
    const diff = A.stack.qty - B.stack.qty;
    if (diff !== 0) return diff * mul;
    return A.name.localeCompare(B.name) * mul;
  }

  if (key === "rarity") {
    const ra = A.stack.items[0]?.rarity || "";
    const rb = B.stack.items[0]?.rarity || "";
    const diff = raritySortValue(ra) - raritySortValue(rb);
    if (diff !== 0) return diff * mul;
    return A.name.localeCompare(B.name) * mul;
  }

  return A.name.localeCompare(B.name) * mul;
}

// Inventory API used by game.js
function addToInventory(inst) {
  if (!inventory[inst.name]) {
    inventory[inst.name] = { qty: 0, items: [] };
  }
  inventory[inst.name].qty += 1;
  inventory[inst.name].items.push(inst);
  renderInventory();
}

function removeOneFromGroup(itemName, quality, stats) {
  const stack = inventory[itemName];
  if (!stack) return;

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

// Category helpers
function categoryHeaderLabel(category = "Other") {
  const map = {
    "Material": "MATERIALS",
    "Crafting Component": "CRAFTING COMPONENTS",
    "Resource": "RESOURCES",
    "Weapon": "WEAPONS",
    "Tool": "TOOLS",
    "Wood": "WOOD",
  };
  return map[category] || (category || "OTHER").toUpperCase();
}

function renderInventory() {
  inventoryList.innerHTML = "";
  const names = Object.keys(inventory);
  if (!names.length) return;

  // ---- Sort bar ----
  const sortBar = document.createElement("div");
  sortBar.className = "inventory-sort-bar";

  const sortLabel = document.createElement("span");
  sortLabel.textContent = "Sort by:";
  sortBar.appendChild(sortLabel);

  function makeSortButton(key, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sort-btn";
    if (inventorySort.key === key) {
      btn.classList.add("active");
      btn.textContent = `${label} ${inventorySort.dir === "asc" ? "▲" : "▼"}`;
    } else {
      btn.textContent = label;
    }
    btn.addEventListener("click", () => {
      if (inventorySort.key === key) {
        inventorySort.dir = (inventorySort.dir === "asc") ? "desc" : "asc";
      } else {
        inventorySort.key = key;
        inventorySort.dir = (key === "qty") ? "desc" : "asc";
      }
      renderInventory();
    });
    return btn;
  }

  sortBar.appendChild(makeSortButton("name", "Name"));
  sortBar.appendChild(makeSortButton("rarity", "Rarity"));
  sortBar.appendChild(makeSortButton("qty", "Quantity"));
  inventoryList.appendChild(sortBar);

  // --- Group stacks by category ---
  const categoryMap = Object.create(null);

  names.forEach(name => {
    const stack = inventory[name];
    const first = stack.items[0] || {};
    const category = first.category || "Other";
    if (!categoryMap[category]) categoryMap[category] = [];
    categoryMap[category].push({ name, stack });
  });

  const CATEGORY_ORDER = GAME_CONFIG.inventory.categoryOrder;
  const categoryKeys = Object.keys(categoryMap).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  categoryKeys.forEach(cat => {
    const group = categoryMap[cat];
    const isCollapsed = collapsedCategories.has(cat);

    // ---- Category header ----
    const header = document.createElement("div");
    header.className = "inventory-category-header";
    header.dataset.category = cat;
    header.textContent = `${isCollapsed ? "▶" : "▼"} ${categoryHeaderLabel(cat)}`;
    inventoryList.appendChild(header);

    header.addEventListener("click", () => {
      const nowCollapsed = !collapsedCategories.has(cat);
      if (nowCollapsed) {
        collapsedCategories.add(cat);
      } else {
        collapsedCategories.delete(cat);
      }
      header.textContent = `${nowCollapsed ? "▶" : "▼"} ${categoryHeaderLabel(cat)}`;

      let node = header.nextElementSibling;
      while (node && !node.classList.contains("inventory-category-header")) {
        node.style.display = nowCollapsed ? "none" : "";
        node = node.nextElementSibling;
      }
    });

    // Sort items within category according to current sort
    group.sort((a, b) => compareStacks(a, b));

    // ---- Render each stack ----
    group.forEach(({ name, stack }) => {
      const rarity = stack.items[0]?.rarity || "";

      const details = document.createElement("details");
      details.className = "inventory-stack";
      details.dataset.category = cat;
      details.dataset.name = name;

      const key = `${cat}::${name}`;
      if (openStacks.has(key)) {
        details.open = true;
      }

      details.addEventListener("toggle", () => {
        if (details.open) openStacks.add(key);
        else openStacks.delete(key);
      });

      if (isCollapsed) {
        details.style.display = "none";
      }

      const summary = document.createElement("summary");

      // Tooltip for the stack
      const first = stack.items[0] || {};
      Tooltip.bind(summary, () => {
        const lines = [
          `<strong>${name}</strong>`,
          `<span class="rarity ${rarityClass(rarity)}">${rarity}</span>`,
        ];
        const qRange = summarizeQualityRange(stack.items);
        if (qRange) lines.push(`Quality Range: ${qRange}`);
        if (first.description) {
          lines.push("");
          lines.push(first.description);
        }
        return lines
          .filter(v => v !== undefined && v !== null)
          .join("<br>");
      });

      // Column-ish layout: Name (colored by rarity) | Qty | Quality range
      const nameSpan = span(name, `rarity ${rarityClass(rarity)}`);
      nameSpan.classList.add("inv-name");
      summary.appendChild(nameSpan);

      const qtySpan = document.createElement("span");
      qtySpan.className = "inv-qty";
      qtySpan.textContent = `x${stack.qty}`;
      summary.appendChild(qtySpan);

      const qRange = summarizeQualityRange(stack.items);
      if (qRange) {
        const qSpan = document.createElement("span");
        qSpan.className = "inv-qrange";
        qSpan.textContent = qRange;
        summary.appendChild(qSpan);
      }

      details.appendChild(summary);

      const variantsWrap = document.createElement("div");
      variantsWrap.className = "stack-variants";
      const groups = groupByIdentical(stack.items);
      groups.forEach(g => {
        variantsWrap.appendChild(makeIdenticalGroupLine(name, rarity, g));
      });
      details.appendChild(variantsWrap);

      inventoryList.appendChild(details);
    });
  });
}

function makeIdenticalGroupLine(itemName, rarity, group) {
  const div = document.createElement("div");
  div.className = "meta";

  const count = group.items.length;
  const rep = group.items[0];
  const quality = group.quality;

  // Name (colored by rarity)
  const nameSpan = span(itemName, `rarity ${rarityClass(rarity)}`);
  div.appendChild(nameSpan);

  // Quality in brackets: [F8]
  const qualitySpan = document.createTextNode(` [${quality}]`);
  div.appendChild(qualitySpan);

  // Quantity xN (optional)
  if (count > 1) {
    div.appendChild(document.createTextNode(` x${count}`));
  }

  // Stats: DMG: X | AS: Y
  const statsObj = rep.stats || {};
  if (
    typeof statsObj.damage === "number" &&
    typeof statsObj.attackSpeed === "number"
  ) {
    const dmg = fmt(statsObj.damage);
    const as = fmt(statsObj.attackSpeed);
    const statsText = document.createTextNode(
      `   DMG: ${dmg} | AS: ${as}`
    );
    div.appendChild(statsText);
  }

  // Tooltip stays the same
  Tooltip.bind(div, () => {
    const header =
      `<strong>${itemName}</strong><br>` +
      `<span class="rarity ${rarityClass(rarity)}" style="display:inline">${rarity}</span><br>` +
      `Quality: ${quality}`;

    const desc = rep.description ? `<br><br>${rep.description}` : "";
    const statsObj = rep.stats || {};
    const statKeys = Object.keys(statsObj);
    const stats = statKeys.length
      ? `<br><br>${statKeys
          .map(k => `${STAT_LABELS[k] ?? k}: ${fmt(statsObj[k])}`)
          .join("<br>")}`
      : "";

    return header + desc + stats;
  });

  // Trash button
  const trashBtn = document.createElement("button");
  trashBtn.className = "trash-btn";
  trashBtn.textContent = "Trash";
  trashBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    Tooltip.hide();
    removeOneFromGroup(itemName, quality, rep.stats);
  });
  div.appendChild(document.createTextNode(" "));
  div.appendChild(trashBtn);

  return div;
}

// ----- Inventory save/load helpers -----

// Returns a deep-cloned snapshot of the current inventory
function getInventorySnapshot() {
  return JSON.parse(JSON.stringify(inventory));
}

// Loads inventory from a snapshot object (or clears if null/undefined)
function loadInventoryFromSnapshot(snapshot) {
  // Clear current inventory
  for (const key of Object.keys(inventory)) {
    delete inventory[key];
  }

  if (snapshot && typeof snapshot === "object") {
    for (const [name, stack] of Object.entries(snapshot)) {
      inventory[name] = {
        qty: stack.qty,
        items: Array.isArray(stack.items)
          ? stack.items.map(it => ({ ...it }))
          : [],
      };
    }
  }

  renderInventory();
}
