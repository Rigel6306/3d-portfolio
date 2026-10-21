// utils/shaders.ts

export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Simulation pass.
 * Ping-pong buffer layout:  R = ink density,  G/B = velocity (uv units / frame)
 *
 * Adjusted for a slower, heavier, more viscous real-world water effect.
 */
export const fluidFragmentShader = /* glsl */ `
  uniform sampler2D uPrev;
  uniform vec2  uPointer;
  uniform vec2  uPrevPointer;
  uniform vec2  uTexel;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uDensityDecay;
  uniform float uVelocityDecay;
  uniform float uDt;      // frame-rate normalised (1.0 == 60fps)
  uniform float uTime;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                  hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  vec2 curl(vec2 p) {
    float e  = 0.02;
    float n1 = vnoise(p + vec2(0.0, e));
    float n2 = vnoise(p - vec2(0.0, e));
    float n3 = vnoise(p + vec2(e, 0.0));
    float n4 = vnoise(p - vec2(e, 0.0));
    return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
  }

  void main() {
    vec4 prev = texture2D(uPrev, vUv);

    // 1. semi-Lagrangian advection (slightly dampened for inertia)
    vec2 back = vUv - prev.gb * (uDt * 0.85);
    vec4 adv  = texture2D(uPrev, back);

    // 2. diffusion (heavier viscosity weighting for smoother spread)
    vec4 nb =
      texture2D(uPrev, back + vec2( uTexel.x, 0.0)) +
      texture2D(uPrev, back + vec2(-uTexel.x, 0.0)) +
      texture2D(uPrev, back + vec2(0.0,  uTexel.y)) +
      texture2D(uPrev, back + vec2(0.0, -uTexel.y));

    float density  = adv.r  * 0.68 + nb.r  * 0.08;
    vec2  velocity = adv.gb * 0.80 + nb.gb * 0.05;

    // 3. decay (slower decay so fluid lingers and glides naturally)
    density  *= pow(max(uDensityDecay, 0.985), uDt);
    velocity *= pow(max(uVelocityDecay, 0.98), uDt);

    // 4. gentler ambient swirl for calmer water currents
    velocity += curl(vUv * 2.5 + uTime * 0.08) * 0.0004 * density * uDt;

    // 5. pointer splat (softer, delayed momentum transfer)
    vec2 A   = vec2(uAspect, 1.0);
    vec2 seg = uPointer - uPrevPointer;
    float segLen = length(seg);

    if (segLen > 0.0002) {
      vec2 a  = uPrevPointer * A;
      vec2 b  = uPointer * A;
      vec2 p  = vUv * A;
      vec2 ab = b - a;
      float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
      float dist = length(p - (a + ab * t));

      float falloff  = exp(-(dist * dist) / (uRadius * uRadius * 1.2)); // wider spread
      float strength = clamp(segLen * 14.0, 0.1, 0.7); // softer peak

      density  += falloff * strength * 0.35;
      velocity += seg * falloff * 0.55; // reduced push speed
    }

    density = min(density, 1.3);
    float vLen = length(velocity);
    if (vLen > 0.02) velocity *= 0.02 / vLen; // lower velocity cap for calm flow

    gl_FragColor = vec4(density, velocity, 1.0);
  }
`;

/**
 * Display pass.
 * Unchanged structurally, keeping the clean refractive lens aesthetic.
 */
export const displayFragmentShader = /* glsl */ `
  uniform sampler2D uFluid;
  uniform sampler2D uTopTexture;
  uniform sampler2D uBottomTexture;
  uniform vec2  uResolution;
  uniform vec2  uTopTextureSize;
  uniform vec2  uBottomTextureSize;
  uniform vec2  uTexel;
  uniform vec2  uPointer;
  uniform float uTime;
  uniform float uIntro;

  varying vec2 vUv;

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

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p  = p * 2.1 + 17.0;
      a *= 0.5;
    }
    return v;
  }

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

    // ── fluid state ──
    vec4  f = texture2D(uFluid, vUv);
    float d = f.r;
    vec2  v = f.gb;

    float dl = texture2D(uFluid, vUv - vec2(uTexel.x, 0.0)).r;
    float dr = texture2D(uFluid, vUv + vec2(uTexel.x, 0.0)).r;
    float db = texture2D(uFluid, vUv - vec2(0.0, uTexel.y)).r;
    float dt = texture2D(uFluid, vUv + vec2(0.0, uTexel.y)).r;
    vec2 grad = vec2(dr - dl, dt - db);

    // ── organic reveal mask ──
    float n     = fbm(vUv * A * 3.2 + uTime * 0.05);
    float field = d + (n - 0.5) * 0.2 * smoothstep(0.0, 0.25, d);
    float reveal = smoothstep(0.16, 0.56, field);

    // ── refraction ──
    vec2 refr = grad * 0.35 + v * 0.6;
    vec2 par  = (uPointer - 0.5) * 0.012;

    vec2 topUV = coverUV(vUv + refr * 0.5 + par, uTopTextureSize);
    vec2 botUV = coverUV(vUv - refr - par * 1.5, uBottomTextureSize);

    vec3 top = texture2D(uTopTexture, topUV).rgb;

    vec3 bottom = vec3(
      texture2D(uBottomTexture, botUV + refr * 0.12).r,
      texture2D(uBottomTexture, botUV).g,
      texture2D(uBottomTexture, botUV - refr * 0.12).b
    );

    vec3 col = mix(top, bottom, reveal);

    vec3  N    = normalize(vec3(-grad * 14.0, 1.0));
    vec3  L    = normalize(vec3(0.4, 0.5, 0.8));
    float spec = pow(max(dot(N, L), 0.0), 48.0) * smoothstep(0.02, 0.3, d);

    col += spec * 0.45;

    float vig = smoothstep(1.15, 0.35, length(vUv - 0.5));
    col *= mix(0.82, 1.0, vig);
    col += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.018;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0) * uIntro, 1.0);
  }
`;