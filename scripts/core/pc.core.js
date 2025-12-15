// scripts/core/pc.core.js
// Global namespace + shared state container (no bundler / script-tag friendly).
(function () {
  // Main namespace
  const PC = (window.PC = window.PC || {});

  // Sub-namespaces (so we stop adding random globals)
  PC.game = PC.game || {};
  PC.zones = PC.zones || {};
  PC.worldmap = PC.worldmap || {};
  PC.ui = PC.ui || {};
  PC.util = PC.util || {};

  // Central state (replace scattered globals with this over time)
  PC.state = PC.state || {
    // core gameplay
    currentHP: 0,
    characterComputed: null,

    // zone / exploration
    currentZone: null,
    isInZone: false,

    // worldmap
    worldMap: null,

    // 0.0.70e — per-zone delta persistence (deterministic regen + deltas)
    zoneDeltas: {},

    // exploration timers/state (we'll migrate these next)
    exploration: {
      zoneExplorationActive: false,
      zoneExplorationTimerId: null,
      zoneManualExplorationActive: false,
      zoneManualTimerId: null,
      zoneExploreDelayTimerId: null,
    },

    // movement timers/state (we'll migrate these next)
    movement: {
      zoneMovementActive: false,
      zoneMovementTimerId: null,
      zoneMovementPath: null,
      zoneMovementOnArrival: null,
    },
  };
})();
