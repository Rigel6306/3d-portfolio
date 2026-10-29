"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/*
 * The source model has no rig or animation (it is one static mesh), so the
 * flapping is done in the vertex shader: every wing vertex is rotated around
 * the shoulder hinge by an angle that grows along the span and lags behind at
 * the tip, so the wing bends like a real one. The tail gets a travelling wave.
 *
 * Model space (before the GLB's own root rotation): x = wingspan,
 * y = body length (head at -y, tail at +y), z = up.
 */
const HINGE_X = 0.45; // shoulder, distance from the spine
const HINGE_Z = 1.2; // wing membrane height
const SPAN = 6.33; // wing tip distance from the spine
const CENTER = 0.22; // resting wing angle (rad)
const AMPLITUDE = 0.68; // flap amplitude (rad): about -25° to +50°
const SWEEP = 0.55; // swept-back wings, like the reference PNG
const TIP_LAG = 1.1; // tip trails the shoulder by this many radians

const f = (n: number) => n.toFixed(4);

const FLAP_GLSL = /* glsl */ `
uniform float uPhase;
uniform float uFlap;
float fSstep(float a, float b, float x){
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
void flapParams(vec3 p, out float th, out float w, out float t){
  float ax = abs(p.x);
  w = fSstep(0.30, 0.95, ax);
  t = clamp((ax - ${f(HINGE_X)}) / (${f(SPAN)} - ${f(HINGE_X)}), 0.0, 1.0);
  th = (${f(CENTER)} + ${f(AMPLITUDE)} * uFlap * sin(uPhase - ${f(TIP_LAG)} * t)) * w * (0.55 + 0.45 * t);
}
vec3 flapPosition(vec3 p){
  float th, w, t;
  flapParams(p, th, w, t);
  float s = p.x < 0.0 ? -1.0 : 1.0;
  float rx = abs(p.x) - ${f(HINGE_X)};
  float rz = p.z - ${f(HINGE_Z)};
  vec3 q = p;
  q.y += ${f(SWEEP)} * rx * w;
  q.x = s * (${f(HINGE_X)} + rx * cos(th) - rz * sin(th));
  q.z = ${f(HINGE_Z)} + rx * sin(th) + rz * cos(th);
  float tail = fSstep(1.8, 5.7, p.y);
  q.x += 0.32 * uFlap * tail * sin(1.9 * p.y - uPhase * 0.9);
  return q;
}
vec3 flapNormal(vec3 p, vec3 n){
  float th, w, t;
  flapParams(p, th, w, t);
  float s = p.x < 0.0 ? -1.0 : 1.0;
  float c = cos(th);
  float sn = sin(th);
  return normalize(vec3(n.x * c - s * n.z * sn, n.y, s * n.x * sn + n.z * c));
}
`;

// Pose: upright and level. Only YAW is used (a 3/4 view, head slightly toward the camera), so the
// legs always hang straight down. No roll and no pitch.
const YAW = Math.PI / 2 - 0.2;
const PIVOT = new THREE.Vector3(0, 0.8, -0.0); // shoulders, after the GLB root rotation

// Camera: level (zero tilt keeps verticals vertical) and a little below the shoulders, so the raised
// wings are seen from underneath like in the reference PNG.
const CAM_Y = -2;
const CAM_Z = 22;
const FOV = 28.2;
// Lens shift (in half-canvas-heights) that places the flap envelope in the canvas: body low-centre,
// wing tips with headroom. Tweak CENTER_X / CENTER_Y to nudge the dragon around inside the canvas.
const CENTER_X = -0.223; // negative = dragon moves right
const CENTER_Y = 0.6; // larger = dragon moves down

export interface ToothlessModelProps {
  src?: string;
  /** Shown while the model loads, and kept if WebGL or the file fails. */
  fallbackSrc?: string;
  /** Wing beats per second. */
  flapRate?: number;
  className?: string;
}

const ToothlessModel = ({
  src = "/paralax2/toothless.glb",
  fallbackSrc,
  flapRate = 1,
  className = "",
}: ToothlessModelProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  // Read every frame so changing it never rebuilds the WebGL context.
  const rate = useRef(flapRate);
  rate.current = flapRate;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setStatus("failed");
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.3;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, CAM_Y, CAM_Z);
    camera.lookAt(0, CAM_Y, 0); // horizontal view direction: no keystoning

    // Soft reflections so the dark skin catches light along the wing ridges.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    if ("environmentIntensity" in scene) {
      (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.5;
    }

    const key = new THREE.DirectionalLight(0xf2f5ff, 2.2);
    key.position.set(-5, 8, 6);
    const rim = new THREE.DirectionalLight(0x9db8ff, 2.4);
    rim.position.set(6, 3, -8);
    const fill = new THREE.HemisphereLight(0x8fa6c8, 0x05060a, 0.35);
    scene.add(key, rim, fill);

    // rig = pose + motion; model sits inside it, offset so the rig pivots at the shoulders.
    const rig = new THREE.Group();
    rig.rotation.set(0, YAW, 0);
    scene.add(rig);

    const shared = {
      uPhase: { value: 0 },
      uFlap: { value: reduceMotion ? 0 : 1 },
    };

    const patch = (mat: THREE.MeshPhysicalMaterial) => {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uPhase = shared.uPhase;
        shader.uniforms.uFlap = shared.uFlap;
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", `#include <common>\n${FLAP_GLSL}`)
          .replace(
            "#include <beginnormal_vertex>",
            "#include <beginnormal_vertex>\nobjectNormal = flapNormal(position, objectNormal);"
          )
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\ntransformed = flapPosition(position);"
          );
      };
      mat.customProgramCacheKey = () => "toothless-flap-v1";
    };

    // The GLB ships plain standard materials. Swap them for physical ones so the near-black skin gets a
    // soft satin sheen and a clear-coat highlight, like the glossy-but-matte look of the reference PNG.
    const upgrade = (src: THREE.MeshStandardMaterial) => {
      const isEye = src.name === "toothless_eye";
      const mat = new THREE.MeshPhysicalMaterial({
        name: src.name,
        map: src.map,
        normalMap: src.normalMap,
        normalScale: new THREE.Vector2(0.75, 0.75), // calmer scale detail, closer to the smooth PNG
        roughness: isEye ? 0.12 : 0.92,
        metalness: 0,
        clearcoat: isEye ? 1 : 0.1,
        clearcoatRoughness: isEye ? 0.04 : 0.34,
        sheen: isEye ? 0 : 0.45,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color(0x9aa3b2),
        side: THREE.DoubleSide,
      });
      src.dispose(); // textures are re-used by the new material
      return mat;
    };

    // ── Sizing ───────────────────────────────────────────────────
    const resize = () => {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Off-axis shift instead of tilting or moving the camera, so legs stay perfectly vertical.
      camera.setViewOffset(w, h, CENTER_X * (h / 2), -CENTER_Y * (h / 2), w, h);
      camera.updateProjectionMatrix();
    };
    resize();

    // ── Frame loop (only runs while on screen) ───────────────────
    let disposed = false;
    let modelReady = false;
    let visible = false;
    const t0 = performance.now();

    const renderFrame = () => {
      const t = (performance.now() - t0) / 1000;
      const phase = t * rate.current * Math.PI * 2;
      if (!reduceMotion) {
        shared.uPhase.value = phase;
        // Body rises through the downstroke and sinks on the upstroke.
        rig.position.y = -0.16 * Math.cos(phase - 0.3);
      }
      renderer.render(scene, camera);
    };

    const sync = () => {
      if (modelReady && visible && !reduceMotion) renderer.setAnimationLoop(renderFrame);
      else renderer.setAnimationLoop(null);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion && modelReady) renderFrame();
    });
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin: "120px" }
    );
    visibilityObserver.observe(canvas);

    // ── Load the model ───────────────────────────────────────────
    const meshes: THREE.Mesh[] = [];
    new GLTFLoader().load(
      src,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.position.set(-PIVOT.x, -PIVOT.y, -PIVOT.z);
        model.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.frustumCulled = false; // the shader moves vertices outside the original bounds
          const mat = upgrade(mesh.material as THREE.MeshStandardMaterial);
          patch(mat);
          mesh.material = mat;
          meshes.push(mesh);
        });
        rig.add(model);
        modelReady = true;
        setStatus("ready");
        if (reduceMotion) renderFrame();
        sync();
      },
      undefined,
      () => !disposed && setStatus("failed")
    );

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      meshes.forEach((m) => {
        m.geometry.dispose();
        const mat = m.material as THREE.MeshPhysicalMaterial;
        mat.map?.dispose();
        mat.normalMap?.dispose();
        mat.dispose();
      });
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [src]);

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      {status !== "ready" && fallbackSrc && (
        <img
          src={fallbackSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
        />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`block h-full w-full transition-opacity duration-500 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};

export default ToothlessModel;