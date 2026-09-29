from PIL import Image, ImageDraw, ImageFilter
import numpy as np, random, os
W=H=2048
OUT='dist/art/environment'
os.makedirs(OUT,exist_ok=True)

def fbm(seed):
    rng=np.random.default_rng(seed)
    acc=np.zeros((H,W),dtype=np.float32); weight=0.0
    for grid,amp in [(16,0.34),(32,0.26),(64,0.18),(128,0.12),(256,0.07),(512,0.03)]:
        small=(rng.random((grid,grid))*255).astype('uint8')
        layer=np.asarray(Image.fromarray(small,'L').resize((W,H),Image.Resampling.BICUBIC),dtype=np.float32)/255.0
        acc+=layer*amp;weight+=amp
    return np.clip(acc/weight,0,1)

def make(name,seed,base,bright,dark,kind):
    n=fbm(seed); fine=fbm(seed+97)
    shade=np.clip((n-.5)*1.1+(fine-.5)*.28, -.55,.55)
    basea=np.array(base,dtype=np.float32); ba=np.array(bright,dtype=np.float32); da=np.array(dark,dtype=np.float32)
    t=np.clip(shade+.5,0,1)[...,None]
    rgb=np.where(t>.5, basea+(ba-basea)*((t-.5)*1.25), da+(basea-da)*(t*1.65))
    # directional large-scale illumination, upper-left brighter
    yy,xx=np.mgrid[0:H,0:W]; light=(1-(xx/W*.34+yy/H*.24))[...,None]
    rgb=np.clip(rgb*(.90+.17*light),0,255).astype('uint8')
    im=Image.fromarray(rgb,'RGB')
    draw=ImageDraw.Draw(im,'RGBA'); rnd=random.Random(seed)
    if kind=='tropical':
        # clustered canopy masses + exposed pale rock, at multiple scales
        for i in range(3400):
            x=rnd.randrange(W);y=rnd.randrange(H);r=rnd.randint(2,9)
            col=rnd.choice([(25,66,35,55),(49,95,45,50),(92,112,57,36),(13,48,31,42)])
            draw.ellipse((x-r*1.4,y-r,x+r*1.4,y+r),fill=col)
        for i in range(520):
            x=rnd.randrange(W);y=rnd.randrange(H);rx=rnd.randint(5,24);ry=rnd.randint(3,13)
            draw.ellipse((x-rx,y-ry,x+rx,y+ry),fill=(171,159,125,rnd.randint(18,52)))
    elif kind=='alpine':
        for i in range(1150):
            x=rnd.randrange(W);y=rnd.randrange(H);rx=rnd.randint(5,25);ry=rnd.randint(3,12)
            c=rnd.choice([(95,97,88,58),(144,139,118,38),(56,67,62,42)])
            draw.ellipse((x-rx,y-ry,x+rx,y+ry),fill=c)
        for i in range(900):
            x=rnd.randrange(W);y=rnd.randrange(H);h=rnd.randint(8,28);w=max(3,h//3)
            draw.polygon([(x,y-h),(x-w,y+h//3),(x+w,y+h//3)],fill=(31,67,47,rnd.randint(45,85)))
    else:
        for i in range(950):
            x=rnd.randrange(W);y=rnd.randrange(H);rx=rnd.randint(6,28);ry=rnd.randint(2,10)
            draw.ellipse((x-rx,y-ry,x+rx,y+ry),fill=rnd.choice([(247,250,247,65),(108,118,116,45),(75,85,84,42)]))
        for i in range(420):
            x=rnd.randrange(W);y=rnd.randrange(H);length=rnd.randint(20,100)
            draw.line((x,y,x+length,y-rnd.randint(-10,20)),fill=(236,245,244,60),width=rnd.randint(1,4))
    im=im.filter(ImageFilter.GaussianBlur(.35))
    im.save(f'{OUT}/{name}',optimize=True)

make('land-tropical.png',101,(55,96,55),(105,124,72),(31,60,42),'tropical')
make('land-alpine.png',211,(97,101,91),(151,146,126),(51,61,58),'alpine')
make('land-snow.png',307,(175,185,182),(240,245,242),(84,96,96),'snow')
print('generated 2048x2048 hero terrain textures')
