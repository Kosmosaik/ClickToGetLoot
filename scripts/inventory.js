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

// View toggle will be wired up in v0.0.67 Step 2
// (Category view vs All Items view)
