let ac=null,master=null;
function initAudio(){if(ac)return;ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.12;master.connect(ac.destination)}
function tone(freq,dur,type='sine',gain=.08,slide=0){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),ac.currentTime+dur);g.gain.setValueAtTime(gain,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g);g.connect(master);o.start();o.stop(ac.currentTime+dur)}
function audioPulse(){initAudio();tone(120,.5,'sawtooth',.12,620);tone(840,.34,'sine',.06,-520)}

function frame(ts){const dt=Math.min(.033,(ts-state.last)/1000||0);state.last=ts;update(dt);draw(ts);requestAnimationFrame(frame)}
function start(){if(state.running)return;state.running=true;state.last=performance.now();boot.classList.add('hidden');initAudio();if(ac?.state==='suspended')ac.resume();}
startBtn.addEventListener('click',start);pulseBtn.addEventListener('click',e=>{e.stopPropagation();pulse()});pauseBtn.addEventListener('click',e=>{e.stopPropagation();state.paused=!state.paused;pauseBtn.textContent=state.paused?'▶':'Ⅱ'});
canvas.addEventListener('pointerdown',e=>{start();pointer=e.pointerId;player.manual=true;canvas.setPointerCapture(pointer);moveTarget(e)});
canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointer)moveTarget(e)});canvas.addEventListener('pointerup',e=>{if(e.pointerId===pointer){pointer=null;setTimeout(()=>player.manual=false,1200)}});canvas.addEventListener('pointercancel',()=>{pointer=null;player.manual=false});
function moveTarget(e){const r=canvas.getBoundingClientRect();player.targetX=(e.clientX-r.left)/r.width*W;player.targetY=(e.clientY-r.top)/r.height*H-40;}
window.addEventListener('keydown',e=>{start();player.manual=true;const d=55;if(e.key==='ArrowLeft'||e.key==='a')player.targetX-=d;if(e.key==='ArrowRight'||e.key==='d')player.targetX+=d;if(e.key==='ArrowUp'||e.key==='w')player.targetY-=d;if(e.key==='ArrowDown'||e.key==='s')player.targetY+=d;if(e.code==='Space')pulse()});
window.addEventListener('blur',()=>{if(state.running)state.paused=true});

loadAssets().then(()=>{
  resetCycle();
  const snap=parseFloat(params.get('snapshot')||'0');
  if(snap>0){
    state.running=true; boot.classList.add('hidden'); player.manual=false;
    const steps=Math.min(60*75,Math.floor(snap*60));
    for(let i=0;i<steps;i++) update(1/60);
    state.paused=true; draw(performance.now()); updateHud();
  }else{
    if(params.get('demo')==='1')start();
    requestAnimationFrame(frame);
  }
}).catch(err=>{console.error(err);boot.querySelector('.subtitle').textContent='ASSET LOAD ERROR';});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
