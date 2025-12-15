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
};

// 0.0.70c — Zone templates (used by world slots / auto-generated zones).
// These are separate from ZONE_DEFINITIONS to keep data modular.
// World tiles carry a templateId (e.g. "primitive_forest_d1") which
// we map to one of these templates when generating a new zone on demand.
const ZONE_TEMPLATES = {
  // Starting zone template (metadata only).
  // The tutorial zone itself is a static layout defined in ZONE_DEFINITIONS,
  // but world tiles still carry a templateId, so we keep this here as a
  // dedicated "start" template. It is not used for procedural generation.
  tutorial_start: {
    id: "tutorial_start",
    name: "Tutorial Start",
    difficulty: 1,
    generator: null,
    generatorConfig: null,
    defaultWeatherState: "clear",
  },
  primitive_forest_d1: {
    id: "primitive_forest_d1",
    name: "Primitive Forest",
    difficulty: 1,
    generator: "cellular_automata",
    generatorConfig: {
      width: 38,
      height: 24,
      fillChance: 0.48,
      smoothIterations: 4,
      borderIsWall: true,
    },
    defaultWeatherState: "overcast",
  },
};

