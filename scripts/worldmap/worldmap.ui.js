// scripts/worldmap/worldmap.ui.js
// Simple UI renderer for the world map panel.

console.log("worldmap.ui.js loaded");

// DOM references
const worldMapPanel = document.getElementById("worldmap-panel");
const worldMapGridEl = document.getElementById("worldmap-grid-view");
const worldMapStatusEl = document.getElementById("worldmap-status");

// Panel switching helpers so we can move between Zone and World Map views.
function switchToWorldMapView() {
  const zonePanel = document.getElementById("zone-panel");

  if (zonePanel) {
    zonePanel.style.display = "none";
  }
  if (worldMapPanel) {
    worldMapPanel.style.display = "block";
  }

  if (typeof renderWorldMapUI === "function") {
    renderWorldMapUI();
  }
}

// Used when we enter a zone from the world map.
function switchToZoneView() {
  const zonePanel = document.getElementById("zone-panel");

  if (worldMapPanel) {
    worldMapPanel.style.display = "none";
  }
  if (zonePanel) {
    zonePanel.style.display = "block";
  }

  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }
}

function switchToWorldMapView() {
    const worldMapPanel = document.getElementById("worldmap-panel");
    const zonePanel = document.getElementById("zone-panel");

    if (zonePanel) {
        zonePanel.style.display = "none";
    }
    if (worldMapPanel) {
        worldMapPanel.style.display = "block";
    }

    if (typeof renderWorldMapUI === "function") {
        renderWorldMapUI();
    }
}

function switchToZoneView() {
    const worldMapPanel = document.getElementById("worldmap-panel");
    const zonePanel = document.getElementById("zone-panel");

    if (worldMapPanel) {
        worldMapPanel.style.display = "none";
    }
    if (zonePanel) {
        zonePanel.style.display = "block";
    }
}

// Convert one world map tile to a single character for the ASCII map.
function worldMapTileToChar(tile) {
  if (!tile || !tile.zoneId) {
    return "."; // empty / no zone here
  }

  switch (tile.fogState) {
    case WORLD_FOG_STATE.VISITED:
      return "X"; // zones we've been in
    case WORLD_FOG_STATE.DISCOVERED:
      return "o"; // known zones we haven't visited yet
    case WORLD_FOG_STATE.UNKNOWN:
    default:
      return "?"; // should not appear in 0.0.70b, but safe fallback
  }
}

// Build the full grid as HTML so each tile can be clicked.
function buildWorldMapGridHTML(worldMap) {
  if (!worldMap) {
    return "(World map not created)";
  }

  let html = "";

  for (let y = 0; y < worldMap.height; y++) {
    for (let x = 0; x < worldMap.width; x++) {
      const tile = worldMap.tiles[y][x];
      const ch = worldMapTileToChar(tile);

      // Each cell is a span with data-x / data-y so we know where was clicked.
      html += `<span class="worldmap-cell" data-x="${x}" data-y="${y}">${ch}</span>`;
    }
    html += "<br>";
  }

  return html;
}

// Public render function
function renderWorldMapUI() {
  if (!worldMapPanel || !worldMapGridEl) return;

  if (typeof worldMap === "undefined" || !worldMap) {
    worldMapGridEl.textContent = "(World map not available)";
    if (worldMapStatusEl) {
      worldMapStatusEl.textContent = "No world map created yet.";
    }
    return;
  }

  worldMapGridEl.innerHTML = buildWorldMapGridHTML(worldMap);

  if (worldMapStatusEl) {
    worldMapStatusEl.textContent =
      "World map ready (Tutorial Zone + adjacent placeholders).";
  }
}

function switchToWorldMapView() {
  const worldMapPanel = document.getElementById("worldmap-panel");
  const zonePanel = document.getElementById("zone-panel");

  if (zonePanel) {
    zonePanel.style.display = "none";
  }
  if (worldMapPanel) {
    worldMapPanel.style.display = "block";
  }

  if (typeof renderWorldMapUI === "function") {
    renderWorldMapUI();
  }
}

// Expose for other scripts
window.renderWorldMapUI = renderWorldMapUI;

// Handle clicks on world map cells.
function handleWorldMapTileClick(x, y) {
  if (typeof worldMap === "undefined" || !worldMap) return;
  if (typeof getWorldMapTile !== "function") return;

  const tile = getWorldMapTile(worldMap, x, y);
  if (!tile || !tile.zoneId) {
    if (worldMapStatusEl) {
      worldMapStatusEl.textContent = "There is nothing mapped at that location.";
    }
    return;
  }

  // Don't allow jumps into completely unknown tiles (just in case)
  if (tile.fogState === WORLD_FOG_STATE.UNKNOWN) {
    if (worldMapStatusEl) {
      worldMapStatusEl.textContent = "You don't know what lies there yet.";
    }
    return;
  }

  // Delegate to game logic (defined in game.js)
  if (typeof enterZoneFromWorldMap === "function") {
    enterZoneFromWorldMap(x, y);
  } else {
    console.warn("enterZoneFromWorldMap is not defined yet.");
  }
}

// Wire up the click listener on the grid element
if (worldMapGridEl) {
  worldMapGridEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || !target.classList || !target.classList.contains("worldmap-cell")) {
      return;
    }

    const x = parseInt(target.getAttribute("data-x"), 10);
    const y = parseInt(target.getAttribute("data-y"), 10);

    if (Number.isNaN(x) || Number.isNaN(y)) return;

    handleWorldMapTileClick(x, y);
  });
}

// Debug helper: manually show the World Map panel and hide the Zone panel.
// Use from browser console: WorldMapDebug.showWorldMapPanel()
WorldMapDebug.showWorldMapPanel = function () {
  if (typeof switchToWorldMapView === "function") {
    switchToWorldMapView();
  }
};




