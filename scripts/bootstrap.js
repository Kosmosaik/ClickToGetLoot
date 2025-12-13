// scripts/bootstrap.js
(function () {
  if (!window.PC) {
    console.error("BOOT FAIL: window.PC missing. Did scripts/core/pc.core.js load?");
    return;
  }

  if (typeof STATE !== "function" || typeof EXP !== "function" || typeof MOV !== "function") {
    console.error("BOOT FAIL: STATE/EXP/MOV missing. Did scripts/core/pc.api.js load?");
    return;
  }

  // Hard dependency checks (add/remove as your project evolves)
  const requiredFns = [
    "setScreen",
    "resetCharacterCreation",
    "renderSaveList",
    "createDefaultSkills",
    "loadInventoryFromSnapshot",
  ];

  const missing = requiredFns.filter((name) => typeof window[name] !== "function");
  if (missing.length) {
    console.error("BOOT FAIL: Missing required functions:", missing);
    console.error("This almost always means a missing <script src> include or wrong load order in index.html.");
    return;
  }

  // Startup
  setScreen("start");
  resetCharacterCreation();
  renderSaveList();

  console.log("BOOT OK");
})();
