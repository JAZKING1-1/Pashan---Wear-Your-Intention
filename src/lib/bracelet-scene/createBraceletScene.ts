import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { PREVIEW_CAPACITY, type BraceletBead } from "@/lib/bracelet-design";
import {
  createStoneMaterial,
  createStoneTextures,
  type StoneTextures,
} from "./stoneMaterials";
import {
  clampOrbitTilt,
  clampOrbitZoom,
  interpolateOrbit,
  orbitPointerIntent,
  wrapOrbitAzimuth,
  type OrbitPose,
} from "./orbit";
export type ScenePreset = "atelier" | "collection" | "detail";
export type SceneLighting = "natural" | "atelier" | "evening";
export type SceneInteractionState = {
  rotating: boolean;
  touring: boolean;
  azimuth: number;
  tilt: number;
  zoom: number;
};
export const scenePresets = {
  atelier: { height: 11.5, distance: 0.001 },
  collection: { height: 6.9, distance: 8.2 },
  detail: { height: 2.5, distance: 5.2 },
} as const;

/**
 * Studio lighting modes. These change how the same stones are lit, never the
 * stones themselves: the bracelet is never rebuilt when the mode changes.
 */
type LightingRecipe = {
  sky: string;
  ground: string;
  ambient: number;
  key: string;
  keyIntensity: number;
  fill: string;
  fillIntensity: number;
  rim: string;
  rimIntensity: number;
  exposure: number;
  environment: number;
};

export const sceneLightingModes: Record<SceneLighting, LightingRecipe> = {
  // Open daylight through a stone room.
  natural: {
    sky: "#fffaf0",
    ground: "#9c8168",
    ambient: 1.9,
    key: "#fff6e6",
    keyIntensity: 3.1,
    fill: "#e8f0ff",
    fillIntensity: 0.55,
    rim: "#ffd9a8",
    rimIntensity: 0.7,
    exposure: 1.08,
    environment: 1,
  },
  // The bench lamp: warmer, closer, more directional.
  atelier: {
    sky: "#fff3e0",
    ground: "#7a5c44",
    ambient: 1.35,
    key: "#ffe6bd",
    keyIntensity: 3.6,
    fill: "#cbb79c",
    fillIntensity: 0.4,
    rim: "#ffc98a",
    rimIntensity: 1.05,
    exposure: 1.02,
    environment: 0.78,
  },
  // Low, late light with a stronger separation edge.
  evening: {
    sky: "#f3e2d2",
    ground: "#4a372a",
    ambient: 0.95,
    key: "#ffd9a4",
    keyIntensity: 2.5,
    fill: "#8fa3c4",
    fillIntensity: 0.5,
    rim: "#ffc07a",
    rimIntensity: 1.35,
    exposure: 0.96,
    environment: 0.62,
  },
};

/** Idle breathing: a barely-there sway, never a product spin. */
const IDLE_DELAY = 6000;
const IDLE_AMPLITUDE = 0.022; // ~1.3 degrees
const IDLE_PERIOD = 2600;
const LIGHTING_DURATION = 560;
const TEXTURE_VARIANTS = 8;
export function buildBeadGeometry() {
  // Closed profile: outside sphere, bevelled lips, and an actual cylindrical bore.
  const points: THREE.Vector2[] = [];
  const lip = 0.12,
    end = Math.acos(lip / 0.47);
  for (let i = 0; i <= 40; i++) {
    // Ascending outer profile gives outward normals; the bore returns downward.
    const theta = -end + (2 * end * i) / 40;
    points.push(
      new THREE.Vector2(0.47 * Math.cos(theta), 0.47 * Math.sin(theta)),
    );
  }
  points.push(
    new THREE.Vector2(0.092, 0.425),
    new THREE.Vector2(0.092, -0.425),
    points[0].clone(),
  );
  return new THREE.LatheGeometry(points, 48);
}
export function createBraceletScene(
  host: HTMLDivElement,
  onSelect: (id: string) => void,
  onFailure: () => void,
  options: {
    onInteractionChange?: (state: SceneInteractionState) => void;
  } = {},
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");
  // Horizontal one-finger movement belongs to the object. Vertical scrolling
  // and two-finger browser zoom always remain available to touch users.
  renderer.domElement.style.touchAction = "pan-y pinch-zoom";
  const scene = new THREE.Scene();
  // Transparent: the page supplies the atelier backdrop, so the preview sits
  // inside the room instead of inside an opaque colour block.
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 70);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  room.dispose();
  pmrem.dispose();

  const ambient = new THREE.HemisphereLight("#fffaf0", "#8b7057", 1.9);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight("#fff6e6", 3.1);
  keyLight.position.set(-4, 9, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -6;
  keyLight.shadow.camera.right = 6;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -6;
  keyLight.shadow.normalBias = 0.035;
  scene.add(keyLight);
  // Soft fill from the opposite side, and a low rim that separates the stones
  // from the surface without rim-lighting the whole room.
  const fill = new THREE.DirectionalLight("#e8f0ff", 0.55);
  fill.position.set(6, 4, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight("#ffd9a8", 0.7);
  rim.position.set(2, 1.5, -7);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);
  const geometry = buildBeadGeometry();
  const meshes = new Map<string, THREE.Mesh>();
  const materials = new Map<string, THREE.MeshPhysicalMaterial>();
  const textures = new Map<string, StoneTextures>();
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  // Warm stone presentation surface with a fine grain, so the bracelet rests
  // on something rather than floating in a void.
  // A stone plinth, sized to sit the bracelet on with a clear margin, so the
  // room behind it stays part of the composition.
  const trayGeometry = new THREE.CylinderGeometry(3.95, 4, 0.12, 96);
  const trayTextureCanvas = document.createElement("canvas");
  trayTextureCanvas.width = 256;
  trayTextureCanvas.height = 256;
  const trayCtx = trayTextureCanvas.getContext("2d")!;
  const trayImage = trayCtx.createImageData(256, 256);
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const index = (y * 256 + x) * 4;
      const grain =
        Math.sin(x * 0.07 + Math.sin(y * 0.031) * 2.4) * 0.5 +
        Math.sin(y * 0.043 + 1.7) * 0.35 +
        Math.sin((x + y) * 0.011) * 0.5;
      const shade = 236 + grain * 9;
      trayImage.data[index] = shade + 6;
      trayImage.data[index + 1] = shade - 6;
      trayImage.data[index + 2] = shade - 24;
      trayImage.data[index + 3] = 255;
    }
  }
  trayCtx.putImageData(trayImage, 0, 0);
  const trayTexture = new THREE.CanvasTexture(trayTextureCanvas);
  trayTexture.colorSpace = THREE.SRGBColorSpace;
  const trayMaterial = new THREE.MeshStandardMaterial({
    map: trayTexture,
    roughness: 0.88,
    metalness: 0,
  });
  const tray = new THREE.Mesh(trayGeometry, trayMaterial);
  tray.position.y = -0.54;
  tray.receiveShadow = true;
  scene.add(tray);

  // Grounding: a soft contact shadow directly under the bracelet, in addition
  // to the directional shadow map.
  const contactCanvas = document.createElement("canvas");
  contactCanvas.width = 128;
  contactCanvas.height = 128;
  const contactCtx = contactCanvas.getContext("2d")!;
  const contactGradient = contactCtx.createRadialGradient(64, 64, 4, 64, 64, 64);
  contactGradient.addColorStop(0, "rgba(58, 36, 22, 0.5)");
  contactGradient.addColorStop(0.55, "rgba(58, 36, 22, 0.22)");
  contactGradient.addColorStop(1, "rgba(58, 36, 22, 0)");
  contactCtx.fillStyle = contactGradient;
  contactCtx.fillRect(0, 0, 128, 128);
  const contactTexture = new THREE.CanvasTexture(contactCanvas);
  contactTexture.colorSpace = THREE.SRGBColorSpace;
  const contactGeometry = new THREE.PlaneGeometry(6.4, 6.4);
  const contactMaterial = new THREE.MeshBasicMaterial({
    map: contactTexture,
    transparent: true,
    depthWrite: false,
  });
  const contact = new THREE.Mesh(contactGeometry, contactMaterial);
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.475;
  contact.renderOrder = -1;
  scene.add(contact);

  const rimGeometry = new THREE.TorusGeometry(3.91, 0.025, 8, 100);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: "#b48d52",
    metalness: 0.6,
    roughness: 0.4,
  });
  const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = -0.465;
  scene.add(rimMesh);
  let cordGeometry = new THREE.TorusGeometry(2.84, 0.026, 8, 120);
  const cordMaterial = new THREE.MeshStandardMaterial({
    color: "#8f6440",
    roughness: 0.95,
  });
  const cord = new THREE.Mesh(cordGeometry, cordMaterial);
  cord.rotation.x = Math.PI / 2;
  group.add(cord);
  // Selection ring: a thin bronze circle drawn around the chosen bead, in the
  // bead's own plane, so it reads as a marker rather than an extra object.
  const haloGeometry = new THREE.TorusGeometry(0.62, 0.018, 8, 64);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: "#f3e2c6",
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.renderOrder = 2;
  halo.visible = false;
  group.add(halo);
  let frame = 0,
    disposed = false,
    failed = false,
    visible = true,
    preset: ScenePreset = "collection",
    radius = 2.84,
    updated = false;
  let draws = 0;
  let selectedBeadId: string | null = null;
  let gesture: {
    id: number;
    pointerType: string;
    startX: number;
    startY: number;
    azimuth: number;
    tilt: number;
    dragging: boolean;
  } | null = null;
  const touches = new Set<number>();
  let multipleTouches = false;
  let suppressClick = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function presetPose(next: ScenePreset): OrbitPose {
    const p = scenePresets[next];
    return {
      azimuth: 0,
      tilt: clampOrbitTilt(Math.atan2(p.height, p.distance)),
      zoom: 1,
      distance: Math.hypot(p.height, p.distance),
      targetFactor: next === "detail" ? 0.85 : 0,
    };
  }
  let orbit = presetPose(preset);
  let motion: {
    from: OrbitPose;
    to: OrbitPose;
    started: number;
    duration: number;
    kind: "view" | "tour";
  } | null = null;
  const settling = new Map<string, number>();
  let published = "";
  // Idle breathing and lighting fades are the only continuous animation here,
  // and both are skipped entirely for reduced-motion users and offscreen scenes.
  let lastInput = performance.now();
  let idleActive = false;
  let idleFrom = 0;
  let idleBase = 0;
  let idleTimer = 0;
  let focus = 1;
  type LightingState = {
    sky: THREE.Color;
    ground: THREE.Color;
    ambient: number;
    key: THREE.Color;
    keyIntensity: number;
    fill: THREE.Color;
    fillIntensity: number;
    rim: THREE.Color;
    rimIntensity: number;
    exposure: number;
    environment: number;
  };
  const readLighting = (mode: SceneLighting): LightingState => {
    const recipe = sceneLightingModes[mode];
    return {
      sky: new THREE.Color(recipe.sky),
      ground: new THREE.Color(recipe.ground),
      ambient: recipe.ambient,
      key: new THREE.Color(recipe.key),
      keyIntensity: recipe.keyIntensity,
      fill: new THREE.Color(recipe.fill),
      fillIntensity: recipe.fillIntensity,
      rim: new THREE.Color(recipe.rim),
      rimIntensity: recipe.rimIntensity,
      exposure: recipe.exposure,
      environment: recipe.environment,
    };
  };
  let lighting: SceneLighting = "natural";
  let lightingNow = readLighting("natural");
  let lightingTween: {
    from: LightingState;
    to: LightingState;
    started: number;
  } | null = null;
  function applyLighting(state: LightingState) {
    ambient.color.copy(state.sky);
    ambient.groundColor.copy(state.ground);
    ambient.intensity = state.ambient;
    keyLight.color.copy(state.key);
    keyLight.intensity = state.keyIntensity;
    fill.color.copy(state.fill);
    fill.intensity = state.fillIntensity;
    rim.color.copy(state.rim);
    rim.intensity = state.rimIntensity;
    renderer.toneMappingExposure = state.exposure;
    scene.environmentIntensity = state.environment;
  }
  applyLighting(lightingNow);
  function publish(silent = false) {
    const state: SceneInteractionState = {
      rotating: !!gesture?.dragging,
      touring: motion?.kind === "tour",
      azimuth: orbit.azimuth,
      tilt: orbit.tilt,
      zoom: orbit.zoom,
    };
    const key = JSON.stringify(state);
    if (published === key) return;
    published = key;
    host.dataset.yaw = String(state.azimuth);
    host.dataset.tilt = String(state.tilt);
    host.dataset.zoom = String(state.zoom);
    host.dataset.interacting = String(state.rotating);
    host.dataset.touring = String(state.touring);
    // Idle breathing must not re-render the React tree every frame.
    if (silent) return;
    options.onInteractionChange?.(state);
  }
  /** Any deliberate input ends the idle sway immediately, at its rest angle. */
  function touched() {
    lastInput = performance.now();
    if (idleActive) orbit.azimuth = idleBase;
    idleActive = false;
    armIdle();
  }
  /**
   * The viewer has no standing animation loop, so the breathing sway is armed
   * by a timer instead: it can only start from an actual idle period.
   */
  function armIdle() {
    clearTimeout(idleTimer);
    if (disposed || failed || reduced.matches) return;
    idleTimer = window.setTimeout(() => {
      if (
        disposed ||
        failed ||
        motion ||
        gesture?.dragging ||
        !visible ||
        document.hidden ||
        performance.now() - lastInput < IDLE_DELAY
      )
        return;
      idleActive = true;
      idleFrom = performance.now();
      idleBase = orbit.azimuth;
      invalidate();
    }, IDLE_DELAY);
  }
  function applyPose() {
    const scale = Math.max(1, radius / 2.84);
    const distance = (orbit.distance * scale) / (orbit.zoom * focus);
    const horizontal = Math.cos(orbit.tilt) * distance;
    camera.position.set(
      Math.sin(orbit.azimuth) * horizontal,
      Math.sin(orbit.tilt) * distance,
      Math.cos(orbit.azimuth) * horizontal,
    );
    camera.up.set(0, 1, 0);
    // The detail focal point travels with the camera rather than jumping to
    // the far side of the ring halfway through a turn.
    camera.lookAt(
      Math.sin(orbit.azimuth) * radius * orbit.targetFactor,
      0,
      Math.cos(orbit.azimuth) * radius * orbit.targetFactor,
    );
    camera.updateMatrixWorld();
  }
  function placeHalo() {
    const selected = selectedBeadId ? meshes.get(selectedBeadId) : null;
    halo.visible = !!selected;
    if (!selected) return;
    halo.position.copy(selected.position);
    // Beads are already turned so their local up points outwards from the ring,
    // so copying the rotation encircles the bead instead of hovering over it.
    halo.quaternion.copy(selected.quaternion);
    halo.rotateX(Math.PI / 2);
    halo.scale.setScalar(1);
  }
  function finishSettling() {
    for (const id of settling.keys()) {
      const mesh = meshes.get(id);
      if (mesh) mesh.position.y = 0;
    }
    settling.clear();
    placeHalo();
  }
  function draw(now: number) {
    frame = 0;
    if (disposed || failed || !visible || document.hidden) return;
    if (motion) {
      const t = Math.min(1, (now - motion.started) / motion.duration);
      const eased =
        motion.kind === "tour" ? t * t * (3 - 2 * t) : 1 - (1 - t) ** 3;
      orbit = interpolateOrbit(motion.from, motion.to, eased);
      if (t === 1) motion = null;
    }
    if (lightingTween) {
      const t = Math.min(1, (now - lightingTween.started) / LIGHTING_DURATION);
      const eased = t * t * (3 - 2 * t);
      lightingNow = {
        ...lightingTween.to,
        sky: lightingTween.from.sky.clone().lerp(lightingTween.to.sky, eased),
        ground: lightingTween.from.ground
          .clone()
          .lerp(lightingTween.to.ground, eased),
        key: lightingTween.from.key.clone().lerp(lightingTween.to.key, eased),
        fill: lightingTween.from.fill
          .clone()
          .lerp(lightingTween.to.fill, eased),
        rim: lightingTween.from.rim.clone().lerp(lightingTween.to.rim, eased),
        ambient:
          lightingTween.from.ambient +
          (lightingTween.to.ambient - lightingTween.from.ambient) * eased,
        keyIntensity:
          lightingTween.from.keyIntensity +
          (lightingTween.to.keyIntensity - lightingTween.from.keyIntensity) *
            eased,
        fillIntensity:
          lightingTween.from.fillIntensity +
          (lightingTween.to.fillIntensity - lightingTween.from.fillIntensity) *
            eased,
        rimIntensity:
          lightingTween.from.rimIntensity +
          (lightingTween.to.rimIntensity - lightingTween.from.rimIntensity) *
            eased,
        exposure:
          lightingTween.from.exposure +
          (lightingTween.to.exposure - lightingTween.from.exposure) * eased,
        environment:
          lightingTween.from.environment +
          (lightingTween.to.environment - lightingTween.from.environment) *
            eased,
      };
      applyLighting(lightingNow);
      if (t === 1) lightingTween = null;
    }
    // A 1-2 degree breathing sway only once the viewer has been left alone: the
    // bracelet is never presented as a spinning product.
    if (!motion && !gesture?.dragging && !reduced.matches) {
      if (!idleActive && now - lastInput > IDLE_DELAY) {
        idleActive = true;
        idleFrom = now;
        idleBase = orbit.azimuth;
      }
      if (idleActive)
        orbit.azimuth =
          idleBase +
          Math.sin(((now - idleFrom) / IDLE_PERIOD) * Math.PI * 2) *
            IDLE_AMPLITUDE;
    }
    for (const [id, started] of settling) {
      const mesh = meshes.get(id);
      const t = Math.min(1, (now - started) / 220);
      if (mesh) mesh.position.y = 0.18 * (1 - t) ** 2;
      if (!mesh || t === 1) settling.delete(id);
    }
    placeHalo();
    applyPose();
    publish(idleActive);
    try {
      renderer.render(scene, camera);
    } catch {
      fail();
      return;
    }
    host.dataset.drawCount = String(++draws);
    // There is no idle render loop: only an explicit finite animation, a
    // lighting fade or an idle sway schedules the next frame.
    if (motion || settling.size || lightingTween || idleActive) invalidate();
  }
  function invalidate() {
    if (!disposed && !failed && !frame && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  function pose() {
    applyPose();
    publish();
    armIdle();
    invalidate();
  }
  function animateTo(to: OrbitPose, kind: "view" | "tour") {
    if (disposed || failed) return;
    if (reduced.matches || !visible || document.hidden) {
      motion = null;
      if (kind === "view") orbit = to;
      pose();
      return;
    }
    motion = {
      from: { ...orbit },
      to,
      started: performance.now(),
      duration: kind === "tour" ? 1800 : 280,
      kind,
    };
    publish();
    invalidate();
  }
  /** Maps are shared per stone family and noise phase, not per bead. */
  function stoneMaps(bead: BraceletBead) {
    const key = bead.stoneKey + "-" + (bead.seed % TEXTURE_VARIANTS);
    let maps = textures.get(key);
    if (!maps) {
      maps = createStoneTextures(bead.stoneKey, bead.seed % TEXTURE_VARIANTS, anisotropy);
      textures.set(key, maps);
    }
    return maps;
  }
  function material(bead: BraceletBead) {
    // Seeded by the bead, so a stone looks consistent across renders and visits
    // while no two beads of the same stone are identical.
    const key = bead.stoneKey + "-" + bead.seed;
    let mat = materials.get(key);
    if (!mat) {
      mat = createStoneMaterial(bead.stoneKey, bead.seed, stoneMaps(bead));
      materials.set(key, mat);
    }
    return mat;
  }
  function update(beads: BraceletBead[], selectedId: string | null) {
    if (disposed || failed) return;
    stopTour();
    selectedBeadId = selectedId;
    const ids = new Set(beads.map((b) => b.id));
    for (const [id, mesh] of meshes)
      if (!ids.has(id)) {
        group.remove(mesh);
        meshes.delete(id);
        settling.delete(id);
      }
    radius =
      0.99 / (2 * Math.sin(Math.PI / Math.max(PREVIEW_CAPACITY, beads.length)));
    cordGeometry.dispose();
    cordGeometry = new THREE.TorusGeometry(radius, 0.026, 8, 120);
    cord.geometry = cordGeometry;
    cord.visible = !!beads.length;
    const slots = Math.max(PREVIEW_CAPACITY, beads.length);
    beads.forEach((b, i) => {
      let mesh = meshes.get(b.id);
      if (!mesh) {
        mesh = new THREE.Mesh(geometry, material(b));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.beadId = b.id;
        group.add(mesh);
        meshes.set(b.id, mesh);
        // Initial saved designs load without a flourish. Only newly added beads
        // settle, and only while motion is permitted and the scene is visible.
        if (updated && !reduced.matches && visible && !document.hidden) {
          settling.set(b.id, performance.now());
          mesh.position.y = 0.18;
        }
      }
      mesh.material = material(b);
      const a = (i * Math.PI * 2) / slots;
      mesh.position.set(
        Math.sin(a) * radius,
        settling.has(b.id) ? mesh.position.y : 0,
        -Math.cos(a) * radius,
      );
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.cos(a), 0, Math.sin(a)),
      );
    });
    updated = true;
    // Small introspection hooks, in the same spirit as the published pose
    // datasets: they make the deterministic per-bead materials observable
    // without exposing the renderer.
    host.dataset.materialCount = String(materials.size);
    host.dataset.materialSignature = Array.from(materials.keys())
      .map((key) => {
        const mat = materials.get(key)!;
        return `${mat.roughness.toFixed(3)}/${mat.metalness.toFixed(
          3,
        )}/${mat.bumpScale.toFixed(4)}/${mat.color.getHexString()}`;
      })
      .join("|");
    placeHalo();
    pose();
  }
  const raycaster = new THREE.Raycaster();
  function selectAt(clientX: number, clientY: number) {
    const bounds = renderer.domElement.getBoundingClientRect();
    if (
      !bounds.width ||
      !bounds.height ||
      clientX < bounds.left ||
      clientX > bounds.right ||
      clientY < bounds.top ||
      clientY > bounds.bottom
    )
      return;
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(clientY - bounds.top) / bounds.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects([...meshes.values()])[0];
    if (hit) onSelect(hit.object.userData.beadId);
  }
  function capture(id: number) {
    try {
      renderer.domElement.setPointerCapture(id);
    } catch {
      // Window move/up listeners still clean up an ended or synthetic pointer.
    }
  }
  function release(id: number) {
    try {
      if (renderer.domElement.hasPointerCapture(id))
        renderer.domElement.releasePointerCapture(id);
    } catch {
      // The browser may already have released it to native touch scrolling.
    }
  }
  function endGesture() {
    const previous = gesture;
    gesture = null;
    if (previous) release(previous.id);
    publish();
  }
  function stopTour() {
    if (motion?.kind !== "tour") return;
    motion = null;
    publish();
  }
  function interrupt() {
    touched();
    motion = null;
    endGesture();
    publish();
  }
  const documentPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    touches.add(event.pointerId);
    if (touches.size > 1) {
      multipleTouches = true;
      suppressClick = true;
      interrupt();
    }
  };
  const pointerDown = (event: PointerEvent) => {
    if (
      disposed ||
      failed ||
      (event.pointerType !== "touch" && event.button !== 0)
    )
      return;
    interrupt();
    if (multipleTouches || touches.size > 1 || !event.isPrimary) return;
    suppressClick = false;
    gesture = {
      id: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      azimuth: orbit.azimuth,
      tilt: orbit.tilt,
      dragging: false,
    };
    if (event.pointerType !== "touch") capture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.dragging) {
      const intent = orbitPointerIntent(dx, dy, gesture.pointerType);
      if (intent === "pending") return;
      suppressClick = true;
      if (intent === "scroll") {
        endGesture();
        return;
      }
      gesture.dragging = true;
      capture(event.pointerId);
    }
    orbit.azimuth = gesture.azimuth - dx * 0.01;
    if (gesture.pointerType !== "touch")
      orbit.tilt = clampOrbitTilt(gesture.tilt + dy * 0.007);
    pose();
  };
  const pointerEnd = (event: PointerEvent) => {
    const previous = gesture;
    if (previous && event.pointerId === previous.id) {
      const isTap =
        event.type === "pointerup" &&
        !previous.dragging &&
        !multipleTouches &&
        orbitPointerIntent(
          event.clientX - previous.startX,
          event.clientY - previous.startY,
          previous.pointerType,
        ) === "pending";
      if (!isTap) suppressClick = true;
      endGesture();
      if (isTap && !disposed && !failed) selectAt(event.clientX, event.clientY);
    }
    touches.delete(event.pointerId);
    if (!touches.size) multipleTouches = false;
  };
  const lostCapture = (event: PointerEvent) => {
    if (gesture?.id !== event.pointerId) return;
    suppressClick = true;
    endGesture();
  };
  const click = (event: MouseEvent) => {
    // Selection happens on a genuine, undragged pointerup. Compatibility click
    // events after a drag cannot select a bead or bubble into another control.
    if (suppressClick && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const resize = () => {
    if (disposed || failed) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    pose();
  };
  function suspend() {
    clearTimeout(idleTimer);
    if (idleActive) orbit.azimuth = idleBase;
    idleActive = false;
    // Scrolling to a control can move the canvas out of view while its short
    // transition is running. Honor an explicit preset/reset destination; only
    // a decorative tour should freeze at the current angle on suspension.
    if (motion?.kind === "view") {
      orbit = motion.to;
      applyPose();
    }
    interrupt();
    finishSettling();
    touches.clear();
    multipleTouches = false;
    suppressClick = true;cancelAnimationFrame(frame);
      frame = 0;
      armIdle();
    }
  const observer =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  observer?.observe(host);
  if (!observer) window.addEventListener("resize", resize);
  const intersection =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
          if (visible) invalidate();
          else suspend();
        });
  intersection?.observe(host);
  const visibility = () => {
    if (document.hidden) suspend();
    else invalidate();
  };
  const reduceMotion = () => {
    if (reduced.matches) {
      // Complete a short requested view change, but stop a tour in place.
      if (motion?.kind === "view") orbit = motion.to;
      motion = null;
      finishSettling();
      // No continuous breathing for reduced-motion users.
      touched();
      lightingTween = null;
      lightingNow = readLighting(lighting);
      applyLighting(lightingNow);
    }
    pose();
  };
  function fail() {
    if (disposed || failed) return;
    failed = true;
    suspend();
    onFailure();
  }
  const blur = () => {
    suspend();
    invalidate();
  };
  const lost = (e: Event) => {
    e.preventDefault();
    fail();
  };
  renderer.domElement.addEventListener("pointerdown", pointerDown);
  renderer.domElement.addEventListener("lostpointercapture", lostCapture);
  renderer.domElement.addEventListener("click", click, true);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  document.addEventListener("pointerdown", documentPointerDown, true);
  window.addEventListener("pointermove", pointerMove, { passive: true });
  window.addEventListener("pointerup", pointerEnd);
  window.addEventListener("pointercancel", pointerEnd);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", reduceMotion);
  resize();
  return {
    update,
    /** Studio light modes relight the same bracelet; nothing is rebuilt. */
    setLighting: (next: SceneLighting) => {
      if (disposed || failed || !Object.hasOwn(sceneLightingModes, next)) return;
      lighting = next;
      const to = readLighting(next);
      host.dataset.lighting = next;
      if (reduced.matches) {
        lightingTween = null;
        lightingNow = to;
        applyLighting(to);
        pose();
        return;
      }
      lightingTween = { from: lightingNow, to, started: performance.now() };
      invalidate();
    },
    /** Focus mode tightens the camera framing without rebuilding the scene. */
    setFocus: (next: boolean) => {
      if (disposed || failed) return;
      const target = next ? 1.14 : 1;
      if (target === focus) return;
      touched();
      focus = target;
      pose();
    },
    setView: (next: ScenePreset) => {
      if (disposed || failed || !Object.hasOwn(scenePresets, next)) return;
      interrupt();
      preset = next;
      orbit.azimuth = wrapOrbitAzimuth(orbit.azimuth);
      animateTo(presetPose(next), "view");
    },
    turn: (amount: number) => {
      if (disposed || failed || !Number.isFinite(amount)) return;
      interrupt();
      orbit.azimuth += amount;
      pose();
    },
    tilt: (amount: number) => {
      if (disposed || failed || !Number.isFinite(amount)) return;
      interrupt();
      orbit.tilt = clampOrbitTilt(orbit.tilt + amount);
      pose();
    },
    zoom: (factor: number) => {
      if (disposed || failed || !Number.isFinite(factor) || factor <= 0) return;
      interrupt();
      orbit.zoom = clampOrbitZoom(orbit.zoom * factor);
      pose();
    },
    reset: () => {
      if (disposed || failed) return;
      interrupt();
      // Reset the equivalent front view by the nearest turn, never spin back
      // through many accumulated manual rotations in a 280ms transition.
      orbit.azimuth = wrapOrbitAzimuth(orbit.azimuth);
      animateTo(presetPose(preset), "view");
    },
    tour: () => {
      if (disposed || failed) return;
      interrupt();
      animateTo({ ...orbit, azimuth: orbit.azimuth + Math.PI * 2 }, "tour");
    },
    stopTour,
    dispose: () => {
      if (disposed) return;
      suspend();
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(idleTimer);
      observer?.disconnect();
      intersection?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerdown", documentPointerDown, true);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerEnd);
      window.removeEventListener("pointercancel", pointerEnd);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reduceMotion);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener(
        "lostpointercapture",
        lostCapture,
      );
      renderer.domElement.removeEventListener("click", click, true);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      geometry.dispose();
      trayGeometry.dispose();
      trayMaterial.dispose();
      rimGeometry.dispose();
      rimMaterial.dispose();
      cordGeometry.dispose();
      cordMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      contactTexture.dispose();
      contactGeometry.dispose();
      contactMaterial.dispose();
      trayTexture.dispose();
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
