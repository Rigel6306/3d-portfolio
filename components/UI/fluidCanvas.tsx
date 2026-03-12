// FluidCanvas.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import {
  vertexShader,
  fluidFragmentShader,
  displayFragmentShader,
} from '../../utils/shaders.';

// Import images from src/assets
// import img1 from "../assets/img1.jpg";
// import img2 from "../assets/img2.jpg";

const FluidCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      precision: "highp",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Mouse state
    const mouse = new THREE.Vector2(0.5, 0.5);
    const prevMouse = new THREE.Vector2(0.5, 0.5);
    let isMoving = false;
    let lastMoveTime = 0;

    // Ping-pong render targets
    const size = 500;
    const pingPongTargets = [
      new THREE.WebGLRenderTarget(size, size, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        depthBuffer: false,
        stencilBuffer: false,
      }),
      new THREE.WebGLRenderTarget(size, size, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        depthBuffer: false,
        stencilBuffer: false,
      }),
    ];
    let currentTarget = 0;

    // Placeholder textures
    const createPlaceholderTexture = (color: string | CanvasGradient | CanvasPattern) => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(c);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 512, 512);
      return new THREE.CanvasTexture(c);
    };

    const topTexture = createPlaceholderTexture("#0000ff");
    const bottomTexture = createPlaceholderTexture("#ff0000");

    const trailsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPrevTrails: { value: null },
        uMouse: { value: mouse },
        uPrevMouse: { value: prevMouse },
        uResolution: { value: new THREE.Vector2(size, size) },
        uDecay: { value: 0.997 },
        uIsMoving: { value: false },
      },
      vertexShader,
      fragmentShader: fluidFragmentShader,
    });

    const displayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uFluid: { value: null },
        uTopTexture: { value: topTexture },
        uBottomTexture: { value: bottomTexture },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uDpr: { value: window.devicePixelRatio },
        uTopTextureSize: { value: new THREE.Vector2(1, 1) },
        uBottomTextureSize: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader,
      fragmentShader: displayFragmentShader,
    });

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const displayMesh = new THREE.Mesh(planeGeometry, displayMaterial);
    scene.add(displayMesh);

    const simMesh = new THREE.Mesh(planeGeometry, trailsMaterial);
    const simScene = new THREE.Scene();
    simScene.add(simMesh);

    // Clear initial targets
    renderer.setRenderTarget(pingPongTargets[0]);
    renderer.clear();
    renderer.setRenderTarget(pingPongTargets[1]);
    renderer.clear();
    renderer.setRenderTarget(null);

    // Event handlers
    const onMouseMove = (event: { clientX: number; clientY: number; }) => {
      const rect = canvas.getBoundingClientRect();
      prevMouse.copy(mouse);
      mouse.x = (event.clientX - rect.left) / rect.width;
      mouse.y = 1 - (event.clientY - rect.top) / rect.height;
      isMoving = true;
      lastMoveTime = performance.now();
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      displayMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      displayMaterial.uniforms.uDpr.value = window.devicePixelRatio;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (isMoving && performance.now() - lastMoveTime > 50) {
        isMoving = false;
      }

      const prevTarget = pingPongTargets[currentTarget];
      currentTarget = (currentTarget + 1) % 2;
      const currentRenderTarget = pingPongTargets[currentTarget];

      trailsMaterial.uniforms.uPrevTrails.value = prevTarget.texture;
      trailsMaterial.uniforms.uMouse.value.copy(mouse);
      trailsMaterial.uniforms.uPrevMouse.value.copy(prevMouse);
      trailsMaterial.uniforms.uIsMoving.value = isMoving;

      renderer.setRenderTarget(currentRenderTarget);
      renderer.render(simScene, camera);

      displayMaterial.uniforms.uFluid.value = currentRenderTarget.texture;

      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    };

    // Image loader
    const loadImage = (url:string, type: string, textureSizeVector: THREE.Vector2) => {
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;
        textureSizeVector.set(originalWidth, originalHeight);

        const maxSize = 4096;
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        if (originalWidth > maxSize || originalHeight > maxSize) {
          if (originalWidth > originalHeight) {
            newWidth = maxSize;
            newHeight = Math.floor(originalHeight * (maxSize / originalWidth));
          } else {
            newHeight = maxSize;
            newWidth = Math.floor(originalWidth * (maxSize / originalHeight));
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        const newTexture = new THREE.CanvasTexture(canvas);
        newTexture.minFilter = THREE.LinearFilter;
        newTexture.magFilter = THREE.LinearFilter;

        if (type === "top") {
          displayMaterial.uniforms.uTopTexture.value = newTexture;
          displayMaterial.uniforms.uTopTextureSize.value = textureSizeVector;
        } else if (type === "bottom") {
          displayMaterial.uniforms.uBottomTexture.value = newTexture;
          displayMaterial.uniforms.uBottomTextureSize.value = textureSizeVector;
        }
      };

      img.src = url;
    };

    const topTextureSize = new THREE.Vector2(1, 1);
    const bottomTextureSize = new THREE.Vector2(1, 1);

    
    loadImage('/canvas1.jpg', "top", topTextureSize);
    loadImage('/img2.jpg', "bottom", bottomTextureSize);

    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return <canvas  ref={canvasRef}  />;
};

export default FluidCanvas;