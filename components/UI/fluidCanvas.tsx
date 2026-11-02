"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  vertexShader,
  fluidFragmentShader,
  displayFragmentShader,
} from "../../utils/shaders";

export interface FluidCanvasProps {
  /** Image shown at rest. */
  topImage?: string;
  /** Image revealed through the fluid. */
  bottomImage?: string;
  /** Brush radius in aspect-corrected uv units (≈0.03 – 0.15). */
  brushSize?: number;
  /** How long ink lingers (0.9 fast fade → 0.999 very slow). */
  persistence?: number;
  /** When false the render loop is paused (context stays alive). */
  active?: boolean;
  className?: string;
  onLoad?: () => void;
}

const SIM_SIZE_DESKTOP = 512;
const SIM_SIZE_COARSE = 256; // phones / tablets
const MAX_DPR = 2;
const MAX_DPR_COARSE = 1;

const createTarget = (size: number) =>
  new THREE.WebGLRenderTarget(size, size, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  });

const createPlaceholder = () => {
  const tex = new THREE.DataTexture(new Uint8Array([8, 10, 14, 255]), 1, 1);
  tex.needsUpdate = true;
  return tex;
};

const FluidCanvas = ({
  topImage = "/paralax2/withLightfury.jpg",
  bottomImage = "/paralax2/toothlessGoodbye.jpg",
  brushSize = 0.07,
  persistence = 0.985,
  active = true,
  className,
  onLoad,
}: FluidCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read every frame, so tuning these never recreates the WebGL context.
  const settings = useRef({ brushSize, persistence });
  settings.current = { brushSize, persistence };

  // Keep the latest onLoad without making it an effect dependency
  // (an unmemoized callback would otherwise rebuild the whole renderer).
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  // Lets the "active" prop start/stop the loop owned by the main effect.
  const activeRef = useRef(active);
  activeRef.current = active;
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const simSize = coarse ? SIM_SIZE_COARSE : SIM_SIZE_DESKTOP;
    const maxDpr = coarse ? MAX_DPR_COARSE : MAX_DPR;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const texel = new THREE.Vector2(1 / simSize, 1 / simSize);

    // ── Simulation ──────────────────────────────────────────────
    let readTarget = createTarget(simSize);
    let writeTarget = createTarget(simSize);

    const pointer = new THREE.Vector2(0.5, 0.5); // smoothed
    const prevPointer = new THREE.Vector2(0.5, 0.5);
    const target = new THREE.Vector2(0.5, 0.5); // raw
    let hasPointer = false;

    const simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPrev: { value: null },
        uPointer: { value: pointer },
        uPrevPointer: { value: prevPointer },
        uTexel: { value: texel },
        uAspect: { value: 1 },
        uRadius: { value: brushSize },
        uDensityDecay: { value: persistence },
        uVelocityDecay: { value: 0.975 },
        uDt: { value: 1 },
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader: fluidFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    const simScene = new THREE.Scene();
    simScene.add(new THREE.Mesh(geometry, simMaterial));

    // ── Display ─────────────────────────────────────────────────
    const topPlaceholder = createPlaceholder();
    const bottomPlaceholder = createPlaceholder();

    const displayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uFluid: { value: null },
        uTopTexture: { value: topPlaceholder },
        uBottomTexture: { value: bottomPlaceholder },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTopTextureSize: { value: new THREE.Vector2(1, 1) },
        uBottomTextureSize: { value: new THREE.Vector2(1, 1) },
        uTexel: { value: texel },
        uPointer: { value: pointer },
        uTime: { value: 0 },
        uIntro: { value: reduceMotion ? 1 : 0 },
      },
      vertexShader,
      fragmentShader: displayFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, displayMaterial));

    renderer.setRenderTarget(readTarget);
    renderer.clear();
    renderer.setRenderTarget(writeTarget);
    renderer.clear();
    renderer.setRenderTarget(null);

    // ── Sizing ──────────────────────────────────────────────────
    const resize = () => {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
      renderer.setSize(w, h, false);
      displayMaterial.uniforms.uResolution.value.set(w, h);
      simMaterial.uniforms.uAspect.value = w / h;
    };
    resize();

    // ── Images ──────────────────────────────────────────────────
    let disposed = false;
    let loaded = 0;
    let hasReportedLoad = false;
    const ownedTextures: THREE.Texture[] = [];

    const loadImage = (
      url: string,
      textureKey: "uTopTexture" | "uBottomTexture",
      sizeKey: "uTopTextureSize" | "uBottomTextureSize"
    ) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (disposed) return;

        // Phones: cap texture size so huge JPGs don't eat GPU memory.
        const cap = coarse ? 2048 : renderer.capabilities.maxTextureSize;
        const max = Math.min(cap, renderer.capabilities.maxTextureSize);
        const k = Math.min(1, max / Math.max(img.width, img.height));
        let source: HTMLImageElement | HTMLCanvasElement = img;
        if (k < 1) {
          const c = document.createElement("canvas");
          c.width = Math.floor(img.width * k);
          c.height = Math.floor(img.height * k);
          c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
          source = c;
        }

        const tex = new THREE.Texture(source);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        ownedTextures.push(tex);

        displayMaterial.uniforms[textureKey].value = tex;
        displayMaterial.uniforms[sizeKey].value.set(source.width, source.height);

        loaded += 1;
        if (reduceMotion) renderFrame(0);
        reportLoadIfReady();
      };
      img.onerror = (error) => {
        if (disposed) return;
        console.error(`Failed to load fluid canvas image: ${url}`, error);
        loaded += 1;
        if (reduceMotion) renderFrame(0);
        reportLoadIfReady();
      };
      img.src = url;
    };

    loadImage(topImage, "uTopTexture", "uTopTextureSize");
    loadImage(bottomImage, "uBottomTexture", "uBottomTextureSize");

    // ── Frame ───────────────────────────────────────────────────
    let time = 0;

    const renderFrame = (dt: number) => {
      const s = settings.current;
      time += dt;

      prevPointer.copy(pointer);
      pointer.lerp(target, 1 - Math.exp(-dt * 28));

      simMaterial.uniforms.uPrev.value = readTarget.texture;
      simMaterial.uniforms.uRadius.value = s.brushSize;
      simMaterial.uniforms.uDensityDecay.value = s.persistence;
      simMaterial.uniforms.uDt.value = dt * 60;
      simMaterial.uniforms.uTime.value = time;

      renderer.setRenderTarget(writeTarget);
      renderer.render(simScene, camera);
      renderer.setRenderTarget(null);
      [readTarget, writeTarget] = [writeTarget, readTarget];

      const u = displayMaterial.uniforms;
      if (!reduceMotion && loaded === 2) {
        u.uIntro.value += (1 - u.uIntro.value) * (1 - Math.exp(-dt * 2.2));
      }
      u.uFluid.value = readTarget.texture;
      u.uTime.value = time;
      renderer.render(scene, camera);
    };

    // Report "ready" as soon as both images are loaded, independent of the
    // render loop (which stays paused until the canvas is revealed).
    const reportLoadIfReady = () => {
      if (loaded !== 2 || hasReportedLoad || disposed) return;
      hasReportedLoad = true;
      // Draw one frame so textures are uploaded to the GPU before reveal.
      if (!reduceMotion) renderFrame(0);
      onLoadRef.current?.();
    };

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      renderFrame(dt);
    };
    const start = () => {
      last = performance.now();
      renderer.setAnimationLoop(tick);
    };
    const stop = () => renderer.setAnimationLoop(null);

    // ── Run / pause control ─────────────────────────────────────
    // Loop runs only when the canvas is on screen AND the parent says active.
    let inView = true;
    let running = false;
    const sync = () => {
      if (reduceMotion || disposed) return;
      const shouldRun = inView && activeRef.current;
      if (shouldRun && !running) {
        running = true;
        start();
      } else if (!shouldRun && running) {
        running = false;
        stop();
      }
    };
    syncRef.current = sync;

    // ── Events ──────────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;

      if (x < 0 || x > 1 || y < 0 || y > 1) {
        hasPointer = false;
        return;
      }
      target.set(x, y);
      if (!hasPointer) {
        pointer.copy(target);
        prevPointer.copy(target);
        hasPointer = true;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) renderFrame(0);
    });
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 }
    );
    visibilityObserver.observe(canvas);

    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    if (!reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    } else {
      renderFrame(0);
    }

    return () => {
      disposed = true;
      running = false;
      stop();
      syncRef.current = () => {};
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("pointermove", onPointerMove);

      readTarget.dispose();
      writeTarget.dispose();
      geometry.dispose();
      simMaterial.dispose();
      displayMaterial.dispose();
      topPlaceholder.dispose();
      bottomPlaceholder.dispose();
      ownedTextures.forEach((t) => t.dispose());
      // No forceContextLoss(): StrictMode remounts onto the same <canvas>.
      renderer.dispose();
    };
    // onLoad intentionally NOT a dependency (kept in onLoadRef).
  }, [topImage, bottomImage]);

  // Start / pause when the parent toggles `active`.
  useEffect(() => {
    syncRef.current();
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
};

export default FluidCanvas;