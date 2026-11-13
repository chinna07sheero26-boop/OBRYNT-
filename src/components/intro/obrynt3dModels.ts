import * as THREE from 'three';

export interface IntroSceneMaterials {
  champagneGold: THREE.MeshPhysicalMaterial;
  brushedGold: THREE.MeshPhysicalMaterial;
  platinumSilver: THREE.MeshPhysicalMaterial;
  obsidianMatte: THREE.MeshStandardMaterial;
  obsidianGloss: THREE.MeshPhysicalMaterial;
  ivorySilk: THREE.MeshPhysicalMaterial;
  espressoLeather: THREE.MeshStandardMaterial;
  charcoalWool: THREE.MeshPhysicalMaterial;
  crystalGlass: THREE.MeshPhysicalMaterial;
  parfumAmber: THREE.MeshPhysicalMaterial;
  rougeVelvet: THREE.MeshPhysicalMaterial;
  pedestalMat: THREE.MeshStandardMaterial;
  emblemFaceMat: THREE.MeshPhysicalMaterial;
  watchDialMat: THREE.MeshStandardMaterial;
  knitFabricMat: THREE.MeshPhysicalMaterial;
}

function createLuxuryTextPlaqueTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian background with subtle metallic grain
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 256);
  bgGrad.addColorStop(0, '#0a0a0c');
  bgGrad.addColorStop(0.5, '#161513');
  bgGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 256);

  // Subtle horizontal metallic rules
  const goldGrad = ctx.createLinearGradient(120, 0, 904, 0);
  goldGrad.addColorStop(0, '#8a6f3d');
  goldGrad.addColorStop(0.25, '#f2d99b');
  goldGrad.addColorStop(0.5, '#fff4d4');
  goldGrad.addColorStop(0.75, '#d7b56d');
  goldGrad.addColorStop(1, '#8a6f3d');

  ctx.fillStyle = goldGrad;
  ctx.fillRect(60, 22, 904, 5);
  ctx.fillRect(60, 229, 904, 5);

  // Crisp OBRYNT lettering
  ctx.font = '700 112px "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = goldGrad;
  ctx.fillText('O B R Y N T', 512, 132);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  // Bump map for raised metallic engraving
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#202020';
  bCtx.fillRect(0, 0, 1024, 256);
  bCtx.fillStyle = '#ffffff';
  bCtx.fillRect(60, 22, 904, 5);
  bCtx.fillRect(60, 229, 904, 5);
  bCtx.font = '700 112px "Cinzel", Georgia, serif';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText('O B R Y N T', 512, 132);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

function createWatchDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;

  // Radial sunburst black-onyx dial
  const grad = ctx.createRadialGradient(cx - 30, cy - 30, 15, cx, cy, 256);
  grad.addColorStop(0, '#1e1c1a');
  grad.addColorStop(0.6, '#0d0d0f');
  grad.addColorStop(1, '#050506');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Concentric guilloche track
  ctx.strokeStyle = 'rgba(218, 185, 118, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 212, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(218, 185, 118, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 165, 0, Math.PI * 2);
  ctx.stroke();

  // 12 Champagne Gold Hour Markers & 60 Minute Ticks
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isHour = i % 5 === 0;
    const rOuter = 208;
    const rInner = isHour ? 178 : 196;
    ctx.strokeStyle = isHour ? '#efd496' : 'rgba(220,220,225,0.45)';
    ctx.lineWidth = isHour ? 5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
    ctx.lineTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
    ctx.stroke();
  }

  // Sub-dial rings
  [
    [cx, cy + 78, 44],
    [cx - 75, cy, 38],
    [cx + 75, cy, 38],
  ].forEach(([sx, sy, sr]) => {
    ctx.strokeStyle = 'rgba(218, 185, 118, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Brand mark on dial
  ctx.fillStyle = '#e7c986';
  ctx.font = '700 26px "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('OBRYNT', cx, cy - 82);
  ctx.fillStyle = '#a3a3a3';
  ctx.font = '500 13px sans-serif';
  ctx.fillText('GENÈVE · ATELIER', cx, cy - 58);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createKnitFabricTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1b1b1e';
  ctx.fillRect(0, 0, 256, 256);

  // Micro twill / luxury weave lines
  for (let y = 0; y < 256; y += 6) {
    for (let x = 0; x < 256; x += 6) {
      ctx.fillStyle = (x + y) % 12 === 0 ? '#27272b' : '#141416';
      ctx.fillRect(x, y, 4, 4);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 6);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(canvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 6);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createIntroMaterials(
  isSoftwareGl: boolean,
  maxAnisotropy: number
): { materials: IntroSceneMaterials; texturesToDispose: THREE.Texture[] } {
  const plaqueTex = createLuxuryTextPlaqueTexture(maxAnisotropy);
  const watchDialTex = createWatchDialTexture(maxAnisotropy);
  const knitTex = createKnitFabricTexture(maxAnisotropy);

  const texturesToDispose = [
    plaqueTex.map,
    plaqueTex.bumpMap,
    watchDialTex,
    knitTex.map,
    knitTex.bumpMap,
  ];

  const materials: IntroSceneMaterials = {
    champagneGold: new THREE.MeshPhysicalMaterial({
      color: 0xe6c782,
      metalness: 0.96,
      roughness: 0.16,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      anisotropy: 0.75,
      envMapIntensity: 1.5,
    }),
    brushedGold: new THREE.MeshPhysicalMaterial({
      color: 0xc9a45c,
      metalness: 0.92,
      roughness: 0.3,
      anisotropy: 0.9,
      anisotropyRotation: Math.PI / 4,
      envMapIntensity: 1.35,
    }),
    platinumSilver: new THREE.MeshPhysicalMaterial({
      color: 0xe8eaee,
      metalness: 0.97,
      roughness: 0.14,
      clearcoat: 0.45,
      anisotropy: 0.65,
      envMapIntensity: 1.45,
    }),
    obsidianMatte: new THREE.MeshStandardMaterial({
      color: 0x161619,
      metalness: 0.08,
      roughness: 0.76,
    }),
    obsidianGloss: new THREE.MeshPhysicalMaterial({
      color: 0x0b0b0d,
      metalness: 0.25,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    }),
    ivorySilk: new THREE.MeshPhysicalMaterial({
      color: 0xf4efe6,
      metalness: 0.04,
      roughness: 0.38,
      sheen: 0.85,
      sheenRoughness: 0.3,
      sheenColor: new THREE.Color(0xfff6e0),
    }),
    espressoLeather: new THREE.MeshStandardMaterial({
      color: 0x2a1f1a,
      metalness: 0.05,
      roughness: 0.58,
    }),
    charcoalWool: new THREE.MeshPhysicalMaterial({
      color: 0x232327,
      metalness: 0.03,
      roughness: 0.84,
      sheen: 0.55,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color(0x6e6a63),
    }),
    crystalGlass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.04,
      transmission: isSoftwareGl ? 0 : 0.92,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 1.0,
      ior: 1.56,
      thickness: 0.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      depthWrite: false,
    }),
    parfumAmber: new THREE.MeshPhysicalMaterial({
      color: 0xd9a043,
      metalness: 0.1,
      roughness: 0.12,
      transparent: true,
      opacity: 0.86,
      emissive: 0x452b06,
      emissiveIntensity: 0.35,
    }),
    rougeVelvet: new THREE.MeshPhysicalMaterial({
      color: 0x6f1a24,
      metalness: 0.05,
      roughness: 0.52,
      sheen: 0.9,
      sheenRoughness: 0.35,
      sheenColor: new THREE.Color(0xc96b74),
    }),
    pedestalMat: new THREE.MeshStandardMaterial({
      color: 0x0e0e11,
      metalness: 0.35,
      roughness: 0.42,
    }),
    emblemFaceMat: new THREE.MeshPhysicalMaterial({
      map: plaqueTex.map,
      bumpMap: plaqueTex.bumpMap,
      bumpScale: 0.025,
      metalness: 0.72,
      roughness: 0.25,
      clearcoat: 0.65,
    }),
    watchDialMat: new THREE.MeshStandardMaterial({
      map: watchDialTex,
      metalness: 0.45,
      roughness: 0.32,
    }),
    knitFabricMat: new THREE.MeshPhysicalMaterial({
      map: knitTex.map,
      bumpMap: knitTex.bumpMap,
      bumpScale: 0.015,
      metalness: 0.05,
      roughness: 0.72,
      sheen: 0.65,
      sheenColor: new THREE.Color(0x52525b),
    }),
  };

  return { materials, texturesToDispose };
}

/**
 * Builds the 3D Official OBRYNT Metallic Crest Emblem (8-part composite sculpture):
 * - Upper diamond frame with inner sculpted 'O' ring
 * - Dual symmetrical architectural wing blades (Champagne Gold & Platinum)
 * - Central horizontal metallic OBRYNT nameplate with upper & lower rails
 * - Outer orbital luxury halo ring & lower crescent arc
 */
export function buildObryntEmblem3D(mats: IntroSceneMaterials): THREE.Group {
  const group = new THREE.Group();

  // 1. Outer Champagne Gold Crest Halo Ring
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.035, 20, 96), mats.champagneGold);
  outerRing.castShadow = true;
  group.add(outerRing);

  // 2. Inner Platinum Accent Ring
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.33, 0.014, 16, 80), mats.platinumSilver);
  group.add(innerRing);

  // 3. Upper Diamond Crest Frame (4 beveled chamfer bars forming a luxury diamond)
  const diamondGroup = new THREE.Group();
  diamondGroup.position.set(0, 0.76, 0.06);
  const diamondShape = new THREE.Shape();
  diamondShape.moveTo(0, 0.44);
  diamondShape.lineTo(0.44, 0);
  diamondShape.lineTo(0, -0.44);
  diamondShape.lineTo(-0.44, 0);
  diamondShape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(0, 0.34);
  hole.lineTo(0.34, 0);
  hole.lineTo(0, -0.34);
  hole.lineTo(-0.34, 0);
  hole.closePath();
  diamondShape.holes.push(hole);

  const diamondGeo = new THREE.ExtrudeGeometry(diamondShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.018,
    bevelSegments: 3,
  });
  diamondGeo.center();
  const diamondMesh = new THREE.Mesh(diamondGeo, mats.champagneGold);
  diamondMesh.castShadow = true;
  diamondGroup.add(diamondMesh);

  // 4. Sculpted 'O' Monogram inside the Diamond Crest
  const monogramO = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.036, 16, 48), mats.platinumSilver);
  monogramO.scale.set(0.84, 1.15, 1.0);
  monogramO.position.z = 0.02;
  diamondGroup.add(monogramO);
  group.add(diamondGroup);

  // 5. Symmetrical Baroque/Architectural Wing Flourishes (left & right)
  const makeWingBlade = (side: 1 | -1) => {
    const bladeGroup = new THREE.Group();
    const layers = [
      { scale: 1.0, y: 0.56, rot: 0.28, mat: mats.platinumSilver, z: 0.0 },
      { scale: 0.85, y: 0.42, rot: 0.48, mat: mats.champagneGold, z: 0.03 },
      { scale: 0.68, y: 0.28, rot: 0.65, mat: mats.platinumSilver, z: -0.02 },
    ];
    layers.forEach((l) => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.quadraticCurveTo(side * 0.55 * l.scale, 0.38 * l.scale, side * 1.15 * l.scale, 0.2 * l.scale);
      s.quadraticCurveTo(side * 0.62 * l.scale, -0.08 * l.scale, 0, -0.1 * l.scale);
      s.closePath();

      const g = new THREE.ExtrudeGeometry(s, {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.014,
        bevelSize: 0.012,
        bevelSegments: 2,
      });
      g.center();
      const m = new THREE.Mesh(g, l.mat);
      m.position.set(side * (0.62 * l.scale), l.y, l.z);
      m.rotation.z = side * -l.rot;
      m.castShadow = true;
      bladeGroup.add(m);
    });
    return bladeGroup;
  };
  group.add(makeWingBlade(1));
  group.add(makeWingBlade(-1));

  // 6. Central Horizontal Architectural Plaque (with engraved OBRYNT face front & back)
  const plaqueCore = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.66, 0.14), mats.obsidianGloss);
  plaqueCore.castShadow = true;
  group.add(plaqueCore);

  const frontFace = new THREE.Mesh(new THREE.PlaneGeometry(2.74, 0.6), mats.emblemFaceMat);
  frontFace.position.z = 0.075;
  group.add(frontFace);

  const backFace = new THREE.Mesh(new THREE.PlaneGeometry(2.74, 0.6), mats.emblemFaceMat);
  backFace.position.z = -0.075;
  backFace.rotation.y = Math.PI;
  group.add(backFace);

  // Upper & lower metallic bezel bars framing the plaque
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.055, 0.18), mats.champagneGold);
  topBar.position.y = 0.34;
  group.add(topBar);

  const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.055, 0.18), mats.champagneGold);
  bottomBar.position.y = -0.34;
  group.add(bottomBar);

  // 7. Lower Crest Flourish & Inverted Medallion Tip
  const lowerFinial = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), mats.champagneGold);
  lowerFinial.position.set(0, -0.78, 0.04);
  lowerFinial.scale.set(1.2, 1.4, 0.45);
  group.add(lowerFinial);

  const lowerArcLeft = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 12, 32, Math.PI * 0.55), mats.platinumSilver);
  lowerArcLeft.position.set(-0.22, -0.52, 0.02);
  lowerArcLeft.rotation.z = Math.PI * 1.1;
  group.add(lowerArcLeft);

  const lowerArcRight = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 12, 32, Math.PI * 0.55), mats.platinumSilver);
  lowerArcRight.position.set(0.22, -0.52, 0.02);
  lowerArcRight.rotation.z = -Math.PI * 0.65;
  group.add(lowerArcRight);

  return group;
}

/**
 * Shared floating runway plinth for each fashion object
 */
function buildCategoryPlinth(mats: IntroSceneMaterials): THREE.Group {
  const plinth = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.28, 0.12, 48), mats.pedestalMat);
  base.position.y = -0.06;
  base.receiveShadow = true;
  plinth.add(base);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.018, 12, 64), mats.champagneGold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.0;
  plinth.add(rim);

  return plinth;
}

/**
 * 1. Men's Fashion: Structured Tailored Double-Breasted Blazer + Architectural Hanger
 */
export function buildMensFashionModel(mats: IntroSceneMaterials): THREE.Group {
  const root = new THREE.Group();
  root.add(buildCategoryPlinth(mats));

  const garment = new THREE.Group();
  garment.position.y = 0.15;

  // Tailored torso silhouette via ExtrudeGeometry
  const coatShape = new THREE.Shape();
  coatShape.moveTo(-0.56, 1.48); // left shoulder
  coatShape.lineTo(-0.22, 1.62); // left neck
  coatShape.quadraticCurveTo(0, 1.44, 0.22, 1.62); // collar notch
  coatShape.lineTo(0.56, 1.48); // right shoulder
  coatShape.lineTo(0.68, 0.45); // right hem outer
  coatShape.lineTo(0.45, 0.12); // right hem bottom
  coatShape.lineTo(0.02, 0.12);
  coatShape.lineTo(-0.02, 0.12);
  coatShape.lineTo(-0.45, 0.12);
  coatShape.lineTo(-0.68, 0.45);
  coatShape.closePath();

  const torsoGeo = new THREE.ExtrudeGeometry(coatShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 3,
  });
  torsoGeo.center();
  const torso = new THREE.Mesh(torsoGeo, mats.charcoalWool);
  torso.position.y = 0.92;
  torso.castShadow = true;
  garment.add(torso);

  // Structured Sleeves (left & right angled cylinders)
  [-1, 1].forEach((side) => {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 1.12, 20), mats.charcoalWool);
    sleeve.position.set(side * 0.66, 0.96, 0);
    sleeve.rotation.z = side * -0.18;
    sleeve.castShadow = true;
    garment.add(sleeve);

    // Cuff gold detail
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 20), mats.champagneGold);
    cuff.position.set(side * 0.75, 0.44, 0);
    cuff.rotation.z = side * -0.18;
    garment.add(cuff);
  });

  // Silk Peak Lapels
  [-1, 1].forEach((side) => {
    const lapelShape = new THREE.Shape();
    lapelShape.moveTo(0, 0);
    lapelShape.lineTo(side * 0.22, 0.48);
    lapelShape.lineTo(side * 0.06, 0.52);
    lapelShape.lineTo(0, 0.18);
    lapelShape.closePath();
    const lapelGeo = new THREE.ExtrudeGeometry(lapelShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
    });
    const lapel = new THREE.Mesh(lapelGeo, mats.obsidianGloss);
    lapel.position.set(side * 0.03, 1.0, 0.16);
    garment.add(lapel);
  });

  // 4 Double-Breasted Champagne Gold Buttons
  [
    [-0.14, 0.85],
    [0.14, 0.85],
    [-0.14, 0.62],
    [0.14, 0.62],
  ].forEach(([bx, by]) => {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.025, 16), mats.champagneGold);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(bx, by, 0.18);
    garment.add(btn);
  });

  // Luxury Brushed Gold Hanger Hook
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.68, 0),
    new THREE.Vector3(0, 1.84, 0),
    new THREE.Vector3(0.08, 1.94, 0),
    new THREE.Vector3(0, 2.02, 0),
    new THREE.Vector3(-0.08, 1.96, 0),
  ]);
  const hook = new THREE.Mesh(new THREE.TubeGeometry(hookCurve, 24, 0.018, 10, false), mats.champagneGold);
  garment.add(hook);

  root.add(garment);
  return root;
}

/**
 * 2. Women's Fashion: Sculpted Couture Draped Gown + Luxury Structured Handbag
 */
export function buildWomensFashionModel(mats: IntroSceneMaterials): THREE.Group {
  const root = new THREE.Group();
  root.add(buildCategoryPlinth(mats));

  // Couture Gown via LatheGeometry
  const points = [
    new THREE.Vector2(0.0, 0.04),
    new THREE.Vector2(0.68, 0.04),
    new THREE.Vector2(0.56, 0.38),
    new THREE.Vector2(0.42, 0.78),
    new THREE.Vector2(0.24, 1.12), // slender waist
    new THREE.Vector2(0.32, 1.46), // bust
    new THREE.Vector2(0.26, 1.62), // neckline
    new THREE.Vector2(0.0, 1.62),
  ];
  const gownGeo = new THREE.LatheGeometry(points, 36);
  const gown = new THREE.Mesh(gownGeo, mats.ivorySilk);
  gown.position.set(-0.18, 0.02, 0);
  gown.castShadow = true;
  root.add(gown);

  // Champagne Gold Architectural Waist Belt & Clasp
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.028, 14, 48), mats.champagneGold);
  belt.rotation.x = Math.PI / 2;
  belt.position.set(-0.18, 1.14, 0);
  root.add(belt);

  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.04), mats.platinumSilver);
  beltBuckle.position.set(-0.18, 1.14, 0.26);
  root.add(beltBuckle);

  // Shoulder Silk Drape Collar Ring
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 14, 40), mats.rougeVelvet);
  collar.rotation.x = Math.PI / 2 + 0.14;
  collar.position.set(-0.18, 1.56, 0);
  root.add(collar);

  // Structured Mini Luxury Handbag beside Gown
  const bagGroup = new THREE.Group();
  bagGroup.position.set(0.54, 0.02, 0.25);
  bagGroup.rotation.y = -0.35;

  const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.16), mats.obsidianGloss);
  bagBody.position.y = 0.17;
  bagBody.castShadow = true;
  bagGroup.add(bagBody);

  const bagFlap = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.16, 0.17), mats.espressoLeather);
  bagFlap.position.set(0, 0.26, 0.01);
  bagGroup.add(bagFlap);

  const bagClasp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), mats.champagneGold);
  bagClasp.position.set(0, 0.19, 0.095);
  bagGroup.add(bagClasp);

  const bagHandle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.016, 10, 28, Math.PI), mats.champagneGold);
  bagHandle.position.set(0, 0.35, 0);
  bagGroup.add(bagHandle);

  root.add(bagGroup);
  return root;
}

/**
 * 3. Kids' Fashion: Heritage Capsule Varsity Jacket + Sculpted Cap
 */
export function buildKidsFashionModel(mats: IntroSceneMaterials): THREE.Group {
  const root = new THREE.Group();
  root.add(buildCategoryPlinth(mats));

  const varsity = new THREE.Group();
  varsity.position.set(-0.1, 0.18, 0);

  // Varsity Jacket Torso
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.42, 1.05);
  bodyShape.lineTo(0.42, 1.05);
  bodyShape.lineTo(0.48, 0.22);
  bodyShape.lineTo(-0.48, 0.22);
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  bodyGeo.center();
  const body = new THREE.Mesh(bodyGeo, mats.rougeVelvet);
  body.position.y = 0.72;
  body.castShadow = true;
  varsity.add(body);

  // Contrasting Ivory Leather Sleeves
  [-1, 1].forEach((side) => {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.095, 0.76, 18), mats.ivorySilk);
    sleeve.position.set(side * 0.52, 0.74, 0);
    sleeve.rotation.z = side * -0.26;
    sleeve.castShadow = true;
    varsity.add(sleeve);
  });

  // Ribbed Collar & Hem Trim
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 12, 32), mats.champagneGold);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.18, 0);
  varsity.add(collar);

  const hem = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.08, 0.29), mats.obsidianMatte);
  hem.position.set(0, 0.28, 0);
  varsity.add(hem);

  // Front Gold Snap Studs
  [0.92, 0.74, 0.56, 0.38].forEach((y) => {
    const snap = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), mats.champagneGold);
    snap.position.set(0, y, 0.155);
    varsity.add(snap);
  });

  // Mini Sculpted Cap beside Jacket
  const capGroup = new THREE.Group();
  capGroup.position.set(0.56, 0.04, 0.34);
  capGroup.rotation.y = -0.45;
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    mats.obsidianGloss
  );
  capGroup.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.02, 24, 1, false, -0.8, 1.6), mats.champagneGold);
  brim.position.set(0, 0.01, 0.15);
  capGroup.add(brim);

  root.add(varsity);
  root.add(capGroup);
  return root;
}

/**
 * 4. Sneakers & Footwear: Multi-Part Architectural Luxury Low-Top Sneaker
 */
export function buildSneakerModel(mats: IntroSceneMaterials): THREE.Group {
  const root = new THREE.Group();
  root.add(buildCategoryPlinth(mats));

  const shoe = new THREE.Group();
  shoe.position.set(0, 0.12, 0);
  shoe.rotation.y = -0.42;

  // 1. Sculpted Midsole Profile
  const soleShape = new THREE.Shape();
  soleShape.moveTo(-0.82, 0);
  soleShape.lineTo(0.76, 0);
  soleShape.quadraticCurveTo(0.96, 0.04, 0.94, 0.16);
  soleShape.lineTo(-0.78, 0.22);
  soleShape.quadraticCurveTo(-0.88, 0.12, -0.82, 0);

  const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
    depth: 0.56,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 3,
  });
  soleGeo.center();
  const sole = new THREE.Mesh(soleGeo, mats.ivorySilk);
  sole.position.set(0, 0.14, 0);
  sole.castShadow = true;
  shoe.add(sole);

  // 2. Gum / Gold Tread Outsole Accent
  const tread = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.05, 0.54), mats.champagneGold);
  tread.position.set(0.04, 0.02, 0);
  shoe.add(tread);

  // 3. Upper Vamp & Quarter Silhouette
  const upperShape = new THREE.Shape();
  upperShape.moveTo(-0.72, 0.2);
  upperShape.lineTo(0.84, 0.18);
  upperShape.quadraticCurveTo(0.86, 0.36, 0.42, 0.44);
  upperShape.lineTo(-0.12, 0.68);
  upperShape.lineTo(-0.62, 0.68);
  upperShape.quadraticCurveTo(-0.78, 0.45, -0.72, 0.2);

  const upperGeo = new THREE.ExtrudeGeometry(upperShape, {
    depth: 0.46,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  upperGeo.center();
  const upper = new THREE.Mesh(upperGeo, mats.knitFabricMat);
  upper.position.set(-0.02, 0.44, 0);
  upper.castShadow = true;
  shoe.add(upper);

  // 4. Padded Heel Collar Ring & Back Tab
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 14, 28), mats.espressoLeather);
  collar.rotation.x = Math.PI / 2 - 0.18;
  collar.position.set(-0.42, 0.68, 0);
  collar.scale.set(1.15, 0.9, 1);
  shoe.add(collar);

  const heelTab = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.24), mats.champagneGold);
  heelTab.position.set(-0.68, 0.54, 0);
  heelTab.rotation.z = 0.15;
  shoe.add(heelTab);

  // 5. Crossed Metallic & Ivory Lace Bars + Gold Dubrae
  for (let i = 0; i < 4; i++) {
    const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), mats.ivorySilk);
    lace.rotation.x = Math.PI / 2;
    lace.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.22;
    lace.position.set(0.06 + i * 0.11, 0.57 - i * 0.06, 0);
    shoe.add(lace);
  }

  const dubrae = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.12), mats.champagneGold);
  dubrae.position.set(0.46, 0.37, 0);
  shoe.add(dubrae);

  // 6. Side Architectural Monogram Stripe
  [-1, 1].forEach((side) => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.02), mats.platinumSilver);
    stripe.position.set(0.05, 0.36, side * 0.27);
    stripe.rotation.z = -0.22;
    shoe.add(stripe);
  });

  root.add(shoe);
  return root;
}

/**
 * 5. Watches & Accessories: Luxury Chronograph Timepiece on Velvet Cushion Stand
 */
export function buildWatchModel(mats: IntroSceneMaterials): THREE.Group {
  const root = new THREE.Group();
  root.add(buildCategoryPlinth(mats));

  // Display Stand Arc
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.42, 24), mats.obsidianGloss);
  stand.position.y = 0.21;
  root.add(stand);

  const watchGroup = new THREE.Group();
  watchGroup.position.set(0, 0.88, 0);
  watchGroup.rotation.set(-0.22, -0.35, 0);

  // 1. Machined Watch Case Barrel
  const caseBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.18, 48), mats.platinumSilver);
  caseBarrel.rotation.x = Math.PI / 2;
  caseBarrel.castShadow = true;
  watchGroup.add(caseBarrel);

  // 2. Stepped Champagne Gold Bezel
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.06, 18, 64), mats.champagneGold);
  bezel.position.z = 0.085;
  watchGroup.add(bezel);

  // 3. Procedural Guilloché Dial Face
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.49, 48), mats.watchDialMat);
  dial.position.z = 0.092;
  watchGroup.add(dial);

  // 4. Sweeping Hour, Minute & Second Hands (named for live ticking animation)
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.24, 0.012), mats.champagneGold);
  hourHand.position.set(0, 0.08, 0.11);
  hourHand.rotation.z = -0.65;
  watchGroup.add(hourHand);

  const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.36, 0.012), mats.platinumSilver);
  minuteHand.position.set(0.08, 0.06, 0.12);
  minuteHand.rotation.z = -1.8;
  watchGroup.add(minuteHand);

  const secondPin = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 16), mats.champagneGold);
  secondPin.rotation.x = Math.PI / 2;
  secondPin.position.z = 0.125;
  watchGroup.add(secondPin);

  // 5. Sapphire Crystal Dome
  const crystal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.02, 48), mats.crystalGlass);
  crystal.rotation.x = Math.PI / 2;
  crystal.position.z = 0.135;
  crystal.renderOrder = 4;
  watchGroup.add(crystal);

  // 6. Knurled Crown & Dual Chronograph Pushers
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.11, 16), mats.champagneGold);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(0.61, 0, 0);
  watchGroup.add(crown);

  [0.24, -0.24].forEach((py) => {
    const pusher = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.09, 12), mats.platinumSilver);
    pusher.rotation.z = Math.PI / 2 - (py > 0 ? 0.3 : -0.3);
    pusher.position.set(0.57, py, 0);
    watchGroup.add(pusher);
  });

  // 7. Curved Espresso Alligator Leather Strap Loop
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.54, 0),
    new THREE.Vector3(0, 0.72, -0.24),
    new THREE.Vector3(0, 0.0, -0.44),
    new THREE.Vector3(0, -0.72, -0.24),
    new THREE.Vector3(0, -0.54, 0),
  ]);
  const strap = new THREE.Mesh(new THREE.TubeGeometry(strapCurve, 32, 0.16, 12, false), mats.espressoLeather);
  strap.scale.set(1.6, 1, 0.55);
  watchGroup.add(strap);

  root.add(watchGroup);
  return root;
}

/**
 * 6. Beauty & Lifestyle: Faceted Crystal Eau de Parfum Flacon + Matte Gold Lipstick Cylinder
 */
export function buildBeautyModel(mats: IntroSceneMaterials): THREE.Group {
  const root = new THREE.Group();
  root.add(buildCategoryPlinth(mats));

  // 1. Octagonal Crystal Parfum Flacon
  const bottleGroup = new THREE.Group();
  bottleGroup.position.set(-0.18, 0.02, 0);

  const glassBody = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.92, 8), mats.crystalGlass);
  glassBody.position.y = 0.46;
  glassBody.renderOrder = 3;
  bottleGroup.add(glassBody);

  // Inner Glowing Amber Elixir Core
  const elixir = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.34, 0.74, 8), mats.parfumAmber);
  elixir.position.y = 0.43;
  elixir.renderOrder = 1;
  bottleGroup.add(elixir);

  // Front Gold Medallion Label on Glass
  const labelPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.025), mats.champagneGold);
  labelPlate.position.set(0, 0.46, 0.43);
  bottleGroup.add(labelPlate);

  // Machined Collar Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.16, 24), mats.platinumSilver);
  neck.position.y = 0.99;
  bottleGroup.add(neck);

  // Heavy Sculpted Octagonal Champagne-Gold Cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.38, 8), mats.champagneGold);
  cap.position.y = 1.25;
  cap.castShadow = true;
  bottleGroup.add(cap);

  root.add(bottleGroup);

  // 2. Luxury Matte Obsidian & Gold Lipstick / Serum Cylinder
  const lipGroup = new THREE.Group();
  lipGroup.position.set(0.55, 0.02, 0.22);

  const tubeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.48, 24), mats.obsidianGloss);
  tubeBase.position.y = 0.24;
  lipGroup.add(tubeBase);

  const tubeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.128, 0.08, 24), mats.champagneGold);
  tubeRing.position.y = 0.5;
  lipGroup.add(tubeRing);

  // Sculpted Angled Rouge Bullet
  const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.24, 24), mats.rougeVelvet);
  bullet.position.y = 0.64;
  lipGroup.add(bullet);

  root.add(lipGroup);
  return root;
}
