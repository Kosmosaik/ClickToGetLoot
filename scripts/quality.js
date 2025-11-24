// scripts/quality.js

// Use tiers from config (F..S)
const TIER_ORDER = GAME_CONFIG.quality.tiers.slice();
const SUBLEVELS_PER_TIER = 10; // 0..9

// Precomputed quality ladder (F0..F9, E0..E9, ..., S0..S9)
const QUALITY_BUCKETS = [];
(function initQualityBuckets() {
  const base = GAME_CONFIG.quality.expBase;
  let rank = 0; // 0 = F0 (worst, most common), last = S9 (best, rarest)

  for (const tier of TIER_ORDER) {
    for (let sub = 0; sub < SUBLEVELS_PER_TIER; sub++) {
      const weight = Math.pow(base, rank);
      QUALITY_BUCKETS.push({
        code: `${tier}${sub}`,
        tier,
        sub,
        weight,
      });
      rank++;
    }
  }
})();

// Generic weighted picker
function pickWeighted(list) {
  const total = list.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of list) {
    if ((r -= p.weight) <= 0) return p;
  }
  return list[list.length - 1];
}

// Public: roll a quality string like "F7", "B3", "S9"
function rollQuality() {
  const q = pickWeighted(QUALITY_BUCKETS);
  return q.code;
}

// Multiplier for stats based on quality string
function qualityMultiplier(q) {
  const tier = q[0];
  const sub = parseInt(q.slice(1), 10);
  const tierIdx = TIER_ORDER.indexOf(tier);

  const stepsPerTier = SUBLEVELS_PER_TIER; // 10
  const totalSteps = TIER_ORDER.length * stepsPerTier; // 7 * 10 = 70
  const step = tierIdx * stepsPerTier + sub; // 0..69

  const t = step / (totalSteps - 1);
  const min = 0.70, max = 1.30;
  return min + (max - min) * t;
}
