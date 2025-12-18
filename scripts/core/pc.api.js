// scripts/core/pc.api.js
console.log("pc.api.js loaded");

// Authoritative state/API access.
// Rules:
// - Never overwrite PC.api (extend only).
// - STATE/EXP/MOV are defined here and nowhere else.
// - Game/UI should prefer PC.api.* actions, and STATE/EXP/MOV for state reads/writes.

(function () {
  const PC = (window.PC = window.PC || {});
  PC.api = PC.api || {};

  // ---- Authoritative state access ----
  PC.api.state = function () {
    return PC.state;
  };

  PC.api.exp = function () {
    return PC.state.exploration;
  };

  PC.api.mov = function () {
    return PC.state.movement;
  };

  // Global shorthands used by existing modules (zones.*, game.*, etc.)
  window.STATE = PC.api.state;
  window.EXP = PC.api.exp;
  window.MOV = PC.api.mov;

  // ---- Action API (extend only) ----
  PC.api.zone = PC.api.zone || {};
  PC.api.world = PC.api.world || {};
  PC.api.items = PC.api.items || {};

  // QoL: roll item quality (F0..S9) biased by zone difficulty (1–10).
  // Implementation: roll N times and take the best result.
  // - difficulty 1 => 1 roll (baseline)
  // - difficulty 10 => up to 5 rolls (cap)
  PC.api.items.rollQualityForZoneDifficulty = PC.api.items.rollQualityForZoneDifficulty || function rollQualityForZoneDifficulty(difficultyRating) {
    const d = Number(difficultyRating);
    const diff = Number.isFinite(d) ? Math.max(1, Math.min(10, d)) : 1;

    // Ensure rollQuality exists (quality.js)
    if (typeof rollQuality !== "function") return "F0";

    // 1..5 rolls, scaled by difficulty
    const rolls = Math.max(1, Math.min(5, 1 + Math.floor((diff - 1) / 2)));

    // Compare quality strings using global TIER_ORDER + SUBLEVELS_PER_TIER (quality.js)
    const stepOf = (q) => {
      if (!q || typeof q !== "string" || q.length < 2) return 0;
      const tier = q[0];
      const sub = parseInt(q.slice(1), 10);
      const tierIdx = (typeof TIER_ORDER !== "undefined" && Array.isArray(TIER_ORDER))
        ? TIER_ORDER.indexOf(tier)
        : 0;
      const stepsPerTier = (typeof SUBLEVELS_PER_TIER === "number") ? SUBLEVELS_PER_TIER : 10;
      const safeTierIdx = tierIdx >= 0 ? tierIdx : 0;
      const safeSub = Number.isFinite(sub) ? Math.max(0, Math.min(stepsPerTier - 1, sub)) : 0;
      return safeTierIdx * stepsPerTier + safeSub;
    };

    let best = rollQuality();
    let bestStep = stepOf(best);

    for (let i = 1; i < rolls; i++) {
      const cand = rollQuality();
      const s = stepOf(cand);
      if (s > bestStep) {
        best = cand;
        bestStep = s;
      }
    }

    return best;
  };

  // QoL: Item unification — resolve loot references through items.js (ItemCatalog).
  // Supports stable IDs so display names can be renamed safely later.
  PC.api.items.getTemplateById = PC.api.items.getTemplateById || function getTemplateById(itemId) {
    const id = String(itemId || "").trim();
    if (!id) return null;
    if (typeof ItemCatalog === "undefined" || !Array.isArray(ItemCatalog)) return null;

    for (let i = 0; i < ItemCatalog.length; i++) {
      const it = ItemCatalog[i];
      if (it && it.id === id) return it;
    }
    return null;
  };

  PC.api.items.getTemplateByName = PC.api.items.getTemplateByName || function getTemplateByName(name) {
    const n = String(name || "").trim();
    if (!n) return null;
    if (typeof ItemCatalog === "undefined" || !Array.isArray(ItemCatalog)) return null;

    for (let i = 0; i < ItemCatalog.length; i++) {
      const it = ItemCatalog[i];
      if (it && it.name === n) return it;
    }
    return null;
  };

  // Preferred: resolve by itemId; fallback: resolve by name.
  PC.api.items.getTemplate = PC.api.items.getTemplate || function getTemplate(ref) {
    if (!ref) return null;

    // If a caller passes { itemId, item }, support that too.
    if (typeof ref === "object") {
      if (ref.itemId) return PC.api.items.getTemplateById(ref.itemId) || (ref.item ? PC.api.items.getTemplateByName(ref.item) : null);
      if (ref.item) return PC.api.items.getTemplateByName(ref.item);
      return null;
    }

    // If it's a string, try ID first (stable), then name (legacy).
    const s = String(ref).trim();
    return PC.api.items.getTemplateById(s) || PC.api.items.getTemplateByName(s);
  };

  // Build a canonical inventory instance using ItemCatalog.
  // `ref` can be:
  // - itemId string (preferred)
  // - name string (legacy)
  // - { itemId, item } object
  PC.api.items.makeInventoryInstance =
    PC.api.items.makeInventoryInstance ||
    function makeInventoryInstance(ref, quality) {
      const q = (typeof quality === "string" && quality.length >= 2) ? quality : "F0";
      const template = PC.api.items.getTemplate(ref);

      // Derive best-effort id/name for fallback cases.
      const refObj = (ref && typeof ref === "object") ? ref : null;
      const fallbackName = refObj ? (refObj.item || refObj.name || "Unknown") : String(ref || "Unknown");
      const fallbackId = refObj ? (refObj.itemId || "") : "";

      // Missing template: create usable instance but warn (dev signal).
      if (!template) {
        console.warn(`[Item Unification] Missing ItemCatalog entry for:`, ref);
        return {
          itemId: fallbackId || null,
          name: String(fallbackName),
          category: "Unknown",
          description: "",
          rarity: "Common",
          quality: q,
          stats: {},
          slot: null,
          weaponType: null,
          skillReq: null,
          attrPerPower: null,
        };
      }

      // Roll stats if applicable (same mechanics as loot button).
      let stats = {};
      try {
        if (template.statRanges && typeof rollStats === "function" && typeof qualityMultiplier === "function") {
          const mult = qualityMultiplier(q);
          stats = rollStats(template.statRanges, mult);
        }
      } catch {
        stats = {};
      }

      return {
        itemId: template.id || null,
        name: template.name,
        category: template.category,
        description: template.description || "",
        rarity: template.rarity || "Common",
        quality: q,
        stats,
        slot: template.slot || null,

        weaponType: template.weaponType || null,
        skillReq: typeof template.skillReq === "number" ? template.skillReq : null,
        attrPerPower: typeof template.attrPerPower === "number" ? template.attrPerPower : null,
      };
    };

  // Back-compat wrapper used by older callers.
  PC.api.items.makeInventoryInstanceFromName =
    PC.api.items.makeInventoryInstanceFromName ||
    function makeInventoryInstanceFromName(name, quality) {
      return PC.api.items.makeInventoryInstance({ item: name }, quality);
    };

  // Zone actions (wire to existing functions if present)
  PC.api.zone.exploreOnce = () => {
    if (typeof startZoneManualExploreOnce === "function") startZoneManualExploreOnce();
  };
  PC.api.zone.startAutoExplore = () => {
    if (typeof startZoneExplorationTicks === "function") startZoneExplorationTicks();
  };
  PC.api.zone.stopAutoExplore = () => {
    if (typeof stopZoneExplorationTicks === "function") stopZoneExplorationTicks();
  };

  // Phase 6.3 — Tile click routing (interaction entrypoint).
  // UI should call this; the router/handlers live elsewhere.
  PC.api.zone.interactAt = (x, y) => {
    // Prefer a dedicated router if/when it exists.
    if (typeof PC.zoneInteractAt === "function") {
      PC.zoneInteractAt(x, y);
      return;
    }
    if (typeof window.zoneInteractAt === "function") {
      window.zoneInteractAt(x, y);
      return;
    }

    // Placeholder (Phase 7 will replace this).
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("Nothing to interact with here (yet).");
    }
  };

  // QoL — Move next to a tile, then interact.
// Used by BOTH:
// - clicking content on the zone map
// - clicking content in the Discoveries list
PC.api.zone.moveToAndInteractAt = (x, y) => {
  const st = PC.api.state();
  const zone = st ? st.currentZone : null;
  if (!st || !zone || !st.isInZone) return;

  // Don’t interrupt exploration or existing movement.
  if (PC.api.exp().zoneExplorationActive || PC.api.exp().zoneManualExplorationActive) {
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("You can’t move to interact while exploring.");
    }
    return;
  }
  if (PC.api.mov().zoneMovementActive) return;

  const tx = Number(x);
  const ty = Number(y);
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

  // Only interact with explored, walkable tiles.
  const tile = zone.tiles?.[ty]?.[tx];
  if (!tile) return;
  if (tile.kind === "blocked" || tile.kind === "locked") return;
  if (!tile.explored) return;

  // Find player position from tile.hasPlayer
  let px = null;
  let py = null;
  for (let yy = 0; yy < zone.height; yy++) {
    const row = zone.tiles[yy];
    if (!row) continue;
    for (let xx = 0; xx < zone.width; xx++) {
      const t = row[xx];
      if (t && t.hasPlayer) {
        px = xx;
        py = yy;
        break;
      }
    }
    if (px != null) break;
  }

  // If we already stand adjacent, interact now.
  if (px != null && py != null) {
    const manhattan = Math.abs(px - tx) + Math.abs(py - ty);
    if (manhattan === 1) {
      PC.api.zone.interactAt(tx, ty);
      if (typeof window.renderZoneUI === "function") window.renderZoneUI();
      return;
    }
  }

  // Use existing "prepared tile" stance pathing if available.
  if (typeof window.findPathToPreparedTile !== "function" || typeof window.startZoneMovement !== "function") {
    // If movement system isn’t present for some reason, do nothing (adjacency rule).
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("You can’t reach that right now.");
    }
    return;
  }

  zone.preparedTargetX = tx;
  zone.preparedTargetY = ty;

  const path = window.findPathToPreparedTile(zone);

  // No path => can’t reach
  if (!Array.isArray(path) || path.length === 0) {
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("No path to that target.");
    }
    return;
  }

  window.startZoneMovement(path, () => {
    // On arrival we should be adjacent by definition of prepared-tile stance pathing.
    PC.api.zone.interactAt(tx, ty);
    if (typeof window.renderZoneUI === "function") window.renderZoneUI();
  });

  if (typeof window.renderZoneUI === "function") window.renderZoneUI();
};
// QoL — Move next to a LOCKED gate tile, then open gate UI.
// Used by BOTH:
// - clicking the gate on the zone map
// - clicking the gate in the Discoveries list
PC.api.zone.moveToAndOpenGateAt = (x, y) => {
  const st = PC.api.state();
  const zone = st ? st.currentZone : null;
  if (!st || !zone || !st.isInZone) return;

  // Don’t interrupt exploration or existing movement.
  if (PC.api.exp().zoneExplorationActive || PC.api.exp().zoneManualExplorationActive) {
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("You can’t interact with the gate while exploring.");
    }
    return;
  }
  if (PC.api.mov().zoneMovementActive) return;

  const tx = Number(x);
  const ty = Number(y);
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

  const tile = zone.tiles?.[ty]?.[tx];
  if (!tile) return;
  if (tile.kind !== "locked" || tile.lockedRegionId == null) return;

  // Find player position from tile.hasPlayer
  let px = null;
  let py = null;
  for (let yy = 0; yy < zone.height; yy++) {
    const row = zone.tiles[yy];
    if (!row) continue;
    for (let xx = 0; xx < zone.width; xx++) {
      const t = row[xx];
      if (t && t.hasPlayer) {
        px = xx;
        py = yy;
        break;
      }
    }
    if (px != null) break;
  }

  // If we already stand adjacent, open immediately.
  if (px != null && py != null) {
    const manhattan = Math.abs(px - tx) + Math.abs(py - ty);
    if (manhattan === 1) {
      if (typeof window.openLockedGateModalAt === "function") {
        window.openLockedGateModalAt(tx, ty);
      }
      if (typeof window.renderZoneUI === "function") window.renderZoneUI();
      return;
    }
  }

  // Use existing "prepared tile" stance pathing if available.
  if (typeof window.findPathToPreparedTile !== "function" || typeof window.startZoneMovement !== "function") {
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("You can’t reach that right now.");
    }
    return;
  }

  zone.preparedTargetX = tx;
  zone.preparedTargetY = ty;

  const path = window.findPathToPreparedTile(zone);

  if (!Array.isArray(path) || path.length === 0) {
    if (typeof window.addZoneMessage === "function") {
      window.addZoneMessage("No path to that target.");
    }
    return;
  }

  window.startZoneMovement(path, () => {
    if (typeof window.openLockedGateModalAt === "function") {
      window.openLockedGateModalAt(tx, ty);
    }
    if (typeof window.renderZoneUI === "function") window.renderZoneUI();
  });

  if (typeof window.renderZoneUI === "function") window.renderZoneUI();
};

  // World actions
  PC.api.world.enterZone = (x, y) => {
    if (typeof enterZoneFromWorldMap === "function") enterZoneFromWorldMap(x, y);
  };
  PC.api.world.showWorldMap = () => {
    if (typeof switchToWorldMapView === "function") switchToWorldMapView();
  };
})();
