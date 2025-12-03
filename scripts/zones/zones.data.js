// scripts/zones/zones.data.js
// Zone definitions & layouts for 0.0.70a2 (data-driven experiment).

console.log("zones.data.js loaded");

// NOTE:
// - This file only contains DATA (no logic).
// - Tile symbol meanings are defined in zones.core.js (ZONE_TILE_SYMBOLS).

// All zone definitions go here.
const ZONE_DEFINITIONS = {
  tutorial_zone: {
    id: "tutorial_zone",
    name: "Tutorial Zone",
    type: "static_layout",
    width: 10,
    height: 10,

    // Handcrafted layout:
    // # = border (blocked)
    // . = walkable
    // L = locked tile
    //
    // The locked tile is at (x=5, y=5), same as your old createDebugZone().
    layout: [
      "##########",
      "#........#",
      "#........#",
      "#........#",
      "#........#",
      "#....L...#",
      "#........#",
      "#........#",
      "#........#",
      "##########",
    ],
  },
};
