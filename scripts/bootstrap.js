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

  // ---- App startup (single entrypoint) ----
  // These functions live in other scripts; since bootstrap.js loads last,
  // they should exist by now.
  if (typeof setScreen === "function") setScreen("start");
  else console.error("Bootstrap startup failed: setScreen() missing.");

  if (typeof resetCharacterCreation === "function") resetCharacterCreation();
  else console.error("Bootstrap startup failed: resetCharacterCreation() missing.");

  if (typeof renderSaveList === "function") renderSaveList();
  else console.error("Bootstrap startup failed: renderSaveList() missing.");
})();
