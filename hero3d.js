import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const box = document.getElementById('hero3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function init(){
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  box.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.1, 10.5);

  const group = new THREE.Group();
  scene.add(group);

  const pearl = new THREE.MeshPhysicalMaterial({
    color:0xf4efe6, roughness:0.28, metalness:0.0, clearcoat:1, clearcoatRoughness:0.12,
    sheen:1, sheenColor:new THREE.Color(0xffe3c8), iridescence:0.6, iridescenceIOR:1.4
  });
  const rose = new THREE.MeshStandardMaterial({color:0xc9956b, metalness:1, roughness:0.22});
  const gold = new THREE.MeshStandardMaterial({color:0xc9a84c, metalness:1, roughness:0.2});

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.35, 96, 96), pearl);
  group.add(body);

  // cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.32, 64), rose);
  cap.position.y = 1.38; group.add(cap);
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.16, 64), gold);
  capTop.position.y = 1.62; group.add(capTop);

  // amber "eye"
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.62, 64, 64),
    new THREE.MeshPhysicalMaterial({color:0xffa31a, emissive:0xff7a00, emissiveIntensity:0.9, roughness:0.05, transmission:0.0, clearcoat:1}));
  eye.position.set(0.2, -0.15, 1.02); group.add(eye);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 32, 128), rose);
  ring.position.copy(eye.position); ring.position.z += 0.02; ring.rotation.set(0.15,-0.12,0.5); group.add(ring);

  // orbit ring
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.012, 16, 256), gold);
  orbit.rotation.set(1.25, 0.2, 0.3); group.add(orbit);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 24), gold);
  group.add(dot);

  // particles
  const N = 380, pos = new Float32Array(N*3);
  for(let i=0;i<N;i++){
    const r = 2.4 + Math.random()*2.6, a = Math.random()*Math.PI*2, b = (Math.random()-0.5)*Math.PI;
    pos[i*3]=r*Math.cos(a)*Math.cos(b); pos[i*3+1]=r*Math.sin(b)*0.9; pos[i*3+2]=r*Math.sin(a)*Math.cos(b)-1;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({color:0xc9a84c, size:0.03, transparent:true, opacity:0.75, sizeAttenuation:true}));
  scene.add(pts);

  const key = new THREE.DirectionalLight(0xfff0d8, 1.6); key.position.set(3,4,5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9a84c, 1.4); rim.position.set(-4,1,-3); scene.add(rim);

  function size(){
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  size(); new ResizeObserver(size).observe(box);

  let mx=0,my=0,tx=0,ty=0, scrollY=0, visible=true, t0=performance.now();
  addEventListener('pointermove', e=>{ const r = box.getBoundingClientRect();
    mx = ((e.clientX - r.left)/r.width - 0.5)*2; my = ((e.clientY - r.top)/r.height - 0.5)*2; }, {passive:true});
  addEventListener('scroll', ()=>{ scrollY = window.scrollY; }, {passive:true});
  new IntersectionObserver(es=>{ visible = es[0].isIntersecting; }).observe(box);

  function frame(now){
    requestAnimationFrame(frame);
    if(!visible) return;
    const t = (now - t0)/1000;
    tx += (mx - tx)*0.05; ty += (my - ty)*0.05;
    group.rotation.y = (reduce?0.3:t*0.35) + tx*0.5 + scrollY*0.0012;
    group.rotation.x = ty*0.25 + Math.sin(t*0.6)*0.04;
    group.position.y = reduce?0:Math.sin(t*0.9)*0.08;
    dot.position.set(Math.cos(t*0.8)*2.1, 0, Math.sin(t*0.8)*2.1).applyEuler(orbit.rotation);
    pts.rotation.y = t*0.03 - scrollY*0.0004;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  box.classList.add('ready');
}
try{ init(); }catch(e){ console.warn('3D unavailable, showing photo', e); }

// 3D tilt on project cards (pointer devices only)
if(matchMedia('(hover:hover)').matches && !reduce){
  document.querySelectorAll('.project-card, .case-card').forEach(c=>{
    c.style.transformStyle='preserve-3d';
    c.addEventListener('pointermove', e=>{
      const r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-0.5, y=(e.clientY-r.top)/r.height-0.5;
      c.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-4px)`;
    });
    c.addEventListener('pointerleave', ()=>{ c.style.transform=''; });
  });
}
