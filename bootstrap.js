/* global Zotero, Services, Components */
/*
 * Zotero Pixel-Blue Workspace.
 * Lifecycle and scoped stylesheets follow Zotero's official bootstrap example
 * and the Warm Theme for Zotero implementation (see CREDITS.md).
 */

var chromeHandle = null;
var PixelBlueWorkspace = null;

function install() {}
function uninstall() {}

async function startup({ id, rootURI }) {
  await Zotero.initializationPromise;

  const aomStartup = Components.classes["@mozilla.org/addons/addon-manager-startup;1"]
    .getService(Components.interfaces.amIAddonManagerStartup);
  chromeHandle = aomStartup.registerChrome(Services.io.newURI(rootURI + "manifest.json"), [
    ["content", "zotero-pixel-blue-workspace", rootURI + "content/"]
  ]);

  PixelBlueWorkspace = createPixelBlueWorkspace(id);
  try {
    await PixelBlueWorkspace.start();
  }
  catch (error) {
    Zotero.logError(error);
    try { PixelBlueWorkspace.stop(); } catch (_) {}
    PixelBlueWorkspace = null;
    chromeHandle?.destruct();
    chromeHandle = null;
    throw error;
  }
}

function onMainWindowLoad({ window }) {
  PixelBlueWorkspace?.decorateWindow(window);
}

function onMainWindowUnload({ window }) {
  PixelBlueWorkspace?.undecorateWindow(window);
}

function shutdown() {
  try {
    PixelBlueWorkspace?.stop();
  }
  finally {
    PixelBlueWorkspace = null;
    chromeHandle?.destruct();
    chromeHandle = null;
  }
}

function createPixelBlueWorkspace(pluginID) {
  const PREF_ENABLED = "extensions.zotero-pixel-blue-workspace.enabled";
  const PREF_GRID = "extensions.zotero-pixel-blue-workspace.grid";
  const ATTR_THEME = "zpbw-theme";
  const ATTR_GRID = "zpbw-grid";
  const CSS_URL = "chrome://zotero-pixel-blue-workspace/content/theme.css";
  const READER_CSS_URL = "chrome://zotero-pixel-blue-workspace/content/reader.css";
  const HTML_NS = "http://www.w3.org/1999/xhtml";
  const MAIN_STYLE_ID = "zpbw-stylesheet";
  const READER_STYLE_ID = "zpbw-reader-stylesheet";
  const MENU_ID = "zpbw-tools-menu";

  let readerCSS = "";
  let enabledObserver = null;
  let gridObserver = null;
  let readerHookRegistered = false;
  let watcherRegistered = false;

  function getPref(name, fallback) {
    try {
      const value = Zotero.Prefs.get(name, true);
      return typeof value === "boolean" ? value : fallback;
    }
    catch (_) { return fallback; }
  }
  const isEnabled = () => getPref(PREF_ENABLED, true);
  const isGrid = () => getPref(PREF_GRID, true);

  function isZoteroWindow(win) {
    try {
      return !!win && !win.closed &&
        String(win.location.href).startsWith("chrome://zotero/");
    }
    catch (_) { return false; }
  }

  function addMenu(win) {
    // Crucial: insert only in the existing Tools popup. Never replace or move
    // the top-level menubar (Arquivo / Editar / Exibir / Ferramentas / Ajuda).
    if (!win.ZoteroPane) return;
    const doc = win.document;
    const toolsPopup = doc.getElementById("menu_ToolsPopup");
    if (!toolsPopup) return;

    let menu = doc.getElementById(MENU_ID);
    if (!menu) {
      menu = doc.createXULElement("menu");
      menu.id = MENU_ID;
      menu.setAttribute("label", "Pixel-Blue Workspace");
      const popup = doc.createXULElement("menupopup");

      const enableItem = doc.createXULElement("menuitem");
      enableItem.id = "zpbw-enable-item";
      enableItem.setAttribute("type", "checkbox");
      enableItem.setAttribute("label", "Ativar tema / Enable theme");
      enableItem.addEventListener("command", () => {
        Zotero.Prefs.set(PREF_ENABLED, !isEnabled(), true);
      });
      popup.appendChild(enableItem);

      const gridItem = doc.createXULElement("menuitem");
      gridItem.id = "zpbw-grid-item";
      gridItem.setAttribute("type", "checkbox");
      gridItem.setAttribute("label", "Grade discreta / Paper grid");
      gridItem.addEventListener("command", () => {
        Zotero.Prefs.set(PREF_GRID, !isGrid(), true);
      });
      popup.appendChild(gridItem);
      menu.appendChild(popup);
      toolsPopup.appendChild(menu);
    }
    const enableItem = doc.getElementById("zpbw-enable-item");
    const gridItem = doc.getElementById("zpbw-grid-item");
    // Zotero 11 (Firefox 153) treats XUL boolean attributes as present/absent.
    // Setting disabled="false" would DISABLE the control in Zotero 11.
    // The reflected properties work across Zotero 7–11 and do not risk this.
    if (enableItem) enableItem.checked = isEnabled();
    if (gridItem) {
      gridItem.checked = isGrid();
      gridItem.disabled = !isEnabled();
    }
  }

  function decorateWindow(win) {
    if (!isZoteroWindow(win)) return;
    try {
      const doc = win.document;
      if (!doc?.documentElement) return;
      let link = doc.getElementById(MAIN_STYLE_ID);
      if (!link) {
        link = doc.createElementNS(HTML_NS, "link");
        link.id = MAIN_STYLE_ID;
        link.rel = "stylesheet";
        link.href = CSS_URL;
        doc.documentElement.appendChild(link);
      }
      doc.documentElement.toggleAttribute(ATTR_THEME, isEnabled());
      doc.documentElement.toggleAttribute(ATTR_GRID, isEnabled() && isGrid());
      addMenu(win);
    }
    catch (error) { Zotero.logError(error); }
  }

  function undecorateWindow(win) {
    try {
      const doc = win?.document;
      if (!doc?.documentElement) return;
      doc.documentElement.removeAttribute(ATTR_THEME);
      doc.documentElement.removeAttribute(ATTR_GRID);
      doc.getElementById(MAIN_STYLE_ID)?.remove();
      doc.getElementById(MENU_ID)?.remove();
    }
    catch (error) { Zotero.logError(error); }
  }

  // Theme only the PDF/EPUB reader *UI*, never the scientific document page.
  function decorateReader(reader) {
    try {
      const doc = reader?._iframeWindow?.document;
      if (!doc?.documentElement || !readerCSS) return;
      if (!doc.getElementById(READER_STYLE_ID)) {
        const style = doc.createElement("style");
        style.id = READER_STYLE_ID;
        style.textContent = readerCSS;
        (doc.head || doc.documentElement).appendChild(style);
      }
      doc.documentElement.toggleAttribute(ATTR_THEME, isEnabled());
      doc.documentElement.toggleAttribute(ATTR_GRID, isEnabled() && isGrid());
    }
    catch (error) { Zotero.logError(error); }
  }

  function undecorateReader(reader) {
    try {
      const doc = reader?._iframeWindow?.document;
      if (!doc?.documentElement) return;
      doc.documentElement.removeAttribute(ATTR_THEME);
      doc.documentElement.removeAttribute(ATTR_GRID);
      doc.getElementById(READER_STYLE_ID)?.remove();
    }
    catch (error) { Zotero.logError(error); }
  }

  function allWindows() {
    const windows = [];
    const enumerator = Services.wm.getEnumerator(null);
    while (enumerator.hasMoreElements()) windows.push(enumerator.getNext());
    return windows;
  }

  function allReaders() { return Zotero.Reader?._readers || []; }

  function refreshAll() {
    for (const win of allWindows()) decorateWindow(win);
    for (const reader of allReaders()) decorateReader(reader);
  }

  const windowWatcher = {
    observe(subject, topic) {
      if (topic !== "domwindowopened") return;
      subject.addEventListener("load", () => decorateWindow(subject), { once: true });
    }
  };

  function onReaderToolbar(event) { decorateReader(event.reader); }

  async function start() {
    try {
      readerCSS = await Zotero.File.getContentsFromURLAsync(READER_CSS_URL);
    }
    catch (error) {
      Zotero.logError(error);
      readerCSS = ""; // Main theme still works if a reader API changes.
    }

    Services.ww.registerNotification(windowWatcher);
    watcherRegistered = true;

    try {
      if (Zotero.Reader?.registerEventListener) {
        Zotero.Reader.registerEventListener("renderToolbar", onReaderToolbar, pluginID);
        readerHookRegistered = true;
      }
    }
    catch (error) { Zotero.logError(error); }

    enabledObserver = Zotero.Prefs.registerObserver(PREF_ENABLED, refreshAll, true);
    gridObserver = Zotero.Prefs.registerObserver(PREF_GRID, refreshAll, true);
    refreshAll();
  }

  function stop() {
    if (watcherRegistered) {
      Services.ww.unregisterNotification(windowWatcher);
      watcherRegistered = false;
    }
    if (readerHookRegistered) {
      try { Zotero.Reader.unregisterEventListener("renderToolbar", onReaderToolbar); }
      catch (error) { Zotero.logError(error); }
      readerHookRegistered = false;
    }
    if (enabledObserver != null) Zotero.Prefs.unregisterObserver(enabledObserver);
    if (gridObserver != null) Zotero.Prefs.unregisterObserver(gridObserver);
    enabledObserver = gridObserver = null;
    for (const win of allWindows()) undecorateWindow(win);
    for (const reader of allReaders()) undecorateReader(reader);
  }

  return { start, stop, decorateWindow, undecorateWindow };
}
