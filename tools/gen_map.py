from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np, math, random
from pathlib import Path

random.seed(81357)
rng=np.random.default_rng(81357)
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'; OUT.mkdir(parents=True,exist_ok=True)
W,H=720,9216

def multiscale_noise(w,h,base=(24,70,82),amps=(22,12,6),cells=(34,110,360)):
    arr=np.zeros((h,w,3),dtype=np.float32); arr[:]=base
    for amp,cell in zip(amps,cells):
        sh=(max(3,h//cell),max(3,w//cell))
        n=rng.random(sh,dtype=np.float32)
        im=Image.fromarray(np.uint8(n*255)).resize((w,h),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(max(1,cell//10)))
        a=np.asarray(im,dtype=np.float32)/255-.5
        arr[:,:,0]+=a*amp*.45; arr[:,:,1]+=a*amp*.9; arr[:,:,2]+=a*amp*1.15
    return Image.fromarray(np.uint8(np.clip(arr,0,255)),'RGB').convert('RGBA')

def mask_from_poly(poly, blur=0):
    m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m); d.polygon(poly,fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m

def composite_texture(base, mask, colors, seed=0, rough=12):
    rr=np.random.default_rng(seed)
    small=rr.random((H//36,W//36),dtype=np.float32)
    n=np.asarray(Image.fromarray(np.uint8(small*255)).resize((W,H),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(2)),dtype=np.float32)/255-.5
    y=np.linspace(0,1,H,dtype=np.float32)[:,None]
    c0=np.array(colors[0],dtype=np.float32); c1=np.array(colors[1],dtype=np.float32)
    col=c0[None,None,:]*(1-y[:,:,None])+c1[None,None,:]*y[:,:,None]
    col=np.repeat(col,W,axis=1)
    col += n[:,:,None]*rough
    tex=Image.fromarray(np.uint8(np.clip(col,0,255)),'RGB').convert('RGBA')
    return Image.composite(tex,base,mask)

im=multiscale_noise(W,H,(8,63,89),(19,12,7),(26,92,310))
d=ImageDraw.Draw(im,'RGBA')
for y in range(0,H,52):
    alpha=10+int(8*math.sin(y*.0017)**2)
    x0=60+int(28*math.sin(y*.0053))+random.randint(-8,8)
    x1=W-60+int(20*math.sin(y*.0037+1.8))+random.randint(-8,8)
    d.arc((x0,y-20,x0+120,y+36),190,325,fill=(127,228,238,alpha),width=2)
    d.arc((x1-120,y-10,x1,y+42),15,155,fill=(121,216,231,alpha),width=2)
for i in range(26):
    cx=random.randint(80,W-80); cy=random.randint(0,H); rx=random.randint(40,130); ry=random.randint(22,65)
    d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=(2,37,57,random.randint(12,30)))

def shores(y):
    if y>=7900: lw,rw=60,660
    elif y>=6900:
        t=(7900-y)/1000; lw=80+150*t; rw=650-95*t
    elif y>=5800:
        t=(6900-y)/1100; lw=230+55*t; rw=555-35*t
    elif y>=4700:
        t=(5800-y)/1100; lw=285-70*t; rw=520+55*t
    elif y>=3800:
        t=(4700-y)/900; lw=215+72*t; rw=575-82*t
    elif y>=2550:
        t=(3800-y)/1250; lw=287-120*t; rw=493+120*t
    else:
        lw=170+40*math.sin(y*.002); rw=550-42*math.sin(y*.002+1.2)
    wob=18*math.sin(y*.0031)+9*math.sin(y*.0097+1)
    return lw+wob, rw+wob*.45

left=[(0,0)]+[(int(shores(y)[0]),y) for y in range(0,H+1,14)]+[(0,H)]
right=[(W,0)]+[(int(shores(y)[1]),y) for y in range(0,H+1,14)]+[(W,H)]
landmask=Image.new('L',(W,H),0); md=ImageDraw.Draw(landmask); md.polygon(left,fill=255); md.polygon(right,fill=255)
im=composite_texture(im,landmask,((72,74,61),(104,91,63)),seed=3,rough=28)
d=ImageDraw.Draw(im,'RGBA')
for side in (0,1):
    pts=[]
    for y in range(0,H+1,12): pts.append((shores(y)[side],y))
    d.line(pts,fill=(0,23,30,190),width=18)
    d.line(pts,fill=(44,115,116,210),width=10)
    d.line(pts,fill=(115,222,214,170),width=5)
    d.line([(x+(6 if side==0 else -6),y) for x,y in pts],fill=(222,255,239,95),width=2)

def road(points,width=72):
    d.line(points,fill=(25,30,31,150),width=width+16,joint='curve')
    d.line(points,fill=(67,69,64,255),width=width,joint='curve')
    d.line(points,fill=(115,111,91,100),width=3,joint='curve')
    for (x1,y1),(x2,y2) in zip(points,points[1:]):
        dx,dy=x2-x1,y2-y1; L=max(1,int(math.hypot(dx,dy))); ux,uy=dx/L,dy/L
        for s in range(20,L,55):
            x=x1+ux*s; y=y1+uy*s
            d.line((x,y,x+ux*24,y+uy*24),fill=(215,199,123,110),width=3)

road([(28,9160),(100,8200),(175,7450),(135,6700),(222,5900),(125,5100),(210,4300),(172,3400),(85,2600)],76)
road([(700,9040),(630,8200),(570,7380),(625,6500),(540,5720),(610,4880),(525,4070),(590,3250),(665,2480)],68)

def prism_rect(box, top, side=(25,31,32,255), height=20, edge=(210,220,208,70), shadow=True):
    x0,y0,x1,y1=box
    if shadow:
        sx,sy=16,24
        d.polygon([(x0+sx,y0+sy),(x1+sx,y0+sy),(x1+sx,y1+sy),(x0+sx,y1+sy)],fill=(0,10,13,95))
    d.polygon([(x0,y1),(x1,y1),(x1+height*.42,y1+height),(x0+height*.42,y1+height)],fill=side)
    d.polygon([(x1,y0),(x1+height*.42,y0+height),(x1+height*.42,y1+height),(x1,y1)],fill=(max(0,side[0]-4),max(0,side[1]-4),max(0,side[2]-4),side[3]))
    d.rectangle((x0,y0,x1,y1),fill=top,outline=edge,width=2)
    d.line((x0+2,y0+3,x1-2,y0+3),fill=(255,255,245,50),width=2)

def warehouse(x,y,w,h,roof=(69,82,83,255),angle=0):
    prism_rect((x,y,x+w,y+h),roof,(30,40,42,255),24)
    for xx in range(x+14,x+w-8,26): d.line((xx,y+8,xx,y+h-8),fill=(15,27,30,80),width=2)
    for k in range(max(1,w//95)):
        vx=x+18+k*85; vy=y+14
        d.rectangle((vx,vy,vx+30,vy+14),fill=(21,31,33,220),outline=(142,159,155,80),width=1)
    for k in range(max(1,w//75)):
        vx=x+28+k*70
        if vx<x+w-20: d.rectangle((vx,y+h-22,vx+14,y+h-14),fill=(190,136,56,125))

def container(x,y,c,scale=1):
    w,h=int(62*scale),int(30*scale)
    prism_rect((x,y,x+w,y+h),c,(31,38,40,255),int(8*scale),shadow=True)
    for xx in range(x+8,x+w-3,max(8,int(12*scale))): d.line((xx,y+4,xx,y+h-4),fill=(10,16,17,85),width=1)

def tank(x,y,r=30):
    d.ellipse((x-r+14,y-r+20,x+r+14,y+r+20),fill=(0,8,10,90))
    d.ellipse((x-r,y-r,x+r,y+r),fill=(82,92,84,255),outline=(161,174,157,120),width=2)
    d.ellipse((x-r+7,y-r+7,x+r-7,y+r-7),fill=(52,62,57,255),outline=(125,143,133,100),width=2)
    d.ellipse((x-r*.35,y-r*.35,x+r*.35,y+r*.35),fill=(27,35,34,255))
    d.line((x-r*.7,y,x+r*.7,y),fill=(190,196,177,65),width=2)

def crane(x,y,flip=1):
    sh=18
    d.line((x+sh,y+sh,x+flip*128+sh,y-70+sh),fill=(0,8,12,100),width=14)
    d.line((x+sh,y+sh,x+sh,y+110+sh),fill=(0,8,12,100),width=16)
    d.line((x,y,x+flip*128,y-70),fill=(113,100,68,255),width=9)
    d.line((x,y,x,y+110),fill=(61,73,72,255),width=12)
    d.line((x+flip*18,y-10,x+flip*18,y+104),fill=(173,160,108,150),width=2)
    d.line((x+flip*28,y-15,x+flip*110,y-60),fill=(205,180,95,115),width=2)

def helipad(cx,cy,r=72):
    d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=(53,60,57,220),outline=(181,189,165,130),width=3)
    d.ellipse((cx-r+9,cy-r+9,cx+r-9,cy+r-9),outline=(201,196,145,130),width=3)
    d.line((cx-r+25,cy,cx+r-25,cy),fill=(223,215,164,100),width=3)
    d.text((cx-14,cy-26),'H',fill=(226,219,176,150),stroke_width=1,stroke_fill=(50,55,53,150))

def bridge(y,skew=0):
    x0,x1=55,670
    d.polygon([(x0+18,y+30),(x1+18,y+skew+30),(x1+18,y+skew+124),(x0+18,y+124)],fill=(0,7,10,125))
    deck=[(x0,y),(x1,y+skew),(x1,y+skew+84),(x0,y+84)]
    d.polygon(deck,fill=(61,69,67,255),outline=(151,158,146,120))
    d.line((x0+4,y+8,x1-4,y+skew+8),fill=(181,181,158,90),width=3)
    for x in range(x0+18,x1-20,48):
        yy=y+int((x-x0)/(x1-x0)*skew)
        d.rectangle((x,yy+16,x+34,yy+67),fill=(36,43,43,255),outline=(101,111,106,80))
    base=y+90
    d.line((x0,base,x1,base+skew),fill=(25,35,37,255),width=8)
    for x in range(x0,x1-50,62):
        yy=base+int((x-x0)/(x1-x0)*skew)
        d.line((x,yy,x+31,yy+42),fill=(27,39,41,255),width=6)
        d.line((x+31,yy+42,x+62,yy+int(62/(x1-x0)*skew)),fill=(27,39,41,255),width=6)
    for x in (x0+14,x1-14):
        d.ellipse((x-4,y+9,x+4,y+17),fill=(255,176,70,210))

for cx,cy,s in [(138,8640,1.1),(575,8420,.88),(340,8980,.72)]:
    pts=[]
    for k in range(12):
        a=k*math.pi*2/12; rr=(56+random.randint(-12,13))*s
        pts.append((cx+math.cos(a)*rr,cy+math.sin(a)*rr*.7))
    sh=[(x+13,y+18) for x,y in pts]; d.polygon(sh,fill=(0,10,13,95)); d.polygon(pts,fill=(75,82,67,255),outline=(147,151,119,95))
    d.ellipse((cx-24*s,cy-16*s,cx+24*s,cy+16*s),fill=(34,48,45,230))
    d.arc((cx-65*s,cy-38*s,cx+65*s,cy+38*s),10,170,fill=(192,247,232,105),width=4)

warehouse(18,7370,170,230,(58,75,80,255)); warehouse(500,7190,190,270,(70,78,75,255))
warehouse(16,6820,150,185,(62,69,65,255)); warehouse(535,6670,165,205,(52,68,72,255))
for i,(x,y,c) in enumerate([
    (34,7130,(118,57,43,255)),(104,7130,(52,78,100,255)),(34,7088,(102,96,56,255)),(104,7088,(91,52,40,255)),
    (525,7005,(54,77,100,255)),(590,7005,(118,59,45,255)),(525,6963,(100,96,58,255)),(590,6963,(61,87,79,255))]): container(x,y,c,.9)
crane(204,7110,1); crane(515,7490,-1); helipad(600,7705,62)
for x,y in [(210,7550),(246,7550),(468,6845),(500,6845)]: tank(x,y,24)
prism_rect((0,7750,235,7880),(76,79,69,255),(34,40,41,255),20)
prism_rect((472,7480,720,7600),(70,75,69,255),(32,38,39,255),20)
for x in range(18,210,42): d.rectangle((x,7818,x+24,7848),fill=(37,44,44,255))
for x in range(495,700,42): d.rectangle((x,7547,x+24,7577),fill=(37,44,44,255))

bridge(6310,28)
warehouse(6,6100,160,165,(61,74,73,255)); warehouse(553,6150,160,170,(69,71,64,255))
for x,y in [(186,6030),(220,6014),(497,6088)]: tank(x,y,25)
for x1,x2,y in [(20,205,6530),(510,705,6460),(45,205,5750),(515,700,5620)]:
    d.line((x1+12,y+20,x2+12,y+20),fill=(0,10,12,80),width=13); d.line((x1,y,x2,y),fill=(93,109,105,255),width=8); d.line((x1,y,x2,y),fill=(190,205,193,60),width=2)

bridge(5280,-36)
warehouse(4,5450,188,240,(52,66,68,255)); warehouse(520,5360,194,258,(65,70,68,255))
warehouse(25,4840,152,185,(69,68,61,255)); warehouse(558,4740,150,200,(55,67,69,255))
for yy in [5025,4982,4939]:
    container(196,yy,(119,58,43,255),.72); container(249,yy,(50,74,97,255),.72); container(302,yy,(105,101,59,255),.72)
crane(190,5550,1); crane(528,5180,-1)
for x,y in [(210,4780),(248,4768),(470,5160),(502,5170)]: tank(x,y,28)

warehouse(0,4240,205,300,(58,67,65,255)); warehouse(510,4150,210,315,(66,69,63,255))
for cx,cy in [(235,4450),(470,4510),(170,3930),(540,3850)]:
    d.ellipse((cx-52,cy-36,cx+52,cy+36),fill=(0,8,10,85)); d.ellipse((cx-44,cy-44,cx+44,cy+44),fill=(69,74,67,255),outline=(158,159,133,100),width=2); d.ellipse((cx-25,cy-25,cx+25,cy+25),fill=(33,41,41,255));
    for a in range(0,360,90):
        xx=cx+math.cos(math.radians(a))*34; yy=cy+math.sin(math.radians(a))*34; d.ellipse((xx-4,yy-4,xx+4,yy+4),fill=(205,164,73,160))
for y in (4040,4350):
    d.line((70,y,250,y-18),fill=(40,49,48,255),width=15); d.line((470,y+20,650,y),fill=(40,49,48,255),width=15)

prism_rect((0,3020,225,3590),(54,64,64,255),(24,33,35,255),28)
prism_rect((495,2980,720,3560),(60,65,62,255),(24,33,35,255),28)
warehouse(15,3140,180,165,(65,73,70,255)); warehouse(525,3085,180,170,(64,70,68,255))
for cx,cy in [(110,3440),(610,3400),(90,2880),(630,2850)]: tank(cx,cy,32)
for radius,alpha in [(250,80),(300,55),(350,35)]:
    d.arc((360-radius,3180-radius*.34,360+radius,3180+radius*.34),200,340,fill=(180,202,188,alpha),width=3)
for r,a in [(120,70),(86,90),(50,100)]: d.ellipse((360-r,3000-r*.42,360+r,3000+r*.42),outline=(78,203,218,a),width=3)
for ang in range(0,360,45):
    x=360+math.cos(math.radians(ang))*135; y=3000+math.sin(math.radians(ang))*56
    d.rectangle((x-5,y-5,x+5,y+5),fill=(219,173,73,100))
crane(205,3230,1); crane(515,3270,-1)

for y in [2250,1700,1120,520]:
    bridge(y,random.randint(-30,30))
for x,y,w,h in [(0,1900,190,250),(530,1800,190,250),(15,960,170,220),(545,820,170,240),(0,220,210,190),(510,130,210,220)]:
    warehouse(x,y,w,h,(55+random.randint(0,15),66+random.randint(0,12),64+random.randint(0,8),255))

d=ImageDraw.Draw(im,'RGBA')
for i in range(1250):
    y=random.randint(0,H-1); lx,rx=shores(y)
    side=random.choice([0,1]);
    if side==0: x=random.randint(3,max(4,int(lx)-4))
    else: x=random.randint(min(W-4,int(rx)+4),W-3)
    if random.random()<.45:
        d.line((x,y,x+random.randint(-8,8),y+random.randint(4,18)),fill=(28,31,29,random.randint(18,50)),width=1)
    else:
        r=random.randint(1,3); d.ellipse((x-r,y-r,x+r,y+r),fill=(175,163,116,random.randint(12,36)))
for y in range(260,9000,170):
    lx,rx=shores(y)
    for x in (lx-13,rx+13):
        d.ellipse((x-5,y-5,x+5,y+5),fill=(26,34,34,180)); d.rectangle((x-2,y-12,x+2,y),fill=(116,126,117,160))

sun=Image.new('RGBA',(W,H),(0,0,0,0)); sd=ImageDraw.Draw(sun,'RGBA')
for y in range(0,H,420):
    sd.polygon([(0,y),(180,y-80),(W,y+210),(W,y+360)],fill=(255,203,125,7))
im=Image.alpha_composite(im,sun.filter(ImageFilter.GaussianBlur(24)))
shade=Image.new('L',(W,1)); sp=shade.load()
for x in range(W):
    u=abs((x-W/2)/(W/2)); sp[x,0]=int(clamp:=min(80,max(0,(u-.72)*240)))
shade=shade.resize((W,H))
black=Image.new('RGBA',(W,H),(0,6,10,255)); im=Image.composite(black,im,shade)

im=Image.alpha_composite(Image.new('RGBA',(W,H),(8,54,76,255)),im)
im=im.convert('RGB')
im.save(OUT/'harbour_map.png',optimize=True)
print('wrote',OUT/'harbour_map.png',im.size)
