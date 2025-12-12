// scripts/bootstrap.js
(function () {
  if (!window.PC) {
    console.error("Bootstrap failed: window.PC missing. Did pc.core.js load?");
    return;
  }

  // In browsers, top-level `const GAME_CONFIG = ...` does NOT attach to window.
  const hasGameConfig =
    (typeof GAME_CONFIG !== "undefined") || !!window.GAME_CONFIG;

  if (!hasGameConfig) {
    console.error("Bootstrap failed: GAME_CONFIG missing. Did config.js load?");
    return;
  }

  // Prefer the non-window one if it exists
  const cfg =
    (typeof GAME_CONFIG !== "undefined") ? GAME_CONFIG : window.GAME_CONFIG;

  console.log(`Bootstrap OK — ProgressCrawl v${cfg.version}`);
})();
