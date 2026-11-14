/* Pure-JavaScript lifecycle test using a minimal Zotero/XUL DOM mock.
 * This is NOT a substitute for testing on a real Zotero installation. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');

function makeDocument() {
  let doc;
  function el(tag) {
    return {
      tag, id: '', parentNode: null, children: [], attrs: {}, events: {}, checked: false, disabled: false,
      setAttribute(key, value) { this.attrs[key] = String(value); },
      removeAttribute(key) { delete this.attrs[key]; },
      toggleAttribute(key, value) {
        if (value) this.attrs[key] = ''; else delete this.attrs[key];
      },
      hasAttribute(key) { return key in this.attrs; },
      addEventListener(event, cb) { this.events[event] = cb; },
      appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
      remove() {
        if (this.parentNode) {
          this.parentNode.children = this.parentNode.children.filter(x => x !== this);
          this.parentNode = null;
        }
      }
    };
  }
  const documentElement = el('window');
  doc = {
    documentElement, head: documentElement,
    createXULElement: el, createElementNS: (_ns, tag) => el(tag),
    createElement: el,
    getElementById(id) {
      function find(node) {
        if (node.id === id) return node;
        for (const child of node.children) { const got = find(child); if (got) return got; }
        return null;
      }
      return find(documentElement);
    }
  };
  return doc;
}

(async () => {
  const doc = makeDocument();
  const nativeBar = doc.createXULElement('menubar');
  nativeBar.id = 'main-menubar';
  doc.documentElement.appendChild(nativeBar);
  const nativeFile = doc.createXULElement('menu');
  nativeFile.id = 'menu_File';
  nativeBar.appendChild(nativeFile);
  const tools = doc.createXULElement('menupopup');
  tools.id = 'menu_ToolsPopup';
  doc.documentElement.appendChild(tools);
  const readerDoc = makeDocument();
  const win = {closed:false,location:{href:'chrome://zotero/content/zotero.xhtml'},document:doc,ZoteroPane:{}};
  const reader = {_iframeWindow:{document:readerDoc}};
  const observers = new Map();
  const prefs = new Map();
  let nextId = 1;
  let readerHook;
  let registeredWatcher;
  let chromeDestroyed = false;
  const Zotero = {
    initializationPromise: Promise.resolve(),
    locale:'pt-BR',
    logError(e) { throw e; },
    File: {async getContentsFromURLAsync() {return '/* mocked reader stylesheet */';}},
    Reader: {
      _readers:[reader],
      registerEventListener(ev, cb) {assert.equal(ev,'renderToolbar');readerHook=cb;},
      unregisterEventListener(ev,cb) {assert.equal(cb,readerHook);readerHook=undefined;}
    },
    Prefs: {
      get(key) {return prefs.get(key);},
      set(key, val) {prefs.set(key,val);for(const x of observers.values())if(x.key===key)x.callback();},
      registerObserver(key, callback) {const id=nextId++; observers.set(id,{key,callback}); return id;},
      unregisterObserver(id) {observers.delete(id);}
    }
  };
  const Services = {
    io:{newURI:s=>s},
    wm:{getEnumerator(){let n=0;return{hasMoreElements(){return n===0;},getNext(){n++;return win;}};}},
    ww:{registerNotification(w){registeredWatcher=w;},unregisterNotification(w){assert.equal(w,registeredWatcher);registeredWatcher=undefined;}}
  };
  const Components = {
    classes:{'@mozilla.org/addons/addon-manager-startup;1':{getService(){return {registerChrome(uri,manifest){
      assert(uri.includes('manifest.json'));
      assert.equal(manifest[0][1], 'zotero-pixel-blue-workspace');
      return {destruct(){chromeDestroyed=true;}};
    }};}}},
    interfaces:{amIAddonManagerStartup:{}}
  };
  const ctx = {Zotero, Services, Components};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'bootstrap.js'),'utf8'),ctx);
  await ctx.startup({id:'zotero-pixel-blue-workspace@vict0rg.github.io',rootURI:'jar:file:///plugin.xpi!/'});
  assert(doc.documentElement.hasAttribute('zpbw-theme'), 'theme should start enabled');
  assert(doc.documentElement.hasAttribute('zpbw-grid'), 'grid should start enabled');
  assert(doc.documentElement.hasAttribute('zpbw-items-grid'), 'central items grid should start enabled');
  assert(doc.documentElement.hasAttribute('zpbw-soft-selection'), 'soft selection should start enabled');
  assert(doc.getElementById('zpbw-stylesheet'), 'main CSS inserted');
  assert(doc.getElementById('zpbw-tools-menu'), 'submenu inserted');
  assert(readerDoc.getElementById('zpbw-reader-stylesheet'), 'reader CSS inserted');
  assert.equal(doc.getElementById('menu_File'), nativeFile, 'native File menu must survive');
  const grid = doc.getElementById('zpbw-grid-item');
  grid.events.command();
  assert(!doc.documentElement.hasAttribute('zpbw-grid'), 'grid can toggle off');
  assert.equal(grid.checked, false, 'grid menu state should reflect new preference');
  const itemsGrid = doc.getElementById('zpbw-items-grid-item');
  const selection = doc.getElementById('zpbw-soft-selection-item');
  assert(itemsGrid && selection, 'both new menu choices exist');
  itemsGrid.events.command();
  assert(!doc.documentElement.hasAttribute('zpbw-items-grid'));
  itemsGrid.events.command();
  assert(doc.documentElement.hasAttribute('zpbw-items-grid'));
  selection.events.command();
  assert(!doc.documentElement.hasAttribute('zpbw-soft-selection'));
  selection.events.command();
  assert(doc.documentElement.hasAttribute('zpbw-soft-selection'));
  const enable = doc.getElementById('zpbw-enable-item');
  enable.events.command();
  assert.equal(enable.checked, false);
  assert.equal(grid.disabled, true);
  assert.equal(itemsGrid.disabled, true);
  assert.equal(selection.disabled, true);
  assert(!doc.documentElement.hasAttribute('zpbw-theme'), 'theme can toggle off');
  assert(!readerDoc.documentElement.hasAttribute('zpbw-theme'), 'reader theme can toggle off');
  enable.events.command();
  assert.equal(enable.checked, true);
  assert.equal(grid.disabled, false);
  assert.equal(itemsGrid.disabled, false);
  assert.equal(selection.disabled, false);
  assert(!Object.hasOwn(grid.attrs, 'disabled'), 'never write disabled="false"');
  assert(doc.documentElement.hasAttribute('zpbw-theme'), 'theme can toggle on');
  readerHook({reader});
  ctx.shutdown();
  assert(!doc.getElementById('zpbw-stylesheet'), 'main stylesheet removed');
  assert(!doc.documentElement.hasAttribute('zpbw-items-grid'));
  assert(!doc.documentElement.hasAttribute('zpbw-soft-selection'));
  assert(!doc.getElementById('zpbw-tools-menu'), 'plugin menu removed');
  assert(!readerDoc.getElementById('zpbw-reader-stylesheet'), 'reader stylesheet removed');
  assert.equal(doc.getElementById('menu_File'), nativeFile, 'native File menu preserved on shutdown');
  assert.equal(observers.size,0,'preference observers cleaned up');
  assert(chromeDestroyed,'registered chrome cleaned up');
  assert(!registeredWatcher,'window watcher cleaned up');
  assert(!readerHook,'reader listener cleaned up');
  const css = fs.readFileSync(path.join(root, 'content/theme.css'),'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert(!/(menubar|menu_File|menu_Edit|menu_View)[^{]*\{/.test(css),'do not style native menubar');
  console.log('OK: startup, stylesheet/menu injection, reader styling, toggles, teardown, menu preservation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
