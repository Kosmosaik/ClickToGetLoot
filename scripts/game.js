// scripts/game.js
let inventoryUnlocked = false;
const inventory = [];

const lootButton = document.getElementById("loot-button");
const progressBar = document.getElementById("progress");
const progressContainer = document.getElementById("progress-container");
const inventoryPanel = document.getElementById("inventory-panel");
const inventoryList = document.getElementById("inventory-list");
const inventoryButton = document.getElementById("inventory-btn");

lootButton.addEventListener("click", startLoot);

function startLoot() {
  lootButton.disabled = true;
  progressContainer.style.display = "block";
  let time = 0;
  const duration = 3; // seconds

  const interval = setInterval(() => {
    time += 0.1;
    progressBar.style.width = `${(time / duration) * 100}%`;
    if (time >= duration) {
      clearInterval(interval);
      progressBar.style.width = "0%";
      progressContainer.style.display = "none";
      lootButton.disabled = false;

      const item = getRandomItem();
      addToInventory(item);

      // Unlock inventory if first loot
      if (!inventoryUnlocked) {
        inventoryUnlocked = true;
        inventoryButton.style.display = "block";
      }
    }
  }, 100);
}

function addToInventory(item) {
  const existing = inventory.find(i => i.name === item.name);
  if (existing) existing.quantity++;
  else inventory.push({ ...item, quantity: 1 });
  renderInventory();
}

function renderInventory() {
  inventoryList.innerHTML = "";
  inventory.forEach(item => {
    const el = document.createElement("div");
    el.textContent = `${item.name} [${item.rarity}] x${item.quantity}`;
    inventoryList.appendChild(el);
  });
}

inventoryButton.addEventListener("click", () => {
  inventoryPanel.style.display =
    inventoryPanel.style.display === "block" ? "none" : "block";
});
