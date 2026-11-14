/* Manifest installation contract. The older plugin omitted update_url and Zotero
 * rejected it as "possibly incompatible" before bootstrap.js ever ran. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 2);
assert.equal(manifest.name, 'Zotero Pixel-Blue Workspace');
const zotero = manifest.applications?.zotero;
assert.ok(zotero, 'applications.zotero is required');
assert.match(zotero.id, /^[^@\s]+@[^@\s]+$/);
assert.match(zotero.update_url, /^https:\/\/[^\s]+\/updates\.json$/,
  'Zotero refuses install without applications.zotero.update_url');
assert.equal(zotero.strict_min_version, '7.0');
assert.equal(zotero.strict_max_version, '10.0.*',
  'Do not declare Zotero 11 until Zotero declares the developer API frozen');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
for (const key of Object.keys(manifest.icons || {})) {
  assert(fs.existsSync(path.join(root,manifest.icons[key])), 'Missing icon ' + key);
}
for(const filename of ['bootstrap.js','content/theme.css','content/reader.css']) {
  assert(fs.existsSync(path.join(root,filename)), `Missing ${filename}`);
}
console.log('OK: Zotero install manifest includes required update_url, valid IDs, version range, assets.');
