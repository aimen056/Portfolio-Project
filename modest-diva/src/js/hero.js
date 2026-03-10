class HeroShader {
    constructor() {
        this.canvas = document.getElementById('hero-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);
        this.time = 0;

        this.init();
    }

    getVertexShader() {
        return `
            varying vec2 vUv;
            uniform float u_time;
            uniform vec2 u_mouse;

            void main() {
                vUv = uv;
                vec3 pos = position;

                // High-speed base liquid movement
                float wave = sin(pos.x * 2.5 + u_time * 0.8) * 0.15;
                wave += cos(pos.y * 3.0 + u_time * 0.6) * 0.1;

                // Interactive ripple (Stronger and more liquid-like)
                float dist = distance(vUv, (u_mouse + 1.0) * 0.5);
                float ripple = sin(dist * 15.0 - u_time * 2.0) * 0.08;
                float mouseArea = smoothstep(0.5, 0.0, dist);
                
                pos.z += wave + (ripple * mouseArea);

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
    }

    getFragmentShader() {
        return `
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
                
                // Fast-moving noise for liquid metal surface
                float n = snoise(st * 4.0 + u_time * 0.4);
                float n2 = snoise(st * 8.0 - u_time * 0.25);
                
                float combinedNoise = (n + n2) * 0.5;
                
                // Chrome Gold Palette (Ultra-Light Luminous Gold)
                vec3 shadowColor = vec3(0.85, 0.75, 0.5); // Very Light Bronze
                vec3 midColor = vec3(1.0, 0.95, 0.7);    // Pale Bright Gold
                vec3 highlightColor = vec3(1.0, 1.0, 1.0); // Pure White Peak
                
                // Specular-like highlights
                float sheen = smoothstep(0.1, 0.5, combinedNoise);
                float spec = pow(combinedNoise * 0.5 + 0.5, 8.0); // Sharp chrome-like shine
                
                vec3 color = mix(shadowColor, midColor, combinedNoise * 0.5 + 0.5);
                color = mix(color, highlightColor, sheen * 0.45);
                color += spec * 0.4; // Controlled metallic luster
                
                // Fine grain
                float grain = fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
                color += grain * 0.03;

                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    async init() {
        const vertex = this.getVertexShader();
        const fragment = this.getFragmentShader();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Use a larger plane to ensure no edges are visible during ripples
        this.geometry = new THREE.PlaneGeometry(5, 3, 128, 128);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_mouse: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: vertex,
            fragmentShader: fragment,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        this.camera.position.z = 1.0;

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.animate();
        this.revealText();
    }

    onMouseMove(e) {
        // Normalize mouse to -1 to 1
        this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    revealText() {
        const tl = gsap.timeline({ delay: 0.5 });
        tl.to('#hero-eyebrow', { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" })
            .to('#hero-title', { opacity: 1, y: 0, duration: 1.2, ease: "power4.out" }, "-=0.8")
            .to('#hero-subtitle', { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, "-=0.8");
    }

    animate() {
        this.time += 0.025; // Slightly reduced speed (was 0.035)

        // Smooth mouse movement
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.08;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.08;

        if (this.material) {
            this.material.uniforms.u_time.value = this.time;
            this.material.uniforms.u_mouse.value.set(this.mouse.x, this.mouse.y);
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HeroShader();
});
