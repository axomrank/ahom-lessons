/* =========================================================
   Account sign-in and progress sync (Firebase Auth + Firestore).
   Loaded only when AXOM_CONFIG.firebase is set. Without it the app
   works fully offline with progress saved on the device.
   Data: one document per learner at users/{uid} (see common.js snapshot()).
   ========================================================= */
const V = "10.12.2";
const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
const { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
const { getFirestore, doc, getDoc, setDoc } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);

export function start({ CFG, auth, snapshot, merge, applySnapshot, listeners }) {
  const app = initializeApp(CFG.firebase);
  const fbAuth = getAuth(app);
  const db = getFirestore(app);
  let timer = null, busy = false;

  async function push() {
    if (!auth.user || busy) return;
    try { await setDoc(doc(db, "users", auth.user.uid), snapshot()); } catch (e) { console.warn("Sync push failed", e); }
  }
  const pushSoon = () => { clearTimeout(timer); timer = setTimeout(push, 4000); };

  async function pull() {
    busy = true;
    try {
      const ref = doc(db, "users", auth.user.uid);
      const snap = await getDoc(ref);
      const merged = snap.exists() ? merge(snapshot(), snap.data()) : snapshot();
      applySnapshot(merged);
      await setDoc(ref, merged);
    } catch (e) { console.warn("Sync pull failed", e); }
    busy = false;
  }

  auth.signIn = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(fbAuth, provider); }
    catch (e) { if (e && e.code === "auth/popup-blocked") await signInWithRedirect(fbAuth, provider); else throw e; }
  };
  auth.signOut = () => signOut(fbAuth);

  onAuthStateChanged(fbAuth, async (user) => {
    auth.user = user ? { uid: user.uid, name: user.displayName || "", photo: user.photoURL || "" } : null;
    if (user) await pull();
    auth.ready = true;
    auth.onChange.forEach((f) => f(auth.user));
  });

  listeners.push(pushSoon);
  document.addEventListener("visibilitychange", () => { if (document.hidden) push(); });
}
