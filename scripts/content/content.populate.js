// scripts/content/content.populate.js
// 0.0.70e — Deterministic zone content population (first pass).
//
// Turns content definitions + spawn tables into concrete per-zone instances
// stored in zone.content.
//
// Notes:
// - Placement only (no UI, no harvesting/combat logic yet)
// - Deterministic based on (world slot seed + zoneId)
// - Instances are minimal:
//     { id, defId, x, y, kind, state }

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // ---------------------------------------------------------------------------
  // Step 1.3 — Seed layering contract
  // ---------------------------------------------------------------------------

  // Base deterministic seed string for this zone.
  // We keep this stable so later delta systems can rely on IDs.
  function buildZoneSeed(zone, worldTile) {
    const worldSeed = worldTile && worldTile.seed != null ? String(worldTile.seed) : "";
    const zoneId = zone && zone.id ? String(zone.id) : "";
    return `${worldSeed}::${zoneId}::content_v1`;
  }

  function subSeed(zoneSeed, label) {
    return `${zoneSeed}::${label}`;
  }

  // Phase 3 — Spawn table resolution.
  // Priority:
  // 1) byTemplate lookup using worldTile.templateId
  // 2) byTemplate lookup using zone.id (handcrafted exceptions)
  // 3) byContext lookup using worldTile.biome / worldTile.era / difficulty bucket
  function difficultyKeyFromRating(rating) {
    const r = Math.floor(Number(rating) || 0);
    if (r <= 0) return null;
    if (r <= 3) return "easy";
    if (r <= 6) return "medium";
    return "hard";
  }

  function resolveSpawnTable(zone, def, worldTile) {
    const root = PC.content.SPAWN_TABLES || {};
    const byTemplate = root.byTemplate || root;
    const byContext = root.byContext || null;

    const t1 = worldTile && worldTile.templateId ? String(worldTile.templateId) : null;
    if (t1 && byTemplate[t1]) return { table: byTemplate[t1], tableId: t1, source: "template" };

    const t2 = zone && zone.id ? String(zone.id) : null;
    if (t2 && byTemplate[t2]) return { table: byTemplate[t2], tableId: t2, source: "template" };

    if (!byContext) return null;

    const biome = worldTile && worldTile.biome ? String(worldTile.biome) : null;
    const era = worldTile && worldTile.era ? String(worldTile.era) : null;
    const diffKey = difficultyKeyFromRating(worldTile && worldTile.difficultyRating);

    if (!biome || !era || !diffKey) return null;

    const ctxBiome = byContext[biome];
    const ctxEra = ctxBiome ? ctxBiome[era] : null;
    const ctx = ctxEra ? (ctxEra[diffKey] || ctxEra.any || null) : null;
    if (!ctx) return null;

    return { table: ctx, tableId: `${biome}/${era}/${diffKey}`, source: "context" };
  }

  // Utility: clamp int.
  function clampInt(n, a, b) {
    const x = Math.floor(Number(n) || 0);
    return Math.max(a, Math.min(b, x));
  }

  // Pick a count from a config.
  // - number => exact
  // - [min,max] => rng
  function pickCount(countSpec, rngObj) {
    if (Array.isArray(countSpec) && countSpec.length >= 2) {
      const min = clampInt(countSpec[0], 0, 9999);
      const max = clampInt(countSpec[1], 0, 9999);
      if (max <= min) return min;
      const r = rngObj?.nextInt ? rngObj.nextInt(min, max) : (min + Math.floor(Math.random() * (max - min + 1)));
      return r;
    }
    if (typeof countSpec === "number") return clampInt(countSpec, 0, 9999);
    return 0;
  }

  // Place one kind of content (resourceNodes/entities/pois/locations).
  function normalizeEntries(entries) {
    if (!Array.isArray(entries)) return [];
    return entries
      .map((e) => {
        const id = e && (e.defId || e.id) ? String(e.defId || e.id) : null;
        const w = e && (e.w != null || e.weight != null) ? Number(e.w != null ? e.w : e.weight) : null;
        if (!id) return null;
        return { id, w: Number.isFinite(w) ? w : 1 };
      })
      .filter(Boolean);
  }

  function placeKind(zone, kindKey, kindDefKey, kindCfg, rngObj, used) {
    if (!zone || !zone.content) return;
    if (!kindCfg) return;

    const defsRegistry = PC.content.DEFS && PC.content.DEFS[kindDefKey]
      ? PC.content.DEFS[kindDefKey]
      : {};

    const entries = normalizeEntries(kindCfg.entries);
    const count = pickCount(kindCfg.countRange != null ? kindCfg.countRange : kindCfg.count, rngObj);
    if (count <= 0 || entries.length === 0) return;

    // Candidate tiles: all walkable.
    const candidates = typeof PC.content.getAllWalkablePositions === "function"
      ? PC.content.getAllWalkablePositions(zone)
      : [];

    if (zone.entrySpawn) {
      const key = `${zone.entrySpawn.x},${zone.entrySpawn.y}`;
      used.add(key);
    }

    // Shuffle candidates so we can pick sequentially.
    if (typeof PC.content.shuffle === "function") {
      PC.content.shuffle(rngObj, candidates);
    }

    let placed = 0;
    for (let idx = 0; idx < candidates.length && placed < count; idx++) {
      const pos = candidates[idx];
      const k = `${pos.x},${pos.y}`;
      if (used.has(k)) continue;

      const picked = typeof PC.content.pickWeighted === "function"
        ? PC.content.pickWeighted(rngObj, entries)
        : entries[0];
      const defId = picked && picked.id ? String(picked.id) : null;
      if (!defId || !defsRegistry[defId]) continue;

      const def = defsRegistry[defId];
      const instance = {
        id: `${kindKey}_${defId}_${pos.x}_${pos.y}`,
        defId,
        kind: kindKey,
        x: pos.x,
        y: pos.y,
        state: Object.assign({}, def.stateDefaults || {}),
      };

      zone.content[kindKey].push(instance);
      used.add(k);
      placed++;
    }
  }

  // Public: populate a zone's content from spawn tables.
  // Pass in worldTile when available for templateId + seed.
  PC.content.populateZoneContent = PC.content.populateZoneContent || function populateZoneContent(zone, def, worldTile) {
    if (!zone) return;
    if (!zone.content) {
      zone.content = { resourceNodes: [], entities: [], pois: [], locations: [] };
    }

    // If already populated, don't do it again (idempotent).
    const alreadyHasContent =
      (zone.content.resourceNodes && zone.content.resourceNodes.length) ||
      (zone.content.entities && zone.content.entities.length) ||
      (zone.content.pois && zone.content.pois.length) ||
      (zone.content.locations && zone.content.locations.length);
    if (alreadyHasContent) return;

    const resolved = resolveSpawnTable(zone, def, worldTile);
    if (!resolved || !resolved.table) return;
    const table = resolved.table;
    const tableId = resolved.tableId;

    const zoneSeed = buildZoneSeed(zone, worldTile);

    // Separate RNG streams per content kind so later tweaks don't domino-shift
    // other placements.
    const rngResources = PC.content.makeRng ? PC.content.makeRng(subSeed(zoneSeed, "resources")) : null;
    const rngEntities = PC.content.makeRng ? PC.content.makeRng(subSeed(zoneSeed, "entities")) : null;
    const rngPois = PC.content.makeRng ? PC.content.makeRng(subSeed(zoneSeed, "pois")) : null;
    const rngLocations = PC.content.makeRng ? PC.content.makeRng(subSeed(zoneSeed, "locations")) : null;

    // Used tile positions across all kinds (no overlap for first pass).
    const used = new Set();

    placeKind(zone, "resourceNodes", "resourceNodes", table.resourceNodes, rngResources, used);
    placeKind(zone, "entities", "entities", table.entities, rngEntities, used);
    placeKind(zone, "pois", "pois", table.pois, rngPois, used);
    placeKind(zone, "locations", "locations", table.locations, rngLocations, used);

    // Light debug (can be removed later)
    if (PC?.config?.debug?.logContentGen) {
      console.log(
        `[0.0.70e] Populated zone content for "${zone.id}" via ${resolved.source} table "${tableId}":`,
        {
          resourceNodes: zone.content.resourceNodes.length,
          entities: zone.content.entities.length,
          pois: zone.content.pois.length,
          locations: zone.content.locations.length,
        }
      );
    }
  };
})();
