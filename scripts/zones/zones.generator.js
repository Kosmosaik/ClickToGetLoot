// scripts/zones/zones.generator.js
// Zone generation helpers (0.0.70b).
// First pass: simple Cellular Automata generator for cave/patch-like shapes.

console.log("zones.generator.js loaded");

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

  // TODO (later in 0.0.70b): post-process to add locked regions, etc.

  // Convert to array of strings
  return map.map((row) => row.join(""));
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
