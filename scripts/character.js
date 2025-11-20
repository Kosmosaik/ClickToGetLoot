// scripts/character.js
// All character-related calculations (attributes & derived stats)

/**
 * Safely get base stats from a character object.
 * Expects something like:
 * {
 *   name: "Foo",
 *   stats: { str: 10, dex: 8, int: 5, vit: 12 }
 * }
 */
function getBaseAttributesFromCharacter(character) {
  if (!character || !character.stats) {
    return { str: 0, dex: 0, int: 0, vit: 0 };
  }
  const s = character.stats;
  return {
    str: Number(s.str) || 0,
    dex: Number(s.dex) || 0,
    int: Number(s.int) || 0,
    vit: Number(s.vit) || 0,
  };
}

/**
 * Build a fresh skills object using GAME_CONFIG defaults.
 */
function createDefaultSkills() {
  const cfg = (GAME_CONFIG.skills && GAME_CONFIG.skills.weapon) || {};
  const defaults = cfg.defaultLevels || {};
  const out = {};
  for (const key in defaults) {
    out[key] = defaults[key];
  }
  return out;
}

/**
 * Shallow-clone skills (for saving/loading).
 */
function cloneSkills(skills) {
  const out = {};
  if (!skills) return out;
  for (const key in skills) {
    out[key] = skills[key];
  }
  return out;
}

/**
 * Combine base attributes with bonuses from equipment/buffs/etc.
 *
 * base:  { str, dex, int, vit }
 * bonus: { str, dex, int, vit }  // can be all zeros (no gear yet)
 *
 * Returns:
 * {
 *   total: { str, dex, int, vit },
 *   bonus: { str, dex, int, vit }
 * }
 *
 * Note: "total" already includes the bonuses. In the UI we will show:
 *   STR: total (bonus)
 * Example: STR: 10 (5)  => total 10, of which 5 comes from bonuses.
 */
function computeAttributeTotals(base, bonus) {
  const b = bonus || {};
  const bonusStr = Number(b.str) || 0;
  const bonusDex = Number(b.dex) || 0;
  const bonusInt = Number(b.int) || 0;
  const bonusVit = Number(b.vit) || 0;

  const totalStr = base.str + bonusStr;
  const totalDex = base.dex + bonusDex;
  const totalInt = base.int + bonusInt;
  const totalVit = base.vit + bonusVit;

  return {
    total: {
      str: totalStr,
      dex: totalDex,
      int: totalInt,
      vit: totalVit,
    },
    bonus: {
      str: bonusStr,
      dex: bonusDex,
      int: bonusInt,
      vit: bonusVit,
    },
  };
}

/**
 * Compute derived stats from attributes and equipment/other bonuses.
 *
 * attrTotals:
 *   {
 *     total: { str, dex, int, vit },
 *     bonus: { str, dex, int, vit }
 *   }
 *
 * equipmentStats (all optional, default 0):
 *   {
 *     bonusHP: 0,
 *     bonusCritChance: 0,  // %
 *     bonusLootFind: 0,    // %
 *     bonusMeleeAtk: 0,    // direct melee attack bonus (if we want later)
 *     bonusRangedAtk: 0    // direct ranged attack bonus
 *   }
 *
 * weaponAttackType:
 *   "melee"  => show Melee Attack as active
 *   "ranged" => show Ranged Attack as active
 *   null/undefined => Unarmed Attack
 */
function computeDerivedStats(attrTotals, equipmentStats, weaponAttackType) {
  const cfg = GAME_CONFIG.character;

  const total = attrTotals.total;
  const STR = total.str;
  const DEX = total.dex;
  const INT = total.int;
  const VIT = total.vit;

  const eq = equipmentStats || {};
  const bonusHP = Number(eq.bonusHP) || 0;
  const bonusCrit = Number(eq.bonusCritChance) || 0;
  const bonusLootFind = Number(eq.bonusLootFind) || 0;
  const bonusMeleeAtk = Number(eq.bonusMeleeAtk) || 0;
  const bonusRangedAtk = Number(eq.bonusRangedAtk) || 0;

  // ---- Max HP ----
  const maxHP =
    cfg.baseHP +
    VIT * cfg.hpPerVit +
    bonusHP;

  // ---- Attack calculations ----
  // Melee attack: STR is main, DEX gives a smaller contribution.
  const meleeAttack =
    STR * cfg.meleeMainScale +
    DEX * cfg.meleeOffScale +
    bonusMeleeAtk;

  // Ranged attack: DEX is main, STR gives a smaller contribution.
  const rangedAttack =
    DEX * cfg.rangedMainScale +
    STR * cfg.rangedOffScale +
    bonusRangedAtk;

  // ---- Crit chance (%) ----
  const critChance =
    cfg.baseCritChance +
    DEX * cfg.critPerDex +
    bonusCrit;

  // ---- Loot Find (%) ----
  const lootFind =
    INT * cfg.lootFindPerInt +
    bonusLootFind;

  // ---- Active Attack (for the character screen) ----
  let attackLabel = "Attack";
  let attackType = "unarmed";
  let attackValue = 0;

  if (weaponAttackType === "melee") {
    attackLabel = "Attack";
    attackType = "melee";
    attackValue = meleeAttack;
  } else if (weaponAttackType === "ranged") {
    attackLabel = "Attack";
    attackType = "ranged";
    attackValue = rangedAttack;
  } else {
    // Unarmed: we can choose a simple formula.
    // For example: unarmed uses melee attack but scaled down a bit.
    attackLabel = "Unarmed Attack";
    attackType = "unarmed";
    attackValue = meleeAttack * 0.5;
  }

  return {
    maxHP,
    meleeAttack,
    rangedAttack,
    critChance,
    lootFind,
    activeAttack: {
      label: attackLabel,
      type: attackType,
      value: attackValue,
    },
  };
}

/**
 * Convenience helper that does everything in one go.
 *
 * character: the currentCharacter object (name + stats)
 * equipmentSummary: (we'll build this later in equipment.js)
 *   {
 *     attrBonus: { str, dex, int, vit },
 *     statsBonus: {
 *       bonusHP,
 *       bonusCritChance,
 *       bonusLootFind,
 *       bonusMeleeAtk,
 *       bonusRangedAtk,
 *     },
 *     weaponAttackType: "melee" | "ranged" | null
 *   }
 *
 * For now, if you call this with only the character, it will assume
 * no equipment bonuses and unarmed.
 */
function buildCharacterComputedState(character, equipmentSummary) {
  const baseAttrs = getBaseAttributesFromCharacter(character);

  const attrBonus = (equipmentSummary && equipmentSummary.attrBonus) || {
    str: 0,
    dex: 0,
    int: 0,
    vit: 0,
  };

  const attrTotals = computeAttributeTotals(baseAttrs, attrBonus);

  const statsBonus =
    (equipmentSummary && equipmentSummary.statsBonus) || {};

  const weaponAttackType =
    (equipmentSummary && equipmentSummary.weaponAttackType) || null;

  const derived = computeDerivedStats(
    attrTotals,
    statsBonus,
    weaponAttackType
  );

  return {
    baseAttributes: baseAttrs,
    attributeTotals: attrTotals,
    derivedStats: derived,
  };
}
