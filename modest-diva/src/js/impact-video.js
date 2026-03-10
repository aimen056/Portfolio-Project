// Scene Setup
const container = document.getElementById('video-box');
const canvas = document.querySelector('#video-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
camera.position.z = 15;

// Handle Resizing
window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
});

// Groups for each 3D coded scene
const hookGroup = new THREE.Group();
const yearsGroup = new THREE.Group();
const projectsGroup = new THREE.Group();

hookGroup.visible = false;
yearsGroup.visible = false;
projectsGroup.visible = false;

scene.add(hookGroup, yearsGroup, projectsGroup);

// --- 1. Hook Group (Massive Sphere + Nodes) ---
const hookSphereGeo = new THREE.IcosahedronGeometry(7, 3);
const hookMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0 });
const hookSphere = new THREE.Mesh(hookSphereGeo, hookMat);
hookGroup.add(hookSphere);

const nodesMat = new THREE.PointsMaterial({ color: 0xFCFAFA, size: 0.1, transparent: true, opacity: 0 });
const hookNodes = new THREE.Points(hookSphereGeo, nodesMat);
hookGroup.add(hookNodes);
hookGroup.position.set(6, 0, -2); // Placed prominently on the right half

// --- 2. Years Group (Chart Display) ---
const chartBars = [];
const chartMat = new THREE.MeshPhongMaterial({ color: 0xD4AF37, transparent: true, opacity: 0 });
const yearsAmbient = new THREE.AmbientLight(0xffffff, 0.5);
const yearsDir = new THREE.DirectionalLight(0xffffff, 1);
yearsDir.position.set(5, 5, 5);
yearsGroup.add(yearsAmbient, yearsDir);

for (let i = 0; i < 5; i++) {
    const barGeo = new THREE.BoxGeometry(0.8, 1, 0.8);
    barGeo.translate(0, 0.5, 0);
    const bar = new THREE.Mesh(barGeo, chartMat);
    bar.position.set(-2.5 + i * 1.2, -2, 0);
    bar.scale.y = 0.01;
    yearsGroup.add(bar);
    chartBars.push(bar);
}
yearsGroup.position.set(-6, -1, 0); // Placed on the left half

// --- 3. Projects Group (Data Cubes) ---
const cubes = [];
const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const cubeMat = new THREE.MeshPhongMaterial({ color: 0xD4AF37, transparent: true, opacity: 0 });
const projectsAmbient = new THREE.AmbientLight(0xffffff, 0.5);
const projectsDir = new THREE.DirectionalLight(0xffffff, 1);
projectsDir.position.set(5, 5, 5);
projectsGroup.add(projectsAmbient, projectsDir);

for (let x = -4; x <= 4; x++) {
    for (let z = -4; z <= 4; z++) {
        if (Math.random() > 0.3) {
            const cube = new THREE.Mesh(cubeGeo, cubeMat);
            cube.position.set(x * 1, 0, z * 1);
            cube.userData.offset = Math.random() * Math.PI * 2;
            projectsGroup.add(cube);
            cubes.push(cube);
        }
    }
}
projectsGroup.rotation.x = Math.PI / 4;
projectsGroup.rotation.y = Math.PI / 4;
projectsGroup.position.set(-5, -2, -2); // Left side

// --- 4. System Group (Powerful Growth Systems) ---
const systemGroup = new THREE.Group();
systemGroup.visible = false;
scene.add(systemGroup);

// Create a glowing central core
const coreGeo = new THREE.IcosahedronGeometry(1.2, 0); // Slightly larger
const coreMat = new THREE.MeshPhongMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0 });
const coreMesh = new THREE.Mesh(coreGeo, coreMat);
systemGroup.add(coreMesh);

// Add orbiting rings
const orbitMat = new THREE.MeshBasicMaterial({ color: 0xFCFAFA, transparent: true, opacity: 0, side: THREE.DoubleSide });
const orbitRings = [];
for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.RingGeometry(1.5 + i * 0.5, 1.55 + i * 0.5, 64);
    const ring = new THREE.Mesh(ringGeo, orbitMat);
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    systemGroup.add(ring);
    orbitRings.push(ring);
}

const systemAmbient = new THREE.AmbientLight(0xffffff, 0.5);
const systemDir = new THREE.DirectionalLight(0xffffff, 1);
systemDir.position.set(5, 5, 5);
systemGroup.add(systemAmbient, systemDir);

systemGroup.position.set(-5, -0.5, 2); // Perfectly positioned over the handshake image area

// --- Animation Loop ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    if (hookGroup.visible) {
        hookGroup.rotation.y = time * 0.05;
        hookGroup.rotation.x = time * 0.02;
        nodesMat.size = 0.05 + Math.sin(time * 3) * 0.03;
    }

    if (yearsGroup.visible) {
        yearsGroup.rotation.y = Math.sin(time * 0.5) * 0.1;
    }

    if (projectsGroup.visible) {
        cubes.forEach(c => {
            c.position.y = Math.sin(time * 3 + c.userData.offset) * 0.5;
        });
        projectsGroup.rotation.y = time * 0.2;
    }

    if (systemGroup.visible) {
        systemGroup.rotation.y = time * 0.2;
        systemGroup.rotation.x = time * 0.1;
        orbitRings.forEach((r, i) => {
            r.rotation.z = time * (0.5 + i * 0.2);
        });
    }

    renderer.render(scene, camera);
}
animate();


// --- GSAP Timeline Orchestration ---
const tl = gsap.timeline({
    paused: true,
    repeat: -1 // Loop infinitely
});

// Resets
gsap.set('.scene', { autoAlpha: 0 });
gsap.set('.bg-image', { opacity: 0, scale: 1 });
gsap.set('.hook-line1, .hook-line2', { y: 20 });
gsap.set('.stat-large', { y: 30, scale: 0.9 });
gsap.set('.global-word, .global-sub', { y: 20 });
gsap.set('.strategy-text, .pull-quote', { autoAlpha: 0 });
gsap.set('.map-pulse', { scale: 0, opacity: 0 });
gsap.set('.map-ring', { scale: 0, opacity: 0 });

// SCENE 1: Logo
tl.to('#scene-logo', { autoAlpha: 1, duration: 0.1 })
    .to('#intro-logo', { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' })
    .to('#scene-logo', { autoAlpha: 0, duration: 0.3 }, "+=0.3");

// SCENE 2: Hook (Massive Half-Screen Sphere)
tl.addLabel("sceneHookStart")
    .call(() => { hookGroup.visible = true; }, null, "sceneHookStart")
    .to('#scene-hook', { autoAlpha: 1, duration: 0.1 }, "sceneHookStart")
    .to([hookMat, nodesMat], { opacity: 0.3, duration: 0.6 }, "sceneHookStart+=0.1")
    .to('.hook-line1', { autoAlpha: 1, y: 0, duration: 0.5 }, "sceneHookStart+=0.3")
    .to('.hook-line2', { autoAlpha: 1, y: 0, duration: 0.5 }, "sceneHookStart+=0.5")
    .addLabel("sceneHookEnd", "sceneHookStart+=2.0")
    .to([hookMat, nodesMat], { opacity: 0, duration: 0.3 }, "sceneHookEnd")
    .to('#scene-hook', { autoAlpha: 0, duration: 0.3 }, "sceneHookEnd")
    .call(() => { hookGroup.visible = false; });

// SCENE 3: 5+ Years (Chart Display)
tl.addLabel("sceneYearsStart")
    .call(() => { yearsGroup.visible = true; }, null, "sceneYearsStart")
    .to('#scene-years', { autoAlpha: 1, duration: 0.1 }, "sceneYearsStart")
    .to(chartMat, { opacity: 0.9, duration: 0.5 }, "sceneYearsStart+=0.1");

chartBars.forEach((b, i) => {
    tl.to(b.scale, {
        y: 1 + i * 0.6 + Math.random(),
        duration: 0.6,
        ease: "power2.out"
    }, `sceneYearsStart+=${0.2 + i * 0.1}`);
});

tl.to('#scene-years .stat-large', { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' }, "sceneYearsStart+=0.6")
    .addLabel("sceneYearsEnd", "sceneYearsStart+=2.2")
    .to(chartMat, { opacity: 0, duration: 0.3 }, "sceneYearsEnd")
    .to('#scene-years', { autoAlpha: 0, duration: 0.3 }, "sceneYearsEnd")
    .call(() => { yearsGroup.visible = false; });

// SCENE 4: Projects (Data Cubes)
tl.addLabel("sceneProjectsStart")
    .call(() => { projectsGroup.visible = true; }, null, "sceneProjectsStart")
    .to('#scene-projects', { autoAlpha: 1, duration: 0.1 }, "sceneProjectsStart")
    .to(cubeMat, { opacity: 0.5, duration: 0.5 }, "sceneProjectsStart+=0.1")
    .to('#scene-projects .stat-large', { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' }, "sceneProjectsStart+=0.5")
    .addLabel("sceneProjectsEnd", "sceneProjectsStart+=2.2")
    .to(cubeMat, { opacity: 0, duration: 0.3 }, "sceneProjectsEnd")
    .to('#scene-projects', { autoAlpha: 0, duration: 0.3 }, "sceneProjectsEnd")
    .call(() => { projectsGroup.visible = false; });

// SCENE 5: Female Team (Cinematic Parallax)
tl.addLabel("sceneFemaleStart")
    .to('#scene-female', { autoAlpha: 1, duration: 0.5 }, "sceneFemaleStart")
    .to('#female-3d-container', { backgroundSize: "85%", duration: 2.2, ease: "none" }, "sceneFemaleStart")
    .to('#scene-female .stat-large', { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' }, "sceneFemaleStart+=0.5")
    .addLabel("sceneFemaleEnd", "sceneFemaleStart+=2.2")
    .to('#scene-female', { autoAlpha: 0, duration: 0.3 }, "sceneFemaleEnd");

// SCENE 6: Global (Map Image + Pakistan Pulse)
tl.addLabel("sceneGlobalStart")
    .to('#bg-map', { opacity: 1, duration: 0.5 }, "sceneGlobalStart")
    .to('#bg-map', { scale: 1.05, duration: 2.2, ease: "none" }, "sceneGlobalStart")
    .to('#scene-global', { autoAlpha: 1, duration: 0.1 }, "sceneGlobalStart")
    .to('.map-pulse', { opacity: 1, scale: 1, duration: 0.2 }, "sceneGlobalStart+=0.5")
    .to('.map-ring', { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", repeat: 1, yoyo: true }, "sceneGlobalStart+=0.5")
    .to('.global-word', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, "sceneGlobalStart+=0.5")
    .to('.global-sub', { autoAlpha: 1, y: 0, duration: 0.6 }, "sceneGlobalStart+=0.8")
    .addLabel("sceneGlobalEnd", "sceneGlobalStart+=2.2")
    .to('#bg-map', { opacity: 0, duration: 0.3 }, "sceneGlobalEnd")
    .to('#scene-global', { autoAlpha: 0, duration: 0.3 }, "sceneGlobalEnd");

// SCENE 7: Closer (Powerful Growth Systems)
tl.addLabel("sceneCloserStart")
    .call(() => { systemGroup.visible = true; }, null, "sceneCloserStart")
    .to('#scene-closer', { autoAlpha: 1, duration: 0.1 }, "sceneCloserStart")
    .to(coreMat, { opacity: 0.9, duration: 0.5 }, "sceneCloserStart+=0.1")
    .to(orbitMat, { opacity: 0.4, duration: 0.5 }, "sceneCloserStart+=0.1")
    .to('#strat-ai', { autoAlpha: 1, duration: 0.6 }, "sceneCloserStart+=0.6")
    .to('.quote-p1', { autoAlpha: 1, duration: 0.6 }, "sceneCloserStart+=1.0")
    .to('.quote-p2', { autoAlpha: 1, duration: 0.6 }, "sceneCloserStart+=1.4")
    .addLabel("sceneCloserEnd", "sceneCloserStart+=3.2")
    .to([coreMat, orbitMat], { opacity: 0, duration: 0.5 }, "sceneCloserEnd")
    .to('#scene-closer', { autoAlpha: 0, duration: 0.5 }, "sceneCloserEnd")
    .call(() => { systemGroup.visible = false; });

let hasPlayed = false;
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !hasPlayed) {
        hasPlayed = true;
        setTimeout(() => tl.play(), 500);
    }
}, { threshold: 0.2 });

observer.observe(document.getElementById('video-box'));


