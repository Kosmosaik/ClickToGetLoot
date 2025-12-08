// scripts/zones/zones.generator.js
// Zone generation helpers (0.0.70b).
// First pass: simple Cellular Automata generator for cave/patch-like shapes.

console.log("zones.generator.js loaded");

// 0.0.70c — Simple seeded PRNG (mulberry32-style) for deterministic layouts.
function createSeededRandom(seedValue) {
  // Convert a string seed into a 32-bit integer
  let seed = 0;
  const str = String(seedValue || "");
  for (let i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) | 0;
  }

  if (seed === 0) {
    seed = 1;
  }

  let t = seed >>> 0;

  return function random() {
    // mulberry32-ish
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Utility: random boolean with a given probability (0.0–1.0)
function randomChance(prob) {
  return Math.random() < prob;
}

// Generate a CA-based layout as an array of strings.
// '#' = wall/blocked, '.' = floor/walkable.
// Later we’ll integrate locked regions on top of this.
function generateLayoutCellularAutomata(config) {
  const width = config.width;
  const height = config.height;
  const fillChance = config.fillChance ?? 0.45;
  const smoothIterations = config.smoothIterations ?? 4;
  const borderIsWall = config.borderIsWall ?? true;

  // Step 1: Random initial map
  let map = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      if (borderIsWall &&
          (x === 0 || y === 0 || x === width - 1 || y === height - 1)) {
        row.push("#"); // solid border
      } else {
        row.push(randomChance(fillChance) ? "#" : ".");
      }
    }
    map.push(row);
  }

  // Step 2: Smoothing using a simple CA rule
  const countWallNeighbors = (arr, x, y) => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (ny < 0 || ny >= height || nx < 0 || nx >= width) {
          // Treat outside as wall to keep shapes more enclosed
          count++;
        } else if (arr[ny][nx] === "#") {
          count++;
        }
      }
    }
    return count;
  };

  for (let iter = 0; iter < smoothIterations; iter++) {
    const newMap = [];
    for (let y = 0; y < height; y++) {
      const newRow = [];
      for (let x = 0; x < width; x++) {
        if (borderIsWall &&
            (x === 0 || y === 0 || x === width - 1 || y === height - 1)) {
          newRow.push("#");
          continue;
        }

        const walls = countWallNeighbors(map, x, y);
        if (walls > 4) {
          newRow.push("#");
        } else if (walls < 4) {
          newRow.push(".");
        } else {
          newRow.push(map[y][x]);
        }
      }
      newMap.push(newRow);
    }
    map = newMap;
  }

  // Convert internal map (array of char arrays) to array of strings
  let layout = map.map((row) => row.join(""));

  // First, clean up islands and connect bigger side blobs.
  layout = postProcessCALayoutRegions(layout, config || {});

  // Then, always try to create a locked subregion between the
  // largest and second-largest walkable regions (if they exist).
  layout = injectLockedGateBetweenPrimaryAndSecondary(layout, config || {});

  return layout;
}


// ----- Region detection & post-processing helpers -----
//
// These helpers operate on the CA layout (array of strings, '#' or '.').
// They will:
//
// 1) Find all walkable regions (connected '.' areas).
// 2) Keep the largest region as "primary".
// 3) Reserve the second-largest region as a future "locked subregion" candidate.
// 4) For remaining regions:
//    - If tiny: remove them ('.' -> '#').
//    - If bigger: carve a simple corridor to the primary region.
//
// Later we can reuse the region info to create a locked subregion with an 'L' gate.

// Convert ["#####", "#...#"] -> [['#','#','#','#','#'], ['#','.','.','.','#']]
function layoutToCharGrid(layout) {
  return layout.map((row) => row.split(""));
}

// Convert [['#','#'],['.','.']] -> ["##", ".."]
function charGridToLayout(grid) {
  return grid.map((row) => row.join(""));
}

// Find all connected regions of walkable ('.') tiles.
function computeWalkableRegions(layout) {
  const height = layout.length;
  if (height === 0) return [];
  const width = layout[0].length;

  const visited = [];
  for (let y = 0; y < height; y++) {
    visited[y] = [];
    for (let x = 0; x < width; x++) {
      visited[y][x] = false;
    }
  }

  const regions = [];
  let nextRegionId = 0;

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  function isWalkableChar(ch) {
    return ch === ".";
  }

  for (let startY = 0; startY < height; startY++) {
    const row = layout[startY];
    for (let startX = 0; startX < width; startX++) {
      if (visited[startY][startX]) continue;
      const ch = row.charAt(startX);
      if (!isWalkableChar(ch)) continue;

      // BFS / flood-fill
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

          const nch = layout[ny].charAt(nx);
          if (!isWalkableChar(nch)) continue;

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

// Carve a simple "L-shaped" corridor between a cell in regionA and a cell in regionB.
// This is intentionally simple: it just draws a Manhattan path.
function carveCorridorBetweenRegions(grid, regionA, regionB) {
  if (!regionA || !regionB || regionA.cells.length === 0 || regionB.cells.length === 0) {
    return;
  }

  let bestPair = null;
  let bestDist = Infinity;

  // Find the closest pair of cells between the two regions (Manhattan distance).
  for (let i = 0; i < regionA.cells.length; i++) {
    const a = regionA.cells[i];
    for (let j = 0; j < regionB.cells.length; j++) {
      const b = regionB.cells[j];
      const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestPair = { a, b };
      }
    }
  }

  if (!bestPair) return;

  const { a, b } = bestPair;

  // Draw a simple L-shaped path from a -> b.
  let x = a.x;
  let y = a.y;

  // Step in x direction first
  const stepX = b.x > x ? 1 : -1;
  while (x !== b.x) {
    if (grid[y][x] === "#") {
      grid[y][x] = ".";
    }
    x += stepX;
  }

  // Then step in y direction
  const stepY = b.y > y ? 1 : -1;
  while (y !== b.y) {
    if (grid[y][x] === "#") {
      grid[y][x] = ".";
    }
    y += stepY;
  }

  // Make sure the end cell is also walkable
  if (grid[y][x] === "#") {
    grid[y][x] = ".";
  }
}

// Post-process CA layout to clean up islands and prepare for locked subregions.
//
// - Keeps the largest region as the main area.
// - Keeps the second-largest as candidate for a "locked subregion" (for future step).
// - For all other regions:
//   * If they are tiny -> remove (turn '.' into '#').
//   * Otherwise -> carve a corridor to the main region.
function postProcessCALayoutRegions(layout, config) {
  if (!layout || layout.length === 0) return layout;

  const regions = computeWalkableRegions(layout);
  if (regions.length <= 1) {
    return layout; // nothing to do
  }

  // Sort regions by size (descending)
  regions.sort((a, b) => b.cells.length - a.cells.length);

  const primaryRegion = regions[0];
  const secondaryCandidate = regions.length > 1 ? regions[1] : null;

  // Minimum size for a region to be worth connecting instead of just deleting.
  const minRegionSizeToKeep = typeof config.minRegionSizeToKeep === "number"
    ? config.minRegionSizeToKeep
    : 12;

  // Work on a mutable char grid
  const grid = layoutToCharGrid(layout);

  // Reserve primary + secondaryCandidate for now.
  // We will only process regions from index 2 onward.
  for (let i = 2; i < regions.length; i++) {
    const region = regions[i];
    const size = region.cells.length;

    if (size < minRegionSizeToKeep) {
      // Tiny island: just remove it by turning '.' into '#'
      for (const cell of region.cells) {
        grid[cell.y][cell.x] = "#";
      }
    } else {
      // Larger side-blob: carve a corridor to the primary region
      carveCorridorBetweenRegions(grid, primaryRegion, region);
    }
  }

  return charGridToLayout(grid);
}

// ----- Locked subregion helpers -----
//
// After we've cleaned up islands, we try to:
// - Find the largest (primary) and second-largest (secondary) walkable regions.
// - Place a single 'L' tile between them.
// - If they are not adjacent by a single wall, carve a simple L-shaped corridor
//   through walls, marking one of those corridor cells as 'L'.

// Build boolean masks for quick "is this tile in region X?" checks.
function buildRegionMask(width, height, region) {
  const mask = [];
  for (let y = 0; y < height; y++) {
    mask[y] = [];
    for (let x = 0; x < width; x++) {
      mask[y][x] = false;
    }
  }
  if (!region || !region.cells) return mask;
  for (const cell of region.cells) {
    if (cell.y >= 0 && cell.y < height && cell.x >= 0 && cell.x < width) {
      mask[cell.y][cell.x] = true;
    }
  }
  return mask;
}

// Try to find a single wall tile that touches both primary and secondary regions.
function findSingleWallGateCandidate(grid, primaryRegion, secondaryRegion) {
  const height = grid.length;
  if (height === 0) return null;
  const width = grid[0].length;

  const primaryMask = buildRegionMask(width, height, primaryRegion);
  const secondaryMask = buildRegionMask(width, height, secondaryRegion);

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] !== "#") continue;

      let touchesPrimary = false;
      let touchesSecondary = false;

      for (const dir of dirs) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (primaryMask[ny][nx]) touchesPrimary = true;
        if (secondaryMask[ny][nx]) touchesSecondary = true;
      }

      if (touchesPrimary && touchesSecondary) {
        return { x, y };
      }
    }
  }

  return null;
}

// Carve a corridor between primary and secondary, and mark ONE of the carved
// wall cells as 'L'. We only carve through cells that are currently walls ('#').
function carveLockedCorridorBetweenRegions(grid, primaryRegion, secondaryRegion) {
  if (!primaryRegion || !secondaryRegion ||
      !primaryRegion.cells || !secondaryRegion.cells ||
      primaryRegion.cells.length === 0 || secondaryRegion.cells.length === 0) {
    return;
  }

  let bestPair = null;
  let bestDist = Infinity;

  // Find the closest pair of cells between the two regions (Manhattan distance).
  for (let i = 0; i < primaryRegion.cells.length; i++) {
    const a = primaryRegion.cells[i];
    for (let j = 0; j < secondaryRegion.cells.length; j++) {
      const b = secondaryRegion.cells[j];
      const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestPair = { a, b };
      }
    }
  }

  if (!bestPair) return;

  const { a, b } = bestPair;

  let x = a.x;
  let y = a.y;
  const pathCells = [];

  // Step in x direction first
  const stepX = b.x > x ? 1 : -1;
  while (x !== b.x) {
    x += stepX;
    if (grid[y][x] === "#") {
      pathCells.push({ x, y });
    }
  }

  // Then step in y direction
  const stepY = b.y > y ? 1 : -1;
  while (y !== b.y) {
    y += stepY;
    if (grid[y][x] === "#") {
      pathCells.push({ x, y });
    }
  }

  if (pathCells.length === 0) {
    // No walls along the simple L-shaped route. In practice this should be rare,
    // but if it happens, we bail and do nothing.
    return;
  }

  // Choose one of the carved cells to be the locked gate.
  const gateIndex = Math.floor(pathCells.length / 2);

  for (let i = 0; i < pathCells.length; i++) {
    const cell = pathCells[i];
    const cx = cell.x;
    const cy = cell.y;
    if (i === gateIndex) {
      grid[cy][cx] = "L"; // locked gate
    } else {
      grid[cy][cx] = "."; // corridor floor
    }
  }
}

// Inject a single 'L' gate between the primary and secondary largest regions.
// If they touch by one wall -> turn that wall into 'L'.
// Otherwise -> carve a simple corridor through walls and put 'L' in the corridor.
function injectLockedGateBetweenPrimaryAndSecondary(layout, config) {
  if (!layout || layout.length === 0) return layout;

  const regions = computeWalkableRegions(layout);
  if (regions.length < 2) {
    // Not enough regions to justify a locked subregion.
    return layout;
  }

  // Sort by size (descending)
  regions.sort((a, b) => b.cells.length - a.cells.length);

  const primaryRegion = regions[0];
  const secondaryRegion = regions[1];

  const grid = layoutToCharGrid(layout);

  // 1) Try the "nice" case: a single wall tile touches both regions.
  const gateCandidate = findSingleWallGateCandidate(grid, primaryRegion, secondaryRegion);
  if (gateCandidate) {
    grid[gateCandidate.y][gateCandidate.x] = "L";
    return charGridToLayout(grid);
  }

  // 2) Fallback: carve a corridor through walls and choose one cell as 'L'.
  carveLockedCorridorBetweenRegions(grid, primaryRegion, secondaryRegion);

  return charGridToLayout(grid);
}

// Main entry: create a layout string array from a zone definition.
function generateLayoutFromDefinition(def) {
  if (!def || def.type !== "generated") {
    console.error("generateLayoutFromDefinition: invalid or non-generated definition", def);
    return null;
  }

  if (def.generator === "cellular_automata") {
    return generateLayoutCellularAutomata(def.generatorConfig || {});
  }

  console.error(`generateLayoutFromDefinition: unsupported generator "${def.generator}"`);
  return null;
}

// Expose for debugging if needed
window.ZoneGeneratorDebug = {
  generateLayoutCellularAutomata,
  generateLayoutFromDefinition,
};
