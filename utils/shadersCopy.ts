export const vertexShader = `varying vec2 vUv2;
void main(){

vUv = uv;
gl_position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}`

export const fluidFragmentShader = `
uniform sampler2D uPreview;
uniform vec2 uPointer;
uniform vec2 uPreviewPointer;
unifor vec2 uTexel;
uniform float uRadius


float vnoise(vex2 p){
vec2 i = floor(p);
vec2 f = fract(p);
}

  vec2 curl(vec2 p) {
    float e  = 0.02; // Small offset delta for derivative calculation
    float n1 = vnoise(p + vec2(0.0, e));
    float n2 = vnoise(p - vec2(0.0, e));
    float n3 = vnoise(p + vec2(e, 0.0));
    float n4 = vnoise(p - vec2(e, 0.0));
    return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
  }


`
