const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fluidFragmentShader = `
  uniform sampler2D uPrevTrails;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform vec2 uResolution;
  uniform float uDecay;
  uniform bool uIsMoving;

  varying vec2 vUv;

  void main() {
    vec4 prevState = texture2D(uPrevTrails, vUv);
    float decayedPrev = prevState.r * uDecay;
    float newValue = decayedPrev;

    if (uIsMoving) {
      vec2 mouseDirection = uMouse - uPrevMouse;
      float lineLength = length(mouseDirection);

      if (lineLength > 0.001) {
        vec2 mouseDir = mouseDirection / lineLength;
        vec2 toPixel = vUv - uPrevMouse;
        float projAlong = dot(toPixel, mouseDir);
        projAlong = clamp(projAlong, 0.0, lineLength);

        vec2 closestPoint = uPrevMouse + projAlong * mouseDir;
        float dist = length(vUv - closestPoint);
        float lineWidth = 0.08;
        float intensity = smoothstep(lineWidth, 0.0, dist) * 0.8;

        newValue = max(intensity, decayedPrev);
      }
    }

    gl_FragColor = vec4(newValue, 0.0, 0.0, 1.0);
  }
`;

const displayFragmentShader = `
  uniform sampler2D uFluid;
  uniform sampler2D uTopTexture;
  uniform sampler2D uBottomTexture;
  uniform vec2 uResolution;
  uniform vec2 uTopTextureSize;
  uniform vec2 uBottomTextureSize;
  uniform float uTime;           // ← ADD THIS uniform (update in loop: performance.now() * 0.001)

  varying vec2 vUv;

  // Cleaner noise (your original is fine, but we use it more sparingly)
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i + vec2(0.0), vec2(12.9898, 78.233))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    return mix(mix(a, b, f.x), mix(c, d, f.y), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp   = 0.5;
    for (int i = 0; i < 3; i++) {   // reduced octaves → cleaner
      value += amp * noise(p);
      p *= 2.3;
      amp *= 0.45;
    }
    return value;
  }

  vec2 getCoverUV(vec2 uv, vec2 texSize) {
    if (texSize.x < 1.0 || texSize.y < 1.0) return uv;
    vec2 s = uResolution / texSize;
    float scale = max(s.x, s.y);
    vec2 scaled = texSize * scale;
    vec2 offset = (uResolution - scaled) * 0.5;
    return (uv * uResolution - offset) / scaled;
  }

  void main() {
    float fluid = texture2D(uFluid, vUv).r;

    vec2 topUV    = getCoverUV(vUv, uTopTextureSize);
    vec2 bottomUV = getCoverUV(vUv, uBottomTextureSize);

    vec4 topColor    = texture2D(uTopTexture, topUV);
    vec4 bottomColor = texture2D(uBottomTexture, bottomUV);

    // ─── Smoother reveal with gentle organic edge ───
    float baseReveal = smoothstep(0.10, 0.62, fluid);
    float edgeNoise  = fbm(vUv * 3.2 + uTime * 0.08) * 0.12;
    float reveal     = smoothstep(0.0, 1.0, baseReveal + edgeNoise - 0.08);

    // ─── Core + trail energy (softer, more glassy/ethereal) ───
    float distToCenter = length(vUv - 1.5);
    float pulse      = 5.0 + sin(uTime * 2.4 + distToCenter * 14.0) * 0.07; // subtle breathing

    float core       = smoothstep(0.24, 0.06, fluid) * pulse * 1.35;
    float trail      = smoothstep(0.58, 0.12, fluid) * 0.95;

    // Light organic trail distortion (less aggressive than original)
    vec2 trailFlow   = vec2(
      sin(fluid * 136.0 + uTime * 0.6 + vUv.y * 4.0),
      cos(fluid * 15.0 - uTime * 0.5 + vUv.x * 5.0)
    ) * 0.018 * trail;

    float subtleNoise = fbm(vUv * 1.5 + trailFlow + uTime * 0.1) * trail * 1.45;

    float energy     = core * 1.3 + trail * 0.85 + subtleNoise * 0.5;

    // ─── Glow color: silvery cyan → soft violet (premium feel) ───
    vec3 glowColor = mix(
     vec3(0.85, 1.96, 1.15),     // bright silver-cyan core
      vec3(1.65, 1.45, 0.05),     // gentle violet trail
      trail * 0.6 + subtleNoise * 0.4
    );

    // ─── Radial + intensity falloff ───
    float radial     = exp(-distToCenter * 15.8) * (0.8 + pulse * 0.2); 
    float opacity    = energy * radial * reveal;

    // ─── Final composition ───
    vec4 finalColor = mix(topColor, bottomColor, reveal);

    // Additive glow only – tuned lower for cleanliness
    finalColor.rgb += glowColor * opacity * 1.9;

    // Optional subtle chromatic breathing on edges (luxury touch)
    float chromAmt = smoothstep(0.45, 0.05, fluid) * 0.018 * (sin(uTime * 1.6)*0.4 + 0.6);
    finalColor.r += texture2D(uTopTexture, topUV + vec2(chromAmt, 0.0)).r * chromAmt * 1.5;
    finalColor.b += texture2D(uTopTexture, topUV - vec2(chromAmt*0.7, 0.0)).b * chromAmt * 1.5;

    gl_FragColor = finalColor;
  }
`;

export {vertexShader,fluidFragmentShader,displayFragmentShader}