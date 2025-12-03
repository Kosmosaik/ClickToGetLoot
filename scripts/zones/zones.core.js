// scripts/zones/zones.core.js
// Basic Zone data model + simple exploration helpers for 0.0.70a (skeleton).

console.log("zones.core.js loaded");

// --- Tile representation ---
// Each tile is:
// { kind: "walkable" | "blocked" | "locked", explored: boolean }

const ZONE_TILE_KIND = {
  WALKABLE: "walkable",
  BLOCKED: "blocked",
  LOCKED: "locked",
};

// Mapping from layout characters -> tile kinds.
// IMPORTANT: this is about what the tile *is*, not whether it's explored.
// Exploration state is stored in tile.explored and rendered as ?, ., #, L in the UI.
const ZONE_TILE_SYMBOLS = {
  "#": { kind: ZONE_TILE_KIND.BLOCKED },
  ".": { kind: ZONE_TILE_KIND.WALKABLE },
  "L": { kind: ZONE_TILE_KIND.LOCKED },
};


// Create an empty zone filled with unexplored walkable tiles.
function createZone({ id, name, width, height }) {
  const tiles = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({
        kind: ZONE_TILE_KIND.WALKABLE,
        explored: false,
      });
    }
    tiles.push(row);
  }

  return {
    id,
    name,
    width,
    height,
    tiles,
  };
}

// Create a zone instance based on a ZONE_DEFINITIONS entry.
function createZoneFromDefinition(zoneId) {
  const def = typeof ZONE_DEFINITIONS !== "undefined"
    ? ZONE_DEFINITIONS[zoneId]
    : null;

  if (!def) {
    console.error(`createZoneFromDefinition: no definition found for zoneId="${zoneId}"`);
    return null;
  }

  // Handle STATIC layout zones (tutorial, etc.)
  if (def.type === "static_layout") {
    const { id, name, width, height, layout } = def;

    if (!Array.isArray(layout) || layout.length !== height) {
      console.error(
        `createZoneFromDefinition: layout height mismatch for zoneId="${zoneId}". ` +
        `Expected ${height} rows, got ${Array.isArray(layout) ? layout.length : "non-array"}.`
      );
      return null;
    }

    const zone = createZone({ id, name, width, height });

    // carry metadata
    zone.defaultWeatherState = def.defaultWeatherState || null;

    for (let y = 0; y < height; y++) {
      const rowStr = layout[y];

      if (typeof rowStr !== "string" || rowStr.length !== width) {
        console.error(
          `createZoneFromDefinition: layout width mismatch in row ${y} for zoneId="${zoneId}". ` +
          `Expected string of length ${width}, got ${rowStr && rowStr.length}.`
        );
        return null;
      }

      for (let x = 0; x < width; x++) {
        const symbol = rowStr[x];
        const template = ZONE_TILE_SYMBOLS[symbol];

        if (!template) {
          console.warn(
            `createZoneFromDefinition: unknown tile symbol "${symbol}" at (${x}, ${y}) in zoneId="${zoneId}". ` +
            `Defaulting to WALKABLE.`
          );
          zone.tiles[y][x].kind = ZONE_TILE_KIND.WALKABLE;
        } else {
          zone.tiles[y][x].kind = template.kind;
        }
      }
    }

    return zone;
  }

  // Handle GENERATED zones (cellular automata etc.)
  if (def.type === "generated") {
    if (typeof generateLayoutFromDefinition !== "function") {
      console.error("createZoneFromDefinition: generator function is not available.");
      return null;
    }

    const layout = generateLayoutFromDefinition(def);
    if (!Array.isArray(layout) || layout.length === 0) {
      console.error("createZoneFromDefinition: generator returned invalid layout.");
      return null;
    }

    const height = layout.length;
    const width = layout[0].length;

    const zone = createZone({
      id: def.id,
      name: def.name,
      width,
      height,
    });

    zone.defaultWeatherState = def.defaultWeatherState || null;

    for (let y = 0; y < height; y++) {
      const rowStr = layout[y];
      if (typeof rowStr !== "string" || rowStr.length !== width) {
        console.error(
          `createZoneFromDefinition (generated): layout width mismatch in row ${y} for zoneId="${zoneId}".`
        );
        return null;
      }

      for (let x = 0; x < width; x++) {
        const symbol = rowStr[x];
        const template = ZONE_TILE_SYMBOLS[symbol];

        if (!template) {
          // In CA maps we currently only use '#' and '.', so any unknown = walkable.
          zone.tiles[y][x].kind = ZONE_TILE_KIND.WALKABLE;
        } else {
          zone.tiles[y][x].kind = template.kind;
        }
      }
    }

    return zone;
  }

  console.error(
    `createZoneFromDefinition: unsupported zone type "${def.type}" for zoneId="${zoneId}".`
  );
  return null;
}

// Simple debug zone now created from data definition.
function createDebugZone() {
  return createZoneFromDefinition("tutorial_zone");
}


// --- Exploration helpers ---

// A tile is "explorable" if it is not blocked.
function isTileExplorable(tile) {
  return tile.kind !== ZONE_TILE_KIND.BLOCKED;
}

// Count how many tiles ARE explorable (walkable + locked).
function countExplorableTiles(zone) {
  let total = 0;
  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];
      if (isTileExplorable(tile)) {
        total++;
      }
    }
  }
  return total;
}

// Count how many explorable tiles have been revealed.
function countExploredTiles(zone) {
  let explored = 0;
  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];
      if (isTileExplorable(tile) && tile.explored) {
        explored++;
      }
    }
  }
  return explored;
}

// Return a small stats object we can show in UI / console.
function getZoneExplorationStats(zone) {
  const total = countExplorableTiles(zone);
  const explored = countExploredTiles(zone);
  const percent = total === 0 ? 0 : Math.round((explored / total) * 100);
  return {
    totalExplorableTiles: total,
    exploredTiles: explored,
    percentExplored: percent,
  };
}

// Reveal ONE random unexplored explorable tile.
// Returns true if something was revealed, false if zone is already fully explored.
function revealRandomExplorableTile(zone) {
  const candidates = [];
  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];
      if (isTileExplorable(tile) && !tile.explored) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) {
    return false;
  }

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  zone.tiles[choice.y][choice.x].explored = true;
  return true;
}

// Reveal ONE unexplored explorable tile in a fixed order (top-left to bottom-right).
// Returns true if something was revealed, false if zone is fully explored.
function revealNextExplorableTileSequential(zone) {
  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];
      if (isTileExplorable(tile) && !tile.explored) {
        tile.explored = true;
        return true;
      }
    }
  }
  return false;
}

// Small debug helpers exposed on window so we can test in the browser console.
window.ZoneDebug = {
  createDebugZone,
  createZoneFromDefinition,
  getZoneExplorationStats,
  revealRandomExplorableTile,
  revealNextExplorableTileSequential,
};

