/* =========================================================
   App settings. The only file to edit when connecting services.
   See SETUP.md for where each value comes from.
   ========================================================= */
window.AXOM_CONFIG = {
  /* Where images live. Keep "content/media/" to serve them with the app.
     After moving media to Cloudflare R2, set the bucket's public URL, e.g.
     "https://media.axomrank.in/" (must end with "/"). */
  mediaBase: "content/media/",

  /* Firebase (accounts + progress sync). Leave null to run without accounts:
     progress is then saved only on the device.
     Paste the config object from Firebase console → Project settings → Your apps → Web app. */
  firebase: null,
  /* Example:
  firebase: {
    apiKey: "…",
    authDomain: "axomrank-app.firebaseapp.com",
    projectId: "axomrank-app",
    appId: "…",
  },
  */
};
