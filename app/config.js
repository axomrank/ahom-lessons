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
     Project: axomrank-ahom (Firebase console → Project settings → Your apps → "Ahom Lessons web").
     These values are public by design; firestore.rules protects the data. */
  firebase: {
    apiKey: "AIzaSyBP2HszDlaIr3aNEiuNTfFReENCp8LL_5A",
    authDomain: "axomrank-ahom.firebaseapp.com",
    projectId: "axomrank-ahom",
    appId: "1:355643471385:web:214d811bdeb632c67cdc88",
  },
};
