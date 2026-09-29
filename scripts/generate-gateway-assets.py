from PIL import Image, ImageDraw
from pathlib import Path
import random, math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/art/level1/raster'; OUT.mkdir(parents=True,exist_ok=True)

def invisible_entropy(im,seed,count=10000):
    rng=random.Random(seed);px=im.load();w,h=im.size
    for _ in range(count):
        x=rng.randrange(w);y=rng.randrange(h)
        if px[x,y][3]==0: px[x,y]=(rng.randrange(256),rng.randrange(256),rng.randrange(256),0)

def texture(draw,box,seed,count=1800):
    rng=random.Random(seed);x0,y0,x1,y1=box
    for i in range(count):
        x=rng.randint(x0,x1);y=rng.randint(y0,y1);r=rng.choice([1,1,2,2,3]);c=(245,232,192,rng.randint(18,55)) if i%4==0 else (23,32,30,rng.randint(20,65));draw.ellipse((x-r,y-r,x+r,y+r),fill=c)

def draw_gateway_keep():
    w,h=720,900;im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA');rng=random.Random(71)
    # cliff_buttress: broad irregular rock plinth integrates the fortress into the terrain
    cliff_buttress=[(86,720),(124,556),(185,490),(242,470),(308,488),(375,462),(451,490),(528,545),(605,720),(568,824),(164,824)]
    d.polygon(cliff_buttress,fill=(122,116,94,255),outline=(58,64,58,250));
    for i in range(48):
        x=rng.randint(130,575);y=rng.randint(510,790);ww=rng.randint(22,68);hh=rng.randint(12,34);d.polygon([(x,y),(x+ww,y-rng.randint(2,12)),(x+ww-rng.randint(3,15),y+hh),(x-rng.randint(3,14),y+hh+rng.randint(1,10))],fill=(154+rng.randint(-18,20),145+rng.randint(-15,16),113+rng.randint(-12,18),100),outline=(55,61,55,70))
    # main top-down keep roof footprint and lower side faces
    roof=[(196,242),(360,170),(525,249),(484,512),(237,512)]
    d.polygon([(237,512),(484,512),(484,610),(237,610)],fill=(83,88,77,255),outline=(40,47,44,255))
    d.polygon([(484,512),(525,249),(525,343),(484,610)],fill=(67,75,69,255),outline=(39,46,43,255))
    d.polygon(roof,fill=(180,171,137,255),outline=(55,62,56,255))
    # upper citadel roof cap
    d.polygon([(244,280),(360,220),(476,282),(446,390),(275,390)],fill=(117,93,67,255),outline=(50,52,47,255))
    d.polygon([(262,275),(360,228),(454,278),(360,310)],fill=(187,126,75,220))
    # four compact corner towers, rendered primarily from roof view
    for cx,cy in [(214,322),(505,324),(246,507),(475,507)]:
        rr=58;d.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),fill=(151,148,126,255),outline=(55,61,57,255),width=7)
        d.ellipse((cx-rr+10,cy-rr+10,cx+rr-10,cy+rr-10),fill=(190,181,149,255),outline=(92,91,75,220),width=4)
        d.line((cx-rr*.55,cy,cx+rr*.55,cy),fill=(78,83,75,120),width=4)
    # bridge_portal: deck connection cue/opening on water-facing face
    bridge_portal=(292,518,428,585)
    d.rounded_rectangle(bridge_portal,radius=12,fill=(35,47,48,255),outline=(216,207,172,225),width=8)
    d.rectangle((305,532,415,554),fill=(60,73,72,255));d.line((307,566,413,566),fill=(206,185,116,180),width=5)
    # roof machinery / small battlements
    for x in range(274,460,44):
        d.rectangle((x,414,x+22,438),fill=(69,78,75,245),outline=(196,199,178,110),width=2)
    # warm lamps as local accents
    for x,y in [(260,503),(462,503),(184,397),(535,398)]:
        d.ellipse((x-9,y-9,x+9,y+9),fill=(255,184,62,235));d.ellipse((x-20,y-20,x+20,y+20),fill=(255,177,49,45))
    texture(d,(150,210,565,805),71,320)
    invisible_entropy(im,9071,15000)
    im.save(OUT/'gateway-keep.png')

def draw_watchtower():
    w,h=520,700;im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA');rng=random.Random(83)
    # rock base
    base=[(105,570),(128,420),(178,360),(252,345),(324,370),(390,430),(416,565),(365,636),(145,630)]
    d.polygon(base,fill=(125,119,96,255),outline=(53,61,55,255),width=6)
    # oblique hex tower roof and side
    roof=[(190,255),(260,210),(333,255),(319,390),(205,390)]
    d.polygon([(205,390),(319,390),(319,495),(205,495)],fill=(69,78,74,255),outline=(36,45,44,255),width=6)
    d.polygon(roof,fill=(185,176,143,255),outline=(57,62,56,255),width=7)
    d.polygon([(210,280),(260,242),(310,282),(260,306)],fill=(113,93,71,255),outline=(63,62,54,200),width=4)
    d.rounded_rectangle((230,405,290,465),radius=9,fill=(30,45,48,255),outline=(208,201,169,210),width=5)
    for a in range(0,360,45):
        rr=58;cx=260+int(math.cos(math.radians(a))*rr);cy=325+int(math.sin(math.radians(a))*rr*.55);d.rectangle((cx-7,cy-7,cx+7,cy+7),fill=(67,73,66,220))
    for i in range(220):
        x=rng.randint(125,400);y=rng.randint(235,615);r=rng.choice([1,1,2]);d.ellipse((x-r,y-r,x+r,y+r),fill=(22,31,29,rng.randint(18,50)) if i%3 else (244,231,191,rng.randint(20,52)))
    invisible_entropy(im,9083,12000)
    im.save(OUT/'coastal-watchtower.png')

def draw_gateway_terrace():
    w,h=1000,420;im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA');rng=random.Random(91)
    pts=[(40,210),(140,110),(815,95),(950,175),(914,330),(120,335)]
    d.polygon(pts,fill=(149,140,112,245),outline=(58,65,58,250),width=9)
    d.line((125,180,875,165),fill=(222,210,171,170),width=8)
    d.line((105,250,900,244),fill=(75,82,72,180),width=12)
    for x in range(145,880,92):d.rectangle((x,138,x+38,179),fill=(76,84,76,230),outline=(183,179,150,120),width=3)
    texture(d,(80,105,925,330),91,280)
    invisible_entropy(im,9091,16000)
    im.save(OUT/'gateway-terrace.png')

def draw_arch_support():
    w,h=500,700;im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA');rng=random.Random(97)
    # bridge support pier with taper and open arch recess
    d.polygon([(115,610),(150,180),(330,180),(385,610)],fill=(120,119,105,255),outline=(45,53,51,255),width=9)
    d.polygon([(150,180),(242,130),(330,180),(308,235),(170,235)],fill=(182,174,143,255),outline=(55,60,55,255),width=7)
    d.rounded_rectangle((190,300,310,520),radius=48,fill=(35,48,49,255),outline=(205,199,168,210),width=8)
    d.line((150,260,345,260),fill=(226,215,175,145),width=6)
    texture(d,(120,170,380,610),97,220)
    invisible_entropy(im,9097,12000)
    im.save(OUT/'gateway-arch-support.png')

def main():
    draw_gateway_keep();draw_watchtower();draw_gateway_terrace();draw_arch_support()
    for n in ('gateway-keep','coastal-watchtower','gateway-terrace','gateway-arch-support'):print('wrote',OUT/f'{n}.png')
if __name__=='__main__':main()
