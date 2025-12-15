// scripts/zones/zones.ids.js
// Central place for zone template IDs and defaults.
// This prevents tedious multi-file edits when adding/renaming templates.

(function () {
  if (!window.PC) window.PC = {};
  if (!PC.ZONES) PC.ZONES = {};

  // Template IDs
  PC.ZONES.TEMPLATE_IDS = {
    TUTORIAL_START: "tutorial_start",

    // NOTE: This ID currently includes "d1" due to earlier experiments.
    // Long-term, prefer difficulty-free IDs like "primitive_forest".
    PRIMITIVE_FOREST: "primitive_forest_d1",
  };

  // Defaults
  PC.ZONES.DEFAULT_PROCEDURAL_TEMPLATE_ID = PC.ZONES.TEMPLATE_IDS.PRIMITIVE_FOREST;
  PC.ZONES.START_TEMPLATE_ID = PC.ZONES.TEMPLATE_IDS.TUTORIAL_START;
})();
