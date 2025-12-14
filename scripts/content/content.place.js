// scripts/content/content.place.js
// 0.0.70e — Placement utilities.
//
// Phase 4.1 — Tile query utilities.
// This module is intentionally small and “pure utility”.
// - It does NOT place content by itself.
// - It provides deterministic candidate lists + small geometry helpers.

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // ---------------------------------------------------------------------------
  // Basic tile predicates
  // ---------------------------------------------------------------------------

  // Return true if a tile is walkable in this zone.
  // We rely on existing tile kinds/constants that zones.core.js defines.
  PC.content.isWalkableTile = PC.content.isWalkableTile || function isWalkableTile(zone, x, y) {
    if (!zone || !zone.tiles || !zone.tiles[y] || !zone.tiles[y][x]) return false;
    const t = zone.tiles[y][x];
    // Most of the code uses ZONE_TILE_KIND.WALKABLE for '.'
    // Fallback: treat '.' as walkable if kind isn't present.
    if (typeof ZONE_TILE_KIND !== "undefined" && ZONE_TILE_KIND?.WALKABLE) {
      return t.kind === ZONE_TILE_KIND.WALKABLE;
    }
    return t.kind === "." || t.char === ".";
  };

  // Return true if a tile exists and is a wall.
  PC.content.isWallTile = PC.content.isWallTile || function isWallTile(zone, x, y) {
    if (!zone || !zone.tiles || !zone.tiles[y] || !zone.tiles[y][x]) return false;
    const t = zone.tiles[y][x];
    if (typeof ZONE_TILE_KIND !== "undefined" && ZONE_TILE_KIND?.WALL) {
      return t.kind === ZONE_TILE_KIND.WALL;
    }
    // Fallback: treat '#'/"#" kind/char as wall.
    return t.kind === "#" || t.char === "#";
  };

  // Optional per-tile content pointers.
  // If a zone uses tile.content, we can set references here.
  PC.content.ensureTileContent = PC.content.ensureTileContent || function ensureTileContent(zone, x, y) {
    if (!zone || !zone.tiles || !zone.tiles[y] || !zone.tiles[y][x]) return null;
    const t = zone.tiles[y][x];
    if (!t.content) t.content = { resourceNodeId: null, entityId: null, poiId: null, locationId: null };
    return t.content;
  };

  // ---------------------------------------------------------------------------
  // Geometry helpers
  // ---------------------------------------------------------------------------

  PC.content.distManhattan = PC.content.distManhattan || function distManhattan(a, b) {
    if (!a || !b) return 999999;
    return Math.abs((a.x || 0) - (b.x || 0)) + Math.abs((a.y || 0) - (b.y || 0));
  };

  PC.content.distSq = PC.content.distSq || function distSq(a, b) {
    if (!a || !b) return 999999999;
    const dx = (a.x || 0) - (b.x || 0);
    const dy = (a.y || 0) - (b.y || 0);
    return dx * dx + dy * dy;
  };

  // Count orthogonal adjacent walls around a tile.
  PC.content.countAdjacentWalls = PC.content.countAdjacentWalls || function countAdjacentWalls(zone, x, y) {
    let c = 0;
    if (PC.content.isWallTile(zone, x + 1, y)) c++;
    if (PC.content.isWallTile(zone, x - 1, y)) c++;
    if (PC.content.isWallTile(zone, x, y + 1)) c++;
    if (PC.content.isWallTile(zone, x, y - 1)) c++;
    return c;
  };

  // ---------------------------------------------------------------------------
  // Candidate tile queries (Phase 4.1)
  // ---------------------------------------------------------------------------

  // Collect all walkable positions in a zone.
  PC.content.getAllWalkablePositions = PC.content.getAllWalkablePositions || function getAllWalkablePositions(zone) {
    const out = [];
    if (!zone || !zone.tiles) return out;
    for (let y = 0; y < zone.height; y++) {
      for (let x = 0; x < zone.width; x++) {
        if (PC.content.isWalkableTile(zone, x, y)) out.push({ x, y });
      }
    }
    return out;
  };

  // Build a filtered candidate list.
  // options:
  // - used: Set of "x,y" that are already occupied
  // - minDistFromEntry: number (Manhattan distance)
  // - preferNearWalls: { minAdjWalls, maxAdjWalls } (optional)
  // - preferOpen: { maxAdjWalls } (optional)
  PC.content.getCandidatePositions = PC.content.getCandidatePositions || function getCandidatePositions(zone, options) {
    const opts = options || {};
    const used = opts.used instanceof Set ? opts.used : null;
    const minDistFromEntry = Number.isFinite(opts.minDistFromEntry) ? Math.max(0, Math.floor(opts.minDistFromEntry)) : 0;
    const entry = zone && zone.entrySpawn ? zone.entrySpawn : null;

    const out = [];
    const walkable = PC.content.getAllWalkablePositions(zone);
    for (let i = 0; i < walkable.length; i++) {
      const p = walkable[i];
      const key = `${p.x},${p.y}`;
      if (used && used.has(key)) continue;
      if (entry && minDistFromEntry > 0) {
        if (PC.content.distManhattan(p, entry) < minDistFromEntry) continue;
      }

      // Optional wall/open preferences.
      if (opts.preferNearWalls) {
        const aw = PC.content.countAdjacentWalls(zone, p.x, p.y);
        const minA = Number.isFinite(opts.preferNearWalls.minAdjWalls) ? opts.preferNearWalls.minAdjWalls : 1;
        const maxA = Number.isFinite(opts.preferNearWalls.maxAdjWalls) ? opts.preferNearWalls.maxAdjWalls : 4;
        if (aw < minA || aw > maxA) continue;
      }
      if (opts.preferOpen) {
        const aw = PC.content.countAdjacentWalls(zone, p.x, p.y);
        const maxA = Number.isFinite(opts.preferOpen.maxAdjWalls) ? opts.preferOpen.maxAdjWalls : 0;
        if (aw > maxA) continue;
      }

      out.push(p);
    }
    return out;
  };
})();
