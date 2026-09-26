import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { PREVIEW_CAPACITY, type BraceletBead } from "@/lib/bracelet-design";
import { stonePalette } from "@/data/bracelet-assets";
import {
  clampOrbitTilt,
  clampOrbitZoom,
  interpolateOrbit,
  orbitPointerIntent,
  wrapOrbitAzimuth,
  type OrbitPose,
} from "./orbit";
export type ScenePreset = "atelier" | "collection" | "detail";
export type SceneInteractionState = {
  rotating: boolean;
  touring: boolean;
  azimuth: number;
  tilt: number;
  zoom: number;
};
export const scenePresets = {
  atelier: { height: 11.5, distance: 0.001 },
  collection: { height: 7.5, distance: 9 },
  detail: { height: 2.5, distance: 5.2 },
} as const;
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
  scene.background = new THREE.Color("#fff9f0");
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 70);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  room.dispose();
  pmrem.dispose();
  const ambient = new THREE.HemisphereLight("#fffaf0", "#8b7057", 2.2);
  scene.add(ambient);
  const light = new THREE.DirectionalLight("#fff9ed", 3.5);
  light.position.set(-4, 9, 5);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -6;
  light.shadow.camera.right = 6;
  light.shadow.camera.top = 6;
  light.shadow.camera.bottom = -6;
  light.shadow.normalBias = 0.035;
  scene.add(light);
  const group = new THREE.Group();
  scene.add(group);
  const geometry = buildBeadGeometry();
  const meshes = new Map<string, THREE.Mesh>();
  const materials = new Map<string, THREE.MeshPhysicalMaterial>();
  const trayGeometry = new THREE.CylinderGeometry(4.5, 4.55, 0.12, 96);
  const trayMaterial = new THREE.MeshStandardMaterial({
    color: "#f8ecdb",
    roughness: 0.82,
  });
  const tray = new THREE.Mesh(trayGeometry, trayMaterial);
  tray.position.y = -0.54;
  tray.receiveShadow = true;
  scene.add(tray);
  const rimGeometry = new THREE.TorusGeometry(4.46, 0.025, 8, 100);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: "#b48d52",
    metalness: 0.6,
    roughness: 0.4,
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.465;
  scene.add(rim);
  let cordGeometry = new THREE.TorusGeometry(2.84, 0.032, 8, 100);
  const cordMaterial = new THREE.MeshStandardMaterial({
    color: "#b58459",
    roughness: 0.85,
  });
  const cord = new THREE.Mesh(cordGeometry, cordMaterial);
  cord.rotation.x = Math.PI / 2;
  group.add(cord);
  const haloGeometry = new THREE.TorusGeometry(0.54, 0.028, 8, 50);
  const haloMaterial = new THREE.MeshBasicMaterial({ color: "#a3471c" });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.rotation.x = Math.PI / 2;
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
  function publish() {
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
    options.onInteractionChange?.(state);
  }
  function applyPose() {
    const scale = Math.max(1, radius / 2.84);
    const distance = (orbit.distance * scale) / orbit.zoom;
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
    if (selected) {
      halo.position.copy(selected.position);
      halo.position.y += 0.5;
    }
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
    for (const [id, started] of settling) {
      const mesh = meshes.get(id);
      const t = Math.min(1, (now - started) / 220);
      if (mesh) mesh.position.y = 0.18 * (1 - t) ** 2;
      if (!mesh || t === 1) settling.delete(id);
    }
    placeHalo();
    applyPose();
    publish();
    try {
      renderer.render(scene, camera);
    } catch {
      fail();
      return;
    }
    host.dataset.drawCount = String(++draws);
    // There is no idle render loop: only an explicit finite animation schedules
    // its next frame. Static views render once per actual invalidation.
    if (motion || settling.size) invalidate();
  }
  function invalidate() {
    if (!disposed && !failed && !frame && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  function pose() {
    applyPose();
    publish();
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
  function material(bead: BraceletBead) {
    const variant = bead.seed % 8;
    const key = bead.stoneKey + "-" + variant;
    if (materials.has(key)) return materials.get(key)!;
    const c = stonePalette[bead.stoneKey];
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = c.base;
    ctx.fillRect(0, 0, 256, 128);
    // Authored colour patterns, referenced to photographs; never reuse lit photos as bump.
    for (let x = 0; x < 256; x++)
      for (let y = 0; y < 128; y++) {
        const wave = Math.sin(
          x * 0.026 +
            y * 0.055 +
            variant +
            Math.sin(y * 0.075 + variant) * 0.65,
        );
        ctx.globalAlpha =
          bead.stoneKey === "tiger-eye"
            ? 0.22 + Math.abs(wave) * 0.28
            : 0.06 + Math.abs(wave) * 0.08;
        ctx.fillStyle = wave > 0 ? c.light : c.dark;
        ctx.fillRect(x, y, 1, 1);
      }
    let seed = variant;
    for (let i = 0; i < 2000; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const x = seed % 256;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const y = seed % 128;
      ctx.globalAlpha = bead.stoneKey === "lava" ? 0.6 : 0.035;
      ctx.fillStyle = i % 2 ? c.light : c.dark;
      ctx.fillRect(x, y, bead.stoneKey === "lava" ? 2 : 1, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const mat = new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: c.roughness,
      metalness: c.metalness,
      clearcoat: bead.stoneKey === "lava" ? 0 : 0.25,
      clearcoatRoughness: 0.25,
    });
    materials.set(key, mat);
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
    cordGeometry = new THREE.TorusGeometry(radius, 0.032, 8, 100);
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
    suppressClick = true;
    cancelAnimationFrame(frame);
    frame = 0;
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
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
