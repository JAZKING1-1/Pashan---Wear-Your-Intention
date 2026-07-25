import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { customStoneOptions, type CustomStoneKey } from "@/data/products";

const MAX_BEADS = 18;
const RING_RADIUS = 3.05;

type StoneMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;

interface SceneRuntime {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  bracelet: THREE.Group;
  beadGroup: THREE.Group;
  meshes: StoneMesh[];
  sphere: THREE.SphereGeometry;
  lava: THREE.IcosahedronGeometry;
  materials: Record<CustomStoneKey, THREE.MeshPhysicalMaterial>;
  textures: THREE.DataTexture[];
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  resizeObserver: ResizeObserver;
  frame: number;
  previousCount: number;
  reducedMotion: boolean;
}

const STONE_LABELS = new Map(
  customStoneOptions.map((stone) => [stone.key, stone.label]),
);

const clampByte = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)));

const mix = (from: number[], to: number[], amount: number) =>
  from.map((value, index) =>
    clampByte(value + ((to[index] ?? value) - value) * amount),
  );

const noise = (x: number, y: number, seed: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 31.117) * 43758.5453;
  return value - Math.floor(value);
};

function createStoneTexture(key: CustomStoneKey) {
  const width = 128;
  const height = 64;
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const v = y / height;
      const grain = noise(x, y, key.length) - 0.5;
      let colour: number[];

      switch (key) {
        case "pyrite": {
          const sparkle = noise(x * 2, y * 2, 11) > 0.91 ? 0.42 : 0;
          colour = mix([104, 70, 24], [232, 187, 88], 0.5 + grain + sparkle);
          break;
        }
        case "tiger-eye": {
          const band = (Math.sin(u * Math.PI * 10 + v * 2.4) + 1) / 2;
          const chatoyance = Math.pow(band, 2.5);
          colour = mix(
            [37, 18, 9],
            [211, 132, 34],
            chatoyance * 0.9 + grain * 0.12,
          );
          break;
        }
        case "hematite":
          colour = mix([24, 25, 27], [141, 145, 145], 0.42 + grain * 0.25);
          break;
        case "amethyst":
          colour = mix([55, 25, 74], [170, 113, 199], 0.5 + grain * 0.35);
          break;
        case "green-quartz":
          colour = mix([34, 90, 58], [130, 188, 125], 0.5 + grain * 0.3);
          break;
        case "lava": {
          const pore = noise(x * 3, y * 3, 19) > 0.78 ? 0.03 : 0.22;
          colour = mix([8, 8, 8], [70, 67, 62], pore + grain * 0.16);
          break;
        }
        case "heart-quartz": {
          const cloud =
            (Math.sin(u * Math.PI * 4.5 + v * 5.2) + 1) / 2 +
            noise(x * 0.55, y * 0.55, 29) * 0.24;
          colour = mix(
            [153, 78, 102],
            [248, 203, 211],
            0.48 + cloud * 0.34 + grain * 0.12,
          );
          break;
        }
        case "citrine": {
          const crystal = (Math.sin(u * Math.PI * 7 + v * 3.2) + 1) / 2;
          colour = mix(
            [145, 78, 8],
            [255, 220, 100],
            0.5 + crystal * 0.3 + grain * 0.16,
          );
          break;
        }
      }

      const offset = (y * width + x) * 4;
      data[offset] = colour[0] ?? 0;
      data[offset + 1] = colour[1] ?? 0;
      data[offset + 2] = colour[2] ?? 0;
      data[offset + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createStoneMaterials() {
  const textures = {} as Record<CustomStoneKey, THREE.DataTexture>;
  const materials = {} as Record<CustomStoneKey, THREE.MeshPhysicalMaterial>;

  customStoneOptions.forEach((stone) => {
    textures[stone.key] = createStoneTexture(stone.key);
  });

  materials.pyrite = new THREE.MeshPhysicalMaterial({
    map: textures.pyrite,
    metalness: 0.88,
    roughness: 0.24,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    bumpMap: textures.pyrite,
    bumpScale: 0.035,
    envMapIntensity: 1.15,
  });
  materials["tiger-eye"] = new THREE.MeshPhysicalMaterial({
    map: textures["tiger-eye"],
    metalness: 0.08,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    bumpMap: textures["tiger-eye"],
    bumpScale: 0.025,
    envMapIntensity: 1.25,
  });
  materials.hematite = new THREE.MeshPhysicalMaterial({
    map: textures.hematite,
    metalness: 0.92,
    roughness: 0.12,
    clearcoat: 0.72,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.35,
  });
  materials.amethyst = new THREE.MeshPhysicalMaterial({
    map: textures.amethyst,
    metalness: 0,
    roughness: 0.12,
    transmission: 0.12,
    thickness: 0.7,
    ior: 1.54,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.2,
  });
  materials["green-quartz"] = new THREE.MeshPhysicalMaterial({
    map: textures["green-quartz"],
    metalness: 0,
    roughness: 0.17,
    transmission: 0.1,
    thickness: 0.65,
    ior: 1.5,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.15,
  });
  materials.lava = new THREE.MeshPhysicalMaterial({
    map: textures.lava,
    metalness: 0.02,
    roughness: 0.96,
    bumpMap: textures.lava,
    bumpScale: 0.16,
    envMapIntensity: 0.55,
  });
  materials["heart-quartz"] = new THREE.MeshPhysicalMaterial({
    map: textures["heart-quartz"],
    metalness: 0,
    roughness: 0.15,
    transmission: 0.16,
    thickness: 0.72,
    ior: 1.54,
    clearcoat: 0.96,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.18,
  });
  materials.citrine = new THREE.MeshPhysicalMaterial({
    map: textures.citrine,
    metalness: 0,
    roughness: 0.1,
    transmission: 0.22,
    thickness: 0.78,
    ior: 1.54,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.28,
  });

  return { materials, textures: Object.values(textures) };
}

function FlatBraceletFallback({
  beads,
  onRemove,
}: {
  beads: CustomStoneKey[];
  onRemove: (index: number) => void;
}) {
  return (
    <div className="bracelet-thread-stage is-fallback" aria-live="polite">
      <div className="bracelet-thread" aria-hidden />
      <div className="bracelet-thread-centre">
        <strong>Choose with intention</strong>
        <span>
          {beads.length ? "Tap a bead to remove it" : "Begin with a stone"}
        </span>
      </div>
      {beads.map((bead, index) => (
        <button
          key={`${index}-${bead}`}
          type="button"
          className={`custom-bead is-${bead}`}
          onClick={() => onRemove(index)}
          aria-label={`Remove ${STONE_LABELS.get(bead) ?? "stone"} bead at position ${index + 1}`}
          style={
            {
              "--bead-angle": `${index * (360 / MAX_BEADS) - 90}deg`,
              "--bead-delay": `${Math.min(index * 25, 350)}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function BraceletScene3D({
  beads,
  onRemove,
}: {
  beads: CustomStoneKey[];
  onRemove: (index: number) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const removeRef = useRef(onRemove);
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    removeRef.current = onRemove;
  }, [onRemove]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let runtime: SceneRuntime | null = null;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.45, 10.4);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.className = "bracelet-3d-canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const environmentGenerator = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = environmentGenerator.fromScene(room, 0.04).texture;
      scene.environment = environment;
      environmentGenerator.dispose();

      const ambient = new THREE.HemisphereLight(0xfff4df, 0x4a2418, 2.3);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffead1, 4.5);
      keyLight.position.set(5, 7, 9);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);

      const rimLight = new THREE.PointLight(0xd8a758, 22, 20);
      rimLight.position.set(-5, -2, 5);
      scene.add(rimLight);

      const bracelet = new THREE.Group();
      bracelet.rotation.set(-0.12, 0.06, -0.08);
      scene.add(bracelet);

      const platform = new THREE.Mesh(
        new THREE.CircleGeometry(4.25, 72),
        new THREE.MeshPhysicalMaterial({
          color: 0xe6d1b8,
          roughness: 0.88,
          metalness: 0,
        }),
      );
      platform.position.z = -0.76;
      platform.receiveShadow = true;
      bracelet.add(platform);

      const cord = new THREE.Mesh(
        new THREE.TorusGeometry(RING_RADIUS, 0.055, 12, 160),
        new THREE.MeshPhysicalMaterial({
          color: 0x6f4b35,
          roughness: 0.66,
          clearcoat: 0.18,
        }),
      );
      cord.position.z = -0.08;
      bracelet.add(cord);

      const beadGroup = new THREE.Group();
      bracelet.add(beadGroup);

      const sphere = new THREE.SphereGeometry(0.52, 36, 28);
      const lava = new THREE.IcosahedronGeometry(0.54, 5);
      const { materials, textures } = createStoneMaterials();

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 7.8;
      controls.maxDistance = 12.5;
      controls.minPolarAngle = Math.PI * 0.28;
      controls.maxPolarAngle = Math.PI * 0.72;
      controls.autoRotate = !window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      controls.autoRotateSpeed = 0.48;

      const resetView = () => {
        camera.position.set(0, 0.45, 10.4);
        controls.target.set(0, 0, 0);
        controls.update();
      };
      mount.dataset.resetReady = "true";
      (
        mount as HTMLDivElement & { resetBraceletView?: () => void }
      ).resetBraceletView = resetView;

      const resize = () => {
        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      runtime = {
        renderer,
        scene,
        camera,
        controls,
        bracelet,
        beadGroup,
        meshes: [],
        sphere,
        lava,
        materials,
        textures,
        raycaster,
        pointer,
        resizeObserver,
        frame: 0,
        previousCount: 0,
        reducedMotion,
      };
      runtimeRef.current = runtime;

      const pickBead = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObjects(runtime?.meshes ?? [], false)[0];
      };

      const onPointerDown = (event: PointerEvent) => {
        pointerDownRef.current = { x: event.clientX, y: event.clientY };
      };
      const onPointerMove = (event: PointerEvent) => {
        const hit = pickBead(event);
        renderer.domElement.classList.toggle("is-bead-hovered", Boolean(hit));
        (runtime?.meshes ?? []).forEach((mesh) => {
          mesh.userData.hovered = mesh === hit?.object;
        });
      };
      const onPointerUp = (event: PointerEvent) => {
        const distance = Math.hypot(
          event.clientX - pointerDownRef.current.x,
          event.clientY - pointerDownRef.current.y,
        );
        if (distance > 7) return;
        const hit = pickBead(event);
        const index = hit?.object.userData.index;
        if (typeof index === "number") removeRef.current(index);
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerup", onPointerUp);

      const animate = (time: number) => {
        if (!runtime) return;
        controls.update();
        runtime.meshes.forEach((mesh, index) => {
          const arrival = mesh.userData.arrivalAt as number;
          const baseScale = mesh.userData.baseScale as number;
          const hoverScale = mesh.userData.hovered ? 1.12 : 1;
          const progress = reducedMotion
            ? 1
            : THREE.MathUtils.clamp((time - arrival) / 420, 0, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const scale = Math.max(0.001, baseScale * eased * hoverScale);
          mesh.scale.setScalar(
            THREE.MathUtils.lerp(mesh.scale.x, scale, reducedMotion ? 1 : 0.18),
          );
          mesh.rotation.y += reducedMotion ? 0 : 0.0015 + index * 0.000015;
        });
        if (!reducedMotion)
          bracelet.position.y = Math.sin(time * 0.0007) * 0.055;
        renderer.render(scene, camera);
        runtime.frame = window.requestAnimationFrame(animate);
      };
      runtime.frame = window.requestAnimationFrame(animate);
      setReady(true);

      return () => {
        window.cancelAnimationFrame(runtime?.frame ?? 0);
        resizeObserver.disconnect();
        controls.dispose();
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        sphere.dispose();
        lava.dispose();
        Object.values(materials).forEach((material) => material.dispose());
        textures.forEach((texture) => texture.dispose());
        environment.dispose();
        scene.traverse((object) => {
          if (
            object instanceof THREE.Mesh &&
            !runtime?.meshes.includes(object as StoneMesh)
          ) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
        runtimeRef.current = null;
      };
    } catch {
      setFailed(true);
      setReady(false);
      return undefined;
    }
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    runtime.beadGroup.clear();
    runtime.meshes = beads.map((bead, index) => {
      const geometry = bead === "lava" ? runtime.lava : runtime.sphere;
      const mesh = new THREE.Mesh(geometry, runtime.materials[bead]);
      const angle = index * ((Math.PI * 2) / MAX_BEADS) + Math.PI / 2;
      const naturalVariation =
        0.96 + ((index * 17 + bead.length * 7) % 9) / 100;
      mesh.position.set(
        Math.cos(angle) * RING_RADIUS,
        Math.sin(angle) * RING_RADIUS,
        Math.sin(angle * 2.1) * 0.085,
      );
      mesh.rotation.set(index * 0.31, angle * 0.7, index * 0.19);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.index = index;
      mesh.userData.baseScale = naturalVariation;
      mesh.userData.arrivalAt =
        performance.now() + (runtime.previousCount === 0 ? index * 34 : 0);
      mesh.scale.setScalar(runtime.reducedMotion ? naturalVariation : 0.001);
      runtime.beadGroup.add(mesh);
      return mesh;
    });
    runtime.previousCount = beads.length;
  }, [beads]);

  const resetView = () => {
    const mount = mountRef.current as
      (HTMLDivElement & { resetBraceletView?: () => void }) | null;
    mount?.resetBraceletView?.();
  };

  if (failed) return <FlatBraceletFallback beads={beads} onRemove={onRemove} />;

  return (
    <div className="bracelet-3d-stage" aria-live="polite">
      <div ref={mountRef} className="bracelet-3d-mount" />
      {!ready && (
        <div className="bracelet-3d-loading" role="status">
          Preparing your stone table
        </div>
      )}
      <div className="bracelet-3d-hud">
        <span>
          <i aria-hidden /> Real-time 3D preview
        </span>
        <button
          type="button"
          onClick={resetView}
          title="Reset 3D view"
          aria-label="Reset 3D view"
        >
          <RotateCcw aria-hidden size={17} />
        </button>
      </div>
      <div className="bracelet-3d-centre" aria-hidden>
        <strong>Choose with intention</strong>
        <span>{beads.length ? "Drag to rotate" : "Begin with a stone"}</span>
        {beads.length > 0 && <small>Tap a bead to remove</small>}
      </div>
      <div className="bracelet-3d-depth-cue" aria-hidden>
        360 DEG
      </div>
      <div className="bracelet-3d-accessible">
        <p>Your bracelet currently has {beads.length} beads.</p>
        {beads.map((bead, index) => (
          <button
            key={`${index}-${bead}`}
            type="button"
            onClick={() => onRemove(index)}
          >
            Remove {STONE_LABELS.get(bead) ?? "stone"} bead at position{" "}
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
