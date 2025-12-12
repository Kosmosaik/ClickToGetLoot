// scripts/bootstrap.js
(function () {
  // Basic sanity checks
  if (!window.PC) {
    console.error("Bootstrap failed: window.PC missing. Did pc.core.js load?");
    return;
  }
  if (!window.GAME_CONFIG) {
    console.error("Bootstrap failed: GAME_CONFIG missing. Did config.js load?");
    return;
  }

  // Optional: log a clean "boot ok"
  console.log(`Bootstrap OK — ProgressCrawl v${GAME_CONFIG.version}`);

  // If later we add PC.game.init(), it can go here.
})();
