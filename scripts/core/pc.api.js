// scripts/core/pc.api.js
console.log("pc.api.js loaded");

// Authoritative state/API access.
// Rules:
// - Never overwrite PC.api (extend only).
// - STATE/EXP/MOV are defined here and nowhere else.
// - Game/UI should prefer PC.api.* actions, and STATE/EXP/MOV for state reads/writes.

(function () {
  const PC = (window.PC = window.PC || {});
  PC.api = PC.api || {};

  // ---- Authoritative state access ----
  PC.api.state = function () {
    return PC.state;
  };

  PC.api.exp = function () {
    return PC.state.exploration;
  };

  PC.api.mov = function () {
    return PC.state.movement;
  };

  // Global shorthands used by existing modules (zones.*, game.*, etc.)
  window.STATE = PC.api.state;
  window.EXP = PC.api.exp;
  window.MOV = PC.api.mov;

  // ---- Action API (extend only) ----
  PC.api.zone = PC.api.zone || {};
  PC.api.world = PC.api.world || {};

  // Zone actions (wire to existing functions if present)
  PC.api.zone.exploreOnce = () => {
    if (typeof startZoneManualExploreOnce === "function") startZoneManualExploreOnce();
  };
  PC.api.zone.startAutoExplore = () => {
    if (typeof startZoneExplorationTicks === "function") startZoneExplorationTicks();
  };
  PC.api.zone.stopAutoExplore = () => {
    if (typeof stopZoneExplorationTicks === "function") stopZoneExplorationTicks();
  };

  // Phase 6.3 — Tile click routing (interaction entrypoint).
  // UI should call this; the router/handlers live elsewhere.
  PC.api.zone.interactAt = (x, y) => {
    // Prefer a dedicated router if/when it exists.
    if (typeof PC.zoneInteractAt === "function") {
      PC.zoneInteractAt(x, y);
      return;
    }
    if (typeof window.zoneInteractAt === "function") {
      window.zoneInteractAt(x, y);
      return;
    }

    // Placeholder (Phase 7 will replace this).
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("Nothing to interact with here (yet).");
    }
  };

  // QoL — Move next to a tile, then interact.
// Used by BOTH:
// - clicking content on the zone map
// - clicking content in the Discoveries list
PC.api.zone.moveToAndInteractAt = (x, y) => {
  const st = PC.api.state();
  const zone = st ? st.currentZone : null;
  if (!st || !zone || !st.isInZone) return;

  // Don’t interrupt exploration or existing movement.
  if (PC.api.exp().zoneExplorationActive || PC.api.exp().zoneManualExplorationActive) {
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("You can’t move to interact while exploring.");
    }
    return;
  }
  if (PC.api.mov().zoneMovementActive) return;

  const tx = Number(x);
  const ty = Number(y);
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

  // Only interact with explored, walkable tiles.
  const tile = zone.tiles?.[ty]?.[tx];
  if (!tile) return;
  if (tile.kind === "blocked" || tile.kind === "locked") return;
  if (!tile.explored) return;

  // Find player position from tile.hasPlayer
  let px = null;
  let py = null;
  for (let yy = 0; yy < zone.height; yy++) {
    const row = zone.tiles[yy];
    if (!row) continue;
    for (let xx = 0; xx < zone.width; xx++) {
      const t = row[xx];
      if (t && t.hasPlayer) {
        px = xx;
        py = yy;
        break;
      }
    }
    if (px != null) break;
  }

  // If we already stand adjacent, interact now.
  if (px != null && py != null) {
    const manhattan = Math.abs(px - tx) + Math.abs(py - ty);
    if (manhattan === 1) {
      PC.api.zone.interactAt(tx, ty);
      if (typeof window.renderZoneUI === "function") window.renderZoneUI();
      return;
    }
  }

  // Use existing "prepared tile" stance pathing if available.
  if (typeof window.findPathToPreparedTile !== "function" || typeof window.startZoneMovement !== "function") {
    // If movement system isn’t present for some reason, do nothing (adjacency rule).
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("You can’t reach that right now.");
    }
    return;
  }

  zone.preparedTargetX = tx;
  zone.preparedTargetY = ty;

  const path = window.findPathToPreparedTile(zone);

  // No path => can’t reach
  if (!Array.isArray(path) || path.length === 0) {
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("No path to that target.");
    }
    return;
  }

  window.startZoneMovement(path, () => {
    // On arrival we should be adjacent by definition of prepared-tile stance pathing.
    PC.api.zone.interactAt(tx, ty);
    if (typeof window.renderZoneUI === "function") window.renderZoneUI();
  });

  if (typeof window.renderZoneUI === "function") window.renderZoneUI();
};

  // World actions
  PC.api.world.enterZone = (x, y) => {
    if (typeof enterZoneFromWorldMap === "function") enterZoneFromWorldMap(x, y);
  };
  PC.api.world.showWorldMap = () => {
    if (typeof switchToWorldMapView === "function") switchToWorldMapView();
  };
})();
