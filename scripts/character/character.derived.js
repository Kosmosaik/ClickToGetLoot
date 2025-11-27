// scripts/character/character.derived.js
// Computes derived stats (HP, crit, loot find, attack, DPS, etc.).

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
      skillEff = Math.max(0.1, Math.pow(ratio || 0.0001, 0.6));
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
  
  // Add a baseline attack so numbers don't feel tiny at low power
  const baseAttack = cfgChar.baseAttack || 0;
  const attackValue = effectiveMax * avgFactor + baseAttack;
  
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
