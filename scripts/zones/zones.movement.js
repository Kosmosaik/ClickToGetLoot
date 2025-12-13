// scripts/zones/zones.movement.js
(function () {
  // Movement speed: tiles per second. Override in GAME_CONFIG.zone.movementTilesPerSecond
  const ZONE_MOVEMENT_TILES_PER_SECOND =
    (window.GAME_CONFIG && GAME_CONFIG.zone && GAME_CONFIG.zone.movementTilesPerSecond) || 4;

  function setZonePlayerPosition(zone, x, y) {
    if (!zone || !zone.tiles) return;

    for (let yy = 0; yy < zone.height; yy++) {
      for (let xx = 0; xx < zone.width; xx++) {
        const t = zone.tiles[yy][xx];
        if (!t) continue;
        t.hasPlayer = (xx === x && yy === y);
      }
    }
  }

  function findPlayerPositionInZone(zone) {
    if (!zone || !zone.tiles) return null;

    for (let y = 0; y < zone.height; y++) {
      for (let x = 0; x < zone.width; x++) {
        const t = zone.tiles[y][x];
        if (t && t.hasPlayer) return { x, y };
      }
    }
    return null;
  }

  function findPathToPreparedTile(zone) {
    if (!zone || !zone.tiles) return null;

    const tx = zone.preparedTargetX;
    const ty = zone.preparedTargetY;
    if (typeof tx !== "number" || typeof ty !== "number") return null;

    const start = findPlayerPositionInZone(zone);
    if (!start) return null;

    const width = zone.width;
    const height = zone.height;

    const stanceTargets = [];
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (let i = 0; i < dirs.length; i++) {
      const sx = tx + dirs[i].dx;
      const sy = ty + dirs[i].dy;
      if (sy < 0 || sy >= height || sx < 0 || sx >= width) continue;

      const t = zone.tiles[sy][sx];
      if (!t) continue;
      if (t.kind === "blocked") continue;
      if (!t.explored && !t.hasPlayer) continue;

      stanceTargets.push({ x: sx, y: sy });
    }

    if (stanceTargets.length === 0) return null;

    const targetSet = new Set(stanceTargets.map(p => `${p.x},${p.y}`));

    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const queue = [{ x: start.x, y: start.y, prev: null }];
    visited[start.y][start.x] = true;

    let endNode = null;

    while (queue.length > 0) {
      const node = queue.shift();
      const key = `${node.x},${node.y}`;
      if (targetSet.has(key)) {
        endNode = node;
        break;
      }

      for (let i = 0; i < dirs.length; i++) {
        const nx = node.x + dirs[i].dx;
        const ny = node.y + dirs[i].dy;
        if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
        if (visited[ny][nx]) continue;

        const tile = zone.tiles[ny][nx];
        if (!tile) continue;
        if (tile.kind === "blocked") continue;
        if (!tile.explored && !tile.hasPlayer) continue;

        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny, prev: node });
      }
    }

    if (!endNode) return null;

    const revPath = [];
    let cur = endNode;
    while (cur) {
      revPath.push({ x: cur.x, y: cur.y });
      cur = cur.prev;
    }
    revPath.reverse();

    if (revPath.length > 0 && revPath[0].x === start.x && revPath[0].y === start.y) {
      revPath.shift();
    }

    return revPath;
  }

  function startZoneMovement(path, onArrival) {
    const zone = (typeof getCurrentZone === "function") ? getCurrentZone() : null;
    const inZone = (typeof getIsInZone === "function") ? getIsInZone() : false;
    if (!zone || !inZone) {
      if (typeof onArrival === "function") onArrival();
      return;
    }
    if (!path || path.length === 0) {
      if (typeof onArrival === "function") onArrival();
      return;
    }

    PC.api.mov().zoneMovementActive = true;
    PC.api.mov().zoneMovementPath = path.slice();
    PC.api.mov().zoneMovementOnArrival = (typeof onArrival === "function") ? onArrival : null;

    const stepDelayMs = Math.max(50, 1000 / ZONE_MOVEMENT_TILES_PER_SECOND);

    function step() {
      const z = (typeof getCurrentZone === "function") ? getCurrentZone() : null;
      const inZ = (typeof getIsInZone === "function") ? getIsInZone() : false;

      if (!PC.api.mov().zoneMovementActive || !z || !inZ) {
        PC.api.mov().zoneMovementTimerId = null;
        return;
      }

      if (!PC.api.mov().zoneMovementPath || PC.api.mov().zoneMovementPath.length === 0) {
        PC.api.mov().zoneMovementActive = false;
        PC.api.mov().zoneMovementTimerId = null;
        const cb = PC.api.mov().zoneMovementOnArrival;
        PC.api.mov().zoneMovementOnArrival = null;
        if (typeof cb === "function") cb();
        return;
      }

      const next = PC.api.mov().zoneMovementPath.shift();
      setZonePlayerPosition(z, next.x, next.y);

      if (typeof renderZoneUI === "function") renderZoneUI();

      PC.api.mov().zoneMovementTimerId = setTimeout(step, stepDelayMs);
    }

    step();
  }

  function stopZoneMovement() {
    if (PC.api.mov().zoneMovementTimerId) {
      clearTimeout(PC.api.mov().zoneMovementTimerId);
      PC.api.mov().zoneMovementTimerId = null;
    }
    PC.api.mov().zoneMovementActive = false;
    PC.api.mov().zoneMovementPath = null;
    PC.api.mov().zoneMovementOnArrival = null;
  }

  // Preserve existing global names (so we don’t have to update every file right now)
  window.setZonePlayerPosition = setZonePlayerPosition;
  window.findPlayerPositionInZone = findPlayerPositionInZone;
  window.findPathToPreparedTile = findPathToPreparedTile;
  window.startZoneMovement = startZoneMovement;
  window.stopZoneMovement = stopZoneMovement;
})();
