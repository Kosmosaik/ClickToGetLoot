// scripts/core/pc.api.js
console.log("pc.api.js loaded");

// Central API + state access helpers.
// IMPORTANT:
// - Never overwrite PC.api (we extend it).
// - EXP/MOV/STATE are defined here as the single source of truth for state access.

(function () {
  const PC = (window.PC = window.PC || {});

  // Ensure api namespace exists
  PC.api = PC.api || {};

  // ---- State access helpers (single source of truth) ----
  PC.api.state = function () {
    return PC.state;
  };

  PC.api.exp = function () {
    return PC.state.exploration;
  };

  PC.api.mov = function () {
    return PC.state.movement;
  };

  // Legacy/global shorthands used across the project (zones.* expects these)
  window.STATE = PC.api.state;
  window.EXP = PC.api.exp;
  window.MOV = PC.api.mov;

  // ---- Action API (extend; do not replace PC.api) ----
  PC.api.zone = PC.api.zone || {};
  PC.api.zone.exploreOnce = () => {
    if (typeof startZoneManualExploreOnce === "function") {
      startZoneManualExploreOnce();
    }
  };
  PC.api.zone.startAutoExplore = () => {
    if (typeof startZoneExplorationTicks === "function") {
      startZoneExplorationTicks();
    }
  };
  PC.api.zone.stopAutoExplore = () => {
    if (typeof stopZoneExplorationTicks === "function") {
      stopZoneExplorationTicks();
    }
  };

  PC.api.world = PC.api.world || {};
  PC.api.world.enterZone = (x, y) => {
    if (typeof enterZoneFromWorldMap === "function") {
      enterZoneFromWorldMap(x, y);
    }
  };
  PC.api.world.showWorldMap = () => {
    if (typeof switchToWorldMapView === "function") {
      switchToWorldMapView();
    }
  };
})();
