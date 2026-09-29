from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import random, math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/art/level1/raster';OUT.mkdir(parents=True,exist_ok=True)

def speckle(im,mask_poly,seed,count=2200):
    rng=random.Random(seed); d=ImageDraw.Draw(im,'RGBA')
    xs=[p[0] for p in mask_poly]; ys=[p[1] for p in mask_poly]
    x0,x1=min(xs),max(xs); y0,y1=min(ys),max(ys)
    for i in range(count):
        x=rng.randint(x0,x1); y=rng.randint(y0,y1)
        # cheap polygon inclusion via mask image generated outside would be expensive; low-alpha misses are acceptable only inside bbox.
        r=rng.choice([1,1,2,2,3,4]);
        col=(240,230,196,rng.randint(12,38)) if i%4==0 else (18,29,28,rng.randint(12,45))
        d.ellipse((x-r,y-r,x+r,y+r),fill=col)

def pine(d,x,y,s,snow=False):
    d.ellipse((x+s*.08,y+s*.18,x+s*.7,y+s*.42),fill=(5,14,13,70))
    trunk=(77,62,42,255); d.rectangle((x-2,y-s*.10,x+2,y+s*.16),fill=trunk)
    for k in range(3):
        yy=y-s*(.78-k*.22); w=s*(.36-k*.035); base=y-s*(.08-k*.13)
        d.polygon([(x,yy),(x-w,base),(x+w,base)],fill=(22,64,40,255) if not snow else (44,71,60,255))
        if snow:
            d.line((x-w*.72,base-s*.08,x,yy+s*.10,x+w*.55,base-s*.05),fill=(235,243,240,180),width=max(2,int(s*.05)))

def rock_facets(d,poly,seed,light=(211,198,157,255),mid=(135,126,101,255),dark=(64,72,67,255),snow=False):
    rng=random.Random(seed)
    d.polygon(poly,fill=mid,outline=(45,54,51,255))
    cx=sum(x for x,y in poly)/len(poly); cy=sum(y for x,y in poly)/len(poly)
    for i,p in enumerate(poly):
        q=poly[(i+1)%len(poly)]
        col=light if i in (0,1,7) else dark if i in (3,4,5) else mid
        d.polygon([p,q,(cx,cy)],fill=(*col[:3],rng.randint(115,190)))
    for _ in range(7):
        a=rng.choice(poly); b=(cx+rng.randint(-80,80),cy+rng.randint(-40,90))
        d.line((a[0],a[1],b[0],b[1]),fill=(38,48,46,110),width=rng.choice([3,4,5]))
    if snow:
        top=sorted(poly,key=lambda p:p[1])[:3]
        d.polygon(top+[(cx,cy-10)],fill=(240,246,243,185))

def _fractal_gray(w,h,seed):
    import numpy as np
    rng=np.random.default_rng(seed)
    acc=np.zeros((h,w),dtype=np.float32); weight=0.0
    for grid,amp in [(7,1.0),(15,.55),(31,.30),(63,.16),(127,.08)]:
        small=(rng.random((max(2,h//grid+2),max(2,w//grid+2)))*255).astype('uint8')
        layer=Image.fromarray(small,'L').resize((w,h),Image.Resampling.BICUBIC)
        acc+=np.asarray(layer,dtype=np.float32)*amp; weight+=amp
    acc/=weight
    acc=(acc-acc.min())/(acc.max()-acc.min()+1e-6)
    return acc

def _textured_rgba(w,h,seed,low,high,alpha=255):
    import numpy as np
    n=_fractal_gray(w,h,seed)
    lo=np.array(low,dtype=np.float32); hi=np.array(high,dtype=np.float32)
    rgb=lo[None,None,:]*(1-n[:,:,None])+hi[None,None,:]*n[:,:,None]
    arr=np.empty((h,w,4),dtype=np.uint8);arr[:,:,:3]=np.clip(rgb,0,255).astype(np.uint8);arr[:,:,3]=alpha
    return Image.fromarray(arr,'RGBA')

def _organic_pine(d,x,y,s,seed,snow=False):
    rng=random.Random(seed)
    # long, soft cast shadow establishes the same upper-left lighting as the world.
    d.ellipse((x+s*.12,y+s*.10,x+s*.88,y+s*.42),fill=(4,14,12,70))
    d.rectangle((x-1.5,y-s*.04,x+1.5,y+s*.18),fill=(64,53,37,235))
    # layered irregular crowns; no hard triangular "Christmas tree" silhouette at gameplay size.
    cols=[(13,54,34,255),(18,72,42,255),(26,84,47,245)] if not snow else [(37,67,57,255),(48,80,68,255),(62,94,79,245)]
    for k in range(4):
        cy=y-s*(.63-k*.16)+rng.uniform(-1.5,1.5); ww=s*(.26+.06*k+rng.uniform(-.03,.03)); hh=s*(.21+.035*k)
        d.ellipse((x-ww,cy-hh,x+ww,cy+hh),fill=cols[min(k,2)])
    d.ellipse((x-s*.11,y-s*.70,x+s*.04,y-s*.42),fill=(75,112,64,95))
    if snow:
        d.arc((x-s*.31,y-s*.73,x+s*.31,y-s*.20),190,344,fill=(235,243,241,170),width=max(1,int(s*.045)))

def gateway_bank():
    import numpy as np
    W,H=1400,1100
    rng=random.Random(5101)
    # Main silhouette and a separate water-facing cliff belt. Their irregularity is large-scale,
    # so the asset reads as authored terrain when downscaled rather than as a vector badge.
    plateau=[(92,720),(128,470),(230,292),(410,190),(680,142),(955,192),(1178,322),(1308,520),(1315,735),(1212,927),(1005,1010),(700,1035),(388,1000),(170,900)]
    cliff_outer=[(126,667),(208,552),(318,490),(438,472),(575,506),(718,478),(860,500),(1012,458),(1170,512),(1270,640),(1252,836),(1132,947),(920,1005),(667,1021),(406,986),(220,895),(130,800)]
    cliff_inner=[(224,654),(302,585),(421,548),(548,570),(690,543),(837,567),(997,526),(1121,572),(1187,670),(1171,790),(1066,865),(888,914),(682,930),(480,905),(310,840),(218,758)]
    plateau_mask=Image.new('L',(W,H),0);ImageDraw.Draw(plateau_mask).polygon(plateau,fill=255)
    cliff_mask=Image.new('L',(W,H),0);cd=ImageDraw.Draw(cliff_mask);cd.polygon(cliff_outer,fill=255);cd.polygon(cliff_inner,fill=0)
    top_tex=_textured_rgba(W,H,5102,(31,64,40),(91,115,68),255)
    # Add broad illumination from upper-left and darken the water-facing half of the plateau.
    top=np.asarray(top_tex).copy(); yy,xx=np.mgrid[0:H,0:W]; shade=np.clip(1.12-(xx/W)*.18-(yy/H)*.13,.76,1.15)
    top[:,:,:3]=np.clip(top[:,:,:3].astype(np.float32)*shade[:,:,None],0,255).astype(np.uint8);top_tex=Image.fromarray(top,'RGBA')
    cliff_tex=_textured_rgba(W,H,5103,(74,71,59),(190,178,139),255)
    # Directional vertical streaking makes the band read as a high rock face rather than a flat patch.
    c=np.asarray(cliff_tex).copy(); vertical=(.72+.34*np.sin(xx*.027+_fractal_gray(W,H,5104)*3.8))*np.clip(1.10-(yy-460)/1000,.72,1.08)
    c[:,:,:3]=np.clip(c[:,:,:3].astype(np.float32)*vertical[:,:,None],0,255).astype(np.uint8);cliff_tex=Image.fromarray(c,'RGBA')
    im=Image.new('RGBA',(W,H),(0,0,0,0))
    # soft detached shadow beneath the whole bank
    shadow=Image.new('RGBA',(W,H),(0,0,0,0));sd=ImageDraw.Draw(shadow);sd.polygon([(x+28,y+40) for x,y in plateau],fill=(4,14,15,110));shadow=shadow.filter(ImageFilter.GaussianBlur(13));im.alpha_composite(shadow)
    im.paste(top_tex,(0,0),plateau_mask);im.paste(cliff_tex,(0,0),cliff_mask)
    d=ImageDraw.Draw(im,'RGBA')
    # Warm, broken rim line and dark cliff toe. Deliberately not one perfect polygon outline.
    for pts,col,width in [(cliff_inner,(229,218,181,170),7),(cliff_outer,(35,44,42,160),8)]:
        for i in range(len(pts)-1):
            if i%3!=1:d.line((*pts[i],*pts[i+1]),fill=col,width=width)
    # Vertical joints, shelves and smaller faceted rock protrusions.
    for i in range(34):
        x=rng.randint(185,1230); y=rng.randint(565,875); length=rng.randint(70,210)
        d.line((x,y,x+rng.randint(-28,25),min(1005,y+length)),fill=(34,43,42,rng.randint(70,125)),width=rng.randint(2,5))
    for i in range(26):
        x=rng.randint(165,1235);y=rng.randint(510,925);rw=rng.randint(14,38);rh=rng.randint(16,52)
        poly=[]
        for k in range(9):
            a=-math.pi/2+2*math.pi*k/9;rr=.70+rng.random()*.27
            poly.append((x+math.cos(a)*rw*rr,y+math.sin(a)*rh*rr))
        d.polygon([(px+7,py+11) for px,py in poly],fill=(8,18,17,70));d.polygon(poly,fill=(135+rng.randint(-15,15),126+rng.randint(-12,12),99+rng.randint(-10,10),210))
        d.line((poly[0][0],poly[0][1],x,y,poly[3][0],poly[3][1]),fill=(231,220,184,95),width=2)
    # Two small sandy coves soften the contact between cliff and sea.
    d.polygon([(205,825),(315,840),(395,900),(330,953),(220,918),(163,870)],fill=(211,194,151,210))
    d.polygon([(1025,846),(1120,825),(1230,866),(1190,930),(1075,945),(998,906)],fill=(214,198,155,195))
    # Dense conifer masses with size/colour variation. Trees follow the upper ledges and avoid the cliff face.
    for i in range(245):
        x=rng.randint(155,1240);y=rng.randint(205,690)
        # retain clear road/fortification pockets through the centre while filling the side slopes.
        if 510<x<880 and 420<y<620 and rng.random()<.78:continue
        _organic_pine(d,x,y,rng.randint(10,25),5200+i)
    # sparse cliff pines on shelves
    for i in range(52):
        x=rng.randint(190,1215);y=rng.randint(570,840)
        if rng.random()<.45:_organic_pine(d,x,y,rng.randint(8,17),5600+i)
    # Fine rock/scree detail, clipped approximately to the visible bank area by placement.
    for i in range(700):
        x=rng.randint(145,1250);y=rng.randint(240,960);r=rng.choice([1,1,1,2,2,3])
        if y<520: col=(155,139,96,rng.randint(18,55))
        else: col=(40,48,44,rng.randint(20,65)) if i%3 else (224,211,174,rng.randint(18,50))
        d.ellipse((x-r,y-r,x+r,y+r),fill=col)
    im.save(OUT/'gateway-cliff-bank.png')

def _mask_texture(im,poly,texture,shadow=(0,0,0,0)):
    mask=Image.new('L',im.size,0);ImageDraw.Draw(mask).polygon(poly,fill=255)
    im.paste(texture,(0,0),mask)
    return mask

def dam_shoulder():
    import numpy as np
    W,H=1500,1500; rng=random.Random(5501)
    im=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA')
    base=[(78,1220),(105,785),(165,520),(278,315),(455,175),(675,105),(925,118),(1160,245),(1322,455),(1408,735),(1390,1140),(1260,1350),(1030,1430),(430,1435),(205,1350)]
    shadow=Image.new('RGBA',(W,H),(0,0,0,0));ImageDraw.Draw(shadow).polygon([(x+34,y+48) for x,y in base],fill=(2,12,15,125));shadow=shadow.filter(ImageFilter.GaussianBlur(17));im.alpha_composite(shadow)
    rock=_textured_rgba(W,H,5502,(43,49,48),(122,119,100),255)
    # strong upper-left light and deeper lower canyon face
    arr=np.asarray(rock).copy();yy,xx=np.mgrid[0:H,0:W];n=_fractal_gray(W,H,5503)
    light=np.clip(1.16-xx/W*.16-yy/H*.28 + (n-.5)*.18,.56,1.18)
    arr[:,:,:3]=np.clip(arr[:,:,:3].astype(np.float32)*light[:,:,None],0,255).astype(np.uint8);rock=Image.fromarray(arr,'RGBA')
    _mask_texture(im,base,rock);d=ImageDraw.Draw(im,'RGBA')
    # Broken snow fields follow height and ledges rather than forming one white geometric cap.
    snow_patches=[[(270,470),(420,260),(645,160),(810,165),(915,250),(845,348),(650,320),(520,370),(390,355)],
                  [(905,285),(1100,320),(1240,470),(1175,555),(1020,505),(930,430)],
                  [(185,615),(305,515),(405,535),(366,635),(245,690)]]
    for j,poly in enumerate(snow_patches):
        d.polygon(poly,fill=(229,237,235,215));d.line(poly+[poly[0]],fill=(188,199,196,105),width=3)
    # Large fractured cliff shelves with dark faces and pale upper lips.
    shelf_paths=[[(130,760),(330,640),(560,600),(780,625),(1000,565),(1260,650),(1375,790)],
                 [(120,930),(330,790),(560,770),(790,805),(1040,740),(1340,845)],
                 [(115,1105),(350,950),(615,930),(850,980),(1130,900),(1380,1030)],
                 [(160,1260),(430,1110),(720,1105),(1010,1140),(1280,1070)]]
    for j,path in enumerate(shelf_paths):
        drop=55+22*j
        face=path+[(x,y+drop) for x,y in reversed(path)]
        d.polygon(face,fill=(30,38,39,115+j*8));d.line(path,fill=(205,198,171,105),width=5)
        for k in range(2,len(path)-1,2):
            x,y=path[k];d.line((x,y,x+rng.randint(-25,28),y+drop+rng.randint(20,80)),fill=(23,32,34,100),width=3)
    # Winding supported mountain road and retaining wall, a key recognition cue in the blueprint.
    road=[(165,900),(320,840),(470,790),(620,765),(790,780),(950,760),(1110,720),(1305,770)]
    d.line(road,fill=(25,31,33,230),width=46,joint='curve');d.line(road,fill=(91,91,83,255),width=31,joint='curve');d.line(road,fill=(221,204,140,145),width=4,joint='curve')
    for i in range(len(road)-1):
        x,y=road[i];d.line((x,y+18,x+rng.randint(-10,12),y+75+rng.randint(0,35)),fill=(34,44,45,155),width=8)
    # Tunnel mouths and service cutouts.
    for x,y in [(350,815),(1185,742)]:
        d.rounded_rectangle((x-40,y-42,x+40,y+28),radius=28,fill=(17,27,30,245),outline=(177,172,151,190),width=7)
        d.rectangle((x-26,y-2,x+26,y+35),fill=(17,27,30,245))
    # More natural trees: dense in the lower canyon, sparse above the snow line.
    for i in range(170):
        x=rng.randint(150,1340);y=rng.randint(430,1260)
        if y<590 and rng.random()<.75:continue
        if 690<y<900 and 120<x<1350 and rng.random()<.34:continue
        _organic_pine(d,x,y,rng.randint(9,23),6000+i,snow=(y<650 and rng.random()<.42))
    # Scree and rock ribs.
    for i in range(72):
        x=rng.randint(140,1360);y=rng.randint(440,1290);ln=rng.randint(35,130)
        d.line((x,y,x+rng.randint(-26,26),min(1400,y+ln)),fill=(23,32,33,rng.randint(55,115)),width=rng.randint(2,5))
    for i in range(520):
        x=rng.randint(130,1365);y=rng.randint(430,1320);r=rng.choice([1,1,2,2,3]);d.ellipse((x-r,y-r,x+r,y+r),fill=(208,199,166,rng.randint(10,38)) if i%5==0 else (16,25,25,rng.randint(12,45)))
    im.save(OUT/'dam-canyon-shoulder.png')

def citadel_shoulder():
    import numpy as np
    W,H=1500,1500; rng=random.Random(5701)
    im=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA')
    base=[(70,1240),(95,735),(165,470),(305,260),(500,140),(760,92),(1010,125),(1210,275),(1350,510),(1420,820),(1395,1190),(1270,1360),(1040,1440),(430,1440),(190,1360)]
    shadow=Image.new('RGBA',(W,H),(0,0,0,0));ImageDraw.Draw(shadow).polygon([(x+35,y+50) for x,y in base],fill=(3,12,16,130));shadow=shadow.filter(ImageFilter.GaussianBlur(18));im.alpha_composite(shadow)
    rock=_textured_rgba(W,H,5702,(42,51,54),(113,119,116),255)
    arr=np.asarray(rock).copy();yy,xx=np.mgrid[0:H,0:W];n=_fractal_gray(W,H,5703);shade=np.clip(1.12-xx/W*.15-yy/H*.22+(n-.5)*.20,.58,1.17);arr[:,:,:3]=np.clip(arr[:,:,:3].astype(np.float32)*shade[:,:,None],0,255).astype(np.uint8);rock=Image.fromarray(arr,'RGBA')
    _mask_texture(im,base,rock);d=ImageDraw.Draw(im,'RGBA')
    # Snow follows the high shelves and cracks, leaving dark exposed rock like the blueprint.
    snowfields=[[(230,500),(340,310),(525,185),(745,118),(940,145),(1110,260),(1190,410),(1050,450),(900,370),(710,400),(540,335),(390,430)],
                [(1085,430),(1250,470),(1345,650),(1280,720),(1140,640)],
                [(165,650),(290,535),(400,555),(350,690),(225,745)]]
    for poly in snowfields:d.polygon(poly,fill=(230,238,236,220));d.line(poly+[poly[0]],fill=(184,198,198,105),width=3)
    # Massive fortress-supporting shelves and mountain faces.
    shelves=[[(115,775),(330,660),(555,625),(760,650),(975,610),(1240,680),(1380,815)],
             [(105,970),(315,820),(590,805),(830,840),(1090,790),(1380,925)],
             [(115,1160),(390,990),(700,995),(1005,1010),(1320,950)]]
    for j,path in enumerate(shelves):
        drop=58+j*25;face=path+[(x,y+drop) for x,y in reversed(path)];d.polygon(face,fill=(23,35,38,120+j*12));d.line(path,fill=(231,237,233,85),width=5)
    # Fortress terraces embedded in the rock: narrower and more layered than the previous broad slabs.
    terraces=[(710,720,620),(780,870,790),(835,1035,980)]
    for cy,y,w in terraces:
        x=(W-w)//2;d.rounded_rectangle((x,y,x+w,y+70),radius=16,fill=(77,88,91,245),outline=(31,43,47,240),width=7);d.line((x+14,y+10,x+w-14,y+10),fill=(226,233,230,135),width=5)
        for k in range(max(4,int(w/120))):
            bx=x+55+k*(w-110)/(max(3,int(w/120)-1));d.rectangle((bx-16,y+30,bx+16,y+54),fill=(28,47,53,230))
    # Defensive road/ledge links the fortress to the mountain sides.
    road=[(145,945),(300,875),(470,825),(650,810),(835,822),(1020,805),(1200,850),(1360,930)]
    d.line(road,fill=(24,32,34,230),width=42,joint='curve');d.line(road,fill=(92,96,91,250),width=28,joint='curve');d.line(road,fill=(229,217,166,115),width=3,joint='curve')
    # Snow-loaded pine pockets below the highest rock.
    for i in range(135):
        x=rng.randint(145,1360);y=rng.randint(430,1220)
        if y<620 and rng.random()<.75:continue
        _organic_pine(d,x,y,rng.randint(9,22),7000+i,snow=(rng.random()<.48))
    for i in range(80):
        x=rng.randint(140,1360);y=rng.randint(430,1300);d.line((x,y,x+rng.randint(-28,28),y+rng.randint(45,145)),fill=(24,34,37,rng.randint(55,115)),width=rng.randint(2,5))
    for i in range(460):
        x=rng.randint(135,1360);y=rng.randint(400,1330);r=rng.choice([1,1,2,2,3]);d.ellipse((x-r,y-r,x+r,y+r),fill=(232,239,236,rng.randint(8,30)) if i%6==0 else (14,24,27,rng.randint(14,44)))
    im.save(OUT/'citadel-mountain-shoulder.png')

if __name__=='__main__':
    gateway_bank(); dam_shoulder(); citadel_shoulder()
    for n in ['gateway-cliff-bank','dam-canyon-shoulder','citadel-mountain-shoulder']:
        print('wrote',OUT/f'{n}.png')
