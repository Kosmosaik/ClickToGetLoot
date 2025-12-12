// scripts/zones/zones.exploration.js
(function () {
  // ---- Exploration-only helpers ----

  // Shared generic messages for exploration
  const ZONE_GENERIC_MESSAGES = [
    "You uncover a patch of ground.",
    "You scout a quiet stretch of the zone.",
    "You reveal more of the surrounding area.",
    "You push the boundary of the unknown.",
    "You chart another small piece of this zone.",
    "You smell fart in the air, but decide to continue anyway.",
    "You slipped on a piece of shit."
  ];

  function addRandomZoneMessage() {
    if (typeof addZoneMessage !== "function") return;
    const msg =
      ZONE_GENERIC_MESSAGES[Math.floor(Math.random() * ZONE_GENERIC_MESSAGES.length)];
    addZoneMessage(msg);
  }

  // --- Zone exploration tick system ---

  function scheduleNextZoneExplorationTick() {
    if (!EXP().zoneExplorationActive || !getIsInZone() || !getCurrentZone()) return;

    const idleDelay = 200;

    EXP().zoneExplorationTimerId = setTimeout(() => {
      EXP().zoneExplorationTimerId = null;
      beginZoneExplorationCycle();
    }, idleDelay);
  }

  // Reveal the next explorable tile, add a random message, update UI.
  function revealNextTileWithMessageAndUI() {
    if (
      !window.ZoneDebug ||
      (typeof ZoneDebug.revealPreparedExplorationTile !== "function" &&
        typeof ZoneDebug.revealNextExplorableTileSequential !== "function")
    ) {
      return false;
    }

    const zone = getCurrentZone();
    if (!zone) return false;

    // Prefer prepared tile reveal, fall back to sequential.
    let changed = false;
    if (typeof ZoneDebug.revealPreparedExplorationTile === "function") {
      changed = ZoneDebug.revealPreparedExplorationTile(zone);
    } else {
      changed = ZoneDebug.revealNextExplorableTileSequential(zone);
    }

    if (changed) {
      addRandomZoneMessage();
    } else {
      if (typeof addZoneMessage === "function") {
        addZoneMessage("There is nothing left to explore here.");
      }
    }

    if (typeof renderZoneUI === "function") renderZoneUI();

    // After revealing a tile, check completion.
    if (typeof ZoneDebug.getZoneExplorationStats === "function") {
      const stats = ZoneDebug.getZoneExplorationStats(zone);
      if (stats && stats.isComplete && typeof onZoneFullyExplored === "function") {
        onZoneFullyExplored();
      }
    }

    return changed;
  }

  function beginZoneExplorationCycle() {
    if (!EXP().zoneExplorationActive || !getIsInZone() || !getCurrentZone()) return;
    if (!window.ZoneDebug || typeof ZoneDebug.getZoneExplorationStats !== "function") return;

    const zone = getCurrentZone();
    const stats = ZoneDebug.getZoneExplorationStats(zone);

    if (stats.isComplete || stats.exploredTiles >= stats.totalExplorableTiles) {
      stopZoneExplorationTicks();
      if (typeof onZoneFullyExplored === "function") onZoneFullyExplored();
      if (typeof renderZoneUI === "function") renderZoneUI();
      return;
    }

    if (typeof ZoneDebug.prepareNextExplorationTile !== "function") return;

    const prepared = ZoneDebug.prepareNextExplorationTile(zone);
    if (!prepared) {
      stopZoneExplorationTicks();
      if (typeof renderZoneUI === "function") renderZoneUI();
      return;
    }

    if (typeof renderZoneUI === "function") renderZoneUI();

    const path = findPathToPreparedTile(zone);
    if (!path) {
      stopZoneExplorationTicks();
      if (typeof addZoneMessage === "function") addZoneMessage("You can't reach that area yet.");
      if (typeof renderZoneUI === "function") renderZoneUI();
      return;
    }

    if (path.length === 0) {
      startZoneExploreDelay(() => runZoneExplorationTick());
      return;
    }

    startZoneMovement(path, () => {
      startZoneExploreDelay(() => runZoneExplorationTick());
    });
  }

  function runZoneExplorationTick() {
    if (!EXP().zoneExplorationActive || !getIsInZone() || !getCurrentZone()) return;
    if (!window.ZoneDebug || typeof ZoneDebug.getZoneExplorationStats !== "function") return;

    const zone = getCurrentZone();
    const stats = ZoneDebug.getZoneExplorationStats(zone);

    if (stats.isComplete || stats.exploredTiles >= stats.totalExplorableTiles) {
      stopZoneExplorationTicks();
      if (typeof onZoneFullyExplored === "function") onZoneFullyExplored();
      if (typeof renderZoneUI === "function") renderZoneUI();
      return;
    }

    revealNextTileWithMessageAndUI();
    scheduleNextZoneExplorationTick();
  }

  function startZoneExplorationTicks() {
    if (EXP().zoneExplorationActive) return;
    if (!getIsInZone() || !getCurrentZone()) return;
    if (MOV().zoneMovementActive) return;

    EXP().zoneExplorationActive = true;
    scheduleNextZoneExplorationTick();
  }

  // Clear the blinking “next explore” marker.
  function clearZoneActiveExploreFlags() {
    const zone = getCurrentZone();
    if (!zone || !zone.tiles) return;

    for (let y = 0; y < zone.height; y++) {
      for (let x = 0; x < zone.width; x++) {
        const t = zone.tiles[y][x];
        if (t && t.isActiveExplore) t.isActiveExplore = false;
      }
    }
  }

  function startZoneExploreDelay(onReveal) {
    const zone = getCurrentZone();
    if (!zone || !zone.tiles) {
      if (typeof onReveal === "function") onReveal();
      return;
    }

    const tx = zone.preparedTargetX;
    const ty = zone.preparedTargetY;
    if (typeof tx !== "number" || typeof ty !== "number") {
      if (typeof onReveal === "function") onReveal();
      return;
    }

    clearZoneActiveExploreFlags();

    const tile = zone.tiles[ty][tx];
    if (tile) tile.isActiveExplore = true;

    if (typeof renderZoneUI === "function") renderZoneUI();

    const delay = 200 + Math.random() * 200;

    EXP().zoneExploreDelayTimerId = setTimeout(() => {
      EXP().zoneExploreDelayTimerId = null;
      if (typeof onReveal === "function") onReveal();
    }, delay);
  }

  function cancelZoneExploreDelay() {
    if (EXP().zoneExploreDelayTimerId) {
      clearTimeout(EXP().zoneExploreDelayTimerId);
      EXP().zoneExploreDelayTimerId = null;
    }
  }

  function stopZoneExplorationTicks() {
    if (!EXP().zoneExplorationActive) return;

    EXP().zoneExplorationActive = false;

    if (EXP().zoneExplorationTimerId) {
      clearTimeout(EXP().zoneExplorationTimerId);
      EXP().zoneExplorationTimerId = null;
    }

    // Also stop any movement in progress
    stopZoneMovement();

    cancelZoneExploreDelay();
    clearZoneActiveExploreFlags();

    if (typeof renderZoneUI === "function") renderZoneUI();
  }

  function onZoneFullyExplored() {
    // Need a world map + helper to do anything.
    const wm = getWorldMap();
    if (!wm) return;
    if (typeof unlockAdjacentWorldTiles !== "function") return;

    const x = wm.currentX;
    const y = wm.currentY;
    if (typeof x !== "number" || typeof y !== "number") return;

    unlockAdjacentWorldTiles(wm, x, y);

    if (typeof addZoneMessage === "function") {
      addZoneMessage("You feel the world open up. New areas are now visible on the world map.");
    }

    if (typeof saveCurrentGame === "function") {
      saveCurrentGame();
    }
  }

  function startZoneManualExploreOnce() {
    if (EXP().zoneManualExplorationActive) return;
    if (EXP().zoneExplorationActive) return;
    if (MOV().zoneMovementActive) return;
    if (!getIsInZone() || !getCurrentZone()) return;
    if (!window.ZoneDebug || typeof ZoneDebug.getZoneExplorationStats !== "function") return;

    const zone = getCurrentZone();
    const stats = ZoneDebug.getZoneExplorationStats(zone);

    if (stats.isComplete || stats.exploredTiles >= stats.totalExplorableTiles) {
      onZoneFullyExplored();
      if (typeof addZoneMessage === "function") addZoneMessage("There is nothing left to explore here.");
      if (typeof renderZoneUI === "function") renderZoneUI();
      return;
    }

    if (typeof ZoneDebug.prepareNextExplorationTile !== "function") return;

    const prepared = ZoneDebug.prepareNextExplorationTile(zone);
    if (!prepared) {
      if (typeof addZoneMessage === "function") addZoneMessage("There is nothing left to explore here.");
      if (typeof renderZoneUI === "function") renderZoneUI();
      return;
    }

    if (typeof renderZoneUI === "function") renderZoneUI();

    const path = findPathToPreparedTile(zone);
    if (!path) {
      if (typeof addZoneMessage === "function") addZoneMessage("You can't reach that area yet.");
      if (typeof renderZoneUI === "function") renderZoneUI();
      return;
    }

    EXP().zoneManualExplorationActive = true;

    const finishManualExplore = () => {
      EXP().zoneManualExplorationActive = false;
      revealNextTileWithMessageAndUI();
      if (typeof renderZoneUI === "function") renderZoneUI();
    };

    if (path.length === 0) {
      startZoneExploreDelay(finishManualExplore);
      return;
    }

    startZoneMovement(path, () => {
      startZoneExploreDelay(finishManualExplore);
    });
  }

  // Preserve existing global hooks used by UI
  window.startZoneExplorationTicks = startZoneExplorationTicks;
  window.stopZoneExplorationTicks = stopZoneExplorationTicks;
  window.startZoneManualExploreOnce = startZoneManualExploreOnce;

  // If anything else wants these
  window.onZoneFullyExplored = onZoneFullyExplored;
})();

