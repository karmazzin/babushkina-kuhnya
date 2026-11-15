"""Rebuild checked-in PWA assets: pip install pillow cairosvg. No runtime dependency."""
from pathlib import Path
from io import BytesIO
import base64
import cairosvg
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'; ASSETS=OUT/'assets'
svg=(ROOT/'design/icon.svg').read_text()
favicon=(ROOT/'design/favicon.svg').read_text()
def render(source,n):
 return cairosvg.svg2png(bytestring=source.encode(),output_width=n,output_height=n)
(ASSETS/'icon.svg').write_text(svg)
(OUT/'favicon.svg').write_text(favicon)
for n in [192,512]:
 (ASSETS/f'icon-{n}.png').write_bytes(render(svg,n))
 # Full-bleed opaque background; all essential artwork inside central 80% circle.
 maskable=svg.replace('rx="108"','rx="0"')
 (ASSETS/f'icon-maskable-{n}.png').write_bytes(render(maskable,n))
(ASSETS/'apple-touch-icon.png').write_bytes(render(svg.replace('rx="108"','rx="0"'),180))
for n in [16,32]: (OUT/f'favicon-{n}x{n}.png').write_bytes(render(favicon,n))
Image.open(BytesIO(render(favicon,256))).save(OUT/'favicon.ico',sizes=[(16,16),(32,32),(48,48)])
icon=base64.b64encode((ASSETS/'icon-512.png').read_bytes()).decode()
social=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#f5e8cb"/><rect x="24" y="24" width="1152" height="582" rx="40" fill="none" stroke="#9ba475" stroke-width="3"/>
<path d="M465 105h620M465 525h620" stroke="#c8b17a" stroke-width="2"/>
<image x="75" y="135" width="360" height="360" href="data:image/png;base64,{icon}"/>
<g font-family="Georgia,serif" fill="#842e25" font-weight="bold" font-style="italic"><text x="485" y="245" font-size="73">Бабушкина</text><text x="485" y="325" font-size="82">кухня</text></g>
<text x="485" y="393" fill="#5b6f40" font-family="Georgia,serif" font-size="28">Три в ряд. Рецепты. Немного уюта.</text>
<text x="485" y="448" fill="#786343" font-family="sans-serif" font-size="24">Без таймера · работает без интернета</text></svg>'''
cairosvg.svg2png(bytestring=social.encode(),write_to=str(ASSETS/'social-preview.png'))
print('Generated favicon, PWA, Apple and social assets')
