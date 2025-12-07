// scripts/worldmap/worldmap.core.js
// World map data model + simple helpers for 0.0.70b (part 1).

console.log("worldmap.core.js loaded");

// Fog-of-war states for the *world map* (not zone tiles).
const WORLD_FOG_STATE = {
  UNKNOWN: "unknown",      // player has no idea what's there
  DISCOVERED: "discovered",// player knows there is a zone there
  VISITED: "visited",      // player has been inside that zone at least once
};

// One world map tile = one "slot" where a zone can exist.
function createWorldMapTile(x, y) {
  return {
    x,
    y,

    // Zone identifier (e.g. "tutorial_zone", "tutorial_zone_north")
    zoneId: null,

    // Fog of war state for the world map.
    fogState: WORLD_FOG_STATE.UNKNOWN,

    // 0.0.70c – World slot metadata
    // These will be assigned when the tile becomes DISCOVERED.
    era: null,          // e.g. "primitive", "fantasy", ...
    biome: null,        // e.g. "temperate_forest", "desert", ...
    templateId: null,   // e.g. "primitive_forest_easy" (maps to a zone template)
    seed: null,         // seed used when generating the actual zone
    zoneGenerated: false, // has a zone already been generated for this slot?
  };
}


// Create an empty world map of given size
function createEmptyWorldMap(width, height) {
  const tiles = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(createWorldMapTile(x, y));
    }
    tiles.push(row);
  }

  return {
    width,
    height,
    tiles,
  };
}

// Safe access helper
function getWorldMapTile(worldMap, x, y) {
  if (!worldMap) return null;
  if (y < 0 || y >= worldMap.height) return null;
  if (x < 0 || x >= worldMap.width) return null;
  return worldMap.tiles[y][x];
}

// Create the default world map for a new game.
// For now: a small grid with the Tutorial Zone in the center,
// and 4 adjacent placeholder zones around it.
function createDefaultWorldMap(startZoneId) {
  const width = 9;
  const height = 9;

  const map = createEmptyWorldMap(width, height);

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  // Store reference point so we can compute "rings" later
  map.startX = centerX;
  map.startY = centerY;

  // Starting tile = tutorial slot
  const startTile = getWorldMapTile(map, centerX, centerY);
  if (startTile) {
    startTile.zoneId = startZoneId;
    startTile.fogState = WORLD_FOG_STATE.VISITED; // we start inside it

    // 0.0.70c: initialize world slot metadata for distance 0 (tutorial)
    if (typeof initializeWorldSlotFromDistance === "function") {
      initializeWorldSlotFromDistance(startTile, 0);
    }
  }

  // Adjacent placeholder zones (first ring around tutorial)
  const neighbors = [
    { dx: 0, dy: -1, idSuffix: "north" },
    { dx: 0, dy: 1, idSuffix: "south" },
    { dx: -1, dy: 0, idSuffix: "west" },
    { dx: 1, dy: 0, idSuffix: "east" },
  ];

  neighbors.forEach((n) => {
    const nx = centerX + n.dx;
    const ny = centerY + n.dy;
    const tile = getWorldMapTile(map, nx, ny);
    if (!tile) return;

    tile.zoneId = `${startZoneId}_${n.idSuffix}`;
    tile.fogState = WORLD_FOG_STATE.DISCOVERED;

    // Manhattan distance from the starting tile (these will all be 1 here)
    const distance = Math.abs(nx - map.startX) + Math.abs(ny - map.startY);

    // 0.0.70c: initialize world slot metadata for the first ring
    if (typeof initializeWorldSlotFromDistance === "function") {
      initializeWorldSlotFromDistance(tile, distance);
    }
  });

  // Current selection = starting tile
  map.currentX = centerX;
  map.currentY = centerY;

  return map;
}


/**
 * Find the world map tile that has the given zoneId.
 * Returns an object { tile, x, y } or null if not found.
 */
function findWorldTileByZoneId(worldMap, zoneId) {
    if (!worldMap || !worldMap.tiles) return null;

    for (let y = 0; y < worldMap.height; y++) {
        for (let x = 0; x < worldMap.width; x++) {
            const tile = worldMap.tiles[y][x];
            if (tile.zoneId === zoneId) {
                return { tile, x, y };
            }
        }
    }

    return null;
}

/**
 * Mark the tile belonging to zoneId as VISITED
 * and update worldMap.currentX/currentY accordingly.
 */
function markWorldTileVisited(worldMap, zoneId) {
    const result = findWorldTileByZoneId(worldMap, zoneId);
    if (!result) {
        console.warn("Could not find world map tile for zoneId:", zoneId);
        return;
    }

    const { tile, x, y } = result;

    if (tile.fogState !== WORLD_FOG_STATE.VISITED) {
        tile.fogState = WORLD_FOG_STATE.VISITED;
    }

    worldMap.currentX = x;
    worldMap.currentY = y;
}

// Small debug helper so we can inspect via DevTools console
window.WorldMapDebug = {
  WORLD_FOG_STATE,
  createEmptyWorldMap,
  createDefaultWorldMap,
  getWorldMapTile,
};

/**
 * Find the world map tile that has the given zoneId.
 * Returns an object { tile, x, y } or null if not found.
 */
function findWorldTileByZoneId(worldMap, zoneId) {
    if (!worldMap || !worldMap.tiles) return null;

    for (let y = 0; y < worldMap.height; y++) {
        for (let x = 0; x < worldMap.width; x++) {
            const tile = worldMap.tiles[y][x];
            if (tile.zoneId === zoneId) {
                return { tile, x, y };
            }
        }
    }

    return null;
}

/**
 * Mark the tile belonging to zoneId as VISITED
 * and update worldMap.currentX/currentY accordingly.
 */
function markWorldTileVisited(worldMap, zoneId) {
    const result = findWorldTileByZoneId(worldMap, zoneId);
    if (!result) {
        console.warn("Could not find world map tile for zoneId:", zoneId);
        return;
    }

    const { tile, x, y } = result;

    if (tile.fogState !== WORLD_FOG_STATE.VISITED) {
        tile.fogState = WORLD_FOG_STATE.VISITED;
    }

    worldMap.currentX = x;
    worldMap.currentY = y;
}

