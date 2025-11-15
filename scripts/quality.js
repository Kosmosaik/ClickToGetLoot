// scripts/quality.js

// Use tiers from config (F..S)
const TIER_ORDER = GAME_CONFIG.quality.tiers.slice();

// Precomputed quality ladder (F9..F1, E9..E1, ..., S9..S1)
const QUALITY_BUCKETS = [];
(function initQualityBuckets() {
  const base = GAME_CONFIG.quality.expBase;
  let rank = 0; // 0 = F9 (worst), 62 = S1 (best)

  for (const tier of TIER_ORDER) {
    for (let sub = 9; sub >= 1; sub--) {
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

// Public: roll a quality string like "F7", "B3", "S1"
function rollQuality() {
  const q = pickWeighted(QUALITY_BUCKETS);
  return q.code;
}

// Multiplier for stats based on quality string
function qualityMultiplier(q) {
  const tier = q[0];
  const sub = parseInt(q.slice(1), 10);
  const tierIdx = TIER_ORDER.indexOf(tier);
  const totalSteps = TIER_ORDER.length * 9;
  const step = tierIdx * 9 + (10 - sub); // 0..62
  const t = step / (totalSteps - 1);
  const min = 0.75, max = 1.8;
  return min + (max - min) * t;
}
