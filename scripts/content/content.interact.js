// scripts/content/content.interact.js
// 0.0.70e — Minimal interactions for placed zone content (Phase 7).
//
// Contract:
// - UI calls PC.api.zone.interactAt(x,y)
// - PC.api.zone.interactAt will forward to PC.zoneInteractAt(x,y) if present
// - This file owns the router + minimal handlers.
//
// Rules:
// - Do not add new global state; use STATE()/PC.state
// - Persist changes via PC.content.* delta helpers
// - Keep logic data-driven via PC.content.DEFS + LOOT_TABLES

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // -----------------------------
  // Helpers
  // -----------------------------

  function getZone() {
    try {
      return typeof STATE === "function" ? STATE().currentZone : null;
    } catch {
      return null;
    }
  }

  function msg(text) {
    if (typeof window.addZoneMessage === "function") window.addZoneMessage(text);
  }
  function disc(text) {
    if (typeof window.addZoneDiscovery === "function") window.addZoneDiscovery(text);
  }

  function getDef(kind, defId) {
    const defs = PC.content?.DEFS;
    if (!defs || !defs[kind]) return null;
    return defs[kind][defId] || null;
  }

  // Find first instance on a tile in a list.
  function findAt(list, x, y) {
    if (!Array.isArray(list)) return null;
    for (const inst of list) {
      if (!inst) continue;
      if (Number(inst.x) === x && Number(inst.y) === y) return inst;
    }
    return null;
  }

  // Priority: entity > POI > node > location (matches Phase 6).
  function getTopInteraction(zone, x, y) {
    if (!zone || !zone.content) return null;
    const e = findAt(zone.content.entities, x, y);
    if (e) return { kind: "entities", inst: e };
    const p = findAt(zone.content.pois, x, y);
    if (p) return { kind: "pois", inst: p };
    const rn = findAt(zone.content.resourceNodes, x, y);
    if (rn) return { kind: "resourceNodes", inst: rn };
    const loc = findAt(zone.content.locations, x, y);
    if (loc) return { kind: "locations", inst: loc };
    return null;
  }

  // Loot rolling (deterministic-friendly):
  // - Uses PC.content.makeRng + seedFromString if available
  function rollLoot(tableId, seedKey) {
    const tables = PC.content?.LOOT_TABLES;
    const tbl = tables ? tables[tableId] : null;
    if (!tbl || !Array.isArray(tbl.entries) || tbl.entries.length === 0) return [];

    const rolls = Math.max(1, Number(tbl.rolls || 1));
    const seedFn = PC.content.seedFromString;
    const makeRng = PC.content.makeRng;
    const pickWeighted = PC.content.pickWeighted;

    const rng = (seedFn && makeRng)
      ? makeRng(seedFn(String(seedKey)))
      : {
          nextFloat: () => Math.random(),
          nextInt: (a, b) => {
            const min = Math.min(a, b);
            const max = Math.max(a, b);
            return Math.floor(Math.random() * (max - min + 1)) + min;
          },
        };

    const out = [];
    for (let i = 0; i < rolls; i++) {
      const pick = pickWeighted ? pickWeighted(rng, tbl.entries) : tbl.entries[0];
      if (!pick || !pick.item) continue;
      const q = Array.isArray(pick.qty) ? pick.qty : [1, 1];
      const qty = rng.nextInt(q[0], q[1]);
      out.push({ item: String(pick.item), qty });
    }

    // Combine duplicates (Wood+Wood => Wood x2)
    const merged = new Map();
    for (const it of out) {
      merged.set(it.item, (merged.get(it.item) || 0) + it.qty);
    }
    return Array.from(merged.entries()).map(([item, qty]) => ({ item, qty }));
  }

  // Minimal mapping to inventory item instances.
  // Inventory expects: name, category, rarity, quality, stats, description.
  function giveLootToInventory(lootRows) {
    if (!Array.isArray(lootRows) || lootRows.length === 0) return;
    if (typeof window.addToInventory !== "function") {
      console.warn("addToInventory() not found; loot will not be added.");
      return;
    }

    for (const row of lootRows) {
      const qty = Math.max(1, Number(row.qty || 1));
      for (let i = 0; i < qty; i++) {
        window.addToInventory({
          name: row.item,
          category: "Zone Loot",
          description: "",
          rarity: "F",
          quality: "F0",
          stats: {},
          slot: null,
          weaponType: null,
          skillReq: null,
          attrPerPower: null,
        });
      }
    }
  }

  function saveAfterInteraction() {
    if (typeof window.requestSaveCurrentGame === "function") {
      window.requestSaveCurrentGame();
    } else if (typeof window.saveCurrentGame === "function") {
      window.saveCurrentGame();
    }
  }

  function refreshUI() {
    if (typeof window.renderZoneUI === "function") window.renderZoneUI();
  }

  // -----------------------------
  // Handlers
  // -----------------------------

  function handleResourceNode(zone, inst) {
    inst.state = inst.state || {};
    const def = getDef("resourceNodes", inst.defId);
    const nm = def?.name || inst.defId;

    if (inst.state.harvested || inst.state.depleted || (typeof inst.state.chargesLeft === "number" && inst.state.chargesLeft <= 0)) {
      msg(`${nm} has already been harvested.`);
      return;
    }

    const lootTableId = def?.lootTableId;
    if (lootTableId) {
      const loot = rollLoot(lootTableId, `${zone.id}:rn:${inst.id}:loot`);
      giveLootToInventory(loot);
      if (loot.length > 0) {
        msg(`You harvest ${nm}.`);
        msg(`Loot: ${loot.map(r => `${r.item} x${r.qty}`).join(", ")}`);
      } else {
        msg(`You harvest ${nm}, but find nothing useful.`);
      }
    } else {
      msg(`You harvest ${nm}.`);
    }

    // Minimal state: harvesting depletes the node for 0.0.70e.
    inst.state.harvested = true;
    inst.state.depleted = true;
    inst.state.chargesLeft = 0;
    if (PC.content.markHarvested) PC.content.markHarvested(zone.id, inst.id);

    saveAfterInteraction();
    refreshUI();
  }

  function handlePoi(zone, inst) {
    inst.state = inst.state || {};
    const def = getDef("pois", inst.defId);
    const nm = def?.name || inst.defId;

    // Stashes: open once, loot.
    if (inst.defId === "stash_small") {
      if (inst.state.opened) {
        msg(`${nm} is empty.`);
        return;
      }
      const lootTableId = def?.lootTableId;
      const loot = lootTableId ? rollLoot(lootTableId, `${zone.id}:poi:${inst.id}:loot`) : [];
      giveLootToInventory(loot);
      inst.state.opened = true;
      if (PC.content.markOpened) PC.content.markOpened(zone.id, inst.id);

      msg(`You open ${nm}.`);
      if (loot.length > 0) msg(`Loot: ${loot.map(r => `${r.item} x${r.qty}`).join(", ")}`);
      saveAfterInteraction();
      refreshUI();
      return;
    }

    // Traps: for Phase 9, "Inspect" yields loot once and then marks as opened.
    if (inst.defId === "trap_snare") {
      if (inst.state.opened) {
        msg(`${nm} has already been inspected.`);
        return;
      }

      const lootTableId = def?.lootTableId;
      const loot = lootTableId ? rollLoot(lootTableId, `${zone.id}:poi:${inst.id}:loot`) : [];
      giveLootToInventory(loot);

      inst.state.inspected = true;
      inst.state.opened = true;
      if (PC.content.markOpened) PC.content.markOpened(zone.id, inst.id);
      if (PC.content.markInspected) PC.content.markInspected(zone.id, inst.id);

      msg(`You inspect ${nm}.`);
      if (loot.length > 0) msg(`Loot: ${loot.map(r => `${r.item} x${r.qty}`).join(", ")}`);
      saveAfterInteraction();
      refreshUI();
      return;
    }

    // Default: mark opened once.
    if (inst.state.opened) {
      msg(`${nm} has already been handled.`);
      return;
    }
    inst.state.opened = true;
    if (PC.content.markOpened) PC.content.markOpened(zone.id, inst.id);
    msg(`You interact with ${nm}.`);
    saveAfterInteraction();
    refreshUI();
  }

  function handleEntity(zone, inst) {
    inst.state = inst.state || {};
    const def = getDef("entities", inst.defId);
    const nm = def?.name || inst.defId;

    if (inst.state.defeated) {
      msg(`${nm} has already been dealt with.`);
      return;
    }

    // 0.0.70e: auto-resolve encounter.
    const lootTableId = def?.lootTableId;
    const loot = lootTableId ? rollLoot(lootTableId, `${zone.id}:e:${inst.id}:loot`) : [];
    giveLootToInventory(loot);

    inst.state.defeated = true;
    if (PC.content.markDefeated) PC.content.markDefeated(zone.id, inst.id);

    msg(`You defeat the ${nm}.`);
    if (loot.length > 0) msg(`Loot: ${loot.map(r => `${r.item} x${r.qty}`).join(", ")}`);
    saveAfterInteraction();
    refreshUI();
  }

  function handleLocation(zone, inst) {
    inst.state = inst.state || {};
    const def = getDef("locations", inst.defId);
    const nm = def?.name || inst.defId;

    // Phase 9: "Enter" is the UX contract. The actual location transition
    // will be implemented later. For now:
    // - first enter => discover + log
    // - subsequent enters => message only
    if (!inst.state.discovered) {
      inst.state.discovered = true;
      if (PC.content.markLocationDiscovered) PC.content.markLocationDiscovered(zone.id, inst.id);
      disc(`Discovered: ${nm}`);
    }

    msg(`You enter ${nm}. (Location travel not implemented yet.)`);
    saveAfterInteraction();
    refreshUI();
  }

  // -----------------------------
  // Router entrypoint
  // -----------------------------

  PC.zoneInteractAt = function zoneInteractAt(x, y) {
    const zone = getZone();
    if (!zone || !zone.tiles || !zone.tiles[y] || !zone.tiles[y][x]) return;
    const tile = zone.tiles[y][x];

    // UI already filters unexplored/blocked, but keep it safe.
    if (tile.kind === "blocked") return;
    if (!tile.explored) return;

    const top = getTopInteraction(zone, x, y);
    if (!top || !top.inst) {
      msg("Nothing interesting here.");
      return;
    }

    // If content is already spent/closed, do not open the modal.
    const s = top.inst.state || {};
    if (top.kind === "resourceNodes" && (s.depleted || s.harvested || (typeof s.chargesLeft === "number" && s.chargesLeft <= 0))) {
      const def = getDef("resourceNodes", top.inst.defId);
      const nm = def?.name || top.inst.defId;
      msg(`${nm} has already been harvested.`);
      return;
    }
    if (top.kind === "entities" && s.defeated) {
      const def = getDef("entities", top.inst.defId);
      const nm = def?.name || top.inst.defId;
      msg(`${nm} has already been dealt with.`);
      return;
    }
    if (top.kind === "pois" && s.opened) {
      const def = getDef("pois", top.inst.defId);
      const nm = def?.name || top.inst.defId;
      msg(`${nm} is already opened.`);
      return;
    }

    // Phase 9: show a confirmation modal (consistent UI) before changing state.
    const showModal = typeof window.showChoiceModal === "function" ? window.showChoiceModal : null;
    if (!showModal) {
      // Fallback: behave like old flow.
      if (top.kind === "resourceNodes") return handleResourceNode(zone, top.inst);
      if (top.kind === "pois") return handlePoi(zone, top.inst);
      if (top.kind === "entities") return handleEntity(zone, top.inst);
      if (top.kind === "locations") return handleLocation(zone, top.inst);
      return;
    }

    const def = getDef(top.kind, top.inst.defId);
    const nm = def?.name || top.inst.defId;
    const kindLabel = top.kind === "resourceNodes" ? "Resource Node" :
      top.kind === "entities" ? "Entity" :
      top.kind === "pois" ? "Point of Interest" :
      top.kind === "locations" ? "Location" : "";

    const primaryText = top.kind === "resourceNodes" ? "Harvest" :
      top.kind === "entities" ? "Kill" :
      top.kind === "pois" ? "Inspect" :
      top.kind === "locations" ? `Enter ${nm}` : "OK";

    const body = kindLabel ? `${kindLabel}: ${nm}` : nm;

    showModal({
      title: nm,
      body,
      primaryText,
      secondaryText: "Cancel",
      onPrimary: () => {
        if (top.kind === "resourceNodes") return handleResourceNode(zone, top.inst);
        if (top.kind === "pois") return handlePoi(zone, top.inst);
        if (top.kind === "entities") return handleEntity(zone, top.inst);
        if (top.kind === "locations") return handleLocation(zone, top.inst);
      },
    });
  };
})();
