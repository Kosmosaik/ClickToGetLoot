// scripts/content/content.deltas.js
// 0.0.70e — Deterministic content persistence via per-zone deltas (Option A).
//
// A delta is a tiny object keyed by zoneId that stores instance-level state changes
// (harvested/opened/defeated/discovered) without storing the full zone snapshot.
//
// Format (per zoneId):
// {
//   harvested: { [instanceId]: true },
//   defeated: { [instanceId]: true },
//   opened: { [instanceId]: true },
//   inspected: { [instanceId]: true },
//   discoveredLocations: { [instanceId]: true }
// }

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // Delta schema version. Bump if we change on-disk shape.
  PC.content.DELTAS_VERSION = PC.content.DELTAS_VERSION || 1;

  function ensureDeltaStore() {
    if (typeof STATE !== 'function') return null;
    const st = STATE();
    st.zoneDeltas = st.zoneDeltas || {};
    return st.zoneDeltas;
  }

  function ensureZoneDelta(zoneId) {
    const store = ensureDeltaStore();
    if (!store || !zoneId) return null;
    const id = String(zoneId);
    store[id] = store[id] || {
      _v: PC.content.DELTAS_VERSION,
      harvested: {},
      defeated: {},
      opened: {},
      inspected: {},
      discoveredLocations: {},
      exploredTiles: {},
    };
    // Back-compat: ensure keys exist
    store[id]._v = store[id]._v || PC.content.DELTAS_VERSION;
    store[id].harvested = store[id].harvested || {};
    store[id].defeated = store[id].defeated || {};
    store[id].opened = store[id].opened || {};
    store[id].inspected = store[id].inspected || {};
    store[id].discoveredLocations = store[id].discoveredLocations || {};
    store[id].exploredTiles = store[id].exploredTiles || {};
    return store[id];
  }

  function applyMapToInstances(instances, map, stateKey) {
    if (!Array.isArray(instances) || !map) return;
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      if (!inst || !inst.id) continue;
      if (map[inst.id]) {
        inst.state = inst.state || {};
        inst.state[stateKey] = true;
      }
    }
  }

  // Public: get (and create) the delta object for a zone.
  PC.content.getZoneDelta = PC.content.getZoneDelta || function getZoneDelta(zoneId) {
    return ensureZoneDelta(zoneId);
  };

  // Public: apply saved deltas to a freshly generated zone.
  PC.content.applyZoneDeltas = PC.content.applyZoneDeltas || function applyZoneDeltas(zone) {
    if (!zone || !zone.id) return;
    const delta = ensureZoneDelta(zone.id);
    if (!delta || !zone.content) return;

    applyMapToInstances(zone.content.resourceNodes, delta.harvested, 'harvested');
    applyMapToInstances(zone.content.entities, delta.defeated, 'defeated');
    applyMapToInstances(zone.content.pois, delta.opened, 'opened');
    applyMapToInstances(zone.content.pois, delta.inspected, 'inspected');
    applyMapToInstances(zone.content.locations, delta.discoveredLocations, 'discovered');

    // Restore explored tiles.
    // NOTE: we only set explored=true for tiles that exist.
    if (zone.tiles && delta.exploredTiles) {
      for (const key in delta.exploredTiles) {
        if (!delta.exploredTiles[key]) continue;
        const parts = String(key).split(',');
        if (parts.length !== 2) continue;
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (y < 0 || y >= zone.height || x < 0 || x >= zone.width) continue;
        const tile = zone.tiles?.[y]?.[x];
        if (!tile) continue;
        // Keep blocked tiles blocked; but allow explored on locked gates too.
        tile.explored = true;
      }
    }
  };

  // Convenience mutators (Phase 7): write deltas on interaction.
  PC.content.markHarvested = PC.content.markHarvested || function markHarvested(zoneId, instId) {
    const d = ensureZoneDelta(zoneId);
    if (!d || !instId) return;
    d.harvested[String(instId)] = true;
  };

  PC.content.markDefeated = PC.content.markDefeated || function markDefeated(zoneId, instId) {
    const d = ensureZoneDelta(zoneId);
    if (!d || !instId) return;
    d.defeated[String(instId)] = true;
  };

  PC.content.markOpened = PC.content.markOpened || function markOpened(zoneId, instId) {
    const d = ensureZoneDelta(zoneId);
    if (!d || !instId) return;
    d.opened[String(instId)] = true;
  };

  PC.content.markInspected = PC.content.markInspected || function markInspected(zoneId, instId) {
    const d = ensureZoneDelta(zoneId);
    if (!d || !instId) return;
    d.inspected[String(instId)] = true;
  };

  PC.content.markLocationDiscovered = PC.content.markLocationDiscovered || function markLocationDiscovered(zoneId, instId) {
    const d = ensureZoneDelta(zoneId);
    if (!d || !instId) return;
    d.discoveredLocations[String(instId)] = true;
  };

  // Exploration persistence ("?" tiles): store explored coordinates.
  PC.content.markTileExplored = PC.content.markTileExplored || function markTileExplored(zoneId, x, y) {
    const d = ensureZoneDelta(zoneId);
    if (!d) return;
    const xi = Number(x);
    const yi = Number(y);
    if (!Number.isFinite(xi) || !Number.isFinite(yi)) return;
    const key = `${xi},${yi}`;
    d.exploredTiles[key] = true;
  };

  // Phase 8: validate + normalize delta store (for backward compat / corrupted saves).
  PC.content.normalizeAllZoneDeltas = PC.content.normalizeAllZoneDeltas || function normalizeAllZoneDeltas(store) {
    const st = store || (typeof STATE === 'function' ? (STATE().zoneDeltas || {}) : null);
    if (!st || typeof st !== 'object') return {};

    for (const zid in st) {
      const d = st[zid];
      if (!d || typeof d !== 'object') {
        st[zid] = ensureZoneDelta(zid);
        continue;
      }

      // Ensure schema keys.
      d._v = d._v || PC.content.DELTAS_VERSION;
      d.harvested = d.harvested && typeof d.harvested === 'object' ? d.harvested : {};
      d.defeated = d.defeated && typeof d.defeated === 'object' ? d.defeated : {};
      d.opened = d.opened && typeof d.opened === 'object' ? d.opened : {};
      d.inspected = d.inspected && typeof d.inspected === 'object' ? d.inspected : {};
      d.discoveredLocations = d.discoveredLocations && typeof d.discoveredLocations === 'object' ? d.discoveredLocations : {};
      d.exploredTiles = d.exploredTiles && typeof d.exploredTiles === 'object' ? d.exploredTiles : {};
    }

    return st;
  };
})();
