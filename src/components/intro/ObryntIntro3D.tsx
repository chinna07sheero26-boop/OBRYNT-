import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ArrowRight } from 'lucide-react';
import {
  createIntroMaterials,
  buildObryntEmblem3D,
  buildMensFashionModel,
  buildWomensFashionModel,
  buildKidsFashionModel,
  buildSneakerModel,
  buildWatchModel,
  buildBeautyModel,
} from './obrynt3dModels';
import { OBRYNT_EMBLEM_SRC } from '../ObryntBrand';

export const INTRO_SESSION_STORAGE_KEY = 'obrynt_intro_seen';

interface ObryntIntro3DProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface CategoryShowcaseMeta {
  indexLabel: string;
  title: string;
  subtitle: string;
}

const SHOWCASE_CATEGORIES: CategoryShowcaseMeta[] = [
  {
    indexLabel: '01',
    title: "MEN'S FASHION",
    subtitle: 'Architectural Tailoring & Outerwear',
  },
  {
    indexLabel: '02',
    title: "WOMEN'S FASHION",
    subtitle: 'Couture Drapery & Structured Leather',
  },
  {
    indexLabel: '03',
    title: "KIDS' FASHION",
    subtitle: 'Heritage Capsule & Everyday Essentials',
  },
  {
    indexLabel: '04',
    title: 'SNEAKERS & FOOTWEAR',
    subtitle: 'Sculpted Silhouettes & Italian Craft',
  },
  {
    indexLabel: '05',
    title: 'WATCHES & ACCESSORIES',
    subtitle: 'Chronograph Horology & Fine Objects',
  },
  {
    indexLabel: '06',
    title: 'BEAUTY & LIFESTYLE',
    subtitle: 'Signature Parfums & Atelier Care',
  },
];

// Reusable module-scope math helpers (zero GC inside animation loop)
const _camTargetPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 0, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createSoftParticleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 244, 210, 1)');
  grad.addColorStop(0.28, 'rgba(232, 198, 122, 0.85)');
  grad.addColorStop(0.65, 'rgba(212, 175, 95, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const ObryntIntro3D: React.FC<ObryntIntro3DProps> = ({ isOpen, onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [phase, setPhase] = useState<
    'opening' | 'brandReveal' | 'showcase' | 'logoAscend' | 'exiting'
  >('opening');
  const [activeCategoryIdx, setActiveCategoryIdx] = useState<number>(-1);
  const [reducedMotionMode, setReducedMotionMode] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SESSION_STORAGE_KEY, '1');
    } catch {
      // Ignore storage restriction errors
    }
    setPhase('exiting');
    window.setTimeout(() => {
      onCompleteRef.current();
    }, 420);
  }, []);

  // Keyboard Escape shortcut to skip intro
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishIntro();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, finishIntro]);

  // Respect prefers-reduced-motion accessibility setting
  useEffect(() => {
    if (!isOpen) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setReducedMotionMode(true);
      setPhase('brandReveal');
      const timer = window.setTimeout(() => {
        finishIntro();
      }, 1100);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, finishIntro]);

  // Core Three.js Cinematic 3D Choreography
  useEffect(() => {
    if (!isOpen || reducedMotionMode) return;
    const container = mountRef.current;
    if (!container) return;

    let frameId = 0;
    let isDisposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let envRT: THREE.WebGLRenderTarget | null = null;
    let particleTex: THREE.CanvasTexture | null = null;
    let texturesToDispose: THREE.Texture[] = [];
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (!isDisposed) {
        setWebglFailed(true);
        finishIntro();
      }
    };

    try {
      const isSoftwareGl = detectSoftwareWebGL();
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const isMobile = width < 768;

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x050506, 1);

      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050506);
      scene.fog = new THREE.FogExp2(0x050506, 0.042);

      const camera = new THREE.PerspectiveCamera(isMobile ? 54 : 42, width / height, 0.1, 120);
      camera.position.set(0, 0.25, isMobile ? 7.6 : 6.2);
      _currentLook.set(0, 0, 0);
      camera.lookAt(_currentLook);

      // Mandatory Studio Environment Reflection Map
      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      roomEnv.dispose();
      pmrem.dispose();

      // Balanced 3-Point Warm/Cool Cinematic Studio Lighting Rig
      const hemiFill = new THREE.HemisphereLight(0xdbeafe, 0x1a150e, 0.45);
      scene.add(hemiFill);

      const keyLight = new THREE.DirectionalLight(0xffe4b5, 2.2);
      keyLight.position.set(4, 7, 6);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 30;
        keyLight.shadow.camera.left = -8;
        keyLight.shadow.camera.right = 8;
        keyLight.shadow.camera.top = 8;
        keyLight.shadow.camera.bottom = -8;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      // Subtle Golden Bloom Light at Center (animates from 0 -> warm intensity)
      const goldenBloomLight = new THREE.PointLight(0xffcf70, 0.0, 18, 1.5);
      goldenBloomLight.position.set(0, 0.3, 2.2);
      scene.add(goldenBloomLight);

      const rimLight = new THREE.DirectionalLight(0xd4dcf7, 1.35);
      rimLight.position.set(-5, 4, -6);
      scene.add(rimLight);

      // Showcase roving highlight light
      const runwaySpot = new THREE.PointLight(0xf6d38b, 0.0, 12, 1.6);
      runwaySpot.position.set(0, 3.0, 0);
      scene.add(runwaySpot);

      // Materials & Procedural Textures
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const matBundle = createIntroMaterials(isSoftwareGl, maxAniso);
      texturesToDispose = matBundle.texturesToDispose;
      Object.values(matBundle.materials).forEach((m) => materialsToDispose.push(m));

      // 1. Hero 3D Official OBRYNT Emblem
      const emblemGroup = buildObryntEmblem3D(matBundle.materials);
      emblemGroup.position.set(0, 0.25, 0);
      emblemGroup.scale.setScalar(0.01);
      scene.add(emblemGroup);

      // Subtle reflective obsidian stage disk beneath the emblem & runway
      const stageFloor = new THREE.Mesh(
        new THREE.CircleGeometry(32, 64),
        new THREE.MeshStandardMaterial({
          color: 0x070709,
          metalness: 0.5,
          roughness: 0.32,
        })
      );
      stageFloor.rotation.x = -Math.PI / 2;
      stageFloor.position.y = -2.2;
      stageFloor.receiveShadow = true;
      scene.add(stageFloor);
      geometriesToDispose.push(stageFloor.geometry);
      materialsToDispose.push(stageFloor.material as THREE.Material);

      // 2. Converging Golden & Platinum Particle System (1,100 particles)
      const PARTICLE_COUNT = 1100;
      const startPos = new Float32Array(PARTICLE_COUNT * 3);
      const targetPos = new Float32Array(PARTICLE_COUNT * 3);
      const currentPos = new Float32Array(PARTICLE_COUNT * 3);
      const colors = new Float32Array(PARTICLE_COUNT * 3);

      const goldColor = new THREE.Color(0xf2cf7e);
      const champagneColor = new THREE.Color(0xfff1c9);
      const platinumColor = new THREE.Color(0xd8dde8);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Initial swirling vortex nebula
        const angle = (i / PARTICLE_COUNT) * Math.PI * 14;
        const radius = 1.6 + Math.random() * 5.8;
        startPos[i * 3] = Math.cos(angle) * radius;
        startPos[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
        startPos[i * 3 + 2] = Math.sin(angle) * radius - 1.0;

        currentPos[i * 3] = startPos[i * 3];
        currentPos[i * 3 + 1] = startPos[i * 3 + 1];
        currentPos[i * 3 + 2] = startPos[i * 3 + 2];

        // Target formation: rings + horizontal emblem bars + floating ambient aura
        if (i < 600) {
          const ringA = (i / 600) * Math.PI * 2;
          const r = 1.38 + (Math.random() - 0.5) * 0.14;
          targetPos[i * 3] = Math.cos(ringA) * r;
          targetPos[i * 3 + 1] = 0.25 + Math.sin(ringA) * r;
          targetPos[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
        } else if (i < 850) {
          // Horizontal nameplate silhouette
          targetPos[i * 3] = (Math.random() - 0.5) * 2.9;
          targetPos[i * 3 + 1] = 0.25 + (Math.random() - 0.5) * 0.55;
          targetPos[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
        } else {
          // Luxury ambient champagne dust motes in the runway room
          targetPos[i * 3] = (Math.random() - 0.5) * 16;
          targetPos[i * 3 + 1] = (Math.random() - 0.5) * 5 + 0.3;
          targetPos[i * 3 + 2] = -2 - Math.random() * 14;
        }

        const c = i % 5 === 0 ? platinumColor : i % 2 === 0 ? goldColor : champagneColor;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometriesToDispose.push(particleGeo);

      particleTex = createSoftParticleTexture();
      const particleMat = new THREE.PointsMaterial({
        size: isMobile ? 0.11 : 0.085,
        map: particleTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      materialsToDispose.push(particleMat);

      const particlePoints = new THREE.Points(particleGeo, particleMat);
      scene.add(particlePoints);

      // 3. 6 Composite 3D Fashion Category Models arranged along a sweeping curved gallery arc
      const categoryModels: THREE.Group[] = [
        buildMensFashionModel(matBundle.materials),
        buildWomensFashionModel(matBundle.materials),
        buildKidsFashionModel(matBundle.materials),
        buildSneakerModel(matBundle.materials),
        buildWatchModel(matBundle.materials),
        buildBeautyModel(matBundle.materials),
      ];

      // Position along an S-curved luxury gallery corridor starting at Z = -5.5 back to Z = -18.5
      const categoryWorldPositions = [
        new THREE.Vector3(-2.6, -1.0, -5.8),
        new THREE.Vector3(2.6, -1.0, -8.3),
        new THREE.Vector3(-2.5, -1.0, -10.8),
        new THREE.Vector3(2.5, -1.0, -13.3),
        new THREE.Vector3(-2.4, -1.0, -15.8),
        new THREE.Vector3(2.2, -1.0, -18.3),
      ];

      categoryModels.forEach((model, idx) => {
        model.position.copy(categoryWorldPositions[idx]);
        model.scale.setScalar(0.92);
        model.visible = false;
        scene.add(model);
      });

      // Collect all procedural geometries created inside models for clean disposal
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry && !geometriesToDispose.includes(mesh.geometry)) {
            geometriesToDispose.push(mesh.geometry);
          }
        }
      });

      // Pre-warm shaders on GPU devices
      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Timeline State (in seconds)
      // 0.00 -> 1.15 : Dark background -> golden light blooms -> particles converge into emblem
      // 1.15 -> 2.75 : Metallic emblem emerges, rotates smoothly, settles dead center; OBRYNT & tagline reveal
      // 2.75 -> 6.35 : 6-Category 3D Fashion Visual Experience camera sweep
      // 6.35 -> 7.25 : Logo elevates upward smoothly into homepage
      const startTime = performance.now();
      let lastTime = startTime;
      let lastPhase: typeof phase = 'opening';
      let lastCatIdx = -1;
      let completedTriggered = false;

      const onResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.fov = w < 768 ? 54 : 42;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      };
      window.addEventListener('resize', onResize);

      const afterDraw = (cb: () => void) => {
        if (!renderer || isDisposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      };

      const tick = () => {
        if (isDisposed || !renderer) return;

        const now = performance.now();
        const elapsed = (now - startTime) / 1000;
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // 1. Golden Light Bloom Intensity
        if (elapsed < 1.2) {
          const t = THREE.MathUtils.smoothstep(elapsed, 0.05, 1.15);
          goldenBloomLight.intensity = t * 5.2;
        } else if (elapsed < 2.75) {
          goldenBloomLight.intensity = 5.2 + Math.sin(elapsed * 2.5) * 0.4;
        } else {
          goldenBloomLight.intensity = THREE.MathUtils.damp(goldenBloomLight.intensity, 1.8, 3.0, delta);
        }

        // 2. Particle Vortex -> Crest Convergence
        const convT = THREE.MathUtils.smootherstep(elapsed, 0.08, 1.35);
        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const ix = i * 3;
          const swirl = (1 - convT) * 2.4;
          const sx = startPos[ix];
          const sz = startPos[ix + 2];
          const rotX = sx * Math.cos(swirl) - sz * Math.sin(swirl);
          const rotZ = sx * Math.sin(swirl) + sz * Math.cos(swirl);

          arr[ix] = THREE.MathUtils.lerp(rotX, targetPos[ix], convT);
          arr[ix + 1] = THREE.MathUtils.lerp(startPos[ix + 1], targetPos[ix + 1], convT) + Math.sin(elapsed * 1.4 + i * 0.05) * 0.025 * convT;
          arr[ix + 2] = THREE.MathUtils.lerp(rotZ, targetPos[ix + 2], convT);
        }
        posAttr.needsUpdate = true;

        // Fade particles subtly after crest forms so luxury dust motes remain airy
        particleMat.opacity = elapsed < 1.5 ? 0.95 : THREE.MathUtils.damp(particleMat.opacity, 0.42, 2.5, delta);

        // 3. Emblem Emergence & Graceful 3D Rotation
        if (elapsed < 2.75) {
          const emblemScale = THREE.MathUtils.smootherstep(elapsed, 0.65, 1.5);
          emblemGroup.scale.setScalar(Math.max(0.01, emblemScale * (isMobile ? 0.85 : 1.05)));

          // Gentle elegant rotation settling toward 0 rad facing viewer
          const rotProgress = THREE.MathUtils.smootherstep(elapsed, 0.7, 2.45);
          const sweepAngle = (1 - rotProgress) * Math.PI * 0.85;
          emblemGroup.rotation.y = sweepAngle;
          emblemGroup.rotation.x = Math.sin(rotProgress * Math.PI) * 0.14;
          emblemGroup.position.y = 0.35 + Math.sin(elapsed * 1.8) * 0.03;
        }

        // Phase transitions & Camera Choreography
        if (elapsed >= 1.25 && elapsed < 2.75 && lastPhase !== 'brandReveal') {
          lastPhase = 'brandReveal';
          setPhase('brandReveal');
        }

        if (elapsed >= 2.75 && elapsed < 6.35) {
          if (lastPhase !== 'showcase') {
            lastPhase = 'showcase';
            setPhase('showcase');
          }

          // Reveal fashion models cleanly during Act 2
          categoryModels.forEach((m, idx) => {
            m.visible = true;
            m.rotation.y += delta * (idx % 2 === 0 ? 0.55 : -0.55);
          });

          // Smooth glide through all 6 categories over 3.6 seconds (0.6s per object)
          const runwayProgress = (elapsed - 2.75) / 3.6;
          const clampedProgress = THREE.MathUtils.clamp(runwayProgress, 0, 0.999);
          const catFloat = clampedProgress * categoryWorldPositions.length;
          const catIdx = Math.min(Math.floor(catFloat), categoryWorldPositions.length - 1);

          if (catIdx !== lastCatIdx) {
            lastCatIdx = catIdx;
            setActiveCategoryIdx(catIdx);
          }

          // Smooth camera target along runway corridor
          const focusPos = categoryWorldPositions[catIdx];
          const sideOffset = focusPos.x < 0 ? 1.65 : -1.65;
          _camTargetPos.set(
            focusPos.x + sideOffset * (isMobile ? 0.75 : 1.0),
            focusPos.y + (isMobile ? 1.55 : 1.35),
            focusPos.z + (isMobile ? 4.3 : 3.45)
          );
          _lookTarget.set(focusPos.x, focusPos.y + 0.75, focusPos.z);

          runwaySpot.position.set(focusPos.x, focusPos.y + 3.2, focusPos.z + 1.2);
          runwaySpot.intensity = THREE.MathUtils.damp(runwaySpot.intensity, 7.5, 5.0, delta);

          // Move emblem smoothly behind/above as camera advances into gallery
          emblemGroup.position.y = THREE.MathUtils.damp(emblemGroup.position.y, 4.5, 3.0, delta);

          camera.position.lerp(_camTargetPos, 1 - Math.exp(-3.8 * delta));
          _currentLook.lerp(_lookTarget, 1 - Math.exp(-4.5 * delta));
          camera.lookAt(_currentLook);
        } else if (elapsed < 2.75) {
          // Act 1 Camera subtle cinematic push-in
          _camTargetPos.set(0, 0.25, isMobile ? 7.4 - elapsed * 0.25 : 6.0 - elapsed * 0.25);
          camera.position.lerp(_camTargetPos, 1 - Math.exp(-4.0 * delta));
          _lookTarget.set(0, 0.2, 0);
          _currentLook.lerp(_lookTarget, 1 - Math.exp(-5.0 * delta));
          camera.lookAt(_currentLook);
        }

        // Act 3: Logo moves upward & transitions into homepage
        if (elapsed >= 6.35 && elapsed < 7.25) {
          if (lastPhase !== 'logoAscend') {
            lastPhase = 'logoAscend';
            setPhase('logoAscend');
            setActiveCategoryIdx(-1);
          }
          _camTargetPos.set(0, 2.8, camera.position.z - 1.5);
          camera.position.lerp(_camTargetPos, 1 - Math.exp(-3.0 * delta));
          runwaySpot.intensity = THREE.MathUtils.damp(runwaySpot.intensity, 0.0, 4.0, delta);
        }

        // Act 4: Complete & Enter Storefront
        if (elapsed >= 7.25 && !completedTriggered) {
          completedTriggered = true;
          finishIntro();
          return;
        }

        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      };

      frameId = requestAnimationFrame(tick);

      return () => {
        isDisposed = true;
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);

        geometriesToDispose.forEach((g) => g.dispose());
        materialsToDispose.forEach((m) => m.dispose());
        texturesToDispose.forEach((t) => t.dispose());
        particleTex?.dispose();
        envRT?.dispose();

        if (renderer) {
          renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
          renderer.dispose();
          if (renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
          }
        }
      };
    } catch {
      setWebglFailed(true);
      finishIntro();
    }
  }, [isOpen, reducedMotionMode, finishIntro]);

  if (!isOpen) return null;

  const isBrandCenterVisible = phase === 'brandReveal';
  const isLogoAscending = phase === 'logoAscend';
  const isExiting = phase === 'exiting';
  const currentCat = activeCategoryIdx >= 0 ? SHOWCASE_CATEGORIES[activeCategoryIdx] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="OBRYNT 3D Opening Experience"
      className={`fixed inset-0 z-[70] overflow-hidden select-none transition-opacity duration-500 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#050506' }}
    >
      {/* Dedicated Empty WebGL Mount Container (never inside blur/HUD wrappers) */}
      {!reducedMotionMode && !webglFailed && (
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      )}

      {/* Radial Champagne Gold Atmospheric Ambient Glow Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          background:
            phase === 'opening'
              ? 'radial-gradient(circle at 50% 48%, rgba(230, 199, 130, 0.14) 0%, rgba(5, 5, 6, 0) 52%)'
              : 'radial-gradient(circle at 50% 45%, rgba(230, 199, 130, 0.08) 0%, rgba(5, 5, 6, 0.45) 70%)',
        }}
      />

      {/* Semantic 3D Brand Typography & Ascending Logo Lockup */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10"
        style={{ perspective: '1000px' }}
      >
        <div
          className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform flex flex-col items-center"
          style={{
            opacity: isBrandCenterVisible || isLogoAscending ? 1 : 0,
            transform: isLogoAscending
              ? 'translate3d(0, -41vh, 0) scale(0.42)'
              : isBrandCenterVisible
              ? 'translate3d(0, 14vh, 0) scale(1) rotateX(0deg)'
              : 'translate3d(0, 18vh, -80px) scale(0.92) rotateX(14deg)',
          }}
        >
          {/* Official Emblem Badge Fallback / Crisp Accent for Reduced Motion */}
          {reducedMotionMode && (
            <div className="w-24 h-24 rounded-full overflow-hidden border border-amber-200/40 mb-5 bg-black shadow-2xl">
              <img
                src={OBRYNT_EMBLEM_SRC}
                alt="OBRYNT Official Crest"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Subtle Subtitle Kicker */}
          <p className="text-[10px] sm:text-xs font-medium tracking-[0.42em] uppercase text-[#d9be83] mb-2">
            INTERNATIONAL FASHION &amp; LIFESTYLE
          </p>

          {/* Main 3D Metallic Brand Wordmark */}
          <h1
            className="font-luxury text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[0.3em] uppercase leading-none"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #b8944f 0%, #f6e3b4 32%, #ffffff 50%, #d8b874 72%, #8e6e35 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 16px 32px rgba(0, 0, 0, 0.92))',
            }}
          >
            OBRYNT
          </h1>

          {/* Champagne Gold Divider Rule */}
          <div className="w-28 sm:w-44 h-[1px] bg-gradient-to-r from-transparent via-[#dfc07c] to-transparent my-4 opacity-80" />

          {/* Required Brand Tagline */}
          <p className="text-xs sm:text-sm font-semibold tracking-[0.38em] uppercase text-[#f4efe6]">
            SHOP SMART. LIVE BETTER.
          </p>
        </div>
      </div>

      {/* Fashion Visual Experience Caption (Lower Center during Act 2) */}
      <div
        className="pointer-events-none absolute bottom-20 sm:bottom-16 inset-x-0 flex flex-col items-center justify-center px-6 text-center z-10 transition-all duration-500"
        style={{
          opacity: currentCat && phase === 'showcase' ? 1 : 0,
          transform: currentCat && phase === 'showcase' ? 'translate3d(0, 0, 0)' : 'translate3d(0, 12px, 0)',
        }}
      >
        {currentCat && (
          <div
            className="px-6 py-3 border border-[#d7b56d]/30"
            style={{ backgroundColor: 'rgba(10, 10, 12, 0.86)' }}
          >
            <div className="flex items-center justify-center gap-3 text-[10px] font-mono tracking-[0.26em] uppercase text-[#dfc07c]">
              <span>{currentCat.indexLabel} / 06</span>
              <span aria-hidden="true">·</span>
              <span>CURATED COLLECTION</span>
            </div>
            <h2 className="font-luxury text-lg sm:text-2xl font-bold tracking-[0.22em] text-white uppercase mt-1">
              {currentCat.title}
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-300 tracking-wider mt-0.5 font-normal">
              {currentCat.subtitle}
            </p>
          </div>
        )}
      </div>

      {/* Top Subtle Brand Mark During Category Showcase */}
      <div
        className="pointer-events-none absolute top-5 left-5 sm:top-7 sm:left-8 z-20 flex items-center gap-3 transition-opacity duration-500"
        style={{ opacity: phase === 'showcase' || isLogoAscending ? 1 : 0 }}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#d7b56d]/50 bg-black">
          <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
        </div>
        <span className="font-luxury text-sm sm:text-base font-bold tracking-[0.24em] text-[#f3e4bf] uppercase">
          OBRYNT
        </span>
      </div>

      {/* Accessible Skip Intro CTA (Always reachable, never blocks shopping) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30">
        <button
          type="button"
          onClick={finishIntro}
          className="min-h-[40px] px-4 py-2 border border-[#d7b56d]/45 hover:border-[#f2d99b] text-[#f5ecd7] hover:text-white text-xs font-semibold uppercase tracking-[0.18em] transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#f2d99b] focus-visible:outline-offset-2"
          style={{ backgroundColor: 'rgba(12, 12, 14, 0.88)' }}
          aria-label="Skip opening animation and enter OBRYNT store"
        >
          <span>Skip Intro</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#e6c782]" />
        </button>
      </div>

      {/* Minimal Bottom Progress Hairline (non-intrusive transition feedback) */}
      {!reducedMotionMode && (
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[2px] bg-white/10 z-20">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              backgroundColor: '#e6c782',
              width:
                phase === 'opening'
                  ? '18%'
                  : phase === 'brandReveal'
                  ? '38%'
                  : phase === 'showcase'
                  ? `${44 + Math.max(0, activeCategoryIdx + 1) * 8}%`
                  : '100%',
            }}
          />
        </div>
      )}
    </div>
  );
};
