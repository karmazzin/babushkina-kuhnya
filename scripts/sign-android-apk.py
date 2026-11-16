"""Sign an already-built release APK using an existing private key; never create keys."""
from pathlib import Path
import hashlib
import json
import os
import subprocess

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
if not sdk:
    raise SystemExit('Set ANDROID_HOME to the installed SDK')
required = ['ANDROID_KEYSTORE', 'ANDROID_KEY_PASSWORD_FILE', 'ANDROID_KEY_ALIAS']
for name in required:
    if not os.environ.get(name):
        raise SystemExit('Missing environment variable: ' + name)
source = root / 'android/app/build/outputs/apk/release/app-release-unsigned.apk'
key = Path(os.environ['ANDROID_KEYSTORE']).expanduser().resolve()
password = Path(os.environ['ANDROID_KEY_PASSWORD_FILE']).expanduser().resolve()
for path in [source, key, password]:
    if not path.is_file():
        raise SystemExit('Required file is missing: ' + str(path))
out = root / 'build/releases' / ('babushkina-kuhnya-' + version + '-release.apk')
out.parent.mkdir(parents=True, exist_ok=True)
signer = str(Path(sdk) / 'build-tools/36.0.0/apksigner')
subprocess.run([signer, 'sign', '--ks', str(key), '--ks-key-alias', os.environ['ANDROID_KEY_ALIAS'],
                '--ks-pass', 'file:' + str(password), '--out', str(out), str(source)], check=True)
verified = subprocess.check_output([signer, 'verify', '--verbose', '--print-certs', str(out)], text=True)
expected = os.environ.get('ANDROID_CERT_SHA256')
if expected and ('certificate SHA-256 digest: ' + expected.lower()) not in verified:
    raise SystemExit('Unexpected signing certificate: do not distribute this APK')
(out.with_suffix('.signature.txt')).write_text(verified)
sha = hashlib.sha256(out.read_bytes()).hexdigest()
(out.with_suffix('.apk.sha256')).write_text(sha + '  ' + out.name + '\n')
print('Signed and verified:', out)
print('SHA-256:', sha)
