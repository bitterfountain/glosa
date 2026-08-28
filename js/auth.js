/* Cuenta opcional con Google: botón de inicio de sesión (Google Identity Services), sesión propia en
   una cookie HttpOnly que pone api.php, y el modal de cuenta. Sin las metas google-client-id (las
   inyecta index.php desde el .env; abriendo index.html desde disco no existen) no se enseña nada y la
   app funciona como siempre, sin cuenta. */
window.Auth = (function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18n.t(k, v);
  const GSI_SRC = "https://accounts.google.com/gsi/client";
  let user = null;
  let gsiPromise = null;
  let buttonRendered = false;
  const listeners = [];

  function meta(name) {
    const el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.content : "";
  }
  const clientId = meta("google-client-id");

  function available() { return !!clientId && /^https?:$/.test(location.protocol); }
  function current() { return user; }
  function onChange(fn) { listeners.push(fn); }

  // ---------------------------------------------------------------- API propia (api.php)
  // Lanza Error con .code (código de api.php) y .status. Un 401 cierra la sesión local.
  async function api(route, opts) {
    opts = opts || {};
    const init = {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: { "X-Requested-With": "Glosa" },
      keepalive: !!opts.keepalive,
    };
    if (opts.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    const r = await fetch("api.php?r=" + encodeURIComponent(route), init);
    let data = null;
    try { data = await r.json(); } catch (_) { /* sin cuerpo */ }
    if (!r.ok || !data || data.ok === false) {
      const err = new Error((data && data.error) || ("HTTP " + r.status));
      err.code = (data && data.error) || "http";
      err.status = r.status;
      if (r.status === 401 && route !== "auth/google") setUser(null);
      throw err;
    }
    return data;
  }

  function setUser(u) {
    const changed = JSON.stringify(u) !== JSON.stringify(user);
    user = u;
    renderState();
    if (changed) listeners.forEach((fn) => fn(user));
  }

  // ---------------------------------------------------------------- Google Identity Services
  function loadGis() {
    if (gsiPromise) return gsiPromise;
    gsiPromise = new Promise((resolve, reject) => {
      if (window.google && google.accounts) { resolve(); return; }
      const s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => { gsiPromise = null; reject(new Error("gsi")); };
      document.head.appendChild(s);
    });
    return gsiPromise;
  }

  async function onCredential(resp) {
    try {
      const r = await api("auth/google", { method: "POST", body: { credential: resp.credential } });
      setUser(r.user);
      App.toast(t("toast.login", { name: r.user.name || r.user.email }), 3500);
    } catch (err) {
      console.error(err);
      App.toast(t("toast.authError", { error: err.code || err.message }), 5000);
    }
  }

  // Botón oficial de Google dentro del modal de cuenta (se pinta una vez, al abrirlo la primera vez).
  async function renderButton() {
    const box = $("gsi-button");
    if (!box || buttonRendered) return;
    try {
      await loadGis();
    } catch (_) {
      box.textContent = t("account.gsiError");
      return;
    }
    google.accounts.id.initialize({ client_id: clientId, callback: onCredential, ux_mode: "popup", auto_select: false, itp_support: true, use_fedcm_for_prompt: true });
    google.accounts.id.renderButton(box, {
      theme: Settings.effectiveTheme && Settings.effectiveTheme() === "dark" ? "filled_black" : "outline",
      size: "large", text: "signin_with", shape: "pill", logo_alignment: "left", locale: I18n.locale, width: 280,
    });
    buttonRendered = true;
  }

  async function logout() {
    try { await api("auth/logout", { method: "POST" }); } catch (_) { /* la cookie caduca sola */ }
    try { google.accounts.id.disableAutoSelect(); } catch (_) { /* sin GIS */ }
    setUser(null);
    App.toast(t("toast.logout"));
  }

  async function deleteAccount() {
    if (!confirm(t("account.delete.confirm"))) return;
    try {
      await api("me", { method: "DELETE" });
      setUser(null);
      App.toast(t("toast.accountDeleted"), 4000);
      close();
    } catch (err) {
      App.toast(t("toast.authError", { error: err.code || err.message }), 5000);
    }
  }

  // ---------------------------------------------------------------- interfaz
  function renderState() {
    const logged = !!user;
    document.body.classList.toggle("is-logged", logged);
    const btn = $("btn-account");
    if (btn) {
      btn.hidden = !available();
      btn.classList.toggle("is-logged", logged);
      const img = $("account-avatar");
      const hasAvatar = logged && !!user.picture;
      btn.classList.toggle("has-avatar", hasAvatar);
      if (img) {
        if (hasAvatar) { img.src = user.picture; img.hidden = false; } else { img.removeAttribute("src"); img.hidden = true; }
      }
      btn.title = logged ? (user.name || user.email) : t("account.title");
    }
    const out = $("account-out");
    const inn = $("account-in");
    if (out) out.hidden = logged;
    if (inn) inn.hidden = !logged;
    if (logged) {
      $("account-name").textContent = user.name || "";
      $("account-email").textContent = user.email || "";
      const pic = $("account-picture");
      if (user.picture) { pic.src = user.picture; pic.hidden = false; } else { pic.hidden = true; }
      $("btn-account-drive").hidden = !(window.Drive && Drive.available());
    }
    // Los textos de la biblioteca cambian con la sesión; se cambia la clave data-i18n para que
    // I18n.apply() (cambio de idioma) los mantenga.
    [["library-sub", "lib.sub"], ["library-note", "lib.note"]].forEach(([id, key]) => {
      const el = $(id);
      if (!el) return;
      el.dataset.i18n = logged ? key + ".synced" : key;
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-needs-drive]").forEach((el) => { el.hidden = !(logged && window.Drive && Drive.available()); });
  }

  function show() {
    if (!available()) return;
    Popup.hide();
    renderState();
    $("account-modal").hidden = false;
    if (!user) renderButton();
  }
  function close() { $("account-modal").hidden = true; }
  function isOpen() { return !$("account-modal").hidden; }

  async function init() {
    renderState();
    if (!available()) return;
    $("btn-account").addEventListener("click", () => (isOpen() ? close() : show()));
    document.querySelectorAll("[data-close-account]").forEach((el) => el.addEventListener("click", close));
    $("btn-logout").addEventListener("click", logout);
    $("btn-delete-account").addEventListener("click", deleteAccount);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { close(); e.stopPropagation(); } }, true);
    I18n.onChange && I18n.onChange(renderState);
    try {
      const r = await api("me");
      setUser(r.user);
    } catch (_) {
      setUser(null);
    }
  }

  return { init, available, current, onChange, api, show, close, loadGis, meta, clientId };
})();
