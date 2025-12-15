// scripts/content/content.rng.js
// 0.0.70e — Deterministic RNG helpers for content placement.
//
// Guiding goal:
// - Make deterministic content placement easy and consistent.
// - Provide a small, well-defined API used by all content systems.

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // ---------------------------------------------------------------------------
  // Step 1.1 — Seed helpers
  // ---------------------------------------------------------------------------

  // Hash a string into a stable uint32.
  // (Small and fast; not cryptographic.)
  PC.content.seedFromString = PC.content.seedFromString || function seedFromString(str) {
    const s = String(str ?? "");
    let h = 2166136261; // FNV-1a base
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  // Mulberry32 RNG factory from uint32 seed.
  function mulberry32(seedU32) {
    let t = seedU32 >>> 0;
    return function nextFloat() {
      t += 0x6d2b79f5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Create an RNG object from a string/number seed.
  // API:
  //   rng.nextFloat() -> [0,1)
  //   rng.nextInt(min,max) -> int inclusive
  PC.content.makeRng = PC.content.makeRng || function makeRng(seedValue) {
    const seedU32 = PC.content.seedFromString(seedValue);
    const nextFloat = mulberry32(seedU32 || 1);

    return {
      seedU32,
      nextFloat,
      nextInt(min, max) {
        const a = Math.floor(Number(min) || 0);
        const b = Math.floor(Number(max) || 0);
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        if (hi === lo) return lo;
        return lo + Math.floor(nextFloat() * (hi - lo + 1));
      },
    };
  };

  // Back-compat: old call sites used createRng(seed) -> function.
  // We keep it as a thin wrapper.
  PC.content.createRng = PC.content.createRng || function createRng(seedValue) {
    const r = PC.content.makeRng(seedValue);
    return function rng() {
      return r.nextFloat();
    };
  };

  // ---------------------------------------------------------------------------
  // Step 1.2 — Selection helpers
  // ---------------------------------------------------------------------------

  // Shuffle an array in-place (Fisher–Yates). Returns the same array.
  PC.content.shuffle = PC.content.shuffle || function shuffle(rngObjOrFn, arr) {
    if (!Array.isArray(arr) || arr.length <= 1) return arr;
    const nextFloat =
      typeof rngObjOrFn === "function" ? rngObjOrFn : rngObjOrFn?.nextFloat || Math.random;

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(nextFloat() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  };

  // Pick a single entry from weighted entries.
  // Supports both:
  // - { w: number }
  // - { weight: number }
  PC.content.pickWeighted = PC.content.pickWeighted || function pickWeighted(rngObjOrFn, entries) {
    if (!Array.isArray(entries) || entries.length === 0) return null;
    const nextFloat =
      typeof rngObjOrFn === "function" ? rngObjOrFn : rngObjOrFn?.nextFloat || Math.random;

    let total = 0;
    for (const e of entries) {
      const w = Math.max(0, Number(e?.w ?? e?.weight ?? 0));
      total += w;
    }
    if (total <= 0) return entries[0] || null;

    let roll = nextFloat() * total;
    for (const e of entries) {
      roll -= Math.max(0, Number(e?.w ?? e?.weight ?? 0));
      if (roll <= 0) return e;
    }
    return entries[entries.length - 1] || null;
  };

  // Pick N unique items from a source array.
  // Returns a new array (does not mutate source).
  PC.content.pickManyUnique = PC.content.pickManyUnique || function pickManyUnique(rngObjOrFn, source, n) {
    if (!Array.isArray(source) || source.length === 0) return [];
    const k = Math.max(0, Math.min(source.length, Math.floor(Number(n) || 0)));
    if (k === 0) return [];
    const copy = source.slice();
    PC.content.shuffle(rngObjOrFn, copy);
    return copy.slice(0, k);
  };
})();
