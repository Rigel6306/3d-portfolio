"use client";

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
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
const HINGE_X = 0.45;
const HINGE_Z = 1.2;
const SPAN = 6.33;
const CENTER = 0.22;
const AMPLITUDE = 0.68;
const SWEEP = 0.55;
const TIP_LAG = 1.1;
// Only vertices above this height flap. Legs hang below the body, so they stay put.
// If the legs still move, raise both numbers a little; if the wing roots tear, lower them.
const LEG_Z0 = 0.45;
const LEG_Z1 = 0.95;

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
  w = fSstep(0.30, 0.95, ax) * fSstep(${f(LEG_Z0)}, ${f(LEG_Z1)}, p.z);
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

// Side-view pose (hero)
const YAW = Math.PI / 2 - 0.2;
const PIVOT = new THREE.Vector3(0, 0.8, -0.9);
const CAM_Y = -2;
const CAM_Z = 22;
const FOV = 28.2;
const CENTER_X = -0.223;
const CENTER_Y = 0.6;

// ── Fly-by: tiny and far at the top left, crossing sideways, turning to face the camera, growing
// with real perspective, then up and over the viewer. The camera sits at z = FLYBY_CAM_Z.
const FLYBY_FOV = 35;
const FLYBY_CAM_Z = 22;
// The approach is ONE cubic Bezier from the far top-left to point B, so the turn from "crossing
// sideways" to "coming straight at you" is a single wide arc instead of a corner between waypoints.
// The last control point sits along the heading of the final leg, so the join at B is seamless.
const APPROACH = new THREE.CubicBezierCurve3(
  new THREE.Vector3(-390, 54, -230), // start: far top-left, tiny
  new THREE.Vector3(-220, 37, -216), // pulls him sideways first (heading ~ +x)
  new THREE.Vector3(-23, 15, -230), // makes the turn wide; heading is ~ +z by the end
  new THREE.Vector3(-9, 6, -80) // B: now facing the viewer
);
const APPROACH_SEGMENTS = 8;
const FLYBY_PATH = [
  ...APPROACH.getPoints(APPROACH_SEGMENTS), // 9 points, the last one is B
  new THREE.Vector3(-0.5, 0.5, 8), // head-on, ~14 units from the lens
  new THREE.Vector3(1.5, 12, 34), // sweeps up over the camera and out the top
];
// With this many points, an even split would spend 80% of the scroll on the far approach. Remap so
// the approach (start to B) gets APPROACH_SHARE of the scroll and the close pass gets the rest.
const APPROACH_SHARE = 0.5;
const U_AT_B = APPROACH_SEGMENTS / (FLYBY_PATH.length - 1);
const flightToCurve = (v: number) =>
  v < APPROACH_SHARE
    ? (v / APPROACH_SHARE) * U_AT_B
    : U_AT_B + ((v - APPROACH_SHARE) / (1 - APPROACH_SHARE)) * (1 - U_AT_B);

export interface ToothlessModelProps {
  src?: string;
  fallbackSrc?: string;
  /** Wing beats per second. */
  flapRate?: number;
  className?: string;
  /** "side": hero profile view. "flyby": full-size layer driven by `flight`. */
  mode?: "side" | "flyby";
  /** flyby only: flight progress, 0 to 1. Drawn only while strictly between 0 and 1. */
  flight?: MotionValue<number>;
}

const ToothlessModel = ({
  src = "/paralax2/toothless.glb",
  fallbackSrc,
  flapRate = 1.1,
  className = "",
  mode = "side",
  flight,
}: ToothlessModelProps) => {
  const flyby = mode === "flyby";
  const flightRef = useRef(flight);
  flightRef.current = flight;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  const rate = useRef(flapRate);
  rate.current = flapRate;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (flyby && reduceMotion) return;

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
    renderer.toneMappingExposure = 0.8;

    const scene = new THREE.Scene();
    // far plane must exceed the start of the path (~390 units away)
    const camera = new THREE.PerspectiveCamera(flyby ? FLYBY_FOV : FOV, 1, 0.1, 800);
    if (flyby) {
      camera.position.set(0, 0, FLYBY_CAM_Z);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, CAM_Y, CAM_Z);
      camera.lookAt(0, CAM_Y, 0);
    }

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    if ("environmentIntensity" in scene) {
      (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.25;
    }

    const key = new THREE.DirectionalLight(0xf2f5ff, 1.3);
    key.position.set(-5, 8, 6);
    const rim = new THREE.DirectionalLight(0x9db8ff, 1.5);
    rim.position.set(6, 3, -8);
    const fill = new THREE.HemisphereLight(0x8fa6c8, 0x05060a, 0.2);
    scene.add(key, rim, fill);
    if (flyby) {
      const front = new THREE.DirectionalLight(0xdfe8ff, 0.8);
      front.position.set(0, 4, 20);
      scene.add(front);
    }

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

    const upgrade = (src: THREE.MeshStandardMaterial) => {
      const isEye = src.name === "toothless_eye";
      const mat = new THREE.MeshPhysicalMaterial({
        name: src.name,
        map: src.map,
        normalMap: src.normalMap,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: isEye ? 0.12 : 0.55,
        metalness: 0,
        clearcoat: isEye ? 1 : 0.15,
        clearcoatRoughness: isEye ? 0.04 : 0.4,
        sheen: isEye ? 0 : 0.15,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color(0x9aa3b2),
        side: THREE.DoubleSide,
      });
      src.dispose();
      return mat;
    };

    const resize = () => {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, flyby ? 1.5 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (flyby) {
        camera.clearViewOffset();
      } else {
        camera.setViewOffset(w, h, CENTER_X * (h / 2), -CENTER_Y * (h / 2), w, h);
      }
      camera.updateProjectionMatrix();
    };
    resize();

    let disposed = false;
    let modelReady = false;
    let visible = false;
    const t0 = performance.now();

    const curve = new THREE.CatmullRomCurve3(FLYBY_PATH, false, "centripetal");
    const forward = new THREE.Vector3(0, 0, 1); // the model's head points along +z
    const heading = new THREE.Vector3();
    const bank = new THREE.Quaternion();
    let drawn = false;

    const renderFrame = () => {
      const t = (performance.now() - t0) / 1000;
      const phase = t * rate.current * Math.PI * 2;

      if (flyby) {
        const v = flightRef.current?.get() ?? 0;
        if (v <= 0 || v >= 1) {
          if (drawn) {
            renderer.clear();
            drawn = false;
          }
          return;
        }
        shared.uPhase.value = phase;
        const u = flightToCurve(v);
        curve.getPoint(u, rig.position);
        curve.getTangent(u, heading);
        rig.quaternion.setFromUnitVectors(forward, heading);
        bank.setFromAxisAngle(heading, 0.14 * Math.sin(t * 0.9));
        rig.quaternion.premultiply(bank);
        renderer.render(scene, camera);
        drawn = true;
        return;
      }

      if (!reduceMotion) {
        shared.uPhase.value = phase;
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
          mesh.frustumCulled = false;
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
  }, [src, flyby]);

  return (
    <div
      className={`${flyby ? "absolute inset-0 h-full w-full" : "relative aspect-square w-full"} ${className}`}
    >
      {status !== "ready" && fallbackSrc && !flyby && (
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