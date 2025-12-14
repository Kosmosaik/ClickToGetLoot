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

  // World actions
  PC.api.world.enterZone = (x, y) => {
    if (typeof enterZoneFromWorldMap === "function") enterZoneFromWorldMap(x, y);
  };
  PC.api.world.showWorldMap = () => {
    if (typeof switchToWorldMapView === "function") switchToWorldMapView();
  };
})();
