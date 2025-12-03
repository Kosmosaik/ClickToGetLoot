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
    defaultWeatherState: "clear",

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

    // Simple generated zones around the tutorial zone.
  // These will use a Cellular Automata-based generator in 0.0.70b.
  tutorial_zone_north: {
    id: "tutorial_zone_north",
    name: "Northern Wilds",
    type: "generated",
    generator: "cellular_automata",
    generatorConfig: {
      width: 28,
      height: 18,
      fillChance: 0.45,       // probability a tile starts as wall
      smoothIterations: 4,    // how many CA smoothing passes
      borderIsWall: true,     // keep solid border
    },
    defaultWeatherState: "overcast",
  },

  tutorial_zone_south: {
    id: "tutorial_zone_south",
    name: "Southern Caves",
    type: "generated",
    generator: "cellular_automata",
    generatorConfig: {
      width: 28,
      height: 18,
      fillChance: 0.50,
      smoothIterations: 5,
      borderIsWall: true,
    },
    defaultWeatherState: "humid",
  },

  tutorial_zone_west: {
    id: "tutorial_zone_west",
    name: "Western Grove",
    type: "generated",
    generator: "cellular_automata",
    generatorConfig: {
      width: 26,
      height: 16,
      fillChance: 0.40,
      smoothIterations: 4,
      borderIsWall: true,
    },
    defaultWeatherState: "clear",
  },

  tutorial_zone_east: {
    id: "tutorial_zone_east",
    name: "Eastern Ridge",
    type: "generated",
    generator: "cellular_automata",
    generatorConfig: {
      width: 26,
      height: 16,
      fillChance: 0.52,
      smoothIterations: 5,
      borderIsWall: true,
    },
    defaultWeatherState: "windy",
  },
};
