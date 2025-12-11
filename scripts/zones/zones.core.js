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

    // 0.0.70c+ — where the player should spawn when entering this zone.
    // This is chosen after the layout is built (see pickZoneEntrySpawn).
    entrySpawn: null,

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

// Choose a good entry spawn tile for this zone.
// We prefer:
// - WALKABLE tiles that are one step away from the border,
// - not too close to an 'L' locked gate tile (if present),
// - falling back to any walkable near the border, then any walkable at all.
function pickZoneEntrySpawn(zone, def) {
  if (!zone || !zone.tiles) return;

  const width = zone.width;
  const height = zone.height;

  // Collect any locked gate tiles so we can keep spawn a bit away from them.
  const gateTiles = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = zone.tiles[y][x];
      if (t && t.kind === ZONE_TILE_KIND.LOCKED) {
        gateTiles.push({ x, y });
      }
    }
  }

  function distanceToNearestGate(x, y) {
    if (gateTiles.length === 0) return Infinity;
    let best = Infinity;
    for (let i = 0; i < gateTiles.length; i++) {
      const g = gateTiles[i];
      const d = Math.abs(g.x - x) + Math.abs(g.y - y);
      if (d < best) best = d;
    }
    return best;
  }

  // If the definition explicitly provides an entry spawn, try that first.
  if (def && def.entrySpawn) {
    const sx = def.entrySpawn.x;
    const sy = def.entrySpawn.y;
    if (
      typeof sx === "number" && typeof sy === "number" &&
      sy >= 0 && sy < height && sx >= 0 && sx < width
    ) {
      const tile = zone.tiles[sy][sx];
      if (tile && tile.kind === ZONE_TILE_KIND.WALKABLE) {
        zone.entrySpawn = { x: sx, y: sy };
        return;
      }
    }
  }

  const borderPreferred = [];
  const borderFallback = [];
  const anyWalkable = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = zone.tiles[y][x];
      if (!tile || tile.kind !== ZONE_TILE_KIND.WALKABLE) continue;

      // Distance from the outer border (0 means on the very edge).
      const distBorder = Math.min(x, y, width - 1 - x, height - 1 - y);
      const distGate = distanceToNearestGate(x, y);

      anyWalkable.push({ x, y, distBorder, distGate });

      // We really like "one step in" tiles, away from the gate.
      if (distBorder === 1) {
        borderPreferred.push({ x, y, distBorder, distGate });
      } else if (distBorder === 2) {
        borderFallback.push({ x, y, distBorder, distGate });
      }
    }
  }

  function chooseBest(candidates, minGateDist) {
    if (!candidates || candidates.length === 0) return null;

    // Filter by gate distance if requested.
    let filtered = candidates;
    if (typeof minGateDist === "number") {
      filtered = candidates.filter(c => c.distGate >= minGateDist);
      if (filtered.length === 0) {
        filtered = candidates; // fall back to the full list
      }
    }

    // Among these, pick the one farthest from any gate.
    let best = filtered[0];
    for (let i = 1; i < filtered.length; i++) {
      const c = filtered[i];
      if (c.distGate > best.distGate) {
        best = c;
      }
    }
    return best;
  }

  let choice =
    chooseBest(borderPreferred, 4) ||
    chooseBest(borderPreferred, 2) ||
    chooseBest(borderFallback, 4) ||
    chooseBest(borderFallback, 2);

  if (!choice && anyWalkable.length > 0) {
    choice = chooseBest(anyWalkable, 2) || anyWalkable[0];
  }

  if (choice) {
    zone.entrySpawn = { x: choice.x, y: choice.y };
  } else {
    // Absolute last resort: center-ish of the map.
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    zone.entrySpawn = { x: cx, y: cy };
  }
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
    
    // 0.0.70c+ — pick an entry spawn tile for this static zone.
    pickZoneEntrySpawn(zone, def);  
    
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

    // 0.0.70c+ — choose a spawn tile near the border, away from the L gate.
    pickZoneEntrySpawn(zone, def);

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

// Find the current player position in this zone based on tile.hasPlayer.
// Returns { x, y } or null if not found yet.
function findZonePlayerPosition(zone) {
  if (!zone || !zone.tiles) return null;

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const t = zone.tiles[y][x];
      if (t && t.hasPlayer) {
        return { x, y };
      }
    }
  }
  return null;
}

// Check if tile at (x, y) has at least one 4-direction neighbor
// that is already explored or currently has the player on it.
// Used to build a "frontier" of natural expansion tiles.
function tileHasExploredOrPlayerNeighbor(zone, x, y) {
  if (!zone || !zone.tiles) return false;

  const dirs = [
    { dx:  1, dy:  0 },
    { dx: -1, dy:  0 },
    { dx:  0, dy:  1 },
    { dx:  0, dy: -1 },
  ];

  for (let i = 0; i < dirs.length; i++) {
    const nx = x + dirs[i].dx;
    const ny = y + dirs[i].dy;

    if (ny < 0 || ny >= zone.height || nx < 0 || nx >= zone.width) {
      continue;
    }

    const neighbor = zone.tiles[ny][nx];
    if (!neighbor) continue;

    if (neighbor.explored || neighbor.hasPlayer) {
      return true;
    }
  }

  return false;
}

// Ensure explored tiles form a single connected region around the player.
// Any explored tile that is not reachable from the player's position
// through explored ground is reset back to unexplored.
function normalizeZoneExploredConnectivity(zone) {
  if (!zone || !zone.tiles) return;

  const playerPos = findZonePlayerPosition(zone);
  if (!playerPos) return;

  const width = zone.width;
  const height = zone.height;

  const visited = [];
  for (let y = 0; y < height; y++) {
    visited[y] = [];
  }

  const queue = [];
  queue.push({ x: playerPos.x, y: playerPos.y });
  visited[playerPos.y][playerPos.x] = true;

  const dirs = [
    { dx:  1, dy:  0 },
    { dx: -1, dy:  0 },
    { dx:  0, dy:  1 },
    { dx:  0, dy: -1 },
  ];

  while (queue.length > 0) {
    const node = queue.shift();

    for (let i = 0; i < dirs.length; i++) {
      const nx = node.x + dirs[i].dx;
      const ny = node.y + dirs[i].dy;

      if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
      if (visited[ny][nx]) continue;

      const tile = zone.tiles[ny][nx];
      if (!tile) continue;

      // We only traverse:
      // - non-blocked tiles
      // - that are already explored OR currently have the player marker.
      if (tile.kind === "blocked") continue;
      if (!tile.explored && !tile.hasPlayer) continue;

      visited[ny][nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }

  // Any explored tile that was NOT visited by this flood fill
  // is an unreachable "island": reset it back to unexplored.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = zone.tiles[y][x];
      if (!tile) continue;
      if (!tile.explored) continue;

      if (!visited[y][x]) {
        tile.explored = false;
      }
    }
  }
}

// Compute which explored tiles are reachable from the player's current position,
// and their distance (number of steps) using 4-direction movement.
function computeReachableExploredFromPlayer(zone) {
  if (!zone || !zone.tiles) return null;

  const playerPos = findZonePlayerPosition(zone);
  if (!playerPos) return null;

  const width = zone.width;
  const height = zone.height;

  const visited = [];
  const dist = [];
  for (let y = 0; y < height; y++) {
    visited[y] = [];
    dist[y] = [];
  }

  const queue = [];
  queue.push({ x: playerPos.x, y: playerPos.y });
  visited[playerPos.y][playerPos.x] = true;
  dist[playerPos.y][playerPos.x] = 0;

  const dirs = [
    { dx:  1, dy:  0 },
    { dx: -1, dy:  0 },
    { dx:  0, dy:  1 },
    { dx:  0, dy: -1 },
  ];

  while (queue.length > 0) {
    const node = queue.shift();
    const baseDist = dist[node.y][node.x];

    for (let i = 0; i < dirs.length; i++) {
      const nx = node.x + dirs[i].dx;
      const ny = node.y + dirs[i].dy;

      if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
      if (visited[ny][nx]) continue;

      const tile = zone.tiles[ny][nx];
      if (!tile) continue;

      // We only walk through:
      //  - non-blocked tiles
      //  - that are already explored OR currently have the player marker.
      if (tile.kind === "blocked") continue;
      if (!tile.explored && !tile.hasPlayer) continue;

      visited[ny][nx] = true;
      dist[ny][nx] = baseDist + 1;
      queue.push({ x: nx, y: ny });
    }
  }

  return { visited, dist };
}

// Compute (and cache) distance in steps from the zone.entrySpawn tile
// across walkable tiles. Used to prefer "inner" tiles before expanding outward.
function ensureEntryDistanceMap(zone) {
  if (!zone || !zone.tiles) return null;
  if (!zone.entrySpawn) return null;

  const width = zone.width;
  const height = zone.height;

  // Reuse cached map if size matches.
  if (
    zone._entryDistanceMap &&
    zone._entryDistanceMapWidth === width &&
    zone._entryDistanceMapHeight === height
  ) {
    return zone._entryDistanceMap;
  }

  const dist = [];
  for (let y = 0; y < height; y++) {
    dist[y] = [];
    for (let x = 0; x < width; x++) {
      dist[y][x] = Infinity;
    }
  }

  const startX = zone.entrySpawn.x;
  const startY = zone.entrySpawn.y;
  if (
    typeof startX !== "number" || typeof startY !== "number" ||
    startX < 0 || startX >= width ||
    startY < 0 || startY >= height
  ) {
    return null;
  }

  const startTile = zone.tiles[startY][startX];
  if (!startTile) return null;

  const queue = [];
  dist[startY][startX] = 0;
  queue.push({ x: startX, y: startY });

  const dirs = [
    { dx:  1, dy:  0 },
    { dx: -1, dy:  0 },
    { dx:  0, dy:  1 },
    { dx:  0, dy: -1 },
  ];

  while (queue.length > 0) {
    const node = queue.shift();
    const baseDist = dist[node.y][node.x];

    for (let i = 0; i < dirs.length; i++) {
      const nx = node.x + dirs[i].dx;
      const ny = node.y + dirs[i].dy;

      if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
      if (dist[ny][nx] !== Infinity) continue;

      const tile = zone.tiles[ny][nx];
      if (!tile) continue;

      // We only walk through tiles that are not BLOCKED and not LOCKED.
      if (tile.kind === ZONE_TILE_KIND.BLOCKED) continue;
      if (tile.kind === ZONE_TILE_KIND.LOCKED) continue;

      dist[ny][nx] = baseDist + 1;
      queue.push({ x: nx, y: ny });
    }
  }

  zone._entryDistanceMap = dist;
  zone._entryDistanceMapWidth = width;
  zone._entryDistanceMapHeight = height;
  return dist;
}

// Mark the next explorable tile as "pending exploration" (for blinking).
// Priority:
//   1) An unexplored neighbor directly next to the player (4-dir).
//   2) Otherwise, ANY "gap" tile (unexplored tile with 2+ explored neighbors),
//      chosen from the *innermost* ring first (smallest distance from entrySpawn).
//   3) Otherwise, a frontier tile chosen from the innermost ring, with a small
//      local bias around the player.
// Also records the chosen coordinates on the zone as preparedTargetX/Y.
// Returns true if a tile was marked, false if none were found.
function prepareNextExplorationTile(zone) {
  if (!zone || !zone.tiles) return false;

  // Only one tile should ever be considered "next".
  clearTileActiveExploreFlags(zone);

  // Clear any previous target metadata.
  zone.preparedTargetX = undefined;
  zone.preparedTargetY = undefined;

  const width = zone.width;
  const height = zone.height;

  // --- STEP 1: Try to pick a tile directly next to the player (1-tile move) ---
  const playerPos = findZonePlayerPosition(zone);
  if (playerPos) {
    const neighborCandidates = [];
    const dirs = [
      { dx:  1, dy:  0 },
      { dx: -1, dy:  0 },
      { dx:  0, dy:  1 },
      { dx:  0, dy: -1 },
    ];

    for (let i = 0; i < dirs.length; i++) {
      const nx = playerPos.x + dirs[i].dx;
      const ny = playerPos.y + dirs[i].dy;

      if (ny < 0 || ny >= height || nx < 0 || nx >= width) {
        continue;
      }

      const tile = zone.tiles[ny][nx];
      if (!tile) continue;

      if (isTileExplorable(tile) && !tile.explored) {
        neighborCandidates.push({ x: nx, y: ny });
      }
    }

    if (neighborCandidates.length > 0) {
      const choice =
        neighborCandidates[Math.floor(Math.random() * neighborCandidates.length)];
      zone.preparedTargetX = choice.x;
      zone.preparedTargetY = choice.y;
      return true;
    }
  }

  // --- STEP 2: Connectivity-aware frontier selection ---
  const reachable = computeReachableExploredFromPlayer(zone);
  if (!reachable || !reachable.visited) {
    return false;
  }

  const visited = reachable.visited;
  const distFromPlayer = reachable.dist;
  const distFromEntry = ensureEntryDistanceMap(zone); // can be null

  const frontier = [];
  const frontierBestDist = [];
  for (let y = 0; y < height; y++) {
    frontierBestDist[y] = [];
    for (let x = 0; x < width; x++) {
      frontierBestDist[y][x] = Infinity;
    }
  }

  const dirs4 = [
    { dx:  1, dy:  0 },
    { dx: -1, dy:  0 },
    { dx:  0, dy:  1 },
    { dx:  0, dy: -1 },
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited[y][x]) continue;

      const baseDist = distFromPlayer[y][x] || 0;

      for (let i = 0; i < dirs4.length; i++) {
        const nx = x + dirs4[i].dx;
        const ny = y + dirs4[i].dy;

        if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;

        const tile = zone.tiles[ny][nx];
        if (!tile) continue;
        if (!isTileExplorable(tile)) continue;
        if (tile.explored) continue;

        const candidateDist = baseDist + 1;

        if (candidateDist < frontierBestDist[ny][nx]) {
          frontierBestDist[ny][nx] = candidateDist;

          if (!frontier.some(p => p.x === nx && p.y === ny)) {
            frontier.push({ x: nx, y: ny });
          }
        }
      }
    }
  }

  if (frontier.length === 0) {
    // No reachable frontier tiles – likely fully explored.
    return false;
  }

  // --- STEP 3: Build info about each frontier tile ---
  const frontierInfo = [];
  for (let i = 0; i < frontier.length; i++) {
    const p = frontier[i];
    const dPlayer = frontierBestDist[p.y][p.x];

    let exploredNeighbors = 0;
    for (let j = 0; j < dirs4.length; j++) {
      const nx = p.x + dirs4[j].dx;
      const ny = p.y + dirs4[j].dy;
      if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
      const nTile = zone.tiles[ny][nx];
      if (!nTile) continue;
      if (nTile.explored || nTile.hasPlayer) {
        exploredNeighbors++;
      }
    }

    const entryDist =
      distFromEntry && distFromEntry[p.y] && distFromEntry[p.y][p.x] !== undefined
        ? distFromEntry[p.y][p.x]
        : Infinity;

    frontierInfo.push({
      x: p.x,
      y: p.y,
      distFromPlayer: dPlayer,
      distFromEntry: entryDist,
      exploredNeighbors,
    });
  }

  // --- STEP 4: HARD GAP-FILL PRIORITY (inner ring first) ---

  // Gap tiles: unexplored tiles with 2+ explored neighbors.
  const holeTiles = frontierInfo.filter(info => info.exploredNeighbors >= 2);

  if (holeTiles.length > 0) {
    // Among hole tiles, pick those with the smallest distance from entry spawn.
    let minEntry = Infinity;
    for (let i = 0; i < holeTiles.length; i++) {
      if (holeTiles[i].distFromEntry < minEntry) {
        minEntry = holeTiles[i].distFromEntry;
      }
    }

    let band = holeTiles.filter(h => h.distFromEntry <= minEntry + 1);

    // Within that ring, bias toward the ones closest to the player.
    let minPlayerDist = Infinity;
    for (let i = 0; i < band.length; i++) {
      if (band[i].distFromPlayer < minPlayerDist) {
        minPlayerDist = band[i].distFromPlayer;
      }
    }
    const band2 = band.filter(h => h.distFromPlayer <= minPlayerDist + 1);
    if (band2.length > 0) {
      band = band2;
    }

    const choice = band[Math.floor(Math.random() * band.length)];
    zone.preparedTargetX = choice.x;
    zone.preparedTargetY = choice.y;
    return true;
  }

  // --- STEP 5: Normal frontier expansion (inner rings first) ---

  // 1) Prefer frontier tiles that are closest to the entry spawn.
  let minEntry = Infinity;
  for (let i = 0; i < frontierInfo.length; i++) {
    if (frontierInfo[i].distFromEntry < minEntry) {
      minEntry = frontierInfo[i].distFromEntry;
    }
  }
  let candidates = frontierInfo.filter(info => info.distFromEntry <= minEntry + 1);
  if (candidates.length === 0) {
    candidates = frontierInfo;
  }

  // 2) Within that ring, prefer tiles closest to the player (keeps motion local).
  let minPlayerDist = Infinity;
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i].distFromPlayer < minPlayerDist) {
      minPlayerDist = candidates[i].distFromPlayer;
    }
  }
  candidates = candidates.filter(info => info.distFromPlayer <= minPlayerDist + 1);
  if (candidates.length === 0) {
    candidates = frontierInfo;
  }

  // 3) And finally, prefer smoother edges (more explored neighbors).
  let best = candidates.filter(info => info.exploredNeighbors >= 3);
  if (best.length === 0) {
    best = candidates.filter(info => info.exploredNeighbors >= 2);
  }
  if (best.length === 0) {
    best = candidates;
  }

  const choice = best[Math.floor(Math.random() * best.length)];
  if (!choice) {
    return false;
  }

  zone.preparedTargetX = choice.x;
  zone.preparedTargetY = choice.y;
  return true;
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




