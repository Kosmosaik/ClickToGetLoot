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

// Simple debug zone for 0.0.70a testing.
// 10x10 grid, with a border of BLOCKED tiles and one LOCKED tile.
function createDebugZone() {
  const width = 10;
  const height = 10;
  const zone = createZone({
    id: "zone_debug_01",
    name: "Tutorial Zone",
    width,
    height,
  });

  // Make outer border blocked (X)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (isBorder) {
        zone.tiles[y][x].kind = ZONE_TILE_KIND.BLOCKED;
      }
    }
  }

  // Put a locked tile somewhere near the center.
  const lockX = 5;
  const lockY = 5;
  zone.tiles[lockY][lockX].kind = ZONE_TILE_KIND.LOCKED;

  return zone;
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
  getZoneExplorationStats,
  revealRandomExplorableTile,
  revealNextExplorableTileSequential,
};
