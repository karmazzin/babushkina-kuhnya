"""Verify the APK contains exactly the prepared local web resources (no device needed)."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile
root=Path(__file__).resolve().parents[1]
apk=Path(sys.argv[1]) if len(sys.argv)>1 else root/'android/app/build/outputs/apk/debug/app-debug.apk'
web=root/'build/android-web'
with zipfile.ZipFile(apk) as archive:
    names=set(archive.namelist())
    assert 'assets/public/sw.js' not in names, 'PWA worker must not ship in Android'
    config=json.loads(archive.read('assets/capacitor.config.json'))
    assert not config.get('server',{}).get('url'), 'Android must load local resources'
    count=0
    for source in sorted(web.rglob('*')):
        if not source.is_file():continue
        target='assets/public/'+source.relative_to(web).as_posix()
        assert target in names, f'Missing asset: {target}'
        assert hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(archive.read(target)).digest(), f'Stale asset: {target}'
        count+=1
    assert 'classes.dex' in names, 'Native bytecode missing'
print(f'APK verified: {count} local web files match the prepared build; no worker or remote server')
print('SHA-256:',hashlib.sha256(apk.read_bytes()).hexdigest())
