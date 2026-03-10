varying vec2 vUv;
uniform float u_time;
uniform vec2 u_mouse;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 a0 = x - floor(x + 0.5);
  vec3 m0 = m * ( 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h ) );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m0, g);
}

void main() {
    vec2 st = vUv;
    
    // Animate noise
    float n = snoise(st * 3.0 + u_time * 0.1);
    float n2 = snoise(st * 6.0 - u_time * 0.05);
    
    // Silk highlight logic
    float brightness = smoothstep(-1.0, 1.0, n + n2);
    
    // Color Palette
    vec3 baseColor = vec3(0.98, 0.99, 0.94); // Coconut Milk
    vec3 highlightColor = vec3(1.0, 1.0, 1.0); // Pure white highlight
    vec3 goldColor = vec3(0.83, 0.68, 0.21); // Subtle gold
    
    vec3 color = mix(baseColor, highlightColor, brightness * 0.3);
    color = mix(color, goldColor, brightness * 0.05);
    
    // Add very subtle grain
    float grain = fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
    color += grain * 0.02;

    gl_FragColor = vec4(color, 1.0);
}
