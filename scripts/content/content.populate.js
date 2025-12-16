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
  // 3) byContext lookup using worldTile.biome / worldTile.era / difficultyRating (numeric)

  function normalizeDifficultyRating(rating) {
    const r = Math.floor(Number(rating) || 0);
    return r > 0 ? r : null;
  }

  // Resolve a context table from a biome/era node.
  // Supported shapes (data-only):
  // - Array of { difficultyRange:[min,max], table:{...} }
  // - Object with a "_ranges" array of the same shape (legacy convenience)
  // - Object keyed by numeric difficulty strings ("1", "2", ...)
  function resolveContextTable(ctxEraNode, difficultyRating) {
    if (!ctxEraNode || !difficultyRating) return null;

    const list = Array.isArray(ctxEraNode)
      ? ctxEraNode
      : (Array.isArray(ctxEraNode._ranges) ? ctxEraNode._ranges : null);

    if (list) {
      for (let i = 0; i < list.length; i++) {
        const entry = list[i];
        const range = entry && Array.isArray(entry.difficultyRange) ? entry.difficultyRange : null;
        const table = entry && entry.table ? entry.table : null;
        if (!range || range.length < 2 || !table) continue;
        const min = Math.floor(Number(range[0]) || 0);
        const max = Math.floor(Number(range[1]) || 0);
        if (difficultyRating >= min && difficultyRating <= max) return table;
      }
      return null;
    }

    // Direct numeric key fallback
    const key = String(difficultyRating);
    if (ctxEraNode[key]) return ctxEraNode[key];
    if (ctxEraNode.any) return ctxEraNode.any;
    return null;
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
    const diffRating = normalizeDifficultyRating(worldTile && worldTile.difficultyRating);

    if (!biome || !era || !diffRating) return null;

    const ctxBiome = byContext[biome];
    const ctxEraNode = ctxBiome ? ctxBiome[era] : null;
    const ctx = resolveContextTable(ctxEraNode, diffRating);
    if (!ctx) return null;

    return { table: ctx, tableId: `${biome}/${era}/dr${diffRating}`, source: "context" };
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

  // Phase 9 — Scale spawn counts by zone size.
  // Supports optional fields on the kind config:
  // - scaleByZoneSize: true
  // - baseTiles: 100 (baseline walkable tile count)
  // - minCount / maxCount clamps
  // - densityPer100: number or [min,max] (alternative to countRange)
  function computeScaledCount(kindCfg, rngObj, walkableCount) {
    if (!kindCfg) return 0;

    const minClamp = kindCfg.minCount != null ? clampInt(kindCfg.minCount, 0, 9999) : null;
    const maxClamp = kindCfg.maxCount != null ? clampInt(kindCfg.maxCount, 0, 9999) : null;

    // Option A: explicit density per 100 walkable tiles
    if (kindCfg.densityPer100 != null) {
      const density = pickCount(kindCfg.densityPer100, rngObj);
      let cnt = Math.floor((Math.max(0, walkableCount) / 100) * density);
      if (minClamp != null) cnt = Math.max(minClamp, cnt);
      if (maxClamp != null) cnt = Math.min(maxClamp, cnt);
      return cnt;
    }

    // Option B: scale an existing baseline count by zone size
    const baseTiles = kindCfg.baseTiles != null ? Math.max(1, clampInt(kindCfg.baseTiles, 1, 100000)) : 100;
    const baselineCount = pickCount(kindCfg.countRange != null ? kindCfg.countRange : kindCfg.count, rngObj);

    if (kindCfg.scaleByZoneSize) {
      let cnt = Math.floor((Math.max(0, walkableCount) / baseTiles) * baselineCount);
      if (minClamp != null) cnt = Math.max(minClamp, cnt);
      if (maxClamp != null) cnt = Math.min(maxClamp, cnt);
      return cnt;
    }

    // Default: unscaled baseline.
    let cnt = baselineCount;
    if (minClamp != null) cnt = Math.max(minClamp, cnt);
    if (maxClamp != null) cnt = Math.min(maxClamp, cnt);
    return cnt;
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
    if (entries.length === 0) return;

    // Candidate tiles: all walkable.
    const candidates = typeof PC.content.getAllWalkablePositions === "function"
      ? PC.content.getAllWalkablePositions(zone)
      : [];

    const count = computeScaledCount(kindCfg, rngObj, candidates.length);
    if (count <= 0) return;

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
        quality: null, // QoL: persistent quality per placed instance
      };

      // QoL: Assign & persist instance quality (F0..S9)
      try {
        const delta = (PC.content && typeof PC.content.getZoneDelta === "function")
          ? PC.content.getZoneDelta(zone.id)
          : null;

        const qmap = delta ? (delta.qualities = delta.qualities || {}) : null;
        const existingQ = qmap ? qmap[instance.id] : null;

        if (typeof existingQ === "string" && existingQ.length >= 2) {
          instance.quality = existingQ;
        } else {
          // Prefer worldTile difficultyRating when available (1–10)
          const diff = worldTile && typeof worldTile.difficultyRating === "number"
            ? worldTile.difficultyRating
            : null;

          const q = (PC.api && PC.api.items && typeof PC.api.items.rollQualityForZoneDifficulty === "function")
            ? PC.api.items.rollQualityForZoneDifficulty(diff)
            : (typeof rollQuality === "function" ? rollQuality() : "F0");

          instance.quality = q;

          if (qmap) qmap[instance.id] = q;
          if (PC.content && typeof PC.content.setInstanceQuality === "function") {
            PC.content.setInstanceQuality(zone.id, instance.id, q);
          }
        }
      } catch {
        // If anything goes wrong, keep null (handlers will default later).
      }

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
