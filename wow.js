import * as THREE from 'three';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 800px)').matches || !matchMedia('(hover:hover)').matches;

/* ---------- preloader ---------- */
const pre = document.getElementById('pre');
setTimeout(()=>pre && pre.classList.add('done'), reduce?100:1500);

/* ---------- hero title words ---------- */
const h1 = document.querySelector('.hero h1');
if(h1 && !reduce){
  const words = h1.textContent.trim().split(/\s+/);
  h1.setAttribute('aria-label', h1.textContent.trim());
  h1.innerHTML = words.map((w,i)=>`<span class="w" aria-hidden="true"><i style="animation-delay:${0.25+i*0.07}s">${w.replace('&','&amp;')}</i></span>`).join(' ');
}

/* ---------- progress bar + cursor glow ---------- */
const prog = document.getElementById('prog'), cur = document.getElementById('cur');
let sp = 0;
function onScroll(){
  const h = document.documentElement.scrollHeight - innerHeight;
  sp = h>0 ? scrollY/h : 0;
  if(prog) prog.style.width = (sp*100)+'%';
}
addEventListener('scroll', onScroll, {passive:true}); onScroll();
let px=innerWidth/2, py=innerHeight/2, cx=px, cy=py, nx=0, ny=0;
addEventListener('pointermove', e=>{ px=e.clientX; py=e.clientY; nx=(px/innerWidth-.5)*2; ny=(py/innerHeight-.5)*2; }, {passive:true});

/* ---------- tilt + glare ---------- */
if(!mobile && !reduce){
  document.querySelectorAll('.project-card,.case-card,.skill-card,.cert-card').forEach(c=>{
    c.classList.add('tilt');
    c.addEventListener('pointermove', e=>{
      const r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      c.style.setProperty('--mx',(x*100)+'%'); c.style.setProperty('--my',(y*100)+'%');
      c.style.transform=`perspective(900px) rotateY(${(x-.5)*9}deg) rotateX(${-(y-.5)*9}deg) translateZ(8px)`;
    });
    c.addEventListener('pointerleave',()=>{ c.style.transform=''; });
  });
  // magnetic buttons
  document.querySelectorAll('.btn').forEach(b=>{
    b.addEventListener('pointermove',e=>{ const r=b.getBoundingClientRect();
      b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*0.18}px,${(e.clientY-r.top-r.height/2)*0.25}px)`; });
    b.addEventListener('pointerleave',()=>{ b.style.transform=''; });
  });
}

/* ---------- counters ---------- */
document.querySelectorAll('.stat-row strong').forEach(el=>{
  const txt = el.textContent.trim(); const m = txt.match(/^([\d.]+)(.*)$/);
  if(!m || reduce) return;
  const end = parseFloat(m[1]), suf = m[2], dec = (m[1].split('.')[1]||'').length;
  el.textContent = '0'+suf;
  const io = new IntersectionObserver(es=>{ if(!es[0].isIntersecting) return; io.disconnect();
    const t0=performance.now(), D=1800;
    (function f(n){ const k=Math.min(1,(n-t0)/D), e=1-Math.pow(1-k,3);
      el.textContent=(end*e).toFixed(dec)+suf; if(k<1) requestAnimationFrame(f); })(t0);
  },{threshold:.6}); io.observe(el);
});

/* ---------- marquee ---------- */
const items = ['MidJourney','Veo','Kling 3.0','Seedance 2.0','Higgsfield','Nano Banana 2','Adobe Firefly','ElevenLabs','Claude','Photoshop','Illustrator','InDesign','Premiere Pro','After Effects','CapCut','GA4','Power BI'];
const hero = document.querySelector('.hero');
if(hero){
  const m = document.createElement('div'); m.className='marq'; m.setAttribute('aria-hidden','true');
  const row = items.map(t=>`<span>${t}</span><span><b>✦</b></span>`).join('');
  m.innerHTML = `<div class="track">${row}${row}</div>`;
  hero.after(m);
}

/* ---------- full-page 3D background ---------- */
try{
  const cv = document.getElementById('bg3d');
  const renderer = new THREE.WebGLRenderer({canvas:cv, antialias:!mobile, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile?1.5:1.75));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.045);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
  const DEPTH = 70;

  // dust tunnel
  const N = mobile?500:1100, pos = new Float32Array(N*3), col = new Float32Array(N*3);
  const gold = new THREE.Color(0xc9a84c), cream = new THREE.Color(0xf5f0e8);
  for(let i=0;i<N;i++){
    const a=Math.random()*Math.PI*2, r=2+Math.random()*14;
    pos[i*3]=Math.cos(a)*r; pos[i*3+1]=Math.sin(a)*r*0.7; pos[i*3+2]=-Math.random()*DEPTH;
    const c = Math.random()<0.8?gold:cream; col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3)); g.setAttribute('color', new THREE.BufferAttribute(col,3));
  const dust = new THREE.Points(g, new THREE.PointsMaterial({size:0.07, vertexColors:true, transparent:true, opacity:0.85, depthWrite:false, sizeAttenuation:true}));
  scene.add(dust);

  // floating gold wire objects along the tunnel
  const geos = [new THREE.IcosahedronGeometry(1,0), new THREE.OctahedronGeometry(1,0), new THREE.TorusGeometry(1,0.28,12,40), new THREE.TetrahedronGeometry(1.1,0), new THREE.TorusKnotGeometry(0.8,0.22,90,10)];
  const objs=[];
  const count = mobile?9:16;
  for(let i=0;i<count;i++){
    const geo = geos[i%geos.length];
    const m = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({color:i%3===0?0xf5f0e8:0xc9a84c, transparent:true, opacity:i%3===0?0.18:0.38}));
    const side = (i%2?1:-1);
    m.position.set(side*(5+Math.random()*6), (Math.random()-.5)*8, -9 - i*(DEPTH-14)/count);
    const s = 0.7+Math.random()*1.4; m.scale.setScalar(s);
    m.userData = {rx:(Math.random()-.5)*0.01, ry:(Math.random()-.5)*0.012, base:m.position.clone(), ph:Math.random()*6};
    scene.add(m); objs.push(m);
  }
  // soft light orbs
  const orbMat = new THREE.MeshBasicMaterial({color:0xf0d98a, transparent:true, opacity:0.9});
  const orbs=[]; for(let i=0;i<6;i++){ const o=new THREE.Mesh(new THREE.SphereGeometry(0.12,16,16), orbMat); o.position.set((Math.random()-.5)*14,(Math.random()-.5)*8,-8-i*10); o.userData={ph:Math.random()*6}; scene.add(o); orbs.push(o); }

  function size(){ renderer.setSize(innerWidth, innerHeight, false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
  size(); addEventListener('resize', size);

  let tz=0, smooth=0, tx=0, ty=0;
  (function frame(now){
    requestAnimationFrame(frame);
    const t=now/1000;
    smooth += (sp - smooth)*0.06;
    camera.position.z = -smooth*(DEPTH-14);
    camera.position.x += ((nx*0.8) - camera.position.x)*0.04;
    camera.position.y += ((-ny*0.5) - camera.position.y)*0.04;
    camera.rotation.z = Math.sin(smooth*6)*0.05;
    camera.lookAt(camera.position.x*0.3, camera.position.y*0.3, camera.position.z-10);
    for(const o of objs){ o.rotation.x+=o.userData.rx*(reduce?0:1)+0.002; o.rotation.y+=o.userData.ry*(reduce?0:1)+0.003; o.position.y=o.userData.base.y+Math.sin(t*0.5+o.userData.ph)*0.4; }
    for(const o of orbs){ o.position.y += Math.sin(t+o.userData.ph)*0.004; }
    dust.rotation.z = t*0.01;
    // cursor glow follow
    cx += (px-cx)*0.12; cy += (py-cy)*0.12;
    if(cur) cur.style.transform=`translate(${cx}px,${cy}px)`;
    renderer.render(scene,camera);
  })(performance.now());
}catch(e){ console.warn('bg3d unavailable', e); }
