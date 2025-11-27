// scripts/character/character.compute.js
// Aggregates equipment into character bonuses for buildCharacterComputedState(...).

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

      const power = damage * attackSpeed;

      const combatCfg = GAME_CONFIG.combat || {};
      const attrPerPower =
        typeof item.attrPerPower === "number"
          ? item.attrPerPower
          : (combatCfg.defaultAttrPerPower || 1.8);

      const recommendedAttrScore = power * attrPerPower;

      const requiredSkill =
        typeof item.skillReq === "number"
          ? item.skillReq
          : 0; // fallback if not defined on item

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
