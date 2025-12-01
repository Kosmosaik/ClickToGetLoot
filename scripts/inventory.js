// scripts/inventory.js

// DOM reference
const inventoryList = document.getElementById("inventory-list");

// Inventory data
const inventory = Object.create(null);

// ----- Inventory toolbar controls -----
const inventoryViewToggleBtn = document.getElementById("inventory-view-toggle");
const inventoryCollapseAllBtn = document.getElementById("inventory-collapse-all");
const inventoryExpandAllBtn = document.getElementById("inventory-expand-all");

// Collapse all categories
if (inventoryCollapseAllBtn) {
  inventoryCollapseAllBtn.addEventListener("click", () => {
    if (typeof collapseAllCategories === "function") {
      collapseAllCategories();
    }
  });
}

// Expand all categories
if (inventoryExpandAllBtn) {
  inventoryExpandAllBtn.addEventListener("click", () => {
    if (typeof expandAllCategories === "function") {
      expandAllCategories();
    }
  });
}

// Set initial label for view toggle
if (inventoryViewToggleBtn) {
  const label =
    typeof inventoryViewMode !== "undefined" && inventoryViewMode === "all"
      ? "View: All items ▼"
      : "View: Category ▼";

  inventoryViewToggleBtn.textContent = label;
}

// View toggle: switch between "category" and "all" modes
if (inventoryViewToggleBtn) {
  inventoryViewToggleBtn.addEventListener("click", () => {
    if (typeof setInventoryViewMode !== "function") return;

    const newMode = inventoryViewMode === "category" ? "all" : "category";
    setInventoryViewMode(newMode);

    // Update button text
    inventoryViewToggleBtn.textContent =
      newMode === "all" ? "View: All items ▼" : "View: Category ▼";
  });
}

// ----- Column resizing for All Items flat view -----
function setupInventoryFlatColumnResizing(headerEl) {
  const MIN_WIDTH = 40;

  // Remove any old handles (in case we re-rendered)
  headerEl.querySelectorAll(".col-resize-handle").forEach((h) => h.remove());

  const headerCells = headerEl.querySelectorAll(".flat-header-cell");
  if (!headerCells.length) return;

  let isResizing = false;
  let startX = 0;
  let startWidths = [];
  let colIndex = -1;

  function onMouseMove(e) {
    if (!isResizing) return;
    const dx = e.clientX - startX;

    const current = getInventoryFlatColumnWidths();
    const newWidths = startWidths.slice();
    newWidths[colIndex] = Math.max(MIN_WIDTH, startWidths[colIndex] + dx);

    setInventoryFlatColumnWidths(newWidths);

    // Apply to header
    applyInventoryFlatColumnWidthsToElement(headerEl);
    // Apply to all existing flat rows
    document
      .querySelectorAll(".inventory-stack-flat > summary")
      .forEach((sumEl) => {
        applyInventoryFlatColumnWidthsToElement(sumEl);
      });
  }

  function onMouseUp() {
    if (!isResizing) return;
    isResizing = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
  
  headerCells.forEach((cell, index) => {
    const handle = document.createElement("div");
    handle.className = "col-resize-handle";
    cell.appendChild(handle);
  
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      isResizing = true;
      startX = e.clientX;
      colIndex = index;
  
      startWidths = getInventoryFlatColumnWidths().slice();
  
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  
    handle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
}
