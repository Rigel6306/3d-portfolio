// utils/shaders.ts

export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * ============================================================================
 * SIMULATION PASS (fluidFragmentShader)
 * ============================================================================
 * Updates the ping-pong simulation buffer every frame.
 * - R channel: Ink / liquid density (how thick or present the fluid is).
 * - G/B channels: Velocity vector in UV units per frame (direction & speed).
 */
export const fluidFragmentShader = /* glsl */ `
  // ── UNIFORMS (Passed from JavaScript/Three.js) ──
  uniform sampler2D uPrev;          // Previous frame's simulation texture (ping-pong buffer)
  uniform vec2  uPointer;           // Current normalized pointer/mouse position (0.0 to 1.0)
  uniform vec2  uPrevPointer;       // Pointer position from the previous frame (used to calculate speed/direction)
  uniform vec2  uTexel;             // Size of a single pixel in UV space (1.0 / width, 1.0 / height)
  uniform float uAspect;          // Screen aspect ratio (width / height) to keep shapes round
  uniform float uRadius;          // Radius of the pointer splat/brush (controls initial drop size)
  uniform float uDensityDecay;    // How fast liquid density fades out over time (closer to 1.0 = lingers longer)
  uniform float uVelocityDecay;   // How fast velocity slows down over time (inertia control)
  uniform float uDt;              // Delta time normalized to 60fps (1.0 == normal frame speed)
  uniform float uTime;            // Total elapsed time in seconds (drives ambient swirling animation)

  varying vec2 vUv;                 // Current fragment coordinate UVs

  // Pseudo-random hash function for generating noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Value noise function built on top of hash
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // Smooth interpolation curve
    return mix(
      mix(hash(i),                  hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  // Curl noise generator: produces divergence-free swirling currents (like real liquid eddies)
  vec2 curl(vec2 p) {
    float e  = 0.02; // Small offset delta for derivative calculation
    float n1 = vnoise(p + vec2(0.0, e));
    float n2 = vnoise(p - vec2(0.0, e));
    float n3 = vnoise(p + vec2(e, 0.0));
    float n4 = vnoise(p - vec2(e, 0.0));
    return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
  }

  void main() {
    vec4 prev = texture2D(uPrev, vUv);

    // 1. SEMI-LAGRANGIAN ADVECTION
    // Trace backward along the velocity vector to see where current liquid came from.
    // [0.85] multiplier: Lower values increase momentum damping; higher values make fluid glide further.
    vec2 back = vUv - prev.gb * (uDt * 0.85);
    vec4 adv  = texture2D(uPrev, back);

    // 2. DIFFUSION (Viscosity)
    // Sample 4 neighboring pixels to bleed density and velocity outward, simulating thickness.
    vec4 nb =
      texture2D(uPrev, back + vec2( uTexel.x, 0.0)) +
      texture2D(uPrev, back + vec2(-uTexel.x, 0.0)) +
      texture2D(uPrev, back + vec2(0.0,  uTexel.y)) +
      texture2D(uPrev, back + vec2(0.0, -uTexel.y));

    // [0.68 / 0.08]: Weights for center advected values vs. neighboring diffusion spread.
    float density  = adv.r  * 0.68 + nb.r  * 0.08;
    vec2  velocity = adv.gb * 0.80 + nb.gb * 0.05;

    // 3. DECAY
    // Gradually remove density and velocity so the screen doesn't stay full forever.
    // [0.985 / 0.98]: Base decay coefficients. Closer to 1.0 = fluid stays active much longer.
    density  *= pow(max(uDensityDecay, 0.985), uDt);
    velocity *= pow(max(uVelocityDecay, 0.98), uDt);

    // 4. AMBIENT SWIRL
    // Adds organic, subtle background motion even when the user isn't touching the screen.
    // [2.5]: Frequency of swirl noise. [0.08]: Speed of ambient animation. [0.0004]: Swirl intensity.
    velocity += curl(vUv * 2.5 + uTime * 0.08) * 0.0004 * density * uDt;

    // 5. POINTER SPLAT (User interaction)
    // Injects fluid density and velocity wherever the user moves their cursor/finger.
    vec2 A   = vec2(uAspect, 1.0);
    vec2 seg = uPointer - uPrevPointer;
    float segLen = length(seg);

    if (segLen > 0.0002) { // Only calculate if the pointer actually moved
      vec2 a  = uPrevPointer * A;
      vec2 b  = uPointer * A;
      vec2 p  = vUv * A;
      vec2 ab = b - a;
      float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
      float dist = length(p - (a + ab * t));

      // [1.2]: Controls splat spread width based on uRadius.
      float falloff  = exp(-(dist * dist) / (uRadius * uRadius * 1.2));
      // [14.0]: Peak strength scaling factor based on how fast the cursor moves.
      float strength = clamp(segLen * 14.0, 0.1, 0.7);

      // [0.35 / 0.55]: How much density (amount added) and velocity (push force) are injected.
      density  += falloff * strength * 0.35;
      velocity += seg * falloff * 0.55;
    }

    // Stability clamps to prevent mathematical explosions or infinite loops in shaders
    density = min(density, 1.3); // Maximum allowed liquid density cap
    float vLen = length(velocity);
    if (vLen > 0.02) velocity *= 0.02 / vLen; // Maximum velocity speed limit [0.02]

    gl_FragColor = vec4(density, velocity, 1.0);
  }
`;

/**
 * ============================================================================
 * DISPLAY PASS (displayFragmentShader)
 * ============================================================================
 * Reads the fluid simulation buffer and uses it as a lens mask to reveal/hide 
 * background textures with realistic refraction, liquid edges, and specular highlights.
 */
export const displayFragmentShader = /* glsl */ `
  // ── UNIFORMS ──
  uniform sampler2D uFluid;          // The live fluid simulation texture from the simulation pass
  uniform sampler2D uTopTexture;     // The top image layer (revealed underneath or covered)
  uniform sampler2D uBottomTexture;  // The background image layer
  uniform vec2  uResolution;         // Canvas width and height in pixels
  uniform vec2  uTopTextureSize;     // Original pixel resolution of uTopTexture
  uniform vec2  uBottomTextureSize;  // Original pixel resolution of uBottomTexture
  uniform vec2  uTexel;              // UV pixel size step
  uniform vec2  uPointer;            // Current mouse pointer coordinate
  uniform float uTime;             // Total elapsed time
  uniform float uIntro;            // Animation driver uniform: 0.0 = fully closed, 1.0 = fully open

  varying vec2 vUv;

  // Hash & noise utilities for surface roughness and grain
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                  hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  // Fractal Brownian Motion (FBM): layers multiple noise octaves to create organic, natural textures
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) { // 4 octave loops
      v += a * noise(p);
      p  = p * 2.1 + 17.0; // Frequency multiplier per octave
      a *= 0.5;            // Amplitude reduction per octave
    }
    return v;
  }

  // CSS 'object-fit: cover' equivalent helper function for textures
  vec2 coverUV(vec2 uv, vec2 texSize) {
    if (texSize.x < 2.0 || texSize.y < 2.0) return uv;
    vec2 s      = uResolution / texSize;
    float scale = max(s.x, s.y);
    vec2 scaled = texSize * scale;
    vec2 offset = (uResolution - scaled) * 0.5;
    return (uv * uResolution - offset) / scaled;
  }

  void main() {
    vec2 A = vec2(uResolution.x / uResolution.y, 1.0);

    // ── 1. READ FLUID STATE ──
    vec4  f = texture2D(uFluid, vUv);
    float d = f.r; // Current density at this pixel
    vec2  v = f.gb; // Current velocity vector at this pixel

    // Sample adjacent pixels to find the slope (gradient), which acts like surface bumps/normals
    float dl = texture2D(uFluid, vUv - vec2(uTexel.x, 0.0)).r;
    float dr = texture2D(uFluid, vUv + vec2(uTexel.x, 0.0)).r;
    float db = texture2D(uFluid, vUv - vec2(0.0, uTexel.y)).r;
    float dt = texture2D(uFluid, vUv + vec2(0.0, uTexel.y)).r;
    vec2 grad = vec2(dr - dl, dt - db);

    // ── 2. ORGANIC LIQUID MASK (Reversible Opening/Closing) ──
    // Adds FBM noise to fluid density so the border looks like rippling water/liquid instead of a harsh circle.
    // [3.2]: Noise scale frequency. [0.05]: Noise animation speed. [0.2]: Distortion weight.
    float n     = fbm(vUv * A * 3.2 + uTime * 0.05);
    float field = d + (n - 0.5) * 0.2 * smoothstep(0.0, 0.25, d);

    // REVERSIBLE THRESHOLD TRICK:
    // As uIntro goes from 1.0 down to 0.0, these bounds shift inward. 
    // This causes the liquid edge to contract cleanly instead of performing a simple fade out.
    // [0.55 / 0.16]: Lower bound mix range (fully open vs fully closed).
    // [0.95 / 0.56]: Upper bound mix range (controls thickness of the liquid edge boundary).
    float low  = mix(0.55, 0.16, uIntro);   
    float high = mix(0.95, 0.56, uIntro);
    float reveal = smoothstep(low, high, field); // Final mask value (0.0 = hidden, 1.0 = visible)

    // ── 3. REFRACTION & TEXTURE WARPING ──
    // Bends background textures based on fluid slopes and velocity directions (water lens effect).
    // [0.35]: Gradient refraction weight. [0.6]: Velocity push weight.
    vec2 refr = grad * 0.35 + v * 0.6;
    vec2 par  = (uPointer - 0.5) * 0.012; // Subtle parallax offset based on pointer position

    vec2 topUV = coverUV(vUv + refr * 0.5 + par, uTopTextureSize);
    vec2 botUV = coverUV(vUv - refr - par * 1.5, uBottomTextureSize);

    vec3 top = texture2D(uTopTexture, topUV).rgb;

    // Chromatic aberration (splitting RGB channels slightly for glass/water realism)
    vec3 bottom = vec3(
      texture2D(uBottomTexture, botUV + refr * 0.12).r, // Red channel shift
      texture2D(uBottomTexture, botUV).g,               // Green channel center
      texture2D(uBottomTexture, botUV - refr * 0.12).b  // Blue channel shift
    );

    // Blend top and bottom textures together using our liquid reveal mask
    vec3 col = mix(top, bottom, reveal);

    // ── 4. SPECULAR HIGHLIGHTS (Lighting Reflection) ──
    // Creates shiny water reflections based on simulated surface normals and a virtual light source.
    vec3  N    = normalize(vec3(-grad * 14.0, 1.0)); // Surface normal vector [14.0 controls bump height]
    vec3  L    = normalize(vec3(0.4, 0.5, 0.8));   // Virtual light direction vector
    // [48.0]: Shininess exponent (higher = smaller, sharper highlight catch point).
    // [0.45]: Specular intensity multiplier.
    float spec = pow(max(dot(N, L), 0.0), 48.0) * smoothstep(0.02, 0.3, d) * reveal;
    col += spec * 0.45;

    // ── 5. VIGNETTE & FILM GRAIN ──
    // Adds atmospheric shading and subtle pixel-level grain texture.
    float vig = smoothstep(1.15, 0.35, length(vUv - 0.5)); // Darkens corners slightly
    col *= mix(0.82, 1.0, vig);
    col += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.018; // [0.018] Grain noise amount

    // Final color output with full alpha opacity (edge contraction handles closing completely)
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;