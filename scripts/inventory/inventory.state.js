// scripts/inventory/inventory.state.js
// State / config used by the inventory UI (sorting + expansion).

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

// View mode for inventory ("category" | "all").
// We'll fully use this in v0.0.67 Step 2.
// View mode for inventory ("category" | "all")
let inventoryViewMode = "category";

// Change view mode and re-render inventory
function setInventoryViewMode(mode) {
  if (inventoryViewMode === mode) return;
  inventoryViewMode = mode;

  const panel = document.getElementById("inventory-panel");
  if (panel) {
    if (mode === "all") {
      // All Items: auto-fit columns, no manual resize
      panel.style.resize = "none";
      panel.style.overflowX = "hidden";

      if (typeof updateInventoryPanelWidthToFitColumns === "function") {
        updateInventoryPanelWidthToFitColumns();
      }
    } else {
      // Category mode: user can resize horizontally
      panel.style.resize = "horizontal";
      panel.style.overflowX = "auto";
    }
  }

  if (typeof renderInventory === "function") {
    renderInventory();
  }
}

// Collapse all categories currently present in the inventory
function collapseAllCategories() {
  // Use the global "inventory" object directly.
  // It exists because we declare `const inventory = Object.create(null);`
  // in scripts/inventory.js (loaded after this file).

  if (typeof inventory === "undefined") return;

  const names = Object.keys(inventory);
  if (!names.length) return;

  // For each item stack, add its category to the collapsed set
  for (const name of names) {
    const group = inventory[name];
    if (!group || !Array.isArray(group.items)) continue;

    // Look at one instance to grab its category
    const firstInst = group.items[0];
    if (firstInst && firstInst.category) {
      collapsedCategories.add(firstInst.category);
    }
  }

  if (typeof renderInventory === "function") {
    renderInventory();
  }
}

// Expand all categories (clear the collapsed set)
function expandAllCategories() {
  collapsedCategories.clear();

  if (typeof renderInventory === "function") {
    renderInventory();
  }
}

// ----- Inventory flat view column widths -----
// We have 5 columns: Item Name, Category, Rarity, Qty, Grades
const INVENTORY_FLAT_COL_COUNT = 5;

// Lazily-loaded widths array, in pixels
let inventoryFlatColumnWidths = null;

function getInventoryFlatColumnWidths() {
  if (!inventoryFlatColumnWidths) {
    // Try to load from localStorage
    try {
      const stored = localStorage.getItem("inventoryFlatColumnWidths");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === INVENTORY_FLAT_COL_COUNT) {
          inventoryFlatColumnWidths = parsed.map((n) => Number(n) || 0);
        }
      }
    } catch {
      // Ignore storage errors and fall back to defaults
    }

    // Defaults if nothing stored or invalid
    if (!inventoryFlatColumnWidths) {
      inventoryFlatColumnWidths = [220, 140, 100, 40, 90]; // px
    }
  }
  return inventoryFlatColumnWidths;
}

function setInventoryFlatColumnWidths(widths) {
  inventoryFlatColumnWidths = widths.slice();
  try {
    localStorage.setItem(
      "inventoryFlatColumnWidths",
      JSON.stringify(inventoryFlatColumnWidths)
    );
  } catch {
    // Ignore storage errors
  }
}

// Apply current widths to any grid element (header or row summary)
function applyInventoryFlatColumnWidthsToElement(el) {
  const widths = getInventoryFlatColumnWidths();
  el.style.display = "grid";
  el.style.gridTemplateColumns = widths.map((w) => `${w}px`).join(" ");
}

