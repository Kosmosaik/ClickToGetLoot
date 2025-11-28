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

