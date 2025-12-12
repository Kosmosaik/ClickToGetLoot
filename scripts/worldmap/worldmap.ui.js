// scripts/worldmap/worldmap.ui.js
// Simple UI renderer for the world map panel.

console.log("worldmap.ui.js loaded");

// ----- Safe accessors (avoid const collisions across scripts) -----
function STATE() { return PC.state; }
function getWorldMap() { return STATE().worldMap; }

// ----- DOM references -----
const worldMapPanel = document.getElementById("worldmap-panel");
const worldMapGridEl = document.getElementById("worldmap-grid-view");
const worldMapStatusEl = document.getElementById("worldmap-status");
const worldMapEnterZoneButton = document.getElementById("worldmap-enter-zone-button");

// 0.0.70c — currently selected tile on the world map (for info panel + enter button)
let selectedWorldTileX = null;
let selectedWorldTileY = null;

// Panel switching helpers so we can move between Zone and World Map views.
function switchToWorldMapView() {
  const zonePanel = document.getElementById("zone-panel");

  if (zonePanel) zonePanel.style.display = "none";
  if (worldMapPanel) worldMapPanel.style.display = "block";

  if (typeof renderWorldMapUI === "function") {
    renderWorldMapUI();
  }
}

// Used when we enter a zone from the world map.
function switchToZoneView() {
  const zonePanel = document.getElementById("zone-panel");

  if (worldMapPanel) worldMapPanel.style.display = "none";
  if (zonePanel) zonePanel.style.display = "block";

  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }
}

// Convert one world map tile to a single character for the ASCII map.
function worldMapTileToChar(tile) {
  if (!tile || !tile.zoneId) return ".";

  switch (tile.fogState) {
    case WORLD_FOG_STATE.VISITED:
      return "X";
    case WORLD_FOG_STATE.DISCOVERED:
      return "o";
    case WORLD_FOG_STATE.UNKNOWN:
    default:
      return "?";
  }
}

// Build the full grid as HTML so each tile can be clicked.
function buildWorldMapGridHTML(wm) {
  if (!wm) return "(World map not created)";

  let html = "";
  for (let y = 0; y < wm.height; y++) {
    for (let x = 0; x < wm.width; x++) {
      const tile = wm.tiles[y][x];
      const ch = worldMapTileToChar(tile);
      html += `<span class="worldmap-cell" data-x="${x}" data-y="${y}">${ch}</span>`;
    }
    html += "<br>";
  }
  return html;
}

// 0.0.70c — Render the info panel for the currently selected tile.
function renderWorldMapTileInfo() {
  const panel = document.getElementById("worldmap-tile-info");
  const content = document.getElementById("worldmap-tile-info-content");

  if (!panel || !content) return;

  const wm = getWorldMap();
  if (!wm || selectedWorldTileX === null || selectedWorldTileY === null) {
    panel.classList.add("hidden");
    content.textContent = "";
    return;
  }

  if (typeof getWorldMapTile !== "function") {
    panel.classList.add("hidden");
    content.textContent = "";
    return;
  }

  const tile = getWorldMapTile(wm, selectedWorldTileX, selectedWorldTileY);
  if (!tile) {
    panel.classList.add("hidden");
    content.textContent = "";
    return;
  }

  panel.classList.remove("hidden");

  const lines = [];
  lines.push(`<strong>Coordinates:</strong> (${selectedWorldTileX}, ${selectedWorldTileY})`);
  if (tile.zoneId) lines.push(`<strong>Zone ID:</strong> ${tile.zoneId}`);
  if (tile.era) lines.push(`<strong>Era:</strong> ${tile.era}`);
  if (tile.biome) lines.push(`<strong>Biome:</strong> ${tile.biome}`);
  if (typeof tile.difficultyRating === "number") {
    lines.push(`<strong>Difficulty Rating:</strong> ${tile.difficultyRating} / 10`);
  }
  if (tile.templateId) lines.push(`<strong>Template:</strong> ${tile.templateId}`);
  lines.push(`<strong>Status:</strong> ${tile.fogState}`);

  content.innerHTML = lines.join("<br>");

  const enterButton = document.getElementById("worldmap-enter-zone-button");
  if (enterButton) {
    const canEnter =
      tile.fogState === WORLD_FOG_STATE.DISCOVERED ||
      tile.fogState === WORLD_FOG_STATE.VISITED;
    enterButton.disabled = !canEnter;
  }
}

// Public render function
function renderWorldMapUI() {
  if (!worldMapPanel || !worldMapGridEl) return;

  const wm = getWorldMap();
  if (!wm) {
    worldMapGridEl.textContent = "(World map not available)";
    if (worldMapStatusEl) worldMapStatusEl.textContent = "No world map created yet.";
    return;
  }

  worldMapGridEl.innerHTML = buildWorldMapGridHTML(wm);

  if (worldMapStatusEl) {
    worldMapStatusEl.textContent = "World map ready.";
  }

  renderWorldMapTileInfo();
}

// Expose for other scripts
window.renderWorldMapUI = renderWorldMapUI;
window.switchToWorldMapView = switchToWorldMapView;
window.switchToZoneView = switchToZoneView;

// 0.0.70c — Select a tile on the world map and refresh UI + info panel.
function selectWorldMapTile(x, y) {
  selectedWorldTileX = x;
  selectedWorldTileY = y;
  renderWorldMapUI();
}
window.selectWorldMapTile = selectWorldMapTile;

// Handle clicks on world map cells.
function handleWorldMapTileClick(x, y) {
  const wm = getWorldMap();
  if (!wm) return;
  if (typeof getWorldMapTile !== "function") return;

  const tile = getWorldMapTile(wm, x, y);
  if (!tile || !tile.zoneId) {
    if (worldMapStatusEl) worldMapStatusEl.textContent = "There is nothing mapped at that location.";
    return;
  }

  if (tile.fogState === WORLD_FOG_STATE.UNKNOWN) {
    if (worldMapStatusEl) worldMapStatusEl.textContent = "You don't know what lies there yet.";
    return;
  }

  selectWorldMapTile(x, y);
}

// Wire up the click listener on the grid element
if (worldMapGridEl) {
  worldMapGridEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || !target.classList || !target.classList.contains("worldmap-cell")) return;

    const x = parseInt(target.getAttribute("data-x"), 10);
    const y = parseInt(target.getAttribute("data-y"), 10);
    if (Number.isNaN(x) || Number.isNaN(y)) return;

    handleWorldMapTileClick(x, y);
  });
}

// Wire up the "Enter Zone" button in the world map info panel.
if (worldMapEnterZoneButton) {
  worldMapEnterZoneButton.addEventListener("click", () => {
    if (selectedWorldTileX === null || selectedWorldTileY === null) {
      if (worldMapStatusEl) worldMapStatusEl.textContent = "Select a zone on the world map first.";
      return;
    }

    const wm = getWorldMap();
    if (!wm) return;
    if (typeof getWorldMapTile !== "function") return;

    const tile = getWorldMapTile(wm, selectedWorldTileX, selectedWorldTileY);
    if (!tile || !tile.zoneId) {
      if (worldMapStatusEl) worldMapStatusEl.textContent = "There is no zone mapped at that location.";
      return;
    }

    if (tile.fogState === WORLD_FOG_STATE.UNKNOWN) {
      if (worldMapStatusEl) worldMapStatusEl.textContent = "You don't know what lies there yet.";
      return;
    }

    if (typeof enterZoneFromWorldMap === "function") {
      enterZoneFromWorldMap(selectedWorldTileX, selectedWorldTileY);
    } else {
      console.warn("enterZoneFromWorldMap is not defined.");
    }
  });
}

// Debug helper: show the World Map panel and hide the Zone panel.
WorldMapDebug.showWorldMapPanel = function () {
  switchToWorldMapView();
};
