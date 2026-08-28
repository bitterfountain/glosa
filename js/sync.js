/* Sincronización de la biblioteca con la cuenta (api.php). Local primero: localStorage sigue siendo la
   verdad en este dispositivo; con sesión, cada cambio se empuja al servidor y, al iniciar sesión y al
   volver a la pestaña, se trae lo de los demás dispositivos. Conflictos: gana la marca de tiempo más
   nueva (posAt para la posición, lastOpened para el resto), la misma regla que entre pestañas. Los
   libros en sí nunca viajan: solo su ficha y la posición. */
window.Sync = (function () {
  "use strict";

  const PUSH_DELAY = 1500;       // ms tras el último cambio antes de enviar
  const PULL_MIN_INTERVAL = 15000; // ms entre dos consultas al volver a la pestaña
  const pending = new Map();     // clave → ficha por enviar
  let pushTimer = 0;
  let lastPull = 0;
  let busy = null;               // promesa de la sincronización en curso

  function enabled() { return !!(window.Auth && Auth.current()); }

  // ---------------------------------------------------------------- de la biblioteca al servidor
  // Lo llama Library en cada cambio local ("add", "position", "remove").
  function onLibraryChange(event, rec) {
    if (!enabled() || !rec || !rec.key) return;
    if (event === "remove") {
      pending.delete(rec.key);
      Auth.api("books/remove", { method: "POST", body: { key: rec.key, at: Date.now() } }).catch((err) => console.warn("Sync: no se pudo borrar", err));
      return;
    }
    pending.set(rec.key, Library.toRemote(rec));
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => flush(false), PUSH_DELAY);
  }

  // Envía lo pendiente. keepalive: al cerrar la pestaña, para que la petición sobreviva.
  async function flush(keepalive) {
    clearTimeout(pushTimer);
    pushTimer = 0;
    if (!enabled() || !pending.size) return;
    const books = Array.from(pending.values());
    pending.clear();
    try {
      const r = await Auth.api("books/sync", { method: "POST", body: { books }, keepalive });
      if (!keepalive) merge(r.books);
    } catch (err) {
      console.warn("Sync: envío fallido, se reintentará", err);
      books.forEach((b) => { if (!pending.has(b.key)) pending.set(b.key, b); });
    }
  }

  // ---------------------------------------------------------------- del servidor a la biblioteca
  // Aplica la lista del servidor: crea lo que falta, adopta posiciones más nuevas, quita lo borrado en
  // otro dispositivo (salvo que aquí se haya abierto después del borrado: entonces se vuelve a subir).
  function merge(list) {
    if (!Array.isArray(list)) return;
    let changed = false;
    list.forEach((b) => {
      if (b.deleted) {
        const local = Library.findByKey(b.key);
        if (!local) return;
        if ((local.lastOpened || 0) <= (b.deletedAt || 0)) { Library.removeLocal(b.key); changed = true; }
        else onLibraryChange("add", local);
        return;
      }
      if (Library.applyRemote(b)) changed = true;
    });
    if (changed && window.App && App.syncPosition) App.syncPosition();
  }

  // Sincronización completa: sube toda la biblioteca local y se queda con la mezcla.
  function full() {
    if (!enabled()) return Promise.resolve();
    if (busy) return busy;
    busy = (async () => {
      try {
        pending.clear();
        const r = await Auth.api("books/sync", { method: "POST", body: { books: Library.exportAll() } });
        merge(r.books);
        lastPull = Date.now();
      } catch (err) {
        console.warn("Sync: sincronización completa fallida", err);
      } finally {
        busy = null;
      }
    })();
    return busy;
  }

  // Solo bajar (al volver a la pestaña): más barato que la completa.
  async function pull(force) {
    if (!enabled() || busy) return;
    if (!force && Date.now() - lastPull < PULL_MIN_INTERVAL) return;
    lastPull = Date.now();
    try {
      const r = await Auth.api("books");
      merge(r.books);
    } catch (err) {
      console.warn("Sync: no se pudo consultar", err);
    }
  }

  function init() {
    if (!window.Auth || !Auth.available()) return;
    Auth.onChange((user) => {
      if (user) full();
      else { pending.clear(); clearTimeout(pushTimer); }
    });
    // Si la sesión ya estaba abierta al cargar, Auth.init dispara onChange con el usuario y se sincroniza.
    window.addEventListener("focus", () => pull(false));
    document.addEventListener("visibilitychange", () => { if (document.hidden) flush(true); else pull(false); });
    window.addEventListener("pagehide", () => flush(true));
  }

  return { init, onLibraryChange, flush, full, pull, enabled };
})();
