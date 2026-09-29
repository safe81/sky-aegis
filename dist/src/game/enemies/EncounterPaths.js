const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function cubic(a,b,c,d,t){const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;}
export const FLIGHT_PROFILES={
 'light-fighter':{entry:1.8,hold:.25,tell:.46,attack:1.0,recover:.4,move:1.15,exit:2.8,y:220,shift:115},
 'interceptor':{entry:1.15,hold:.16,tell:.55,attack:.48,recover:.12,move:.85,exit:1.65,y:300,shift:280},
 'side-sweeper':{entry:2.1,hold:.3,tell:.65,attack:1.8,recover:.35,move:1.3,exit:2.6,y:245,shift:360},
 'armoured-bomber':{entry:2.8,hold:.5,tell:.9,attack:1.9,recover:.75,move:1.8,exit:4.0,y:245,shift:145},
 'missile-aircraft':{entry:2.0,hold:.5,tell:1.0,attack:1.45,recover:.7,move:1.6,exit:2.9,y:275,shift:235},
 'gunship':{entry:2.7,hold:.6,tell:.8,attack:2.1,recover:.7,move:1.6,exit:3.5,y:325,shift:210},
};
export function flightPose(family,origin,age){
 const p=FLIGHT_PROFILES[family];if(!p)return null;
 const dir=origin.x<576?1:-1;
 const target={x:clamp(origin.x+dir*(family==='interceptor'?170:family==='side-sweeper'?100:20),95,1057),y:p.y+Math.max(0,-origin.y-50)*.22};
 const next={x:clamp(target.x+dir*p.shift,90,1062),y:target.y+(family==='side-sweeper'?110:170)};
 const sweptEnd=at=>family==='side-sweeper'?clamp(at+dir*190,90,1062):at;
 const schedule=[['entrance',p.entry],['position',p.hold],['telegraph',p.tell],['attack',p.attack],['recovery',p.recover],['reposition',p.move],['telegraph',p.tell],['attack',p.attack],['exit',p.exit]];
 let time=age,index=0;while(index<schedule.length-1&&time>=schedule[index][1])time-=schedule[index++][1];
 const [state,duration]=schedule[index],t=clamp(time/duration,0,1),cycle=index>=6?1:0;
 let x=cycle?next.x:target.x,y=cycle?next.y:target.y;
 if(state==='entrance'){x=cubic(origin.x,origin.x-dir*75,target.x,target.x,t);y=cubic(origin.y,origin.y+180,target.y,target.y,t);}
 if(state==='recovery')x=sweptEnd(target.x);
 if(state==='reposition'){x=cubic(sweptEnd(target.x),sweptEnd(target.x)+dir*60,next.x-dir*50,next.x,t);y=cubic(target.y,target.y-45,next.y,next.y,t);}
 if(state==='exit'){x=cubic(sweptEnd(next.x),sweptEnd(next.x)-dir*40,clamp(next.x+dir*180,80,1072),clamp(next.x+dir*280,60,1092),t);y=cubic(next.y,next.y+90,1180,1470,t);}
 if(state==='attack'&&family==='side-sweeper'){const start=cycle?next.x:target.x,end=sweptEnd(start);x=cubic(start,start,end,end,t);}
 return {x,y,state,phaseTime:time,phaseDuration:duration,attackCycle:cycle,done:state==='exit'&&time>=duration};
}
