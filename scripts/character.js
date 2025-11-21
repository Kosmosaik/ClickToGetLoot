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
function computeDerivedStats(
  attrTotals,
  equipmentStats,
  weaponAttackType,
  skills,
  mainWeapon
) {
  const cfgChar = GAME_CONFIG.character;
  const cfgCombat = GAME_CONFIG.combat || {};
  const profiles = GAME_CONFIG.weaponProfiles || {};
  const skillsCfg = (GAME_CONFIG.skills && GAME_CONFIG.skills.weapon) || {};

  const total = attrTotals.total;
  const STR = total.str;
  const DEX = total.dex;
  const INT = total.int;
  const VIT = total.vit;

  const eq = equipmentStats || {};
  const bonusHP = Number(eq.bonusHP) || 0;
  const bonusCrit = Number(eq.bonusCritChance) || 0;
  const bonusLootFind = Number(eq.bonusLootFind) || 0;

  // ---- Max HP ----
  const maxHP =
    cfgChar.baseHP +
    VIT * cfgChar.hpPerVit +
    bonusHP;

  // ---- Crit chance (%) ----
  const critChance =
    cfgChar.baseCritChance +
    DEX * cfgChar.critPerDex +
    bonusCrit;

  // ---- Loot Find (%) ----
  const lootFind =
    INT * cfgChar.lootFindPerInt +
    bonusLootFind;

  // ---- Weapon + skill + attribute efficiencies ----

  // 1) Determine active weapon or fallback to unarmed
  let weaponType = (mainWeapon && mainWeapon.weaponType) || "unarmed";
  let trueDamage = (mainWeapon && mainWeapon.trueDamage) || 0;
  let attackSpeed = (mainWeapon && mainWeapon.attackSpeed) || 1;
  let requiredSkill = (mainWeapon && mainWeapon.requiredSkill) || 0;
  let recommendedAttrScore =
    (mainWeapon && mainWeapon.recommendedAttrScore) || 0;

  // If no actual weapon stats, treat as unarmed
  if (!mainWeapon || !trueDamage) {
    weaponType = "unarmed";

    const baseUnarmed = cfgCombat.unarmedBaseDamage ?? 1;
    const perStr = cfgCombat.unarmedDamagePerStr ?? 0.2;
    trueDamage = baseUnarmed + STR * perStr;

    attackSpeed = cfgCombat.unarmedAttackSpeed ?? 1.2;

    const unarmedProf = profiles.unarmed || {};
    const attrPerPower = unarmedProf.attrPerPower || 1.5;
    const power = trueDamage * attackSpeed;
    recommendedAttrScore = power * attrPerPower;

    const reqCfg = skillsCfg.requiredFromPower || {};
    const baseReq = reqCfg.base ?? 10;
    const perPower = reqCfg.perPower ?? 3;
    const minReq = reqCfg.min ?? 0;
    const maxReq = reqCfg.max ?? (skillsCfg.maxLevel ?? 200);

    requiredSkill = Math.round(baseReq + power * perPower);
    if (requiredSkill < minReq) requiredSkill = minReq;
    if (requiredSkill > maxReq) requiredSkill = maxReq;
  }

  // 2) Skill efficiency
  let skillEff = 1;
  const skillLevels = skills || {};
  const playerSkill = skillLevels[weaponType] ?? 0;

  if (requiredSkill > 0) {
    const ratio = playerSkill / requiredSkill;
    if (ratio <= 1) {
      skillEff = Math.max(0.1, Math.pow(ratio || 0.0001, 0.7));
    } else {
      const over = ratio - 1;
      const bonus = over * 0.25;
      skillEff = Math.min(1 + bonus, 1.10);
    }
  }

  // 3) Attribute efficiency
  let attrEff = 1;
  const prof = profiles[weaponType] || profiles["sword"] || {};
  const w = prof.attrWeights || {};

  function wVal(key) {
    const v = w[key];
    return typeof v === "number" ? v : 0;
  }

  const playerAttrScore =
    STR * wVal("STR") +
    DEX * wVal("DEX") +
    INT * wVal("INT") +
    VIT * wVal("VIT");

  if (recommendedAttrScore > 0) {
    const ratio = playerAttrScore / recommendedAttrScore;
    let offset = ratio - 1;
    let bonus = offset * 0.25;
    if (bonus < -0.2) bonus = -0.2;
    if (bonus > 0.2) bonus = 0.2;
    attrEff = 1 + bonus;
  }

  // 4) Final effective damage, Attack, DPS
  const avgFactor = cfgCombat.attackAverageFactor ?? 0.85;
  const effectiveMax = trueDamage * skillEff * attrEff;
  const attackValue = effectiveMax * avgFactor;
  const dps = attackValue * attackSpeed;

  const attackLabel = "Attack";
  const attackType =
    weaponAttackType || weaponType;

  return {
    maxHP,
    critChance,
    lootFind,
    attack: {
      label: attackLabel,
      type: attackType,
      value: attackValue,
      max: effectiveMax,
      trueDamage,
      skillEff,
      attrEff,
      requiredSkill,
      weaponType,
    },
    attackSpeed,
    dps,
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

  const mainWeapon =
    (equipmentSummary && equipmentSummary.mainWeapon) || null;

  const skills =
    (character && character.skills) || {};

  const derived = computeDerivedStats(
    attrTotals,
    statsBonus,
    weaponAttackType,
    skills,
    mainWeapon
  );

  return {
    baseAttributes: baseAttrs,
    attributeTotals: attrTotals,
    derivedStats: derived,
  };
}
