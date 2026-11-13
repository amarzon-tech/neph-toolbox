/**
 * Nephrology Toolbox — configuration.
 * DRAFT=true until Dr D (Amar Damodar) signs off on medical content.
 * Do not remove the draft banner or set DRAFT to false without his sign-off
 * in his own words.
 */
(function (global) {
  const DRAFT = true;
  const DRAFT_BANNER = "Draft – not for clinical use until reviewed by Dr D";
  const APP_NAME = "Nephrology Toolbox";
  const APP_VERSION = "0.2.0-draft";
  const SUPPORT_EMAIL = "amardamodar@gmail.com";
  const PUBLISHER = "Wellness Tech LLC";

  const config = { DRAFT, DRAFT_BANNER, APP_NAME, APP_VERSION, SUPPORT_EMAIL, PUBLISHER };
  global.NephConfig = config;
  if (typeof module !== "undefined" && module.exports) module.exports = config;
})(typeof globalThis !== "undefined" ? globalThis : this);
