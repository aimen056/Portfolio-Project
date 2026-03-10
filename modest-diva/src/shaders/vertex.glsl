varying vec2 vUv;
uniform float u_time;
uniform vec2 u_mouse;

void main() {
    vUv = uv;
    vec3 pos = position;

    // Subtle wave based on time and UV
    float wave = sin(pos.x * 1.5 + u_time * 0.5) * 0.1;
    wave += cos(pos.y * 2.0 + u_time * 0.3) * 0.05;

    // Mouse influence
    float dist = distance(vUv, (u_mouse + 1.0) * 0.5);
    float mouseInfluence = smoothstep(0.4, 0.0, dist) * 0.15;
    
    pos.z += wave + mouseInfluence;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
