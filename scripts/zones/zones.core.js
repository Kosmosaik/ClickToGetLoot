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

    // 0.0.70c-qol — track the current "player" position in this zone.
    // Null means "no position yet" (e.g. nothing explored so far).
    playerX: null,
    playerY: null,

    // 0.0.70d+ — content / state scaffolding
    // (will be filled from templates later)
    content: {
      resourceNodes: [],
      entities: [],
      pois: [],
    },

    // These already exist conceptually but we give them defaults
    // so every zone object has a predictable shape.
    defaultWeatherState: null,
    lockedRegions: null, // will be set by locked-region helpers if needed
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
    
    // After building tiles, prepare content scaffolding.
    initializeZoneContent(zone, def);
    
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
    // After building tiles from the layout, mark locked subregions (if any).
    if (typeof markZoneLockedSubregionsFromLayout === "function") {
      markZoneLockedSubregionsFromLayout(zone);
    }

    // 0.0.70d — content scaffolding
    initializeZoneContent(zone, def);
    
    return zone;
  }

  console.error(
    `createZoneFromDefinition: unsupported zone type "${def.type}" for zoneId="${zoneId}".`
  );
  return null;
}

// 0.0.70d — Zone content scaffolding.
// This is where we will later populate zone.content based on templates:
// entities, resource nodes, POIs, etc.
function initializeZoneContent(zone, def) {
  if (!zone) return;

  // Ensure content object exists (in case older zones were created before
  // we added it to createZone).
  if (!zone.content) {
    zone.content = {
      resourceNodes: [],
      entities: [],
      pois: [],
    };
  }

  // For now, we don't actually spawn anything.
  // Later we will:
  //  - Look up a template by def.templateId or zone.id
  //  - Read entities/resources/pois spawn tables from ZONE_TEMPLATES
  //  - Use the zone seed (or derived sub-seeds) for deterministic placement
}

// ----- Locked subregion helpers -----
//
// We use the final zone tiles to figure out which parts of the map
// are behind an 'L' gate. The generator already placed 'L' between
// the largest and second-largest regions. Here we:
//
// - Find all walkable regions (ZONE_TILE_KIND.WALKABLE).
// - Treat the largest region as "primary".
// - Treat all other regions as a single locked subregion (id = 1).
// - For locked region tiles, we temporarily turn them into BLOCKED,
//   but remember their original kind so we can restore it on unlock.

// Return an array of { id, cells: [{x,y}...] } for walkable regions.
function computeZoneWalkableRegions(zone) {
  const regions = [];
  const height = zone.height;
  const width = zone.width;

  const visited = [];
  for (let y = 0; y < height; y++) {
    visited[y] = [];
    for (let x = 0; x < width; x++) {
      visited[y][x] = false;
    }
  }

  let nextRegionId = 0;

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (let startY = 0; startY < height; startY++) {
    for (let startX = 0; startX < width; startX++) {
      if (visited[startY][startX]) continue;
      const startTile = zone.tiles[startY][startX];
      if (!startTile || startTile.kind !== ZONE_TILE_KIND.WALKABLE) continue;

      const cells = [];
      const queue = [{ x: startX, y: startY }];
      visited[startY][startX] = true;

      while (queue.length > 0) {
        const { x, y } = queue.shift();
        cells.push({ x, y });

        for (const dir of dirs) {
          const nx = x + dir.dx;
          const ny = y + dir.dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (visited[ny][nx]) continue;

          const tile = zone.tiles[ny][nx];
          if (!tile || tile.kind !== ZONE_TILE_KIND.WALKABLE) continue;

          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }

      regions.push({
        id: nextRegionId++,
        cells,
      });
    }
  }

  return regions;
}

// Use the regions and the 'L' gate to mark a locked subregion in the zone.
function markZoneLockedSubregionsFromLayout(zone) {
  const height = zone.height;
  const width = zone.width;

  // Find any 'L' tiles (kind = LOCKED). If there are none, nothing to do.
  const gateTiles = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = zone.tiles[y][x];
      if (tile && tile.kind === ZONE_TILE_KIND.LOCKED) {
        gateTiles.push({ x, y });
      }
    }
  }

  if (gateTiles.length === 0) {
    return; // no locked gate in this zone
  }

  // Compute regions on WALKABLE tiles only (L and walls are treated as blocked).
  const regions = computeZoneWalkableRegions(zone);
  if (regions.length < 2) {
    return; // not enough separate areas to justify a locked region
  }

  // Sort by size, largest first.
  regions.sort((a, b) => b.cells.length - a.cells.length);

  const primaryRegion = regions[0];

  // Combine all non-primary regions into a single locked subregion (id = 1).
  const lockedCells = [];
  for (let i = 1; i < regions.length; i++) {
    const region = regions[i];
    for (const cell of region.cells) {
      lockedCells.push(cell);
    }
  }

  if (lockedCells.length === 0) {
    return;
  }

  zone.lockedRegions = [
    {
      id: 1,
      unlocked: false,
    },
  ];

  // Mark all locked-region tiles.
  for (const cell of lockedCells) {
    const { x, y } = cell;
    const tile = zone.tiles[y][x];
    if (!tile) continue;

    // Remember what this tile was originally, then temporarily block it.
    tile.lockedRegionId = 1;
    tile.originalKind = tile.originalKind || tile.kind;
    tile.kind = ZONE_TILE_KIND.BLOCKED;
  }

  // Associate gate tiles with the locked region as well.
  for (const gate of gateTiles) {
    const gateTile = zone.tiles[gate.y][gate.x];
    if (!gateTile) continue;
    gateTile.lockedRegionId = 1;
  }
}

// Unlock a given locked region in the zone.
// This restores original tile kinds and makes them explorable.
function unlockZoneLockedRegion(zone, regionId) {
  if (!zone || !zone.lockedRegions) return;

  const entry = zone.lockedRegions.find((r) => r.id === regionId);
  if (!entry || entry.unlocked) {
    return;
  }

  entry.unlocked = true;

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];
      if (!tile) continue;
      if (tile.lockedRegionId !== regionId) continue;

      // Gate tile (was LOCKED) becomes normal walkable floor.
      if (tile.kind === ZONE_TILE_KIND.LOCKED) {
        tile.kind = ZONE_TILE_KIND.WALKABLE;
        tile.originalKind = ZONE_TILE_KIND.WALKABLE;
      }

      // Tiles that were BLOCKED only because of the lock become walkable again.
      if (tile.kind === ZONE_TILE_KIND.BLOCKED) {
        const restoredKind = tile.originalKind || ZONE_TILE_KIND.WALKABLE;
        tile.kind = restoredKind;
      }
    }
  }
}

// Simple debug zone now created from data definition.
function createDebugZone() {
  return createZoneFromDefinition("tutorial_zone");
}


// --- Exploration helpers ---

// A tile is "explorable" if it is not blocked.
function isTileExplorable(tile) {
  // Only normal walkable tiles are explorable.
  // BLOCKED and LOCKED tiles are not.
  return tile.kind === ZONE_TILE_KIND.WALKABLE;
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

  // Use floor so we never claim 100% until explored === total.
  const percent = total === 0 ? 0 : Math.floor((explored / total) * 100);

  return {
    totalExplorableTiles: total,
    exploredTiles: explored,
    percentExplored: percent,
    isComplete: total > 0 && explored >= total,
  };
}

// Clear the "player is standing here" marker on all tiles in this zone.
function clearZonePlayerMarker(zone) {
  if (!zone || !zone.tiles) return;

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const t = zone.tiles[y][x];
      if (t && t.hasPlayer) {
        t.hasPlayer = false;
      }
    }
  }
}

// Helper: clear the "currently being explored" flag on all tiles.
// We call this right before we mark a new active exploration tile,
// so only ONE tile can blink at a time.
function clearTileActiveExploreFlags(zone) {
  if (!zone || !zone.tiles) return;

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const t = zone.tiles[y][x];
      if (t && t.isActiveExplore) {
        t.isActiveExplore = false;
      }
    }
  }
}

// Clear the "this tile will be explored next" flag on all tiles.
function clearTileActiveExploreFlags(zone) {
  if (!zone || !zone.tiles) return;

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const t = zone.tiles[y][x];
      if (t && t.isActiveExplore) {
        t.isActiveExplore = false;
      }
    }
  }
}

// Mark the next explorable tile as "pending exploration" (for blinking).
// Does NOT set tile.explored; it just marks tile.isActiveExplore = true.
// Returns true if a tile was marked, false if none were found.
function prepareNextExplorationTile(zone) {
  if (!zone || !zone.tiles) return false;

  // Only one tile should ever be marked as "next".
  clearTileActiveExploreFlags(zone);

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];
      if (isTileExplorable(tile) && !tile.explored) {
        tile.isActiveExplore = true;
        return true;
      }
    }
  }

  return false;
}

// Reveal the tile that was previously marked by prepareNextExplorationTile.
// If none is marked, falls back to the old sequential reveal.
// Returns true if something was revealed, false if there was nothing to do.
function revealPreparedExplorationTile(zone) {
  if (!zone || !zone.tiles) return false;

  let target = null;

  // Find the tile that was marked as "will be explored".
  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];
      if (tile && tile.isActiveExplore && !tile.explored) {
        target = { x, y };
        break;
      }
    }
    if (target) break;
  }

  // If nothing was prepared, fall back to the old sequential reveal.
  if (!target) {
    return revealNextExplorableTileSequential(zone);
  }

  const tile = zone.tiles[target.y][target.x];

  // Stop blinking — it's no longer "pending", it's being revealed now.
  tile.isActiveExplore = false;
  tile.explored = true;

  // Move the player marker to this tile.
  clearZonePlayerMarker(zone);
  tile.hasPlayer = true;

  return true;
}


// Reveal ONE unexplored explorable tile in a fixed order (top-left to bottom-right).
// Returns true if something was revealed, false if zone is fully explored.
function revealNextExplorableTileSequential(zone) {
  if (!zone || !zone.tiles) return false;

  // Clear any previous "blinking" and player marker.
  clearTileActiveExploreFlags(zone);
  clearZonePlayerMarker(zone);

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];
      if (isTileExplorable(tile) && !tile.explored) {
        tile.explored = true;

        // Move the player marker onto this tile.
        tile.hasPlayer = true;

        return true; // <-- stop after revealing ONE tile
      }
    }
  }
  return false; // nothing left to reveal
}

// 0.0.70c — Ensure we have a generated zone definition for a given world tile.
// If ZONE_DEFINITIONS already has an entry for tile.zoneId, we reuse it.
// Otherwise we look up tile.templateId in ZONE_TEMPLATES and create a
// "generated" definition on the fly. Returns the definition or null.
function ensureGeneratedZoneDefinitionForWorldTile(tile) {
  if (!tile || !tile.zoneId) {
    console.warn("ensureGeneratedZoneDefinitionForWorldTile: tile or zoneId missing.", tile);
    return null;
  }

  if (typeof ZONE_DEFINITIONS === "undefined") {
    console.error("ensureGeneratedZoneDefinitionForWorldTile: ZONE_DEFINITIONS is not defined.");
    return null;
  }

  // If we already have a definition (e.g. tutorial zones), just return it.
  const existing = ZONE_DEFINITIONS[tile.zoneId];
  if (existing) {
    return existing;
  }

  const templateId = tile.templateId || "primitive_forest_easy";
  if (typeof ZONE_TEMPLATES === "undefined") {
    console.warn("ensureGeneratedZoneDefinitionForWorldTile: ZONE_TEMPLATES is not defined.");
    return null;
  }

  const template = ZONE_TEMPLATES[templateId];
  if (!template) {
    console.warn(
      `ensureGeneratedZoneDefinitionForWorldTile: no template found for templateId="${templateId}".`
    );
    return null;
  }

  const generator = template.generator || "cellular_automata";
  const generatorConfig = Object.assign({}, template.generatorConfig || {});

  // 0.0.70c — feed tile.seed into the generator config so layout is deterministic.
  if (tile.seed) {
    generatorConfig.seed = tile.seed;
  }

  // Later we might inject difficulty/era/biome/difficulty tweaks here.
  // For now, we only ensure width/height/etc are passed through.

  const def = {
    id: tile.zoneId,
    name: template.name || tile.zoneId,
    type: "generated",
    generator,
    generatorConfig,
    defaultWeatherState: template.defaultWeatherState || null,
  };

  ZONE_DEFINITIONS[tile.zoneId] = def;

  // 0.0.70c — mark the world slot as having a generated definition.
  tile.zoneGenerated = true;

  return def;
}

// Small debug helpers exposed on window so we can test in the browser console.
window.ZoneDebug = {
  createDebugZone,
  createZoneFromDefinition,
  getZoneExplorationStats,
  revealNextExplorableTileSequential, // still exposed
  prepareNextExplorationTile,         // NEW
  revealPreparedExplorationTile,      // NEW
  ensureGeneratedZoneDefinitionForWorldTile,
};




