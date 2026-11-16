"""Regenerate checked-in Android launcher and splash assets (Pillow required)."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
res=root/'android/app/src/main/res'
icon=Image.open(root/'dist/assets/icon-512.png').convert('RGBA')
for density,scale in [('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)]:
    folder=res/f'mipmap-{density}'
    for name in ['ic_launcher.png','ic_launcher_round.png']:
        icon.resize((int(48*scale),int(48*scale)),Image.Resampling.LANCZOS).save(folder/name)
    side=int(108*scale);foreground=Image.new('RGBA',(side,side))
    inset=int(20*scale);art=icon.resize((side-2*inset,side-2*inset),Image.Resampling.LANCZOS)
    foreground.alpha_composite(art,(inset,inset));foreground.save(folder/'ic_launcher_foreground.png')
for path in res.glob('drawable*/splash.png'):
    with Image.open(path) as old:size=old.size
    bg=Image.new('RGBA',size,'#f5e8cb');side=min(240,int(min(size)*.36))
    art=icon.resize((side,side),Image.Resampling.LANCZOS);bg.alpha_composite(art,((size[0]-side)//2,(size[1]-side)//2));bg.convert('RGB').save(path)
(res/'values/ic_launcher_background.xml').write_text('<resources><color name="ic_launcher_background">#f5e8cb</color></resources>\n')
