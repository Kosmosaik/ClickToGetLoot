// scripts/game/game.save.js
// Save/load system for ClickToGetLoot.

const SAVE_KEY = "CTGL_SAVES_V1";

function loadAllSaves() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn("Failed to load saves:", e);
    return [];
  }
}

function writeAllSaves(saves) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
  } catch (e) {
    console.warn("Failed to write saves:", e);
  }
}

function renderSaveList(saves = loadAllSaves()) {
  const saveListContainer = document.getElementById("save-list");
  if (!saveListContainer) return;

  saveListContainer.innerHTML = "";

  if (!saves.length) {
    const p = document.createElement("p");
    p.textContent = "No saved characters yet.";
    saveListContainer.appendChild(p);
    return;
  }

  const list = document.createElement("div");
  list.className = "save-list";

  saves.forEach(save => {
    const row = document.createElement("div");
    row.className = "save-row";

    const label = document.createElement("span");
    const st = save.stats || {};
    label.textContent =
      `${save.name} — STR ${st.str} | DEX ${st.dex} | INT ${st.int} | VIT ${st.vit}`;
    row.appendChild(label);

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => {
      loadSave(save.id);
    });
    row.appendChild(loadBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      deleteSave(save.id);
    });
    row.appendChild(deleteBtn);

    list.appendChild(row);
  });

  saveListContainer.appendChild(list);
}

function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `save-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function saveCurrentGame() {
  if (!currentCharacter) return;

  const saves = loadAllSaves();

  const snapshot = {
    id: currentSaveId || generateId(),
    name: currentCharacter.name,
    stats: { ...currentCharacter.stats },
    skills: cloneSkills(currentCharacter.skills),
    inventory: getInventorySnapshot(),
    equipped: getEquippedSnapshot(),
    features: {
      inventoryUnlocked: inventoryUnlocked,
      equipmentUnlocked: equipmentUnlocked,
    },

    // 0.0.70c+ — persist world map (owned by PC.state, not a global)
    worldMap: (typeof STATE === "function" ? STATE().worldMap : null),
  };

  const idx = saves.findIndex(s => s.id === snapshot.id);
  if (idx === -1) {
    saves.push(snapshot);
  } else {
    saves[idx] = snapshot;
  }

  currentSaveId = snapshot.id;
  writeAllSaves(saves);
  renderSaveList(saves);
}

function loadSave(id) {
  const saves = loadAllSaves();
  const save = saves.find(s => s.id === id);
  if (!save) return;

  currentCharacter = {
    name: save.name,
    stats: { ...save.stats },
    skills: save.skills
      ? cloneSkills(save.skills)
      : createDefaultSkills(), // fallback for old saves
  };
  currentSaveId = save.id;

  loadInventoryFromSnapshot(save.inventory || {});

  // 0.0.70c+ — Restore world map from save into PC.state (no globals)
  if (save.worldMap) {
    if (typeof setWorldMap === "function") {
      setWorldMap(save.worldMap);
    } else if (typeof STATE === "function") {
      STATE().worldMap = save.worldMap;
    }
  } else if (typeof createDefaultWorldMap === "function") {
    const wm = createDefaultWorldMap("tutorial_zone");
    if (typeof setWorldMap === "function") {
      setWorldMap(wm);
    } else if (typeof STATE === "function") {
      STATE().worldMap = wm;
    }
  }

  // Restore equipped items (if present)
  if (save.equipped) {
    loadEquippedFromSnapshot(save.equipped);
  } else {
    loadEquippedFromSnapshot(null);
  }

  updateCharacterSummary();
  recomputeCharacterComputedState();

  // ----- Restore feature unlocks (with backward-compat) -----
  const feats = save.features || {};

  const hasInventoryItems =
    save.inventory && Object.keys(save.inventory).length > 0;
  const hasEquippedItems =
    save.equipped && Object.values(save.equipped).some(Boolean);

  inventoryUnlocked =
    typeof feats.inventoryUnlocked === "boolean"
      ? feats.inventoryUnlocked
      : hasInventoryItems;

  equipmentUnlocked =
    typeof feats.equipmentUnlocked === "boolean"
      ? feats.equipmentUnlocked
      : hasEquippedItems;

  if (inventoryButton) {
    inventoryButton.style.display = inventoryUnlocked ? "block" : "none";
  }
  if (equipmentButton) {
    equipmentButton.style.display = equipmentUnlocked ? "block" : "none";
  }
  if (equipmentPanel && !equipmentUnlocked) {
    equipmentPanel.style.display = "none";
  }

  // Re-render world map (renderer reads from STATE().worldMap)
  if (typeof renderWorldMapUI === "function") {
    renderWorldMapUI();
  }

  // Show the main game screen
  setScreen("game");

  // After loading a save, default to the World Map view
  if (typeof switchToWorldMapView === "function") {
    switchToWorldMapView();
  }
}

function deleteSave(id) {
  let saves = loadAllSaves();
  saves = saves.filter(s => s.id !== id);
  writeAllSaves(saves);

  // If you delete the currently loaded character, reset state
  if (currentSaveId === id) {
    currentCharacter = null;
    currentSaveId = null;
    loadInventoryFromSnapshot(null);
    loadEquippedFromSnapshot(null);
    characterComputed = null;
    updateEquipmentPanel();
  }

  renderSaveList();
}
