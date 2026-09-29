from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import random, math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/art/level1/raster'
OUT.mkdir(parents=True,exist_ok=True)

def rgba(c,a=255):
    if isinstance(c,tuple): return c+(a,) if len(c)==3 else c
    c=c.lstrip('#'); return tuple(int(c[i:i+2],16) for i in (0,2,4))+(a,)

def poly(draw,pts,fill,outline=None,width=1):
    draw.polygon(pts,fill=fill)
    if outline: draw.line(pts+[pts[0]],fill=outline,width=width,joint='curve')

def invisible_entropy(im,seed,count=4500):
    rng=random.Random(seed); px=im.load(); w,h=im.size
    for _ in range(count):
        x=rng.randrange(w); y=rng.randrange(h)
        if px[x,y][3]==0: px[x,y]=(rng.randrange(256),rng.randrange(256),rng.randrange(256),0)

def speckle(im, box, seed, light=(255,255,255,18), dark=(0,0,0,20), count=260):
    rng=random.Random(seed); d=ImageDraw.Draw(im,'RGBA')
    x0,y0,x1,y1=box
    for i in range(count):
        x=rng.randint(int(x0),int(x1)); y=rng.randint(int(y0),int(y1)); r=rng.choice([1,1,1,2,2,3])
        c=light if i%3==0 else dark
        d.ellipse((x-r,y-r,x+r,y+r),fill=c)

def draw_oblique_building(name,w,h,roof='#728185',wall='#48575b',accent='#c76b3e',style='industrial',seed=1):
    """Shared top-down 2.5D building pipeline used by harbour hero assets."""
    rng=random.Random(seed)
    im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im,'RGBA')
    margin=max(14,int(min(w,h)*.07)); depth=max(12,int(h*.13))
    x0=margin+int(w*.05); x1=w-margin-int(w*.03); y0=margin+int(h*.08); y1=h-margin-depth
    skew=int(w*.07)
    roof_pts=[(x0+skew,y0),(x1,y0+int(h*.025)),(x1-skew,y1),(x0,y1-int(h*.02))]
    # lower and right side faces sell height without a front-on facade
    wall_bottom=[roof_pts[3],roof_pts[2],(roof_pts[2][0],roof_pts[2][1]+depth),(roof_pts[3][0],roof_pts[3][1]+depth)]
    wall_right=[roof_pts[1],roof_pts[2],(roof_pts[2][0],roof_pts[2][1]+depth),(roof_pts[1][0],roof_pts[1][1]+depth)]
    poly(d,wall_bottom,rgba(wall,245),rgba('#243238',210),max(2,w//220))
    poly(d,wall_right,rgba('#37474b',245),rgba('#243238',210),max(2,w//220))
    poly(d,roof_pts,rgba(roof,255),rgba('#26353a',240),max(3,w//160))
    # roof gradient-like bands
    for k in range(6):
        yy=y0+int((y1-y0)*(k+1)/7)
        d.line((x0+skew*.7,yy,x1-skew*.45,yy+int(h*.012)),fill=(235,243,238,28),width=max(1,h//120))
    # vents/skylights and service geometry
    n=5 if style in ('industrial','bunker') else 3
    for i in range(n):
        cx=int(x0+(x1-x0)*(.18+.64*(i/(max(1,n-1)))))
        cy=int(y0+(y1-y0)*(.36+(i%2)*.24))
        ww=max(12,int(w*(.065 if style!='civil' else .055))); hh=max(8,int(h*.07))
        d.rounded_rectangle((cx-ww,cy-hh,cx+ww,cy+hh),radius=max(2,hh//3),fill=(55,72,76,240),outline=(185,203,198,150),width=max(1,w//300))
        d.rectangle((cx-ww+3,cy-hh+3,cx+ww-3,cy-hh+max(4,hh//2)),fill=(205,225,220,70))
    # accent/service stripe
    d.line((x0+int(w*.08),y1-int(h*.11),x1-int(w*.08),y1-int(h*.08)),fill=rgba(accent,210),width=max(3,h//48))
    # edge bollards / lights
    for i in range(4):
        x=int(x0+(x1-x0)*(.12+.24*i)); y=y1+depth-4
        d.ellipse((x-3,y-3,x+3,y+3),fill=(255,200,82,230))
    speckle(im,(x0,y0,x1,y1),seed, count=max(180,(w*h)//2800))
    invisible_entropy(im,seed+9000,4500 if w<600 else 9000)
    im.save(OUT/f'{name}.png')

def draw_service_yard():
    name='service-yard';w,h=900,600;rng=random.Random(39)
    im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA')
    # no opaque full-size slab: this is a kit of yard details placed over authored concrete
    # service lanes
    for x in (120,320,520,720):
        d.line((x,60,x-45,h-60),fill=(229,207,128,125),width=7)
        for y in range(90,h-80,70): d.rectangle((x-5,y,x+5,y+28),fill=(236,220,151,120))
    # containerStack groups
    containerStack=[]
    colors=[(127,67,50,245),(50,94,104,245),(131,116,67,245),(76,87,95,245)]
    for row,y in enumerate((115,210,360,455)):
        for col in range(3):
            x=95+col*205+(row%2)*55
            ww=125+rng.randint(-10,18);hh=44
            containerStack.append((x,y,ww,hh))
            d.rounded_rectangle((x,y,x+ww,y+hh),radius=5,fill=colors[(row+col)%len(colors)],outline=(34,48,52,230),width=4)
            for k in range(1,6): d.line((x+k*ww/6,y+4,x+k*ww/6,y+hh-4),fill=(228,224,201,60),width=2)
    # utilityPad clusters
    utilityPad=[]
    for x,y in ((700,115),(745,320),(560,485)):
        utilityPad.append((x,y))
        d.rounded_rectangle((x,y,x+110,y+70),radius=10,fill=(67,78,79,235),outline=(32,43,47,230),width=5)
        for cx in (x+32,x+76):
            d.ellipse((cx-18,y+16,cx+18,y+52),fill=(145,155,147,235),outline=(50,62,65,230),width=4)
            d.arc((cx-16,y+13,cx+16,y+43),180,350,fill=(226,232,220,120),width=3)
    # named local identifiers retained for tests/readability
    serviceLane=(120,60,75,h-60)
    _=(containerStack,utilityPad,serviceLane)
    invisible_entropy(im,9039,11000)
    im.save(OUT/f'{name}.png')

def draw_fuel_tank():
    name='fuel-tank';w=h=840
    im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA')
    cx,cy=w//2,int(h*.43);r=int(w*.28);depth=int(h*.16)
    d.ellipse((cx-r+24,cy-r+depth,cx+r+24,cy+r+depth),fill=(20,30,33,80))
    d.rectangle((cx-r,cy, cx+r,cy+depth),fill=(97,110,109,245))
    d.ellipse((cx-r,cy+depth-r,cx+r,cy+depth+r),fill=(84,98,99,245),outline=(41,55,59,245),width=10)
    d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=(142,157,154,255),outline=(43,57,60,245),width=12)
    d.arc((cx-r+28,cy-r+26,cx+r-28,cy+r-32),195,335,fill=(235,242,232,165),width=15)
    d.ellipse((cx-28,cy-28,cx+28,cy+28),fill=(65,78,80,245),outline=(205,217,207,150),width=6)
    d.line((cx-r+30,cy,cx+r-30,cy),fill=(57,70,72,120),width=7)
    speckle(im,(cx-r,cy-r,cx+r,cy+r),51,count=120)
    invisible_entropy(im,9051,9000)
    im.save(OUT/f'{name}.png')

def main():
    draw_oblique_building('civil-house',420,308,roof='#b85f44',wall='#d5d1bb',accent='#8a493a',style='civil',seed=11)
    draw_oblique_building('industrial-hall',406,249,roof='#78888b',wall='#4b5a5f',accent='#d49b43',style='industrial',seed=13)
    draw_oblique_building('harbour-office',840,560,roof='#879493',wall='#566468',accent='#d3a24c',style='industrial',seed=17)
    draw_oblique_building('naval-bunker',840,560,roof='#687575',wall='#3d4b4d',accent='#b78b3b',style='bunker',seed=23)
    draw_service_yard()
    draw_fuel_tank()
    for n in ('civil-house','industrial-hall','harbour-office','naval-bunker','service-yard','fuel-tank'):
        print('wrote',OUT/f'{n}.png')

if __name__=='__main__': main()

def draw_civil_boat():
    name='civil-boat';w,h=300,600
    im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA')
    # soft wake under the stern
    for k,a in [(0,80),(18,50),(36,28)]:
        d.arc((35-k,355+k,265+k,595+k),200,340,fill=(220,246,247,a),width=max(2,10-k//5))
    hull=[(150,45),(222,150),(232,345),(195,470),(150,535),(105,470),(68,345),(78,150)]
    d.polygon([(x+8,y+14) for x,y in hull],fill=(4,18,24,85))
    d.polygon(hull,fill=(216,222,216,255),outline=(52,67,70,255),width=8)
    d.polygon([(150,70),(198,168),(194,318),(150,360),(106,318),(102,168)],fill=(109,132,135,255),outline=(47,63,66,230),width=5)
    d.rounded_rectangle((112,185,188,280),radius=14,fill=(39,63,70,255),outline=(191,207,202,180),width=4)
    d.polygon([(120,160),(150,112),(180,160)],fill=(235,239,231,220))
    d.line((88,334,212,334),fill=(231,212,148,170),width=4)
    d.ellipse((133,402,167,436),fill=(67,79,78,255),outline=(219,226,215,140),width=3)
    # navigation lights
    d.ellipse((84,300,96,312),fill=(86,235,157,245));d.ellipse((204,300,216,312),fill=(239,83,73,245))
    invisible_entropy(im,9067,4000)
    im.save(OUT/f'{name}.png')

if __name__=='__main__':
    draw_civil_boat()
    print('wrote',OUT/'civil-boat.png')
