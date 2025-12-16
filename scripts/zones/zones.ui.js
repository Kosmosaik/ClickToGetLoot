// scripts/zones/zones.ui.js
// UI layer for Zone main panel (0.0.70a).

console.log("zones.ui.js loaded");

// ----- DOM references -----
const zonePanel = document.getElementById("zone-panel");

const zoneNameEl = document.getElementById("zone-name");
const zoneStatusEl = document.getElementById("zone-status");
const zoneStatsEl = document.getElementById("zone-exploration-stats");
const zoneGridEl = document.getElementById("zone-grid-view");

const zoneExploreNextBtn = document.getElementById("zone-explore-next");
const zoneExploreAutoBtn = document.getElementById("zone-explore-auto");
const zoneExploreStopBtn = document.getElementById("zone-explore-stop");

const zoneMessagesListEl = document.getElementById("zone-messages-list");
const zoneDiscoveriesListEl = document.getElementById("zone-discoveries-list");
const zoneDiscoveriesSortBarEl = document.getElementById("zone-discoveries-sort-bar");

// UI-only (not saved)
let zoneDiscoveriesSort = { key: "distance", dir: "asc" };

const zoneFinishMenuEl = document.getElementById("zone-finish-menu");
const zoneFinishStayBtn = document.getElementById("zone-finish-stay");
const zoneFinishLeaveBtn = document.getElementById("zone-finish-leave");

function getZone() {
  return STATE().currentZone;
}
function inZone() {
  return !!STATE().isInZone;
}

// ----- Helpers -----

// Build quick lookup maps for placed zone content by tile coordinate.
// Instances are stored in zone.content.* arrays; we index them per render.
function buildContentIndex(zone) {
  const idx = {
    resourceNodes: new Map(),
    entities: new Map(),
    pois: new Map(),
    locations: new Map(),
  };

  if (!zone || !zone.content) return idx;

  const addAll = (kind, list) => {
    if (!Array.isArray(list)) return;
    for (const inst of list) {
      if (!inst) continue;
      const x = Number(inst.x);
      const y = Number(inst.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      idx[kind].set(`${x},${y}`, inst);
    }
  };

  addAll("resourceNodes", zone.content.resourceNodes);
  addAll("entities", zone.content.entities);
  addAll("pois", zone.content.pois);
  addAll("locations", zone.content.locations);
  return idx;
}

// Resolve the highest-priority content instance on a tile.
// Priority: entity > POI > node > location
function getTopTileContent(zone, contentIndex, x, y) {
  const key = `${x},${y}`;
  const entity = contentIndex.entities.get(key);
  if (entity) {
    const s = entity.state || {};
    // Phase 9: defeated entities are removed/invisible until respawned.
    if (!s.defeated) return { kind: "entities", inst: entity };
  }
  const poi = contentIndex.pois.get(key);
  if (poi) return { kind: "pois", inst: poi };
  const rn = contentIndex.resourceNodes.get(key);
  if (rn) {
    const s = rn.state || {};
    // Phase 9: depleted/harvested nodes are removed/invisible until respawned.
    const spent = !!s.depleted || !!s.harvested || (typeof s.chargesLeft === "number" && s.chargesLeft <= 0);
    if (!spent) return { kind: "resourceNodes", inst: rn };
  }
  const loc = contentIndex.locations.get(key);
  if (loc) return { kind: "locations", inst: loc };
  return null;
}

function getContentDef(kind, defId) {
  const defs = window.PC?.content?.DEFS;
  if (!defs || !defs[kind]) return null;
  return defs[kind][defId] || null;
}

function getInstanceStateLabel(kind, inst) {
  const s = inst && inst.state ? inst.state : {};
  if (kind === "resourceNodes") {
    if (s.depleted) return "(depleted)";
    if (typeof s.chargesLeft === "number" && s.chargesLeft <= 0) return "(depleted)";
    return "";
  }
  if (kind === "entities") {
    if (s.defeated) return "(defeated)";
    return "";
  }
  if (kind === "pois") {
    if (s.opened) return "(opened)";
    if (s.inspected) return "(inspected)";
    if (s.triggered) return "(triggered)";
    return "";
  }
  if (kind === "locations") {
    if (s.discovered) return "(discovered)";
    return "";
  }
  return "";
}

function getMarkerGlyph(kind, inst, def) {
  // Prefer explicit glyph from definition.
  const g = def && def.glyph ? String(def.glyph) : null;
  if (g) return g;
  // Fallbacks if a def is missing.
  if (kind === "entities") return "e";
  if (kind === "pois") return "!";
  if (kind === "resourceNodes") return "*";
  if (kind === "locations") return "○";
  return ".";
}

// ---------------------------------------------------------------------------
// QoL — Discoveries list (state-driven, derived from explored + active content)
// ---------------------------------------------------------------------------
// Rules:
// - Only show content on explored tiles.
// - Remove from list when "done" in the same way the grid stops rendering it:
//   - resourceNodes: depleted/harvested/chargesLeft<=0 => hidden
//   - entities: defeated => hidden
//   - pois: for now, opened/inspected/triggered => hidden (static POIs later)
//   - locations: always show on explored tiles (discovered label if applicable)
//
// NOTE: No new persistent state is introduced here. This is derived UI.

function isInstanceHiddenFromZone(kind, inst) {
  const s = inst && inst.state ? inst.state : {};

  if (kind === "resourceNodes") {
    const spent =
      !!s.depleted ||
      !!s.harvested ||
      (typeof s.chargesLeft === "number" && s.chargesLeft <= 0);
    return spent;
  }

  if (kind === "entities") {
    return !!s.defeated;
  }

  if (kind === "pois") {
    // For now: remove most POIs when interacted with.
    // (Later we can introduce "static" POI types that remain.)
    return !!s.opened || !!s.inspected || !!s.triggered;
  }

  // locations remain visible
  return false;
}

function isTileExplored(zone, x, y) {
  if (!zone || !zone.tiles) return false;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (y < 0 || y >= zone.height || x < 0 || x >= zone.width) return false;
  const row = zone.tiles[y];
  if (!row) return false;
  const tile = row[x];
  return !!tile && tile.explored === true;
}

function updateZoneDiscoveriesSortBar() {
  if (!zoneDiscoveriesSortBarEl) return;

  const buttons = zoneDiscoveriesSortBarEl.querySelectorAll("button.sort-btn[data-key]");
  for (const btn of buttons) {
    const key = btn.dataset.key;
    const baseLabel = (key === "distance") ? "Distance" : (key === "name") ? "Name" : "Type";

    if (key === zoneDiscoveriesSort.key) {
      btn.classList.add("active");
      btn.textContent = `${baseLabel} ${zoneDiscoveriesSort.dir === "asc" ? "▲" : "▼"}`;
    } else {
      btn.classList.remove("active");
      btn.textContent = baseLabel;
    }
  }
}

function renderZoneDiscoveries(zone) {
  if (!zoneDiscoveriesListEl) return;

  // No zone => clear list
  if (!zone) {
    zoneDiscoveriesListEl.innerHTML = "";
    return;
  }

  const content = zone.content || {};
  zoneDiscoveriesListEl.innerHTML = "";

  // Determine player position (for distance sorting)
  let playerX = null;
  let playerY = null;
  if (zone.tiles) {
    for (let y = 0; y < zone.height; y++) {
      const row = zone.tiles[y];
      if (!row) continue;
      for (let x = 0; x < zone.width; x++) {
        const t = row[x];
        if (t && t.hasPlayer) {
          playerX = x;
          playerY = y;
          break;
        }
      }
      if (playerX != null) break;
    }
  }

  function distSq(x, y) {
    if (playerX == null || playerY == null) return Number.POSITIVE_INFINITY;
    const dx = x - playerX;
    const dy = y - playerY;
    return dx * dx + dy * dy;
  }

  const entries = [];

  function collect(kind, inst) {
    if (!inst) return;

    const x = Number(inst.x);
    const y = Number(inst.y);

    if (!isTileExplored(zone, x, y)) return;

    // Hide "done" stuff (matches how the zone map hides nodes/entities etc)
    if (isInstanceHiddenFromZone(kind, inst)) return;

    const def = getContentDef(kind, inst.defId);
    const name = def && def.name ? def.name : (inst.defId || "Unknown");
    const glyph = getMarkerGlyph(kind, inst, def);
    const label = getInstanceStateLabel(kind, inst);

    entries.push({
      kind,
      id: String(inst.id ?? ""),
      x,
      y,
      name,
      glyph,
      label,
      d2: distSq(x, y),
    });
  }

  // Collect
  if (Array.isArray(content.resourceNodes)) for (const inst of content.resourceNodes) collect("resourceNodes", inst);
  if (Array.isArray(content.entities)) for (const inst of content.entities) collect("entities", inst);
  if (Array.isArray(content.pois)) for (const inst of content.pois) collect("pois", inst);
  if (Array.isArray(content.locations)) for (const inst of content.locations) collect("locations", inst);

  // Sort
  const key = zoneDiscoveriesSort.key || "distance";
  const dir = zoneDiscoveriesSort.dir || "asc";
  const mul = (dir === "asc") ? 1 : -1;

  if (key === "name") {
    entries.sort((a, b) => mul * a.name.localeCompare(b.name));
  } else if (key === "type") {
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return mul * a.kind.localeCompare(b.kind);
      return mul * a.name.localeCompare(b.name);
    });
  } else {
    // distance default
    entries.sort((a, b) => {
      if (a.d2 !== b.d2) return mul * (a.d2 - b.d2);
      return a.name.localeCompare(b.name);
    });
  }

  // Render
  for (const e of entries) {
    const li = document.createElement("li");
    li.className = "zone-discovery-entry";
    li.dataset.kind = e.kind;
    li.dataset.id = e.id;
    li.dataset.x = String(e.x);
    li.dataset.y = String(e.y);

    const glyphEl = document.createElement("span");
    glyphEl.className = "zone-discovery-glyph";
    glyphEl.textContent = e.glyph;

    const textEl = document.createElement("span");
    textEl.className = "zone-discovery-text";
    textEl.textContent = e.label ? `${e.name} ${e.label}` : e.name;

    li.appendChild(glyphEl);
    li.appendChild(textEl);

    zoneDiscoveriesListEl.appendChild(li);
  }
}

// Build an HTML grid from the current zone.
// # = blocked, ? = unexplored walkable, . = explored walkable, L = locked
// Each cell is a <span> so we can click on it.
// Build an HTML grid from the current zone.
// # = blocked, ? = unexplored walkable, . = explored walkable, L = locked
// Each cell is a <span> so we can click on it.
function buildZoneGridString(zone) {
  if (!zone) return "(No active zone)";

  const contentIndex = buildContentIndex(zone);

  let html = "";

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];

      // --- 1) Base character based on tile kind + explored ---
      let ch;
      if (tile.kind === "blocked") {
        ch = "#";
      } else if (tile.kind === "locked") {
        ch = "L"; // lock gate
      } else {
        // walkable
        ch = tile.explored ? "." : "?";
      }

      // --- 2) Base CSS class for the cell ---
      let classes = "zone-cell";

      // --- 3) Blinking for the tile that WILL be explored next ---
      // This is the "pending" tile (during the delay) and should:
      // - show as "?"
      // - have a special CSS class so it can blink
      if (tile.isActiveExplore && !tile.explored) {
        ch = "?";
        classes += " zone-cell-exploring";
      }

      // --- 4) Content markers (only on explored tiles) ---
      // Priorities: entity > POI > node > location.
      // NOTE: We only show markers for explored walkable tiles.
      let title = "";
      if (tile.kind !== "blocked" && tile.kind !== "locked" && tile.explored) {
        const top = getTopTileContent(zone, contentIndex, x, y);
        if (top && top.inst) {
          const def = getContentDef(top.kind, top.inst.defId);
          const label = getInstanceStateLabel(top.kind, top.inst);
          ch = getMarkerGlyph(top.kind, top.inst, def);
          classes += " zone-cell-content";
          classes += ` zone-cell-content-${top.kind}`;
          // Phase 9:
          // - Nodes/entities that are "done" are not rendered at all.
          // - POIs keep a "done" style when opened.
          // - Locations remain visible without a "done" style.
          if (label && top.kind !== "locations") classes += " zone-cell-content-done";
          const nm = def && def.name ? def.name : top.inst.defId;
          title = `${nm} ${label}`.trim();
        }
      }

      // --- 5) Player marker ☻ on the latest explored tile ---
      // We now track the player directly on the tile as tile.hasPlayer.
      if (tile.hasPlayer) {
        ch = "☻";
      }

      const titleAttr = title ? ` title="${title.replace(/\"/g, "&quot;")}"` : "";
      html += `<span class="${classes}" data-x="${x}" data-y="${y}"${titleAttr}>${ch}</span>`;
    }
    html += "<br>";
  }

  return html;
}

function getZoneStatusText(zone, stats) {
  if (!zone || !inZone()) {
    return "Status: Not in a zone";
  }

  if (!stats) {
    // Stats missing (ZoneDebug not ready)
    return "Status: Exploring";
  }

  if (stats.percentExplored >= 100) {
    return "Status: Zone completed";
  }

  if (EXP().zoneExplorationActive) {
    return "Status: Exploring (Auto)";
  }

  if (EXP().zoneManualExplorationActive) {
    return "Status: Exploring (Manual)";
  }

  return "Status: Idle (Ready to explore)";
}

function renderZoneUI() {
  if (!zonePanel) return;

  const zone = getZone();

  // No zone at all
  if (!zone) {
    if (zoneNameEl) {
      zoneNameEl.textContent = "Zone: (none)";
    }
    if (zoneStatusEl) {
      zoneStatusEl.textContent = "Status: Not in a zone";
    }
    if (zoneStatsEl) {
      zoneStatsEl.textContent = "Explored: 0% (0 / 0 tiles)";
    }
    if (zoneGridEl) {
      zoneGridEl.textContent = "(No active zone)";
    }
    if (zoneFinishMenuEl) {
      zoneFinishMenuEl.style.display = "none";
    }
    if (zoneExploreNextBtn) zoneExploreNextBtn.disabled = true;
    if (zoneExploreAutoBtn) zoneExploreAutoBtn.disabled = true;
    if (zoneExploreStopBtn) zoneExploreStopBtn.disabled = true;

    // QoL: Clear discoveries when not in a zone
    if (typeof renderZoneDiscoveries === "function") {
      renderZoneDiscoveries(null);
    }
    return;
  }

  // Exploration stats
  let stats = null;
  let statsText = "Exploration stats unavailable";
  if (window.ZoneDebug && typeof ZoneDebug.getZoneExplorationStats === "function") {
    stats = ZoneDebug.getZoneExplorationStats(zone);
    statsText = `Explored: ${stats.percentExplored}% (${stats.exploredTiles} / ${stats.totalExplorableTiles} tiles)`;
  }

  // Zone name
  if (zoneNameEl) {
    const name = zone.name || zone.id || "Unknown Zone";
    zoneNameEl.textContent = `Zone: ${name}`;
  }

  // Status
  if (zoneStatusEl) {
    zoneStatusEl.textContent = getZoneStatusText(zone, stats);
  }

  // Stats text
  if (zoneStatsEl) {
    zoneStatsEl.textContent = statsText;
  }

  // Grid (HTML + camera)
  if (zoneGridEl) {
    zoneGridEl.innerHTML = buildZoneGridString(zone);
  }

  // Finish menu: always visible while in a zone
  if (zoneFinishMenuEl) {
    zoneFinishMenuEl.style.display = "block";
  }

  // Button states
  const canExplore =
    inZone() &&
    !MOV().zoneMovementActive &&
    stats &&
    stats.totalExplorableTiles > 0 &&
    stats.percentExplored < 100;

  const anyExploreInProgress =
    EXP().zoneExplorationActive || EXP().zoneManualExplorationActive;

  if (zoneExploreNextBtn) {
    zoneExploreNextBtn.disabled = !canExplore || anyExploreInProgress;
  }
  if (zoneExploreAutoBtn) {
    zoneExploreAutoBtn.disabled = !canExplore || anyExploreInProgress;
  }
  if (zoneExploreStopBtn) {
    zoneExploreStopBtn.disabled = !EXP().zoneExplorationActive;
  }

  // QoL: Discoveries derived from explored tiles + active content
  if (typeof renderZoneDiscoveries === "function") {
    updateZoneDiscoveriesSortBar();
    renderZoneDiscoveries(zone);
  }
}

// Expose so other scripts can trigger UI refresh
window.renderZoneUI = renderZoneUI;

// ----- Message / Discovery helpers -----

function addZoneMessage(text) {
  if (!zoneMessagesListEl) return;

  const li = document.createElement("li");
  li.textContent = text;
  zoneMessagesListEl.prepend(li);

  while (zoneMessagesListEl.children.length > 30) {
    zoneMessagesListEl.removeChild(zoneMessagesListEl.lastChild);
  }
}

function addZoneDiscovery(text) {
  if (!zoneDiscoveriesListEl) return;

  const li = document.createElement("li");
  li.textContent = text;
  zoneDiscoveriesListEl.prepend(li);

  while (zoneDiscoveriesListEl.children.length > 50) {
    zoneDiscoveriesListEl.removeChild(zoneDiscoveriesListEl.lastChild);
  }
}

window.addZoneMessage = addZoneMessage;
window.addZoneDiscovery = addZoneDiscovery;

// ----- Button wiring -----

// Discoveries sort (inventory-style tabs)
if (zoneDiscoveriesSortBarEl) {
  zoneDiscoveriesSortBarEl.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest("button.sort-btn[data-key]") : null;
    if (!btn) return;

    const key = btn.dataset.key;
    if (!key) return;

    if (zoneDiscoveriesSort.key === key) {
      zoneDiscoveriesSort.dir = (zoneDiscoveriesSort.dir === "asc") ? "desc" : "asc";
    } else {
      zoneDiscoveriesSort.key = key;
      zoneDiscoveriesSort.dir = "asc";
    }

    updateZoneDiscoveriesSortBar();
    renderZoneUI();
  });
}

// Explore Next Tile (manual, one step)
if (zoneExploreNextBtn) {
  zoneExploreNextBtn.addEventListener("click", () => {
    if (typeof startZoneManualExploreOnce !== "function") return;
    PC.api.zone.exploreOnce();
    renderZoneUI();
  });
}


// Explore Auto (start tick-based exploring)
if (zoneExploreAutoBtn) {
  zoneExploreAutoBtn.addEventListener("click", () => {
    if (!getZone() || !inZone()) return;
    if (EXP().zoneExplorationActive) return; // already exploring
    if (typeof startZoneExplorationTicks === "function") {
      PC.api.zone.startAutoExplore();
    }
    renderZoneUI();
  });
}

// Stop Exploring (stop tick-based exploring)
if (zoneExploreStopBtn) {
  zoneExploreStopBtn.addEventListener("click", () => {
    if (!EXP().zoneExplorationActive) return;
    if (typeof stopZoneExplorationTicks === "function") {
      PC.api.zone.stopAutoExplore();
    }
    addZoneMessage("You stop to catch your breath and look around.");
    renderZoneUI();
  });
}

// ----- Click handling on the zone grid -----
//
// Clicking on an 'L' tile should unlock the corresponding locked subregion.
if (zoneGridEl) {
  zoneGridEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || !target.classList || !target.classList.contains("zone-cell")) {
      return;
    }

    const x = parseInt(target.getAttribute("data-x"), 10);
    const y = parseInt(target.getAttribute("data-y"), 10);
    if (Number.isNaN(x) || Number.isNaN(y)) return;
    const zone = getZone();
    if (!zone) return;
    
    const tile = zone.tiles[y][x];
    
    if (!tile) return;

    // Only handle clicks on locked gate tiles that belong to a locked region.
    if (tile.kind !== "locked" || tile.lockedRegionId == null) {
      // Phase 6.3 — Click routing for content interactions.
      // UI does not decide the interaction type; it only routes the click.
      // Only allow interaction on explored, walkable tiles.
      if (tile.kind === "blocked") return;
      if (!tile.explored) return;

      if (window.PC?.api?.zone && typeof PC.api.zone.interactAt === "function") {
        PC.api.zone.interactAt(x, y);
      }

      // Even if no handler exists yet, we still refresh to keep tooltips/markers correct.
      if (typeof renderZoneUI === "function") {
        renderZoneUI();
      }
      return;
    }

    console.log(
      "Clicked locked gate at",
      x,
      y,
      "for lockedRegionId=",
      tile.lockedRegionId
    );

    if (typeof unlockZoneLockedRegion === "function") {
      unlockZoneLockedRegion(zone, tile.lockedRegionId);
    }

    // Mark the gate tile itself as explored so it no longer shows as '?'.
    tile.explored = true;

    // 0.0.70e — persist explored tiles so gate doesn't reset on reload.
    try {
      if (window.PC?.content && typeof PC.content.markTileExplored === "function") {
        PC.content.markTileExplored(zone.id, x, y);
      }
    } catch {}

    // Debounced autosave: unlocking/ exploring should persist.
    if (typeof requestSaveCurrentGame === "function") {
      requestSaveCurrentGame();
    }

    if (typeof addZoneMessage === "function") {
      addZoneMessage("You unlock a hidden passage leading deeper into the area.");
    }

    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }
  });
}

// Finish menu: STAY
if (zoneFinishStayBtn) {
  zoneFinishStayBtn.addEventListener("click", () => {
    console.log("Player chose to STAY in the zone.");
    // No special behavior yet; they just remain in the completed zone.
  });
}

// Finish menu: LEAVE ZONE
// Finish menu: LEAVE ZONE
if (zoneFinishLeaveBtn) {
  zoneFinishLeaveBtn.addEventListener("click", () => {
    console.log("Player chose to LEAVE the zone.");

    // 1) Stop any ongoing auto exploration
    if (typeof stopZoneExplorationTicks === "function") {
      stopZoneExplorationTicks();
    }

    // 2) Mark the world map tile for this zone as VISITED and update currentX/currentY
    //    (only if we have both worldMap and currentZone and the helper exists)
    if (STATE().worldMap && getZone() && typeof markWorldTileVisited === "function") {
      markWorldTileVisited(STATE().worldMap, getZone().id);
    }

    // 3) Update main state to "not in a zone"
    STATE().isInZone = false;
    STATE().currentZone = null;

    // 4) Add a message (while the zone panel is still visible)
    addZoneMessage("You leave the area behind.");

    // 5) Switch to the world map view if available
    if (typeof switchToWorldMapView === "function") {
      switchToWorldMapView();
    } else {
      // Fallback: at least refresh the zone UI if something is missing
      renderZoneUI();
    }
  });
}

