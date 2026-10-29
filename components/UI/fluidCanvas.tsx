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
  className?: string;
  onLoad?: () => void;
}

const SIM_SIZE = 512;
const MAX_DPR = 2;

const createTarget = () =>
  new THREE.WebGLRenderTarget(SIM_SIZE, SIM_SIZE, {
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
  topImage = "/paralax2/castle.jpg",
  bottomImage = "/paralax2/toothlessGoodbye.jpg",
  brushSize = 0.07,
  persistence = 0.985,
  className,
  onLoad,
}: FluidCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read every frame, so tuning these never recreates the WebGL context.
  const settings = useRef({ brushSize, persistence });
  settings.current = { brushSize, persistence };


  

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const texel = new THREE.Vector2(1 / SIM_SIZE, 1 / SIM_SIZE);

    // ── Simulation ──────────────────────────────────────────────
    let readTarget = createTarget();
    let writeTarget = createTarget();

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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
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

        const max = renderer.capabilities.maxTextureSize;
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
      };
      img.onerror = (error) => {
        if (disposed) return;
        console.error(`Failed to load fluid canvas image: ${url}`, error);
        loaded += 1;
        if (reduceMotion) renderFrame(0);
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

      // Smooth the pointer so strokes are fluid and frame-rate independent;
      // the stroke decays to zero naturally when the cursor stops.
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

      if (loaded === 2 && !hasReportedLoad) {
        hasReportedLoad = true;
        onLoad?.();
      }
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
        // First contact: jump, don't streak from the old position.
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
        if (reduceMotion) return;
        if (entry.isIntersecting) start();
        else stop();
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
      stop();
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
  }, [topImage, bottomImage, onLoad]);

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