import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { PREVIEW_CAPACITY, type BraceletBead } from "@/lib/bracelet-design";
import { stonePalette } from "@/data/bracelet-assets";
export type ScenePreset = "atelier" | "collection" | "detail";
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
    visible = true,
    rotation = 0,
    preset: ScenePreset = "atelier",
    radius = 2.84;
  let draws = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function draw() {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    renderer.render(scene, camera);
    host.dataset.drawCount = String(++draws);
  }
  function invalidate() {
    if (!disposed && !frame && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  function pose() {
    const p = scenePresets[preset];
    const scale = Math.max(1, radius / 2.84);
    camera.position.set(
      Math.sin(rotation) * p.distance * scale,
      p.height * scale,
      Math.cos(rotation) * p.distance * scale,
    );
    camera.up.set(0, 1, 0);
    if (preset === "atelier")
      camera.up.set(Math.sin(rotation), 0, -Math.cos(rotation));
    camera.lookAt(0, 0, preset === "detail" ? radius * 0.85 : 0);
    camera.updateProjectionMatrix();
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
    const ids = new Set(beads.map((b) => b.id));
    for (const [id, mesh] of meshes)
      if (!ids.has(id)) {
        group.remove(mesh);
        meshes.delete(id);
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
      }
      mesh.material = material(b);
      const a = (i * Math.PI * 2) / slots;
      mesh.position.set(Math.sin(a) * radius, 0, -Math.cos(a) * radius);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.cos(a), 0, Math.sin(a)),
      );
    });
    halo.visible = !!selectedId && meshes.has(selectedId);
    if (halo.visible) {
      halo.position.copy(meshes.get(selectedId!)!.position);
      halo.position.y = 0.5;
    }
    pose();
  }
  const raycaster = new THREE.Raycaster();
  const click = (e: MouseEvent) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(e.clientY - bounds.top) / bounds.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects([...meshes.values()])[0];
    if (hit) onSelect(hit.object.userData.beadId);
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    pose();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) invalidate();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  intersection.observe(host);
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  };
  const lost = (e: Event) => {
    e.preventDefault();
    onFailure();
  };
  renderer.domElement.addEventListener("click", click);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", invalidate);
  resize();
  return {
    update,
    setView: (next: ScenePreset) => {
      preset = next;
      pose();
    },
    turn: (amount: number) => {
      rotation += amount;
      pose();
    },
    reset: () => {
      rotation = 0;
      pose();
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", invalidate);
      renderer.domElement.removeEventListener("click", click);
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
