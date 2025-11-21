// scripts/equipment.js
// Handles equipped items and summarizes their bonuses for the character system.

// All valid equipment slots for v0.1
const EQUIP_SLOTS = ["weapon", "chest", "legs", "feet", "trinket"];

// Current equipped items.
// Each slot will either be `null` or an item object similar to inventory items:
// { name, rarity, quality, stats, description, slot, attackType, ... }
const equipped = {
  weapon: null,
  chest: null,
  legs: null,
  feet: null,
  trinket: null,
};

function isValidEquipSlot(slot) {
  return EQUIP_SLOTS.includes(slot);
}

/**
 * Equip an item into a given slot.
 *
 * - slot: one of "weapon", "chest", "legs", "feet", "trinket"
 * - item: an item object (like inventory items) or null to clear
 *
 * Returns the item that was previously in that slot (or null).
 */
function equipItemToSlot(slot, item) {
  if (!isValidEquipSlot(slot)) {
    console.warn("equipItemToSlot: invalid slot", slot);
    return null;
  }

  const previous = equipped[slot] || null;

  // Store a shallow copy so we don't accidentally mutate the original
  if (item) {
    equipped[slot] = {
      ...item,
      stats: { ...(item.stats || {}) },
    };
  } else {
    equipped[slot] = null;
  }

  return previous;
}

/**
 * Unequip whatever is in the given slot.
 * Returns the unequipped item (or null if empty).
 */
function unequipSlot(slot) {
  if (!isValidEquipSlot(slot)) {
    console.warn("unequipSlot: invalid slot", slot);
    return null;
  }
  const previous = equipped[slot] || null;
  equipped[slot] = null;
  return previous;
}

/**
 * Get a snapshot of the equipped items suitable for saving.
 * This returns a plain object that can be serialized to JSON.
 */
function getEquippedSnapshot() {
  const snap = {};
  for (const slot of EQUIP_SLOTS) {
    const it = equipped[slot];
    if (it) {
      snap[slot] = {
        ...it,
        stats: { ...(it.stats || {}) },
      };
    } else {
      snap[slot] = null;
    }
  }
  return snap;
}

/**
 * Load equipped items from a snapshot (e.g. from a save file).
 * Snapshot format should match what getEquippedSnapshot() produces.
 */
function loadEquippedFromSnapshot(snapshot) {
  for (const slot of EQUIP_SLOTS) {
    const it = snapshot && snapshot[slot] ? snapshot[slot] : null;
    if (it) {
      equipped[slot] = {
        ...it,
        stats: { ...(it.stats || {}) },
      };
    } else {
      equipped[slot] = null;
    }
  }
}

/**
 * Summarize all equipment bonuses into the format expected
 * by buildCharacterComputedState(...) in character.js.
 *
 * Returns:
 * {
 *   attrBonus: { str, dex, int, vit },
 *   statsBonus: {
 *     bonusHP,
 *     bonusCritChance,
 *     bonusLootFind,
 *     bonusMeleeAtk,
 *     bonusRangedAtk,
 *   },
 *   weaponAttackType: "melee" | "ranged" | null,
 *   mainWeapon: { ... }  // used for combat math
 * }
 *
 * Now:
 * - Attribute bonuses can come from either direct stats (str/dex/int/vit)
 *   or legacy keys (bonusStr/bonusDex/bonusInt/bonusVit).
 * - CritChance and LootFind come from item.stats.critChance / lootFind.
 * - HP, MeleeAtk, RangedAtk bonuses are kept for future use.
 */

function summarizeEquipmentForCharacter() {
  const attrBonus = { str: 0, dex: 0, int: 0, vit: 0 };

  const statsBonus = {
    bonusHP: 0,
    bonusCritChance: 0,
    bonusLootFind: 0,
    bonusMeleeAtk: 0,
    bonusRangedAtk: 0,
  };

  let weaponAttackType = null;
  let mainWeapon = null;

  for (const slot of EQUIP_SLOTS) {
    const item = equipped[slot];
    if (!item) continue;

    const stats = item.stats || {};

    // Weapon attack type (melee / ranged / null)
    if (slot === "weapon") {
      if (item.attackType === "melee" || item.attackType === "ranged") {
        weaponAttackType = item.attackType;
      }
    }

    // Main weapon snapshot for combat calculations
    if (slot === "weapon") {
      const damage = typeof stats.damage === "number" ? stats.damage : 0;
      const attackSpeed =
        typeof stats.attackSpeed === "number" ? stats.attackSpeed : 1;

      const weaponType = inferWeaponType(item);
      const profiles = GAME_CONFIG.weaponProfiles || {};
      const prof = profiles[weaponType] || profiles["sword"] || {};
      const attrPerPower = prof.attrPerPower || 2.0;

      const power = damage * attackSpeed;

      const skillsCfg = (GAME_CONFIG.skills && GAME_CONFIG.skills.weapon) || {};
      const reqCfg = skillsCfg.requiredFromPower || {};
      const baseReq = reqCfg.base ?? 20;
      const perPower = reqCfg.perPower ?? 5;
      const minReq = reqCfg.min ?? 0;
      const maxReq = reqCfg.max ?? (skillsCfg.maxLevel ?? 200);

      let requiredSkill = Math.round(baseReq + power * perPower);
      if (requiredSkill < minReq) requiredSkill = minReq;
      if (requiredSkill > maxReq) requiredSkill = maxReq;

      const recommendedAttrScore = power * attrPerPower;

      mainWeapon = {
        weaponType,
        trueDamage: damage,
        attackSpeed,
        power,
        requiredSkill,
        recommendedAttrScore,
      };
    }

    // ---- Attribute bonuses ----
    if (typeof stats.str === "number") attrBonus.str += stats.str;
    if (typeof stats.dex === "number") attrBonus.dex += stats.dex;
    if (typeof stats.int === "number") attrBonus.int += stats.int;
    if (typeof stats.vit === "number") attrBonus.vit += stats.vit;

    if (typeof stats.bonusStr === "number") attrBonus.str += stats.bonusStr;
    if (typeof stats.bonusDex === "number") attrBonus.dex += stats.bonusDex;
    if (typeof stats.bonusInt === "number") attrBonus.int += stats.bonusInt;
    if (typeof stats.bonusVit === "number") attrBonus.vit += stats.bonusVit;

    // ---- HP bonus ----
    if (typeof stats.bonusHP === "number") {
      statsBonus.bonusHP += stats.bonusHP;
    }

    // ---- Crit chance & Loot Find ----
    if (typeof stats.critChance === "number") {
      statsBonus.bonusCritChance += stats.critChance;
    }
    if (typeof stats.lootFind === "number") {
      statsBonus.bonusLootFind += stats.lootFind;
    }

    // ---- Direct attack bonuses (legacy / future) ----
    if (typeof stats.bonusMeleeAtk === "number") {
      statsBonus.bonusMeleeAtk += stats.bonusMeleeAtk;
    }
    if (typeof stats.bonusRangedAtk === "number") {
      statsBonus.bonusRangedAtk += stats.bonusRangedAtk;
    }
  }

  return {
    attrBonus,
    statsBonus,
    weaponAttackType,
    mainWeapon,
  };
}

function inferWeaponType(item) {
  if (!item) return "unarmed";
  const name = (item.name || "").toLowerCase();

  // If we ever add explicit weaponType on items, prefer that.
  if (item.weaponType) return item.weaponType;

  if (item.attackType === "ranged") {
    return "bow";
  }

  if (name.includes("dagger")) return "dagger";
  if (name.includes("sword")) return "sword";
  if (name.includes("axe") || name.includes("hatchet")) return "axe";

  // Generic fallback
  return "sword";
}

/**
 * Read-only view of the current equipped items.
 * Returns a shallow copy of the equipped slots.
 */
function getEquippedState() {
  const out = {};
  for (const slot of EQUIP_SLOTS) {
    const item = equipped[slot];
    out[slot] = item
      ? { ...item, stats: { ...(item.stats || {}) } }
      : null;
  }
  return out;
}

/**
 * Build tooltip HTML for an equipped item.
 * Matches inventory tooltip style, but WITHOUT +/- comparisons.
 */
function buildEquipmentItemTooltip(item, slot) {
  if (!item) return "";

  const stats = item.stats || {};
  const rarity = item.rarity || "Unknown";
  const quality = item.quality ?? "?";

  const lines = [];

  // Header
  lines.push(`<strong>${item.name}</strong>`);
  if (typeof rarityClass === "function") {
    lines.push(
      `<span class="rarity ${rarityClass(rarity)}">${rarity}</span>`
    );
  } else {
    lines.push(`${rarity}`);
  }
  lines.push(`Quality: ${quality}`);

  // Weapon section
  if (slot === "weapon" && typeof stats.damage === "number") {
    const dmg = stats.damage;
    const as =
      typeof stats.attackSpeed === "number" ? stats.attackSpeed : 1;
    const rawDps = dmg * as;

    lines.push("");
    lines.push("<strong>Weapon</strong>");

    lines.push(`Damage: ${fmt(dmg)}`);
    lines.push(`Attack Speed: ${fmt(as)}`);
    lines.push(`Raw DPS: ${fmt(rawDps)}`);

    // Required skill vs your skill (same format as inventory)
    const skillsCfg =
      (GAME_CONFIG.skills && GAME_CONFIG.skills.weapon) || {};
    const labels = skillsCfg.labels || {};
    const weaponType = inferWeaponType(item);
    const label = labels[weaponType] || weaponType;

    if (typeof computeRequiredSkillForWeapon === "function") {
      const reqInfo = computeRequiredSkillForWeapon(dmg, as, weaponType);

      const playerSkill =
        (window.currentCharacter &&
          window.currentCharacter.skills &&
          window.currentCharacter.skills[weaponType]) ||
        0;

      if (reqInfo) {
        lines.push(
          `${label}: ${reqInfo.required} (${fmt(playerSkill)})`
        );
      }
    }
  }

  // Generic stats block (non-weapon stats)
  const allStatKeys = Object.keys(stats).filter(
    (k) => k !== "damage" && k !== "attackSpeed"
  );

  if (allStatKeys.length) {
    lines.push("");
    lines.push("<strong>Stats</strong>");

    allStatKeys.forEach((k) => {
      const label =
        (typeof STAT_LABELS !== "undefined" && STAT_LABELS[k]) || k;
      const val = stats[k] ?? 0;
      if (!val) return;
      lines.push(`${label}: ${fmt(val)}`);
    });
  }

  if (item.description) {
    lines.push("");
    lines.push(item.description);
  }

  return lines.join("<br>");
}
