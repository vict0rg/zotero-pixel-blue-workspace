#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check bootstrap.js
node tests/manifest.cjs
node tests/smoke.cjs
version=$(python3 -c 'import json;print(json.load(open("manifest.json"))["version"])')
mkdir -p dist
out="dist/zotero-pixel-blue-workspace-${version}.xpi"
rm -f "$out"
zip -X -q -9 "$out" manifest.json bootstrap.js LICENSE CREDITS.md THIRD_PARTY_LICENSES.md \
    content/theme.css content/reader.css content/icon.svg
python3 - "$out" <<'PY'
import json, sys, zipfile, hashlib, pathlib
xpi = pathlib.Path(sys.argv[1])
source = json.loads(pathlib.Path('manifest.json').read_text(encoding='utf8'))
with zipfile.ZipFile(xpi) as archive:
    bad = archive.testzip()
    assert bad is None, f"ZIP file error: {bad}"
    assert archive.namelist()[0] == 'manifest.json'
    packaged = json.loads(archive.read('manifest.json'))
    assert packaged == source
url = f"https://github.com/vict0rg/zotero-pixel-blue-workspace/releases/download/v{source['version']}/{xpi.name}"
update = {'addons': {source['applications']['zotero']['id']: {'updates': [{
    'version': source['version'],
    'update_link': url,
    'update_hash': 'sha256:' + hashlib.sha256(xpi.read_bytes()).hexdigest(),
    'applications': {'zotero': {
        'strict_min_version': source['applications']['zotero']['strict_min_version'],
        'strict_max_version': source['applications']['zotero']['strict_max_version'],
    }},
}]}}}
pathlib.Path('dist/updates.json').write_text(json.dumps(update, indent=2) + '\n', encoding='utf8')
print('SHA256', update['addons'][source['applications']['zotero']['id']]['updates'][0]['update_hash'])
print('Verified XPI metadata and generated dist/updates.json')
PY
echo "Created $out"
