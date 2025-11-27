// scripts/character/character.skills.js
// Character weapon skills helpers.

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
