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
      harvested: {},
      defeated: {},
      opened: {},
      inspected: {},
      discoveredLocations: {},
    };
    // Back-compat: ensure keys exist
    store[id].harvested = store[id].harvested || {};
    store[id].defeated = store[id].defeated || {};
    store[id].opened = store[id].opened || {};
    store[id].inspected = store[id].inspected || {};
    store[id].discoveredLocations = store[id].discoveredLocations || {};
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
})();
