import * as THREE from 'three';

const box = document.getElementById('hero3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function init(){
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  box.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6);

  // the real Pearl Aura render on a plane, tilting in 3D
  const tex = new THREE.TextureLoader().load('pearl-aura-hero.jpg', ()=>{ box.classList.add('ready'); });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const H = 3.6, W = H*576/768;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({map:tex}));
  const holder = new THREE.Group(); holder.add(card); scene.add(holder);

  // thin gold frame floating slightly in front
  const fr = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(W+0.18, H+0.18)),
    new THREE.LineBasicMaterial({color:0xc9a84c, transparent:true, opacity:0.8}));
  fr.position.z = 0.25; holder.add(fr);

  // gold dust at different depths (parallax)
  function dust(n, zmin, zmax, size, op){
    const p = new Float32Array(n*3);
    for(let i=0;i<n;i++){ p[i*3]=(Math.random()-0.5)*5.2; p[i*3+1]=(Math.random()-0.5)*5; p[i*3+2]=zmin+Math.random()*(zmax-zmin); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p,3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({color:0xe6c874, size, transparent:true, opacity:op, sizeAttenuation:true, depthWrite:false}));
    scene.add(m); return m;
  }
  const back = dust(120, -2.5, -0.6, 0.035, 0.55);
  const front = dust(60, 0.5, 2.2, 0.05, 0.8);

  function size(){
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix();
    const fit = (H+0.9)/ (2*Math.tan(THREE.MathUtils.degToRad(15)));
    camera.position.z = Math.max(fit, (W+0.9)/(2*Math.tan(THREE.MathUtils.degToRad(15))/ (1/camera.aspect)));
  }
  size(); new ResizeObserver(size).observe(box);

  let mx=0,my=0,tx=0,ty=0, sy=0, visible=true;
  addEventListener('pointermove', e=>{ const r=box.getBoundingClientRect();
    mx=((e.clientX-r.left)/r.width-0.5)*2; my=((e.clientY-r.top)/r.height-0.5)*2; }, {passive:true});
  addEventListener('deviceorientation', e=>{ if(e.gamma!=null){ mx=Math.max(-1,Math.min(1,e.gamma/30)); my=Math.max(-1,Math.min(1,(e.beta-45)/30)); } });
  addEventListener('scroll', ()=>{ sy=window.scrollY; }, {passive:true});
  new IntersectionObserver(es=>{ visible=es[0].isIntersecting; }).observe(box);

  const t0=performance.now();
  (function frame(now){
    requestAnimationFrame(frame);
    if(!visible) return;
    const t=(now-t0)/1000;
    const ax = reduce?0:Math.sin(t*0.5)*0.12, ay = reduce?0:Math.cos(t*0.4)*0.08;
    tx += (mx-tx)*0.06; ty += (my-ty)*0.06;
    holder.rotation.y = tx*0.35 + ax;
    holder.rotation.x = ty*0.22 + ay;
    holder.position.y = reduce?0:Math.sin(t*0.8)*0.05;
    back.position.x = -tx*0.25; back.position.y = ty*0.15 + sy*0.0008; back.rotation.y = t*0.02;
    front.position.x = -tx*0.7; front.position.y = ty*0.4 + (reduce?0:Math.sin(t*0.6)*0.05);
    front.position.z = 0;
    renderer.render(scene, camera);
  })(t0);
}
try{ init(); }catch(e){ console.warn('3D unavailable, showing photo', e); }

if(matchMedia('(hover:hover)').matches && !reduce){
  document.querySelectorAll('.project-card, .case-card').forEach(c=>{
    c.addEventListener('pointermove', e=>{
      const r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-0.5, y=(e.clientY-r.top)/r.height-0.5;
      c.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-4px)`;
    });
    c.addEventListener('pointerleave', ()=>{ c.style.transform=''; });
  });
}
