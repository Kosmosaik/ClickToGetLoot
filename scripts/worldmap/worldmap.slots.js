// scripts/worldmap/worldmap.slots.js
// 0.0.70c - World slot metadata helpers (ERA / BIOME / TEMPLATE / SEED)

console.log("worldmap.slots.js loaded");

// Very small "enum" helpers for now.
// These will expand later when we add Fantasy / Industrial / Sci-Fi etc.
const ERA = {
  PRIMITIVE: "primitive",
  // TODO: fantasy, industrial, sci_fi...
};

const BIOME = {
  TEMPERATE_FOREST: "temperate_forest",
  // TODO: add more biomes later
};

// For now these are extremely simple presets.
// Later they will be tied to full ZONE_TEMPLATES + spawn tables.
const WORLD_SLOT_TEMPLATES = {
  tutorial: {
    era: ERA.PRIMITIVE,
    biome: BIOME.TEMPERATE_FOREST,
    templateId: "tutorial_cave",
  },
  primitive_forest_easy: {
    era: ERA.PRIMITIVE,
    biome: BIOME.TEMPERATE_FOREST,
    templateId: "primitive_forest_easy",
  },
};

/**
 * Initialize slot metadata on a world map tile, if not already set.
 * Called when a tile transitions from UNKNOWN -> DISCOVERED (0.0.70c rule).
 */
function initializeWorldSlotMetadata(tile, options) {
  if (!tile) return;

  const opts = options || {};

  if (!tile.era) {
    tile.era = opts.era || ERA.PRIMITIVE;
  }
  if (!tile.biome) {
    tile.biome = opts.biome || BIOME.TEMPERATE_FOREST;
  }
  if (!tile.templateId) {
    tile.templateId = opts.templateId || "primitive_forest_easy";
  }

  // Difficulty rating 1–10 — derived from the zone template if available.
  if (typeof tile.difficultyRating !== "number") {
    // 1) explicit override on options (if we ever use it)
    if (typeof opts.difficultyRating === "number") {
      tile.difficultyRating = opts.difficultyRating;
    }
    // 2) otherwise, try to get it from the zone template by templateId
    else if (
      typeof ZONE_TEMPLATES !== "undefined" &&
      tile.templateId &&
      ZONE_TEMPLATES[tile.templateId] &&
      typeof ZONE_TEMPLATES[tile.templateId].difficulty === "number"
    ) {
      tile.difficultyRating = ZONE_TEMPLATES[tile.templateId].difficulty;
    }
    // 3) fallback
    else {
      tile.difficultyRating = null;
    }
  }

  // Simple seed for now. Later we can derive from a worldSeed + coords.
  if (!tile.seed) {
    tile.seed = `${tile.x}_${tile.y}_${Math.floor(Math.random() * 1e9)}`;
  }

  // Whether we've already generated the zone instance for this slot.
  if (typeof tile.zoneGenerated !== "boolean") {
    tile.zoneGenerated = false;
  }
}

/**
 * Pick a world slot template based on distance from the starting tile.
 * For 0.0.70c this is deliberately simple:
 *  - distance 0 = tutorial
 *  - everything else = primitive forest easy
 *
 * Later we can add rings with different biomes/difficulties/eras.
 */
function pickWorldSlotTemplateForDistance(distance) {
  if (distance === 0) {
    return WORLD_SLOT_TEMPLATES.tutorial;
  }

  return WORLD_SLOT_TEMPLATES.primitive_forest_easy;
}

/**
 * 0.0.70c — Difficulty rating for a world slot (1–10).
 *
 * Rules:
 * - Always between 1 and 10.
 * - Every difficulty is always possible (small chance).
 * - Further from start => more weight on higher numbers.
 */
function pickDifficultyForDistance(distance) {
  // Distance 0 = starting tile; clamp negative just in case.
  const d = Math.max(0, distance || 0);

  // Base difficulty increases slowly with distance, capped at 10.
  // Example: 0 -> 1.5, 1 -> 2.0, 4 -> 3.8, 10+ -> ~8+ etc.
  const base = Math.min(10, 1 + d * 0.7);

  const weights = [];
  for (let level = 1; level <= 10; level++) {
    // Baseline weight so every level is possible.
    let w = 1;

    // Bias around the base difficulty: closer to base => higher weight.
    const diff = Math.abs(level - base);
    w += Math.max(0, 4 - diff); // up to +4 if exactly at base

    // Slight extra push for high difficulties at larger distances.
    if (d >= 4 && level >= 7) {
      w += 1;
    }
    if (d >= 8 && level >= 9) {
      w += 2;
    }

    weights.push(w);
  }

  // Weighted random pick
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < 10; i++) {
    r -= weights[i];
    if (r <= 0) {
      return i + 1; // difficulty 1..10
    }
  }
  return 10;
}

/**
 * Convenience wrapper: initialize slot metadata for a tile
 * based on ring distance from the starting tile.
 */
function initializeWorldSlotFromDistance(tile, distance) {
  const preset =
    pickWorldSlotTemplateForDistance(distance) ||
    WORLD_SLOT_TEMPLATES.primitive_forest_easy;

  // Difficulty rating is an instance-level world tile property.
  // We pick it here (distance-weighted) and pass it as an explicit override.
  //
  // NOTE: The tutorial tile (distance 0) is intentionally fixed and may use
  // the template default difficulty.
  const opts = { ...preset };
  if (distance !== 0) {
    opts.difficultyRating = pickDifficultyForDistance(distance);
  }

  initializeWorldSlotMetadata(tile, opts);
}

// Debug helper – so you can poke this from DevTools if you want.
window.WorldSlotDebug = {
  ERA,
  BIOME,
  WORLD_SLOT_TEMPLATES,
  initializeWorldSlotMetadata,
  pickWorldSlotTemplateForDistance,
  pickDifficultyForDistance,
  initializeWorldSlotFromDistance,
};
