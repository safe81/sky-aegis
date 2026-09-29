function drawHarbourStructures(t){
  const by=(state.scroll%2400)-650;
  if(by>-220&&by<H+260){
    ctx.save();ctx.translate(0,by);
    ctx.save();ctx.translate(20,34);ctx.rotate(-.045);ctx.fillStyle='rgba(0,5,9,.48)';ctx.fillRect(72,-58,590,122);ctx.restore();
    ctx.rotate(-.045);
    const g=ctx.createLinearGradient(0,-70,0,70);g.addColorStop(0,'#77817f');g.addColorStop(.42,'#465357');g.addColorStop(1,'#202c31');ctx.fillStyle=g;ctx.fillRect(64,-66,600,114);
    ctx.fillStyle='#151f23';for(let x=78;x<650;x+=58){ctx.fillRect(x,-50,38,83)}
    ctx.strokeStyle='#a2a59a';ctx.lineWidth=3;ctx.strokeRect(64,-66,600,114);
    ctx.fillStyle='#cfaa4a';for(let x=73;x<650;x+=66)ctx.fillRect(x,-58,32,5);
    ctx.strokeStyle='#1c292e';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(70,49);ctx.lineTo(660,49);for(let x=70;x<640;x+=72){ctx.moveTo(x,49);ctx.lineTo(x+36,111);ctx.lineTo(x+72,49)}ctx.stroke();
    ctx.fillStyle='#323b3c';ctx.beginPath();ctx.arc(170,-8,31,0,TAU);ctx.fill();ctx.fillStyle='#171c1d';ctx.beginPath();ctx.arc(170,-8,18,0,TAU);ctx.fill();
    for(const bx of [98,628]){ctx.globalCompositeOperation='lighter';glowCircle(ctx,bx,-52,18,'rgba(255,155,58,.3)');ctx.globalCompositeOperation='source-over';ctx.fillStyle='#ffc36a';ctx.fillRect(bx-3,-55,6,6)}
    ctx.restore();
  }

  const py=((state.scroll+1540)%2050)-560;
  if(py>-280&&py<H+300){
    ctx.save();ctx.translate(490,py);ctx.rotate(.035);
    ctx.fillStyle='rgba(0,5,9,.42)';ctx.fillRect(-205,-126,330,250);
    ctx.translate(-14,-17);
    ctx.fillStyle='#283436';poly(ctx,[[-205,124],[125,124],[112,151],[-190,151]]);ctx.fill();
    ctx.fillStyle='#222d30';poly(ctx,[[125,-126],[150,-110],[137,137],[125,124]]);ctx.fill();
    const pg=ctx.createLinearGradient(-180,-120,100,120);pg.addColorStop(0,'#77776c');pg.addColorStop(.55,'#565e5c');pg.addColorStop(1,'#303b3d');ctx.fillStyle=pg;ctx.fillRect(-205,-126,330,250);
    ctx.strokeStyle='rgba(218,219,200,.34)';ctx.lineWidth=3;ctx.strokeRect(-205,-126,330,250);
    ctx.fillStyle='rgba(22,32,35,.9)';for(let y=-100;y<95;y+=38)ctx.fillRect(-190,y,300,3);
    const cs=[[-158,-86,0],[-105,-86,1],[-52,-86,2],[-132,-40,1],[-79,-40,0],[22,-78,2]];
    for(const [x,y,v] of cs){ctx.save();ctx.translate(x,y);ctx.scale(.54,.54);drawContainer(v);ctx.restore()}
    ctx.strokeStyle='#293638';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(-188,78);ctx.lineTo(-72,78);ctx.quadraticCurveTo(-42,78,-42,48);ctx.lineTo(-42,15);ctx.stroke();
    ctx.strokeStyle='#9ba8a3';ctx.lineWidth=3;ctx.stroke();
    ctx.strokeStyle='rgba(225,224,188,.34)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(62,55,44,0,TAU);ctx.stroke();ctx.font='800 36px system-ui';ctx.fillStyle='rgba(225,224,188,.28)';ctx.textAlign='center';ctx.fillText('H',62,68);
    for(const [lx,ly,c] of [[-187,-109,'#ffb04a'],[105,-109,'#74eaff'],[108,106,'#74eaff'],[-187,106,'#ffb04a']]){ctx.globalCompositeOperation='lighter';glowCircle(ctx,lx,ly,22,c==='#74eaff'?'rgba(60,220,255,.26)':'rgba(255,156,55,.24)');ctx.globalCompositeOperation='source-over';ctx.fillStyle=c;ctx.beginPath();ctx.arc(lx,ly,3.5,0,TAU);ctx.fill()}
    ctx.restore();
  }

  const gy=((state.scroll+340)%1900)-760;
  if(gy>-190&&gy<H+200){
    ctx.save();ctx.translate(0,gy);
    ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=32;ctx.beginPath();ctx.moveTo(420,38);ctx.lineTo(720,70);ctx.stroke();
    ctx.strokeStyle='#394b52';ctx.lineWidth=22;ctx.stroke();ctx.strokeStyle='#8e9ea0';ctx.lineWidth=4;ctx.stroke();
    for(let x=448;x<720;x+=58){ctx.strokeStyle='#27373c';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x,7);ctx.lineTo(x+28,98);ctx.stroke()}
    ctx.restore();
  }
}
