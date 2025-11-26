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

function equipOneFromGroup(itemName, quality, stats) {
  const stack = inventory[itemName];
  if (!stack) return;

  // Find the specific instance that matches this quality + stats
  const idx = stack.items.findIndex(
    it => it.quality === quality && statsEqual(it.stats, stats)
  );
  if (idx === -1) return;

  const item = stack.items[idx];

  // Determine which slot this item should go into (weapon, chest, etc.)
  const slot = getEquipSlotForItem(item);
  if (!slot) {
    console.warn("Item is not equippable:", item);
    return;
  }

  // Equip this item, and get back whatever was previously in that slot
  const previousEquipped = equipItemToSlot(slot, item);

  // Remove ONE instance from the inventory stack
  removeOneFromGroup(itemName, quality, stats);
  // (removeOneFromGroup already decreases qty and re-renders)

  // If a previous item was equipped, return it to the inventory
  if (previousEquipped) {
    addToInventory(previousEquipped);
  }

  // Recompute character stats (HP / attack / crit / loot find)
  if (typeof recomputeCharacterComputedState === "function") {
    recomputeCharacterComputedState();
  }

  // Auto-save after changing equipment
  if (typeof saveCurrentGame === "function") {
    saveCurrentGame();
  }
}

function getEquipSlotForItem(item) {
  // For now we just trust item.slot ("weapon", "chest", etc.)
  if (!item || !item.slot) return null;
  // Optional: validate slot name later
  return item.slot;
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
    "Food": "FOOD",
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
      // Toggle collapsed state for this category
      if (collapsedCategories.has(cat)) {
        collapsedCategories.delete(cat);
      } else {
        collapsedCategories.add(cat);
      }

      // Re-render the whole inventory based on updated state
      renderInventory();
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
        details.style.display =
          collapsed ? "none" : "";
        node = node.nextElementSibling;
      }

      const summary = document.createElement("summary");

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

  // Left side: text (name, quality, qty, stats)
  const left = document.createElement("span");
  left.className = "meta-left";

  // Name (colored by rarity)
  const nameSpan = span(itemName, `rarity ${rarityClass(rarity)}`);
  left.appendChild(nameSpan);

  // Quality in brackets: [F8]
  left.appendChild(document.createTextNode(` [${quality}]`));

  // Quantity xN (optional)
  if (count > 1) {
    left.appendChild(document.createTextNode(` x${count}`));
  }

  // Simple inline quick info for weapons: DMG / AS
  const statsObj = rep.stats || {};
  if (
    typeof statsObj.damage === "number" &&
    typeof statsObj.attackSpeed === "number"
  ) {
    const dmg = fmt(statsObj.damage);
    const as = fmt(statsObj.attackSpeed);
    left.appendChild(
      document.createTextNode(`   DMG: ${dmg} | AS: ${as}`)
    );
  }

  div.appendChild(left);

  // Tooltip with comparison vs currently equipped item (same slot)
  Tooltip.bind(div, () => {
    const slot = rep.slot || null;

    // Currently equipped item in the same slot
    let equippedItem = null;
    let equippedStats = {};
    if (slot && typeof getEquippedState === "function") {
      const eq = getEquippedState();
      if (eq && eq[slot]) {
        equippedItem = eq[slot];
        equippedStats = eq[slot].stats || {};
      }
    }

    const lines = [];

    // --- Header ---
    lines.push(`<strong>${itemName}</strong>`);
    lines.push(
      `<span class="rarity ${rarityClass(rarity)}">${rarity}</span>`
    );
    lines.push(`Quality: ${quality}`);

    const stats = rep.stats || {};

    // --- Weapon block: Damage / AS / Raw DPS / Required skill ---
    if (slot === "weapon" && typeof stats.damage === "number") {
      const dmg = stats.damage;
      const as =
        typeof stats.attackSpeed === "number" ? stats.attackSpeed : 1;
      const rawDps = dmg * as;

      let eqDmg = 0;
      let eqAs = 0;
      let eqDps = 0;
      if (equippedItem && equippedStats) {
        if (typeof equippedStats.damage === "number") {
          eqDmg = equippedStats.damage;
        }
        if (typeof equippedStats.attackSpeed === "number") {
          eqAs = equippedStats.attackSpeed;
        }
        eqDps = eqDmg * (eqAs || 1);
      }

      lines.push("");
      lines.push("<strong>Weapon</strong>");

      // Damage
      let dmgLine = `Damage: ${fmt(dmg)}`;
      if (equippedItem) {
        dmgLine += formatDelta(dmg, eqDmg);
      }
      lines.push(dmgLine);

      // Attack Speed
      let asLine = `Attack Speed: ${fmt(as)}`;
      if (equippedItem) {
        asLine += formatDelta(as, eqAs);
      }
      lines.push(asLine);

      // Raw DPS
      let dpsLine = `Raw DPS: ${fmt(rawDps)}`;
      if (equippedItem) {
        dpsLine += formatDelta(rawDps, eqDps);
      }
      lines.push(dpsLine);

      // Required skill vs your skill
      const skillsCfg =
        (GAME_CONFIG.skills && GAME_CONFIG.skills.weapon) || {};
      const labels = skillsCfg.labels || {};
      const weaponType = inferWeaponTypeFromItem(rep);
      const label = labels[weaponType] || weaponType;

      const required =
        typeof rep.skillReq === "number" ? rep.skillReq : 0;

      const playerSkill =
        (currentCharacter &&
          currentCharacter.skills &&
          currentCharacter.skills[weaponType]) ||
        0;

      if (required > 0) {
        lines.push(
          `${label}: ${required} (${fmt(playerSkill)})`
        );
      }
    }

    // --- Generic stats block (all other stats) ---
    const allStatKeys = Array.from(
      new Set([
        ...Object.keys(stats),
        ...Object.keys(equippedStats),
      ])
    ).filter((k) => k !== "damage" && k !== "attackSpeed"); // handled above

    if (allStatKeys.length) {
      lines.push("");
      lines.push("<strong>Stats</strong>");

      allStatKeys.forEach((k) => {
        const label = STAT_LABELS[k] ?? k;
        const val = stats[k] ?? 0;
        const eqVal = equippedStats[k] ?? 0;

        if (!val && !eqVal) return;

        let line = `${label}: ${fmt(val)}`;
        if (equippedItem) {
          line += formatDelta(val, eqVal);
        }
        lines.push(line);
      });
    }

    // --- Description at the bottom ---
    if (rep.description) {
      lines.push("");
      lines.push(rep.description);
    }

    return lines.join("<br>");
  });

  // Right side: actions (Equip, then Trash)
  const btnWrap = document.createElement("span");
  btnWrap.className = "inv-actions";

  // Equip button (only if item is equippable)
  if (rep.slot) {
    const equipBtn = document.createElement("button");
    equipBtn.className = "equip-btn";
    equipBtn.textContent = "Equip";
    equipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      Tooltip.hide();
      equipOneFromGroup(itemName, quality, rep.stats);
    });
    btnWrap.appendChild(equipBtn);
  }

  // Trash button (always present)
  const trashBtn = document.createElement("button");
  trashBtn.className = "trash-btn";
  trashBtn.textContent = "Trash";
  trashBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    Tooltip.hide();
    removeOneFromGroup(itemName, quality, rep.stats);
  });
  btnWrap.appendChild(trashBtn);

  div.appendChild(btnWrap);

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
