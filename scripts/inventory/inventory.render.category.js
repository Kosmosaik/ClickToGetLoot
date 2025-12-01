// scripts/inventory/inventory.render.category.js
// Renders the standard "by category" inventory view.

// Main inventory renderer: dispatches based on current view mode
function renderInventory() {
  if (inventoryViewMode === "all") {
    // For now, fall back to category view until we implement the All Items renderer
    renderInventoryAllItemsView();
  } else {
    renderInventoryCategoryView();
  }
}

function renderInventoryCategoryView() {
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

    // If the category is collapsed, do not render its stacks
    if (isCollapsed) {
      return;
    }

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
        if (details.open) {
          openStacks.add(key);
        } else {
          openStacks.delete(key);
        }
      });

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

// === All Items flat view ===
// Shows a flat list of all stacks, sortable by column headers.
function renderInventoryAllItemsView() {
  inventoryList.innerHTML = "";
  const names = Object.keys(inventory);
  if (!names.length) return;

  // ---- Header row with clickable columns ----
  const header = document.createElement("div");
  header.className = "inventory-flat-header";

  function makeHeaderCell(key, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "flat-header-cell";

    if (inventorySort.key === key) {
      btn.classList.add("active");
      const arrow = inventorySort.dir === "asc" ? "▲" : "▼";
      btn.textContent = `${label} ${arrow}`;
    } else {
      btn.textContent = label;
    }

    btn.addEventListener("click", () => {
      if (inventorySort.key === key) {
        // Same column: toggle direction
        inventorySort.dir = inventorySort.dir === "asc" ? "desc" : "asc";
      } else {
        // New column: choose a sensible default direction
        inventorySort.key = key;
        if (key === "qty" || key === "quality") {
          // Show biggest stacks / best grades first
          inventorySort.dir = "desc";
        } else {
          inventorySort.dir = "asc";
        }
      }
      renderInventory();
    });

    return btn;
  }

  header.appendChild(makeHeaderCell("name", "Item Name"));
  header.appendChild(makeHeaderCell("category", "Category"));
  header.appendChild(makeHeaderCell("rarity", "Rarity"));
  header.appendChild(makeHeaderCell("qty", "Qty"));
  header.appendChild(makeHeaderCell("quality", "Grades"));
  inventoryList.appendChild(header);

  applyInventoryFlatColumnWidthsToElement(header);

  // Adjust panel width to fit current columns
  if (typeof updateInventoryPanelWidthToFitColumns === "function") {
    updateInventoryPanelWidthToFitColumns();
  }

  // ---- Build & sort the flat stack list ----
  const stacks = names.map((name) => ({
    name,
    stack: inventory[name],
  }));

  stacks.sort(compareStacks);

  // ---- Render each stack as a <details> row ----
  stacks.forEach(({ name, stack }) => {
    if (!stack || !Array.isArray(stack.items) || !stack.items.length) return;

    const first = stack.items[0] || {};
    const rarity = first.rarity || "";
    const category = first.category || "Other";

    const details = document.createElement("details");
    details.className = "inventory-stack inventory-stack-flat";
    details.dataset.category = category;
    details.dataset.name = name;

    // Persist open/closed state like in category view
    const key = `${category}::${name}`;
    if (openStacks.has(key)) {
      details.open = true;
    }

    details.addEventListener("toggle", () => {
      if (details.open) {
        openStacks.add(key);
      } else {
        openStacks.delete(key);
      }
    });

    const summary = document.createElement("summary");

    // Name (colored by rarity)
    const nameSpan = span(name, `rarity ${rarityClass(rarity)}`);
    nameSpan.classList.add("inv-name");
    summary.appendChild(nameSpan);

    // Category text (e.g. Weapons, Resources)
    const catSpan = document.createElement("span");
    catSpan.className = "inv-category-tag";
    catSpan.textContent = category;
    summary.appendChild(catSpan);

    // Rarity text column (e.g. Rare, Exotic)
    const raritySpan = document.createElement("span");
    raritySpan.className = "inv-rarity";
    raritySpan.textContent = rarity || "";
    summary.appendChild(raritySpan);

    // Quantity xN
    const qtySpan = document.createElement("span");
    qtySpan.className = "inv-qty";
    qtySpan.textContent = `x${stack.qty}`;
    summary.appendChild(qtySpan);

    // Quality range (e.g. F0–E3)
    const qRange = summarizeQualityRange(stack.items);
    const qSpan = document.createElement("span");
    qSpan.className = "inv-qrange";
    qSpan.textContent = qRange || "";
    summary.appendChild(qSpan);

    details.appendChild(summary);

    // Expanded: identical groups with buttons & tooltips
    const variantsWrap = document.createElement("div");
    variantsWrap.className = "stack-variants";
    const groups = groupByIdentical(stack.items);
    groups.forEach((g) => {
      variantsWrap.appendChild(makeIdenticalGroupLine(name, rarity, g));
    });
    details.appendChild(variantsWrap);
    
    applyInventoryFlatColumnWidthsToElement(summary);

    inventoryList.appendChild(details);
  });
  if (typeof setupInventoryFlatColumnResizing === "function") {
    setupInventoryFlatColumnResizing(header);
  }
}
