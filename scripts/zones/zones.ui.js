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
const zoneExploreAutoBtn = document.getElementById("zone-explore-auto"); // now a toggle (auto/stop)
const zoneLeaveZoneBtn = document.getElementById("zone-leave-zone");

const zoneMessagesListEl = document.getElementById("zone-messages-list");
const zoneDiscoveriesListEl = document.getElementById("zone-discoveries-list");
const zoneDiscoveriesSortBarEl = document.getElementById("zone-discoveries-sort-bar");

// UI-only (not saved)
let zoneDiscoveriesSort = { key: "distance", dir: "asc" };

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

function isLockedGateTile(tile) {
  return !!tile && tile.kind === "locked" && tile.lockedRegionId != null;
}

// Gate becomes "discovered" when any cardinal neighbor is explored.
function isLockedGateDiscovered(zone, x, y) {
  if (!zone || !zone.tiles) return false;
  if (y < 0 || y >= zone.height || x < 0 || x >= zone.width) return false;

  const tile = zone.tiles[y]?.[x];
  if (!isLockedGateTile(tile)) return false;

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (const d of dirs) {
    const nx = x + d.dx;
    const ny = y + d.dy;
    if (ny < 0 || ny >= zone.height || nx < 0 || nx >= zone.width) continue;
    if (isTileExplored(zone, nx, ny)) return true;
  }
  return false;
}

function isZoneIdleForInteraction() {
  if (EXP().zoneExplorationActive) return false;
  if (EXP().zoneManualExplorationActive) return false;
  if (MOV().zoneMovementActive) return false;
  return true;
}

// ---- Locked Gate Modal + Lockpick flow ----
let __lockpickTimerId = null;
let __lockpickStartedAt = 0;

function clearLockpickTimer() {
  if (__lockpickTimerId != null) {
    clearInterval(__lockpickTimerId);
    __lockpickTimerId = null;
  }
  __lockpickStartedAt = 0;
}

function applyTrapDamage(amount) {
  const dmg = Math.max(0, Number(amount || 0));
  if (dmg <= 0) return;

  if (typeof getCurrentHP === "function" && typeof setCurrentHP === "function") {
    const cur = Number(getCurrentHP() || 0);
    const next = Math.max(0, cur - dmg);
    setCurrentHP(next);
  } else {
    // Fallback: direct state, only if helpers missing
    try {
      const st = STATE();
      st.currentHP = Math.max(0, Number(st.currentHP || 0) - dmg);
    } catch {}
  }

  if (typeof updateHPBar === "function") {
    updateHPBar();
  }
}

// Exposed so pc.api.js can call it after moving adjacent.
window.openLockedGateModalAt = function openLockedGateModalAt(x, y) {
  const zone = getZone();
  if (!zone) return;

  const tx = Number(x);
  const ty = Number(y);
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

  const tile = zone.tiles?.[ty]?.[tx];
  if (!isLockedGateTile(tile)) return;

  // Must be discovered
  if (!isLockedGateDiscovered(zone, tx, ty)) return;

  // Must be idle
  if (!isZoneIdleForInteraction()) return;

  // Must be adjacent (movement system should ensure this)
  // If not adjacent for any reason, route through move helper.
  let px = null, py = null;
  for (let yy = 0; yy < zone.height; yy++) {
    const row = zone.tiles[yy];
    if (!row) continue;
    for (let xx = 0; xx < zone.width; xx++) {
      const t = row[xx];
      if (t && t.hasPlayer) { px = xx; py = yy; break; }
    }
    if (px != null) break;
  }
  if (px == null || py == null || (Math.abs(px - tx) + Math.abs(py - ty)) !== 1) {
    if (window.PC?.api?.zone && typeof PC.api.zone.moveToAndOpenGateAt === "function") {
      PC.api.zone.moveToAndOpenGateAt(tx, ty);
    }
    return;
  }

  clearLockpickTimer();

  const showModal = typeof window.showChoiceModal === "function" ? window.showChoiceModal : null;
  if (!showModal) return;

  const bodyHtml =
    `<div>Locked Gate</div>` +
    `<div class="lockpick-ui">` +
    `  <div class="lockpick-row"><span>Lockpicking</span><span id="lockpick-time">3.0s</span></div>` +
    `  <input id="lockpick-progress" type="range" min="0" max="3000" value="0" disabled />` +
    `</div>`;

  showModal({
    title: "Locked Gate",
    bodyHtml,
    primaryText: "Lockpick",

    secondaryText: "Leave",
    keepOpenOnPrimary: true,
    onSecondary: () => {
      clearLockpickTimer();
    },
    onPrimary: () => {
      // Start lockpick attempt (3 seconds)
      const primaryBtn = document.getElementById("modal-primary");
      const secondaryBtn = document.getElementById("modal-secondary");
      const prog = document.getElementById("lockpick-progress");
      const timeEl = document.getElementById("lockpick-time");

      if (!primaryBtn || !secondaryBtn || !prog || !timeEl) return;

      // Prevent re-click / closing during attempt
      primaryBtn.disabled = true;
      secondaryBtn.disabled = true;

      __lockpickStartedAt = Date.now();
      const duration = 3000;

      __lockpickTimerId = setInterval(() => {
        const elapsed = Date.now() - __lockpickStartedAt;
        const clamped = Math.max(0, Math.min(duration, elapsed));
        prog.value = String(clamped);

        const remainingMs = Math.max(0, duration - clamped);
        timeEl.textContent = `${(remainingMs / 1000).toFixed(1)}s`;

        if (elapsed >= duration) {
          clearLockpickTimer();

          // Roll 50/50
          const success = Math.random() < 0.5;

          if (success) {
            // Unlock region (runtime)
            if (typeof unlockZoneLockedRegion === "function") {
              unlockZoneLockedRegion(zone, tile.lockedRegionId);
            }
            
            // Persist unlock into zoneDeltas
            try {
              const st = STATE();
              const zid = zone.id;
              const rid = tile.lockedRegionId;
            
              if (!st.zoneDeltas) st.zoneDeltas = {};
              if (!st.zoneDeltas[zid]) st.zoneDeltas[zid] = {};
              if (!st.zoneDeltas[zid].unlockedRegions) {
                st.zoneDeltas[zid].unlockedRegions = {};
              }
            
              st.zoneDeltas[zid].unlockedRegions[rid] = true;
            } catch (e) {
              console.warn("Failed to persist unlocked region", e);
            }
            
            if (typeof requestSaveCurrentGame === "function") {
              requestSaveCurrentGame();
            }

          // Failure -> trap
          applyTrapDamage(20);

          if (typeof requestSaveCurrentGame === "function") {
            requestSaveCurrentGame();
          }

          if (typeof addZoneMessage === "function") {
            addZoneMessage("The lock snaps shut and a trap injures you! (-20 HP)");
          }

          if (typeof window.hideChoiceModal === "function") window.hideChoiceModal();
          if (typeof renderZoneUI === "function") renderZoneUI();
        }
      }, 50);
    },
  });
};

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

  // Collect discovered locked gates (treat as POI-like interactable)
  // NOTE: This block MUST live after `entries` is initialized (and after `distSq` exists).
  for (let yy = 0; yy < zone.height; yy++) {
    for (let xx = 0; xx < zone.width; xx++) {
      const t = zone.tiles?.[yy]?.[xx];
      if (!isLockedGateTile(t)) continue;

      // Gate must be discovered to appear in Discoveries
      if (!isLockedGateDiscovered(zone, xx, yy)) continue;

      entries.push({
        kind: "gates",
        id: `gate:${xx},${yy}`,
        x: xx,
        y: yy,
        name: "Locked Gate",
        glyph: "L",
        label: "",
        d2: distSq(xx, yy),
      });
    }
  }
  
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

      let ch;
      if (tile.kind === "blocked") {
        ch = "#";
      } else if (tile.kind === "locked") {
        // Hide gate until discovered
        ch = isLockedGateDiscovered(zone, x, y) ? "L" : "?";
      } else {
        ch = tile.explored ? "." : "?";
      }

      let classes = "zone-cell";

      if (tile.kind === "locked") {
        classes += " zone-cell-gate";
        if (!isLockedGateDiscovered(zone, x, y)) {
          classes += " zone-cell-gate-hidden";
        }
      }

      if (tile.isActiveExplore && !tile.explored && tile.kind !== "locked") {
        ch = "?";
        classes += " zone-cell-exploring";
      }

      let title = "";

      // Content markers (only on explored walkable tiles)
      if (tile.kind !== "blocked" && tile.kind !== "locked" && tile.explored) {
        const top = getTopTileContent(zone, contentIndex, x, y);
        if (top && top.inst) {
          const def = getContentDef(top.kind, top.inst.defId);
          const label = getInstanceStateLabel(top.kind, top.inst);
          ch = getMarkerGlyph(top.kind, top.inst, def);
          classes += " zone-cell-content";
          classes += ` zone-cell-content-${top.kind}`;
          if (label && top.kind !== "locations") classes += " zone-cell-content-done";
          const nm = def && def.name ? def.name : top.inst.defId;
          title = `${nm} ${label}`.trim();
        }
      }

      if (tile.kind === "locked" && isLockedGateDiscovered(zone, x, y)) {
        title = "Locked Gate";
      }

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
    if (zoneNameEl) zoneNameEl.textContent = "Zone: (none)";
    if (zoneStatusEl) zoneStatusEl.textContent = "Status: Not in a zone";
    if (zoneStatsEl) zoneStatsEl.textContent = "Explored: 0% (0 / 0 tiles)";
    if (zoneGridEl) zoneGridEl.textContent = "(No active zone)";

    if (zoneExploreNextBtn) zoneExploreNextBtn.disabled = true;
    if (zoneExploreAutoBtn) zoneExploreAutoBtn.disabled = true;
    if (zoneLeaveZoneBtn) zoneLeaveZoneBtn.disabled = true;

    // Ensure toggle label resets when leaving a zone
    if (zoneExploreAutoBtn) zoneExploreAutoBtn.textContent = "Explore Auto";

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

  // Can we start exploring?
  const canExplore =
    inZone() &&
    !MOV().zoneMovementActive &&
    stats &&
    stats.totalExplorableTiles > 0 &&
    stats.percentExplored < 100;

  const anyExploreInProgress =
    EXP().zoneExplorationActive || EXP().zoneManualExplorationActive;

  // Explore Next: only when idle + canExplore
  if (zoneExploreNextBtn) {
    zoneExploreNextBtn.disabled = !canExplore || anyExploreInProgress;
  }

  // Explore Auto: toggle button (start/stop)
  if (zoneExploreAutoBtn) {
    const autoActive = !!EXP().zoneExplorationActive;

    zoneExploreAutoBtn.textContent = autoActive ? "Stop Exploring" : "Explore Auto";

    // If auto is running, we always allow stopping.
    // If auto is NOT running, we require canExplore + idle.
    zoneExploreAutoBtn.disabled = autoActive ? false : (!canExplore || anyExploreInProgress);
  }

  // Leave Zone: available while in a zone (even if completed)
  if (zoneLeaveZoneBtn) {
    zoneLeaveZoneBtn.disabled = !inZone();
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


// Explore Auto (toggle start/stop)
if (zoneExploreAutoBtn) {
  zoneExploreAutoBtn.addEventListener("click", () => {
    if (!getZone() || !inZone()) return;

    // If currently running -> stop
    if (EXP().zoneExplorationActive) {
      if (window.PC?.api?.zone && typeof PC.api.zone.stopAutoExplore === "function") {
        PC.api.zone.stopAutoExplore();
      } else if (typeof stopZoneExplorationTicks === "function") {
        stopZoneExplorationTicks();
      }
      addZoneMessage("You stop to catch your breath and look around.");
      renderZoneUI();
      return;
    }

    // Otherwise start
    if (typeof startZoneExplorationTicks === "function" || (window.PC?.api?.zone && typeof PC.api.zone.startAutoExplore === "function")) {
      if (window.PC?.api?.zone && typeof PC.api.zone.startAutoExplore === "function") {
        PC.api.zone.startAutoExplore();
      } else {
        startZoneExplorationTicks();
      }
    }
    renderZoneUI();
  });
}

// ----- Click handling on the zone grid -----
//
// Clicking on an 'L' tile should unlock the corresponding locked subregion.
if (zoneGridEl) {
  zoneGridEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || !target.classList || !target.classList.contains("zone-cell")) return;

    const x = parseInt(target.getAttribute("data-x"), 10);
    const y = parseInt(target.getAttribute("data-y"), 10);
    if (Number.isNaN(x) || Number.isNaN(y)) return;

    const zone = getZone();
    if (!zone) return;

    const tile = zone.tiles?.[y]?.[x];
    if (!tile) return;

    // Locked gate click routing
    if (isLockedGateTile(tile)) {
      // Must be discovered
      if (!isLockedGateDiscovered(zone, x, y)) return;

      // Must be idle
      if (!isZoneIdleForInteraction()) return;

      // Move adjacent then open modal
      if (window.PC?.api?.zone && typeof PC.api.zone.moveToAndOpenGateAt === "function") {
        PC.api.zone.moveToAndOpenGateAt(x, y);
      }
      return;
    }

    // Normal content interaction routing (unchanged rules)
    if (tile.kind === "blocked") return;
    if (!tile.explored) return;

    if (window.PC?.api?.zone && typeof PC.api.zone.moveToAndInteractAt === "function") {
      PC.api.zone.moveToAndInteractAt(x, y);
    }

    if (typeof renderZoneUI === "function") renderZoneUI();
  });
}

// Leave Zone (now in main Controls row)
if (zoneLeaveZoneBtn) {
  zoneLeaveZoneBtn.addEventListener("click", () => {
    console.log("Player chose to LEAVE the zone.");

    // 1) Stop any ongoing auto exploration
    if (window.PC?.api?.zone && typeof PC.api.zone.stopAutoExplore === "function") {
      PC.api.zone.stopAutoExplore();
    } else if (typeof stopZoneExplorationTicks === "function") {
      stopZoneExplorationTicks();
    }

    // 2) Mark the world map tile for this zone as VISITED
    if (STATE().worldMap && getZone() && typeof markWorldTileVisited === "function") {
      markWorldTileVisited(STATE().worldMap, getZone().id);
    }

    // 3) Update main state to "not in a zone"
    STATE().isInZone = false;
    STATE().currentZone = null;

    // 4) Add a message
    addZoneMessage("You leave the area behind.");

    // 5) Switch to world map view
    if (typeof switchToWorldMapView === "function") {
      switchToWorldMapView();
    } else {
      renderZoneUI();
    }
  });
}

if (zoneDiscoveriesListEl) {
  zoneDiscoveriesListEl.addEventListener("click", (e) => {
    const li = e.target && e.target.closest ? e.target.closest("li.zone-discovery-entry") : null;
    if (!li) return;

    const x = parseInt(li.dataset.x, 10);
    const y = parseInt(li.dataset.y, 10);
    if (Number.isNaN(x) || Number.isNaN(y)) return;

    const kind = li.dataset.kind || "";

    // Gate interaction from Discoveries
    if (kind === "gates") {
      if (!isZoneIdleForInteraction()) return;
      if (window.PC?.api?.zone && typeof PC.api.zone.moveToAndOpenGateAt === "function") {
        PC.api.zone.moveToAndOpenGateAt(x, y);
      }
      return;
    }

    // Default: same as before
    if (window.PC?.api?.zone && typeof PC.api.zone.moveToAndInteractAt === "function") {
      PC.api.zone.moveToAndInteractAt(x, y);
    }
  });
}


