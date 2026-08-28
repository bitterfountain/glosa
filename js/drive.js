/* Abrir libros desde Google Drive. Permiso drive.file (solo los ficheros que el lector elige en el
   selector de Google, nada más de su Drive) pedido en el momento de pulsar "Abrir de Drive"; el fichero
   se descarga directamente de Google al navegador (la API admite CORS) y se guarda en IndexedDB como
   cualquier otro. El servidor de Glosa no ve ni el fichero ni el token de Google: la biblioteca solo
   guarda el id del fichero (drive:<id>) para volver a bajarlo en otro dispositivo.
   Necesita las metas google-client-id y google-api-key (y google-app-id, el número del proyecto, para
   que el selector autorice a la app sobre lo elegido). */
window.Drive = (function () {
  "use strict";

  const SCOPE = "https://www.googleapis.com/auth/drive.file";
  const API = "https://www.googleapis.com/drive/v3/files/";
  const GAPI_SRC = "https://apis.google.com/js/api.js";
  const MIMES = "application/pdf,application/epub+zip,text/html,application/xhtml+xml,text/plain";
  const MAX_BYTES = 80 * 1024 * 1024;
  const t = (k, v) => I18n.t(k, v);
  let token = null;
  let tokenExpires = 0;
  let pickerPromise = null;

  function available() { return Auth.available() && !!Auth.meta("google-api-key"); }
  function isNarrow() { return Math.min(window.innerWidth, window.innerHeight) < 600; }

  // ---------------------------------------------------------------- token de acceso (en memoria)
  // Popup de Google la primera vez (consentimiento); después, si el lector ya lo concedió, Google lo
  // devuelve sin preguntar. Caduca en una hora y se vuelve a pedir.
  async function getToken() {
    if (token && Date.now() < tokenExpires - 60000) return token;
    await Auth.loadGis();
    return new Promise((resolve, reject) => {
      const user = Auth.current();
      const client = google.accounts.oauth2.initTokenClient({
        client_id: Auth.clientId,
        scope: SCOPE,
        hint: user && user.email ? user.email : undefined,
        callback: (r) => {
          if (r.error) { reject(new Error(r.error)); return; }
          token = r.access_token;
          tokenExpires = Date.now() + (Number(r.expires_in) || 3600) * 1000;
          resolve(token);
        },
        error_callback: (e) => reject(new Error(e && e.type ? e.type : "popup")),
      });
      client.requestAccessToken({ prompt: "" });
    });
  }

  // ---------------------------------------------------------------- selector de Google
  function loadPicker() {
    if (pickerPromise) return pickerPromise;
    pickerPromise = new Promise((resolve, reject) => {
      const done = () => gapi.load("picker", { callback: resolve, onerror: () => reject(new Error("picker")) });
      if (window.gapi && gapi.load) { done(); return; }
      const s = document.createElement("script");
      s.src = GAPI_SRC;
      s.async = true;
      s.onload = done;
      s.onerror = () => { pickerPromise = null; reject(new Error("gapi")); };
      document.head.appendChild(s);
    });
    return pickerPromise;
  }

  // Abre el selector y devuelve { id, name } del fichero elegido, o null si se cancela.
  async function pick() {
    const tok = await getToken();
    await loadPicker();
    return new Promise((resolve) => {
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(MIMES).setIncludeFolders(true).setParent("root");
      const all = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(MIMES);
      const b = new google.picker.PickerBuilder()
        .addView(all)
        .addView(view)
        .addView(google.picker.ViewId.RECENTLY_PICKED)
        .setOAuthToken(tok)
        .setDeveloperKey(Auth.meta("google-api-key"))
        .setTitle(t("drive.pickerTitle"))
        .setLocale(I18n.locale)
        .setCallback((d) => {
          if (d.action === google.picker.Action.PICKED) resolve(d.docs && d.docs[0] ? { id: d.docs[0].id, name: d.docs[0].name, size: d.docs[0].sizeBytes } : null);
          else if (d.action === google.picker.Action.CANCEL) resolve(null);
        });
      const appId = Auth.meta("google-app-id");
      if (appId) b.setAppId(appId);
      // El selector no es adaptable: tiene un mínimo de 566×350 y en pantallas estrechas se escala
      // entero para caber. Pidiendo el tamaño mínimo y sin barra lateral, el escalado es la mitad de agresivo.
      if (isNarrow()) b.setSize(566, 350).enableFeature(google.picker.Feature.NAV_HIDDEN);
      b.build().setVisible(true);
    });
  }

  // ---------------------------------------------------------------- descarga
  async function fetchFile(fileId, name) {
    const tok = await getToken();
    const headers = { Authorization: "Bearer " + tok };
    const m = await fetch(API + encodeURIComponent(fileId) + "?fields=name,size,mimeType", { headers });
    if (!m.ok) throw new Error("HTTP " + m.status);
    const meta = await m.json();
    const size = Number(meta.size) || 0;
    if (size > MAX_BYTES) throw new Error(t("drive.tooBig", { mb: Math.round(size / 1048576), max: Math.round(MAX_BYTES / 1048576) }));
    const r = await fetch(API + encodeURIComponent(fileId) + "?alt=media", { headers });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const blob = await r.blob();
    return new File([blob], name || meta.name || "libro", { type: meta.mimeType || blob.type || "" });
  }

  // Botón "Abrir de Google Drive": elegir, bajar y abrir.
  async function open() {
    if (!available()) return;
    // En el móvil el selector del sistema ("Abrir libro") ya incluye Google Drive y se maneja mejor.
    if (isNarrow()) App.toast(t("drive.mobileHint"), 6000);
    let doc = null;
    try {
      doc = await pick();
    } catch (err) {
      console.error(err);
      if (String(err.message) !== "popup_closed" && String(err.message) !== "access_denied") App.toast(t("drive.error", { error: err.message }), 5000);
      return;
    }
    if (!doc) return;
    Auth.close();
    App.toast(t("catalog.downloading", { title: doc.name }), 6000);
    try {
      const file = await fetchFile(doc.id, doc.name);
      await App.openFile(file, { kind: "drive", ref: doc.id });
    } catch (err) {
      console.error(err);
      App.toast(t("drive.error", { error: err.message }), 5000);
    }
  }

  function init() {
    document.querySelectorAll("[data-open-drive]").forEach((el) => el.addEventListener("click", open));
  }

  return { init, available, open, fetchFile };
})();
