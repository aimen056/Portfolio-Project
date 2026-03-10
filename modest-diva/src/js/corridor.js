/**
 * corridor.js v3 — "Beyond Business" 3D Walk-Through
 * Fixes: camera-Z zone sync, arc-length path, quote pause,
 *        inscription proximity reveal, torch shadow jitter,
 *        arrival moment, animated monitor, CSS vignette
 */
(function () {
    'use strict';

    /* ═══ ZONES ════════════════════════════════════════════════ */
    const ZONES = [
        {
            name: 'The Village', label: 'origins', side: 'right',
            text: [
                'I grew up in a remote area.',
                'I know what it feels like when the world tells you — <strong>tech, marketing, business — that\'s not for girls like you.</strong>',
                'I know. Because I heard it too. <strong>And then I proved them wrong.</strong>',
            ],
            zRange: [1.0, 0.60]
        },
        {
            name: 'The Decision', label: 'chapter ii', side: 'left',
            text: [
                'Not every woman gets the courage or the opportunity to pack up and move to a big city.',
                'Not everyone has that door opened for them.',
                '<strong>So I decided to build the door myself.</strong>',
            ],
            zRange: [0.60, 0.22]
        },
        {
            name: 'The Team', label: 'chapter iii', side: 'right',
            text: [
                'Here\'s something most people don\'t put on their portfolio: <strong>90% of my agency staff is female.</strong>',
                'That\'s not a coincidence — it\'s a decision.',
                'Women from small towns, remote areas — now managing projects, building brands, and <strong>leading campaigns for international clients.</strong>',
            ],
            zRange: [0.22, -0.18]
        },
        {
            name: 'The Mission', label: 'chapter iv', side: 'left',
            text: [
                'My core mission isn\'t just profit —',
                'it\'s building a system and a culture where women can grow, learn, and work with confidence.',
                '<strong>Where being from a small village isn\'t a limitation — it\'s your superpower.</strong>',
            ],
            zRange: [-0.18, -0.58]
        },
        {
            name: 'The Invitation', label: 'chapter v', side: 'right',
            text: [
                'If you\'ve been told you need a degree, a budget, or &ldquo;connections&rdquo; to succeed in digital marketing —',
                '<strong>let me be the person who tells you: you don\'t.</strong>',
                'You need a plan, a wifi connection, and someone who believes in you <em>before</em> you believe in yourself.',
            ],
            zRange: [-0.58, -1.0]
        },
    ];

    /* ═══ CONSTANTS ═════════════════════════════════════════════ */
    const CL = 90, CW = 9, CH = 7.5, SEGS = 22;

    /* ═══ COLOURS ═══════════════════════════════════════════════ */
    const C = {
        stoneDark: new THREE.Color(0x140e07),
        stoneMid: new THREE.Color(0x261808),
        stoneLight: new THREE.Color(0x3a2510),
        officeBg: new THREE.Color(0xeae3d6),
        officeWall: new THREE.Color(0xf2ede4),
        officeFloor: new THREE.Color(0xcec5b0),
        fogDark: new THREE.Color(0x0e0904),
        fogLight: new THREE.Color(0xc8c0b0),
        amber: new THREE.Color(0xff9820),
        amberDim: new THREE.Color(0xc06010),
        coolWhite: new THREE.Color(0xd8e8ff),
        sunlight: new THREE.Color(0xfff4e0),
        gold: new THREE.Color(0xd4af37),
    };

    /* ═══ STATE ══════════════════════════════════════════════════ */
    let renderer, scene, camera;
    let camCurve, lookCurve;
    let torchSconces = [], shaftMeshes = [], inscriptions = [];
    let wallMeshes = [], floorMeshes = [];
    let ambientLight, officeSpot, rimLight;
    let dustCanvas, dustCtx, particles = [];
    let monitorCtx, monitorTex;
    let vignetteEl, arrivalEl;
    let clock = new THREE.Clock();
    let scrollProg = 0, lastZoneIdx = -1;
    let textRevealTimer = null;

    /* ══════════════════════════════════════════════════════════════
       INIT
    ══════════════════════════════════════════════════════════════ */
    function init() {
        if (!document.getElementById('corridor')) return;
        if (typeof THREE === 'undefined' || typeof gsap === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        injectOverlays();
        buildScene();
        buildCameraPath();
        buildCorridor();
        buildPortfolioIcons(); // Scattering icons 1-6
        buildLighting();
        buildOffice();
        buildDust();
        buildScrollTrigger();
        buildServicesObserver();
        patchPanelHTML();
        animate();
    }

    /* ══════════════════════════════════════════════════════════════
       PORTFOLIO ICONS — 1.png to 6.png scattered in business zone
    ══════════════════════════════════════════════════════════════ */
    function buildPortfolioIcons() {
        const texLoader = new THREE.TextureLoader();
        const iconPaths = [
            '/public/images/1.png', '/public/images/2.png',
            '/public/images/3.png', '/public/images/4.png',
            '/public/images/5.png', '/public/images/6.png'
        ];

        // Place them in the second half of the corridor
        iconPaths.forEach((path, i) => {
            const z = -CL * 0.15 - (i * (CL * 0.05));
            const side = i % 2 === 0 ? 1 : -1;
            const tex = texLoader.load(path);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
            const mesh = mk(new THREE.PlaneGeometry(0.8, 0.8), mat);

            // Randomish jitter
            const x = side * (CW * 0.3 + Math.random() * 1.2);
            const y = 1.2 + Math.random() * 1.0;

            mesh.position.set(x, y, z);
            mesh.rotation.y = Math.random() * 0.4 - 0.2;
            mesh.userData = {
                floating: true,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5
            };
            scene.add(mesh);
        });
    }

    /* ══════════════════════════════════════════════════════════════
       OVERLAYS — vignette + arrival flash (injected via JS)
    ══════════════════════════════════════════════════════════════ */
    function injectOverlays() {
        // CSS vignette layer
        vignetteEl = document.createElement('div');
        vignetteEl.id = 'corridor-vignette';
        vignetteEl.style.cssText = `
            position:absolute;inset:0;z-index:12;pointer-events:none;
            background:radial-gradient(ellipse at 50% 50%,
                transparent 38%, rgba(0,0,0,0.72) 100%);
            transition:opacity 1.2s ease;opacity:1;
        `;
        document.getElementById('corridor-sticky').appendChild(vignetteEl);

        // Arrival flash overlay
        arrivalEl = document.createElement('div');
        arrivalEl.id = 'corridor-arrival';
        arrivalEl.style.cssText = `
            position:absolute;inset:0;z-index:25;pointer-events:none;
            background:rgba(240,234,218,0);
            transition:background 1.4s ease;
        `;
        document.getElementById('corridor-sticky').appendChild(arrivalEl);
    }

    /* ══════════════════════════════════════════════════════════════
       SCENE
    ══════════════════════════════════════════════════════════════ */
    function buildScene() {
        const canvas = document.getElementById('corridor-canvas');
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(C.stoneDark);
        scene.fog = new THREE.FogExp2(C.fogDark.clone(), 0.048);

        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 150);
        window.addEventListener('resize', onResize);
    }

    /* ══════════════════════════════════════════════════════════════
       CAMERA PATH — Arc-length parametrised S-curve
       (getPointAt = equal speed throughout, no fast/slow zones)
    ══════════════════════════════════════════════════════════════ */
    function buildCameraPath() {
        camCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.0, 1.55, CL * 0.5 + 5),
            new THREE.Vector3(0.6, 1.60, CL * 0.34),
            new THREE.Vector3(-0.5, 1.58, CL * 0.18),
            new THREE.Vector3(0.0, 1.55, CL * 0.01), // quote zone centre
            new THREE.Vector3(-0.3, 1.65, -CL * 0.12),
            new THREE.Vector3(0.2, 1.55, -CL * 0.30),
            new THREE.Vector3(0.0, 1.55, -CL * 0.5 + 5.2), // intimately close to the end wall
        ]);
        // Force arc-length (equal distance per t unit)
        camCurve.arcLengthDivisions = 400;
        camCurve.updateArcLengths();

        lookCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.0, 1.55, CL * 0.38),
            new THREE.Vector3(0.4, 1.58, CL * 0.22),
            new THREE.Vector3(-0.4, 1.56, CL * 0.06),
            new THREE.Vector3(0.0, 1.60, -CL * 0.07),
            new THREE.Vector3(-0.2, 1.65, -CL * 0.22),
            new THREE.Vector3(0.2, 1.55, -CL * 0.38),
            new THREE.Vector3(0.0, 1.55, -CL * 0.5 - 2.0), // look directly at mural, far ahead
        ]);
        lookCurve.arcLengthDivisions = 400;
        lookCurve.updateArcLengths();
    }

    /* ══════════════════════════════════════════════════════════════
       CORRIDOR GEOMETRY
    ══════════════════════════════════════════════════════════════ */
    function buildCorridor() {
        const segLen = CL / SEGS;
        const phrases = [
            'She was told no.', 'She built the door.', 'She kept going.',
            'She proved them wrong.', 'She made the path.', 'She led the next one.',
            'She showed up anyway.', 'She rewrote the rules.',
            'She transformed doubt into direction.', 'She never stopped.'
        ];

        for (let i = 0; i < SEGS; i++) {
            const z = CL * 0.5 - i * segLen - segLen * 0.5;
            const norm = i / (SEGS - 1);

            // Walls
            const wMat = mkMat(C.stoneDark, 0.94, 0);
            [-1, 1].forEach(s => {
                const m = mk(new THREE.BoxGeometry(0.22, CH, segLen - 0.1), wMat.clone());
                m.position.set(s * CW * 0.5, CH * 0.5 - 0.4, z);
                m.receiveShadow = true;
                m.userData = { type: 'wall', norm };
                scene.add(m); wallMeshes.push(m);

                // niche
                if (i % 4 === 1 && norm < 0.62) {
                    const n = mk(new THREE.BoxGeometry(0.08, 1.1, 0.5), mkMat(C.stoneDark, 0.98, 0));
                    n.position.set(s * (CW * 0.5 - 0.05), CH * 0.38, z + segLen * 0.1);
                    scene.add(n);
                }
            });

            // Floor
            const fMat = mkMat(C.stoneMid, 0.85, 0);
            const fMesh = mk(new THREE.BoxGeometry(CW, 0.12, segLen - 0.06), fMat);
            fMesh.position.set(0, -0.06, z); fMesh.receiveShadow = true;
            fMesh.userData = { type: 'floor', norm }; scene.add(fMesh); floorMeshes.push(fMesh);

            // Grout
            if (i % 2 === 0) {
                const g = mk(new THREE.BoxGeometry(CW, 0.015, 0.04), mkMat(new THREE.Color(0x080503), 1, 0));
                g.position.set(0, 0, z + segLen * 0.5); scene.add(g);
            }

            // Ceiling
            const cMesh = mk(new THREE.BoxGeometry(CW + 0.44, 0.16, segLen - 0.06), wMat.clone());
            cMesh.position.set(0, CH, z); cMesh.receiveShadow = true;
            cMesh.userData = { type: 'ceil', norm }; scene.add(cMesh); wallMeshes.push(cMesh);

            // Arch ring every 3 segs
            if (i % 3 === 0) buildArch(z, norm);

            // Torch sconce every 3 segs (alternate sides)
            if (i % 3 === 1 && norm < 0.74)
                buildSconce(z, i % 6 < 3 ? -1 : 1, norm);

            // Wall Screens — with icons 1-6 spread through the path
            const iconIndexMap = { 2: 1, 5: 2, 8: 3, 11: 4, 14: 5, 17: 6 };
            if (iconIndexMap[i]) {
                buildInscription(z, i % 2 === 0 ? -1 : 1, '', iconIndexMap[i]);
            }

            // Light shafts transition zone
            if (norm > 0.50 && norm < 0.86 && i % 2 === 0) buildShaft(z, norm);

            // Window glow end zone
            if (norm > 0.73 && i % 2 === 0) buildWinGlow(z, norm);
        }

        buildEndWall();
        buildZoneWallPanels();
    }

    function buildArch(z, norm) {
        const mat = mkMat(lerpCol(C.stoneLight, C.officeWall, norm * norm), 0.95, 0);
        const pGeo = new THREE.BoxGeometry(0.45, CH, 0.45);
        [-1, 1].forEach(s => {
            const p = mk(pGeo.clone(), mat.clone());
            p.position.set(s * (CW * 0.5 + 0.18), CH * 0.5 - 0.4, z);
            p.castShadow = true; scene.add(p);
        });
        const lin = mk(new THREE.BoxGeometry(CW + 0.9, 0.5, 0.45), mat.clone());
        lin.position.set(0, CH + 0.08, z); lin.castShadow = true; scene.add(lin);
    }

    function buildSconce(z, side, norm) {
        const rod = mk(new THREE.CylinderGeometry(0.04, 0.06, 0.55, 6),
            mkMat(new THREE.Color(0x2a1a08), 0.9, 0));
        rod.rotation.z = side * Math.PI * 0.18;
        rod.position.set(side * (CW * 0.5 - 0.18), CH * 0.62, z); scene.add(rod);

        const ember = mk(new THREE.SphereGeometry(0.12, 8, 8),
            new THREE.MeshStandardMaterial({ color: C.amber, emissive: C.amber, emissiveIntensity: 2.5, roughness: 0.3 }));
        ember.position.set(side * (CW * 0.5 - 0.16), CH * 0.62 + 0.32, z); scene.add(ember);

        const light = new THREE.PointLight(C.amber, 0, 12);
        light.position.copy(ember.position);
        light.castShadow = true;
        light.shadow.mapSize.set(256, 256);
        light.shadow.camera.far = 12;
        scene.add(light);

        torchSconces.push({
            ember, light,
            basePos: ember.position.clone(),
            phase: Math.random() * Math.PI * 2,
            side, z
        });
    }

    function buildInscription(z, side, phrase, iconIdx) {
        // Dark backing
        const bk = mk(new THREE.BoxGeometry(0.03, 1.2, 1.8), mkMat(new THREE.Color(0x0a0704), 1, 0));
        bk.position.set(side * (CW * 0.5 - 0.08), 1.75, z);
        bk.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5; scene.add(bk);

        // Gold trim frame
        const tMat = new THREE.MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 0.45, metalness: 0.9, roughness: 0.2 });

        // Vertical trim
        [-0.91, 0.91].forEach(dz => {
            const t = mk(new THREE.BoxGeometry(0.012, 1.25, 0.012), tMat.clone());
            t.position.set(side * (CW * 0.5 - 0.07), 1.75, z + dz);
            scene.add(t);
        });
        // Horizontal trim
        [-0.61, 0.61].forEach(dy => {
            const t = mk(new THREE.BoxGeometry(0.012, 0.012, 1.85), tMat.clone());
            t.position.set(side * (CW * 0.5 - 0.07), 1.75 + dy, z);
            t.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5; scene.add(t);
        });

        // Canvas for Icon
        const cvs = document.createElement('canvas');
        cvs.width = 512; cvs.height = 512;
        const ctx = cvs.getContext('2d');

        const drawPlaceholder = () => {
            ctx.fillStyle = '#110c08';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(256, 256, 180, 0, Math.PI * 2);
            ctx.stroke();
        };
        drawPlaceholder();

        const tex = new THREE.CanvasTexture(cvs);
        const mesh = mk(new THREE.PlaneGeometry(1.6, 1.4),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
        mesh.position.set(side * (CW * 0.5 - 0.06), 1.75, z);
        mesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        scene.add(mesh);

        if (iconIdx) {
            const img = new Image();
            img.src = `images/${iconIdx}.png`; // Try relative path
            img.onload = () => {
                ctx.clearRect(0, 0, 512, 512);
                ctx.fillStyle = '#0a0705';
                ctx.fillRect(0, 0, 512, 512);

                // Gold outer ring
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(256, 256, 210, 0, Math.PI * 2);
                ctx.stroke();

                // Draw Icon
                const aspect = img.width / img.height;
                const h = 260;
                const w = h * aspect;
                ctx.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
                tex.needsUpdate = true;
            };
            img.onerror = () => {
                console.warn(`Failed to load icon ${iconIdx} at ${img.src}`);
                ctx.fillStyle = '#ff0000'; // Red dot to indicate error
                ctx.beginPath(); ctx.arc(256, 256, 20, 0, Math.PI * 2); ctx.fill();
                tex.needsUpdate = true;
            };
        }

        // Store for proximity reveal
        inscriptions.push({ mesh, bk, z, revealed: false });
    }

    function buildShaft(z, norm) {
        const alpha = clamp((norm - 0.50) / 0.36, 0, 1) * 0.07;
        const side = Math.sin(z) > 0 ? 1 : -1;
        const m = mk(new THREE.PlaneGeometry(1.6, CH * 0.85),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.97, 0.88), transparent: true, opacity: alpha, depthWrite: false, side: THREE.DoubleSide }));
        m.position.set(side * CW * 0.28, CH * 0.45, z);
        m.rotation.y = Math.PI * 0.5; m.rotation.z = side * 0.22;
        m.userData = { baseOpacity: alpha }; scene.add(m); shaftMeshes.push(m);
    }

    function buildWinGlow(z, norm) {
        const a = clamp((norm - 0.73) / 0.27, 0, 1) * 0.46;
        const m = mk(new THREE.PlaneGeometry(0.06, CH * 0.55),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.98, 0.92), transparent: true, opacity: a, depthWrite: false }));
        m.position.set(CW * 0.5 - 0.04, CH * 0.42, z); m.rotation.y = -Math.PI * 0.5; scene.add(m);
    }

    function buildEndWall() {
        const ew = mk(new THREE.BoxGeometry(CW + 0.44, CH + 0.6, 0.22),
            mkMat(C.officeWall, 0.55, 0.02));
        ew.position.set(0, CH * 0.5 - 0.15, -CL * 0.5 + 0.12); ew.receiveShadow = true; scene.add(ew);

        // ── Main mural canvas ──────────────────────────────────────────
        const cvs = document.createElement('canvas');
        cvs.width = 1024; cvs.height = 640;
        const ctx = cvs.getContext('2d'); ctx.clearRect(0, 0, 1024, 640);

        // Gold decorative rules
        const grad = ctx.createLinearGradient(0, 0, 1024, 0);
        grad.addColorStop(0, 'rgba(212,175,55,0)');
        grad.addColorStop(0.5, 'rgba(212,175,55,0.55)');
        grad.addColorStop(1, 'rgba(212,175,55,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(60, 58, 904, 2);
        ctx.fillRect(60, 582, 904, 2);

        // Eyebrow label
        ctx.font = '600 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(212,175,55,0.60)';
        ctx.fillText('Z I L  E  H U M A  \u2014  B E Y O N D  B U S I N E S S', 512, 36);

        // Main quote lines
        ctx.font = 'italic bold 52px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(26,16,5,0.90)';
        ctx.fillText('I build doors', 512, 155);
        ctx.fillText('for women who were', 512, 222);
        ctx.fillText('told there were none.', 512, 289);

        // Attribution
        ctx.font = '400 22px Georgia,serif';
        ctx.fillStyle = 'rgba(180,140,40,0.80)';
        ctx.fillText('\u2014 Zil e Huma', 512, 360);

        // Stat band
        const stats = [
            { val: '90%', label: 'Female Staff' },
            { val: '12+', label: 'Countries Reached' },
            { val: '5\u00d7', label: 'Revenue Growth' },
            { val: '100+', label: 'Women Mentored' },
        ];
        const bandY = 468, bW = 200;
        stats.forEach((s, i) => {
            const x = 128 + i * 256;
            ctx.fillStyle = 'rgba(212,175,55,0.10)';
            ctx.beginPath();
            ctx.roundRect(x - bW * 0.5, bandY - 42, bW, 84, 6);
            ctx.fill();
            ctx.strokeStyle = 'rgba(212,175,55,0.22)';
            ctx.lineWidth = 1; ctx.stroke();

            ctx.font = 'bold 30px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(212,175,55,0.95)';
            ctx.fillText(s.val, x, bandY - 10);
            ctx.font = '500 11px monospace';
            ctx.fillStyle = 'rgba(80,55,20,0.65)';
            ctx.fillText(s.label.toUpperCase(), x, bandY + 22);
        });

        const tm = mk(new THREE.PlaneGeometry(6.2, 3.88),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvs), transparent: true, opacity: 0.97, depthWrite: false }));
        tm.position.set(0, CH * 0.5 + 0.3, -CL * 0.5 + 0.25); scene.add(tm);

        // ── Glowing gold floor strip at end wall ─────────────────────
        const glow = mk(new THREE.PlaneGeometry(CW - 0.5, 0.06),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd4af37), transparent: true, opacity: 0.35, depthWrite: false }));
        glow.position.set(0, 0.01, -CL * 0.5 + 0.5);
        glow.rotation.x = -Math.PI * 0.5; scene.add(glow);
        shaftMeshes.push(glow);

        // ── Award medallion plaques (left + right of end wall) ────────
        buildMedalPlaque(-2.8, 'Brand Strategist', '2021\u2013now');
        buildMedalPlaque(2.8, 'Digital Creator', 'Top 1%');
    }

    function buildMedalPlaque(x, title, sub) {
        const endZ = -CL * 0.5 + 1.5;
        const backing = mk(new THREE.BoxGeometry(1.5, 1.9, 0.04),
            mkMat(new THREE.Color(0xe8dfc8), 0.5, 0.1));
        backing.position.set(x, 2.4, endZ); scene.add(backing);

        const rim = mk(new THREE.BoxGeometry(1.56, 1.96, 0.02),
            new THREE.MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 0.18, metalness: 0.9, roughness: 0.3 }));
        rim.position.set(x, 2.4, endZ - 0.04); scene.add(rim);

        const pc = document.createElement('canvas');
        pc.width = 256; pc.height = 320;
        const pctx = pc.getContext('2d');
        pctx.clearRect(0, 0, 256, 320);
        pctx.fillStyle = '#f5f0e4'; pctx.fillRect(0, 0, 256, 320);

        // Medal circle gradient
        const grd = pctx.createRadialGradient(128, 110, 10, 128, 110, 68);
        grd.addColorStop(0, '#ffe98a'); grd.addColorStop(1, '#b8860b');
        pctx.fillStyle = grd;
        pctx.beginPath(); pctx.arc(128, 110, 68, 0, Math.PI * 2); pctx.fill();
        pctx.strokeStyle = '#d4af37'; pctx.lineWidth = 3; pctx.stroke();

        // Star icon inside medal
        pctx.fillStyle = '#fff8dc';
        pctx.font = 'bold 52px serif'; pctx.textAlign = 'center'; pctx.textBaseline = 'middle';
        pctx.fillText('\u2605', 128, 112);

        // Title & sub
        pctx.font = 'bold 18px Georgia,serif'; pctx.textAlign = 'center'; pctx.textBaseline = 'top';
        pctx.fillStyle = '#2a1a08';
        pctx.fillText(title, 128, 196);
        pctx.font = '13px monospace';
        pctx.fillStyle = '#a07830';
        pctx.fillText(sub, 128, 228);

        const pl = mk(new THREE.PlaneGeometry(1.38, 1.74),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pc), transparent: true, opacity: 0.97, depthWrite: false }));
        pl.position.set(x, 2.4, endZ + 0.03); scene.add(pl);
    }

    /* ══════════════════════════════════════════════════════════════
       ZONE WALL ILLUSTRATION PANELS
       One thematic panel per zone on the OPPOSITE wall from the text
    ══════════════════════════════════════════════════════════════ */
    function buildZoneWallPanels() {
        // Each entry: z = midpoint of that zone's zRange, side = opposite of text side
        const panels = [
            {
                zNorm: 0.80,  // midpoint of [1.0, 0.60]
                side: -1,     // left wall (text is right)
                draw(ctx, W, H) {
                    // Origins — Signal Tower / Digital Reach
                    const gold = '#d4af37', dim = 'rgba(212,175,55,0.35)';
                    // Tower base
                    ctx.fillStyle = gold;
                    ctx.fillRect(W / 2 - 6, H * 0.52, 12, H * 0.28);
                    // Tower mid platform
                    ctx.fillRect(W / 2 - 22, H * 0.44, 44, 6);
                    // Tower top
                    ctx.fillRect(W / 2 - 14, H * 0.30, 28, 6);
                    ctx.fillRect(W / 2 - 4, H * 0.18, 8, H * 0.14);
                    // Signal arcs
                    for (let r = 1; r <= 3; r++) {
                        ctx.beginPath();
                        ctx.arc(W / 2, H * 0.22, r * 28, -Math.PI * 0.7, -Math.PI * 0.3);
                        ctx.strokeStyle = `rgba(212,175,55,${0.6 - r * 0.15})`;
                        ctx.lineWidth = 2.5; ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(W / 2, H * 0.22, r * 28, Math.PI * 1.3, Math.PI * 1.7);
                        ctx.stroke();
                    }
                    // Label
                    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(212,175,55,0.80)';
                    ctx.fillText('DIGITAL REACH', W / 2, H * 0.90);
                    ctx.font = '10px monospace';
                    ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.fillText('broadcast · connect · grow', W / 2, H * 0.96);
                }
            },
            {
                zNorm: 0.41,  // midpoint of [0.60, 0.22]
                side: 1,      // right wall (text is left)
                draw(ctx, W, H) {
                    // Decision — Compass Rose / Strategy
                    const cx = W / 2, cy = H * 0.44, R = 70;
                    // Outer ring
                    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
                    // Cardinal points
                    [0, 90, 180, 270].forEach(deg => {
                        const rad = (deg - 90) * Math.PI / 180;
                        ctx.beginPath();
                        ctx.moveTo(cx + Math.cos(rad) * (R - 20), cy + Math.sin(rad) * (R - 20));
                        ctx.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
                        ctx.strokeStyle = 'rgba(212,175,55,0.9)'; ctx.lineWidth = 2; ctx.stroke();
                    });
                    // N arrow
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - R + 22);
                    ctx.lineTo(cx - 9, cy + 10);
                    ctx.lineTo(cx, cy - 10);
                    ctx.closePath();
                    ctx.fillStyle = '#d4af37'; ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - R + 22);
                    ctx.lineTo(cx + 9, cy + 10);
                    ctx.lineTo(cx, cy - 10);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(212,175,55,0.35)'; ctx.fill();
                    // Center dot
                    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#d4af37'; ctx.fill();
                    // Label
                    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(212,175,55,0.80)';
                    ctx.fillText('STRATEGY', W / 2, H * 0.88);
                    ctx.font = '10px monospace';
                    ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.fillText('direction · purpose · plan', W / 2, H * 0.94);
                }
            },
            {
                zNorm: 0.02,  // midpoint of [0.22, -0.18]
                side: -1,     // left wall (text is right)
                draw(ctx, W, H) {
                    // The Team — People silhouettes
                    const gold = '#d4af37';
                    const figures = [
                        { x: W * 0.20, scale: 0.82 },
                        { x: W * 0.50, scale: 1.00 },
                        { x: W * 0.80, scale: 0.82 },
                    ];
                    figures.forEach(({ x, scale }) => {
                        const headR = 14 * scale, bodyH = 38 * scale, bodyW = 22 * scale;
                        const baseY = H * 0.72;
                        ctx.beginPath(); ctx.arc(x, baseY - bodyH - headR - 2, headR, 0, Math.PI * 2);
                        ctx.fillStyle = gold; ctx.globalAlpha = scale * 0.85; ctx.fill();
                        ctx.beginPath();
                        ctx.ellipse(x, baseY - bodyH * 0.5, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
                        ctx.fill(); ctx.globalAlpha = 1;
                    });
                    // Connect arc between them
                    ctx.beginPath();
                    ctx.moveTo(W * 0.20, H * 0.72 - 30);
                    ctx.bezierCurveTo(W * 0.35, H * 0.40, W * 0.65, H * 0.40, W * 0.80, H * 0.72 - 30);
                    ctx.strokeStyle = 'rgba(212,175,55,0.40)'; ctx.lineWidth = 1.5; ctx.stroke();
                    // Stars / sparkles above
                    [[W * 0.50, H * 0.12], [W * 0.30, H * 0.20], [W * 0.70, H * 0.18]].forEach(([sx, sy]) => {
                        ctx.font = '14px serif'; ctx.textAlign = 'center';
                        ctx.fillStyle = 'rgba(212,175,55,0.65)';
                        ctx.fillText('✦', sx, sy);
                    });
                    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(212,175,55,0.80)';
                    ctx.fillText('90% WOMEN LED', W / 2, H * 0.88);
                    ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.fillText('agency · team · leadership', W / 2, H * 0.94);
                }
            },
            {
                zNorm: -0.38, // midpoint of [-0.18, -0.58]
                side: 1,      // right wall (text is left)
                draw(ctx, W, H) {
                    // The Mission — Growth Chart
                    const gold = '#d4af37';
                    const pts = [
                        [W * 0.12, H * 0.72], [W * 0.28, H * 0.60], [W * 0.42, H * 0.52],
                        [W * 0.57, H * 0.38], [W * 0.72, H * 0.28], [W * 0.88, H * 0.14],
                    ];
                    // Area fill
                    ctx.beginPath(); ctx.moveTo(pts[0][0], H * 0.78);
                    pts.forEach(([px, py]) => ctx.lineTo(px, py));
                    ctx.lineTo(pts[pts.length - 1][0], H * 0.78); ctx.closePath();
                    ctx.fillStyle = 'rgba(212,175,55,0.08)'; ctx.fill();
                    // Line
                    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
                    pts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
                    ctx.strokeStyle = gold; ctx.lineWidth = 2.5; ctx.stroke();
                    // Data points
                    pts.forEach(([px, py]) => {
                        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
                        ctx.fillStyle = gold; ctx.fill();
                    });
                    // Axes
                    ctx.strokeStyle = 'rgba(212,175,55,0.20)'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(W * 0.10, H * 0.12); ctx.lineTo(W * 0.10, H * 0.78); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(W * 0.10, H * 0.78); ctx.lineTo(W * 0.92, H * 0.78); ctx.stroke();
                    // Arrow tip
                    ctx.fillStyle = gold;
                    ctx.beginPath(); ctx.moveTo(W * 0.88, H * 0.10); ctx.lineTo(W * 0.83, H * 0.18); ctx.lineTo(W * 0.93, H * 0.18); ctx.closePath(); ctx.fill();
                    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(212,175,55,0.80)'; ctx.fillText('BRAND GROWTH', W / 2, H * 0.91);
                    ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.fillText('results · scale · impact', W / 2, H * 0.97);
                }
            },
            {
                zNorm: -0.79, // midpoint of [-0.58, -1.0]
                side: -1,     // left wall (text is right)
                draw(ctx, W, H) {
                    // The Invitation — Envelope + burst
                    const cx = W / 2, cy = H * 0.42;
                    // Envelope body
                    ctx.fillStyle = 'rgba(212,175,55,0.15)';
                    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(cx - 52, cy - 30, 104, 72, 6);
                    ctx.fill(); ctx.stroke();
                    // Envelope flap (V shape)
                    ctx.beginPath();
                    ctx.moveTo(cx - 52, cy - 30);
                    ctx.lineTo(cx, cy + 6);
                    ctx.lineTo(cx + 52, cy - 30);
                    ctx.strokeStyle = 'rgba(212,175,55,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
                    // Bottom V-seam
                    ctx.beginPath();
                    ctx.moveTo(cx - 52, cy + 42);
                    ctx.lineTo(cx, cy + 8);
                    ctx.lineTo(cx + 52, cy + 42);
                    ctx.stroke();
                    // Sparkle rays emanating from envelope
                    const rays = [[cx, cy - 52], [cx + 58, cy - 20], [cx + 68, cy + 30],
                    [cx - 58, cy - 20], [cx - 68, cy + 30]];
                    rays.forEach(([rx, ry]) => {
                        ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'rgba(212,175,55,0.6)';
                        ctx.fillText('✦', rx, ry);
                    });
                    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
                    ctx.fillStyle = 'rgba(212,175,55,0.80)'; ctx.fillText('YOUR TURN', W / 2, H * 0.88);
                    ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.fillText('learn · grow · lead', W / 2, H * 0.94);
                }
            },
        ];

        const W = 512, H = 320;
        panels.forEach(({ zNorm, side, draw }) => {
            // Convert normalised range-midpoint back to world-Z
            const worldZ = zNorm * CL * 0.5;
            const wallX = side * (CW * 0.5 - 0.08);

            // Canvas
            const cvs = document.createElement('canvas');
            cvs.width = W; cvs.height = H;
            const ctx = cvs.getContext('2d');
            ctx.clearRect(0, 0, W, H);

            // Dark backing
            ctx.fillStyle = 'rgba(8,5,2,0.82)';
            ctx.fillRect(0, 0, W, H);

            // Gold border
            ctx.strokeStyle = 'rgba(212,175,55,0.30)';
            ctx.lineWidth = 2;
            ctx.strokeRect(4, 4, W - 8, H - 8);

            // Draw thematic illustration
            draw(ctx, W, H);

            // 3D plane flush on wall
            const mat = new THREE.MeshBasicMaterial({
                map: new THREE.CanvasTexture(cvs),
                transparent: true, opacity: 0.92, depthWrite: false,
                side: THREE.FrontSide
            });
            const mesh = mk(new THREE.PlaneGeometry(2.4, 1.5), mat);
            mesh.position.set(wallX, 1.8, worldZ);
            mesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
            scene.add(mesh);

            // Subtle point-light glow in front of the panel
            const gl = new THREE.PointLight(new THREE.Color(0.8, 0.65, 0.2), 0.4, 5);
            gl.position.set(wallX + side * (-0.6), 1.8, worldZ);
            scene.add(gl);
        });
    }

    /* ══════════════════════════════════════════════════════════════
       LIGHTING
    ══════════════════════════════════════════════════════════════ */
    function buildLighting() {
        ambientLight = new THREE.AmbientLight(C.amberDim, 0.22); scene.add(ambientLight);

        officeSpot = new THREE.SpotLight(C.sunlight, 0, 35, Math.PI * 0.38, 0.6, 1.2);
        officeSpot.position.set(0, CH - 0.6, -CL * 0.5 + 8);
        officeSpot.target.position.set(0, 0, -CL * 0.5 + 8);
        officeSpot.castShadow = true; officeSpot.shadow.mapSize.set(512, 512);
        scene.add(officeSpot); scene.add(officeSpot.target);

        rimLight = new THREE.DirectionalLight(C.coolWhite, 0);
        rimLight.position.set(0, CH * 0.6, -CL * 0.5 - 5);
        rimLight.target.position.set(0, CH * 0.3, 0);
        scene.add(rimLight); scene.add(rimLight.target);
    }

    /* ══════════════════════════════════════════════════════════════
       OFFICE FURNISHINGS
    ══════════════════════════════════════════════════════════════ */
    function buildOffice() {
        const endZ = -CL * 0.5 + 3;
        const dkMat = mkMat(new THREE.Color(0xd4c4a8), 0.6, 0.05);

        // Desk
        const top = mk(new THREE.BoxGeometry(2.8, 0.07, 1.1), dkMat.clone());
        top.position.set(0.2, 0.78, endZ); top.castShadow = top.receiveShadow = true; scene.add(top);
        [[-1.3, -0.47], [-1.3, 0.47], [1.3, -0.47], [1.3, 0.47]].forEach(([lx, lz]) => {
            const l = mk(new THREE.BoxGeometry(0.06, 0.76, 0.06), dkMat.clone());
            l.position.set(0.2 + lx, 0.4, endZ + lz); l.castShadow = true; scene.add(l);
        });

        // Laptop
        const lap = mk(new THREE.BoxGeometry(0.85, 0.03, 0.55),
            mkMat(new THREE.Color(0x2a2a2a), 0.5, 0.4));
        lap.position.set(0, 0.83, endZ - 0.1); scene.add(lap);

        // Monitor stand + screen
        const stand = mk(new THREE.CylinderGeometry(0.04, 0.12, 0.42, 8),
            mkMat(new THREE.Color(0x1a1a1a), 0.4, 0.6));
        stand.position.set(0.2, 1.0, endZ - 0.05); scene.add(stand);

        const screen = mk(new THREE.BoxGeometry(1.5, 0.95, 0.06),
            mkMat(new THREE.Color(0x1a1a1a), 0.4, 0.6));
        screen.position.set(0.2, 1.73, endZ - 0.05); scene.add(screen);

        // Animated monitor canvas
        const monCvs = document.createElement('canvas');
        monCvs.width = 512; monCvs.height = 320;
        monitorCtx = monCvs.getContext('2d');
        monitorTex = new THREE.CanvasTexture(monCvs);
        const glowMat = new THREE.MeshBasicMaterial({ map: monitorTex, transparent: true, opacity: 0.92 });
        const glow = mk(new THREE.PlaneGeometry(1.38, 0.83), glowMat);
        glow.position.set(0.2, 1.73, endZ - 0.01); scene.add(glow);

        const sLight = new THREE.PointLight(new THREE.Color(0.7, 0.88, 1.0), 0.7, 4);
        sLight.position.set(0.2, 1.73, endZ + 0.35); scene.add(sLight);

        // Plant
        const pot = mk(new THREE.CylinderGeometry(0.14, 0.10, 0.28, 8),
            mkMat(new THREE.Color(0xb0704a), 0.8, 0));
        pot.position.set(-1.1, 0.96, endZ - 0.1); scene.add(pot);
        const soil = mk(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 8),
            mkMat(new THREE.Color(0x2a1a08), 1, 0));
        soil.position.set(-1.1, 1.12, endZ - 0.1); scene.add(soil);
        const lMat = mkMat(new THREE.Color(0x3a6e30), 0.8, 0);
        [[0, 0.4, 0], [-0.15, 0.28, 0.1], [0.14, 0.32, -0.08]].forEach(([lx, ly, lz]) => {
            const lf = mk(new THREE.SphereGeometry(0.16, 7, 6), lMat.clone());
            lf.scale.set(1, 1.4, 1);
            lf.position.set(-1.1 + lx, 1.18 + ly, endZ - 0.1 + lz); scene.add(lf);
        });
    }

    /* ══════════════════════════════════════════════════════════════
       DUST PARTICLES
    ══════════════════════════════════════════════════════════════ */
    function buildDust() {
        dustCanvas = document.getElementById('corridor-dust');
        if (!dustCanvas) return;
        dustCanvas.width = window.innerWidth; dustCanvas.height = window.innerHeight;
        dustCtx = dustCanvas.getContext('2d');
        for (let i = 0; i < 70; i++) particles.push({
            x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
            r: Math.random() * 1.5 + 0.3,
            vx: (Math.random() - 0.5) * 0.22, vy: -(Math.random() * 0.35 + 0.06),
            alpha: Math.random() * 0.45 + 0.08,
            type: Math.random() < 0.6 ? 'amber' : 'white',
            phase: Math.random() * Math.PI * 2
        });
    }

    function animateDust(t, elapsed) {
        if (!dustCtx) return;
        dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
        const stoneA = clamp(1 - t * 2.2, 0, 1), officeA = clamp((t - 0.55) / 0.3, 0, 1);
        particles.forEach(p => {
            p.x += p.vx + Math.sin(elapsed * 0.7 + p.phase) * 0.04; p.y += p.vy;
            if (p.y < -6) { p.y = dustCanvas.height + 6; p.x = Math.random() * dustCanvas.width; }
            const op = p.type === 'amber' ? stoneA : officeA;
            dustCtx.globalAlpha = op;
            dustCtx.beginPath();
            dustCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            dustCtx.fillStyle = p.type === 'amber' ? `rgba(212,150,40,${p.alpha})` : `rgba(230,230,240,${p.alpha * 0.7})`;
            dustCtx.fill();
        });
        dustCtx.globalAlpha = 1;
    }

    /* ══════════════════════════════════════════════════════════════
       ANIMATED MONITOR SCREEN — marketing dashboard
    ══════════════════════════════════════════════════════════════ */
    const barTargets = [0.82, 0.65, 0.91, 0.74, 0.55, 0.88];
    let barHeights = [0, 0, 0, 0, 0, 0];
    let monitorTick = 0;

    function updateMonitor(elapsed) {
        if (!monitorCtx) return;
        const ctx = monitorCtx;
        ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, 512, 320);

        // Header bar
        ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, 512, 28);
        ctx.fillStyle = 'rgba(212,175,55,0.9)';
        ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
        ctx.fillText('▸  analytics.dashboard  —  live', 10, 18);

        // Animated bar chart
        const barW = 38, gap = 12, startX = 30, baseY = 220;
        const labels = ['Reach', 'Clicks', 'Conv.', 'SEO', 'Email', 'Social'];
        barTargets.forEach((t, i) => {
            barHeights[i] += (t - barHeights[i]) * 0.04;
            const h = barHeights[i] * 130;
            const x = startX + i * (barW + gap);
            const grd = ctx.createLinearGradient(x, baseY - h, x, baseY);
            grd.addColorStop(0, 'rgba(212,175,55,0.9)');
            grd.addColorStop(1, 'rgba(212,175,55,0.2)');
            ctx.fillStyle = grd;
            ctx.fillRect(x, baseY - h, barW, h);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '9px monospace'; ctx.textAlign = 'center';
            ctx.fillText(labels[i], x + barW * 0.5, baseY + 14);
            ctx.fillStyle = 'rgba(212,175,55,0.85)';
            ctx.fillText(Math.round(barHeights[i] * 100) + '%', x + barW * 0.5, baseY - h - 6);
        });

        // Pulsing KPI
        monitorTick += 0.04;
        const kpiAlpha = 0.5 + Math.sin(monitorTick) * 0.5;
        ctx.fillStyle = `rgba(80,220,120,${0.6 + kpiAlpha * 0.35})`;
        ctx.font = 'bold 13px monospace'; ctx.textAlign = 'right';
        ctx.fillText('● LIVE', 500, 18);

        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(30, 240, 450, 1);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`Clients: 12 active  |  Revenue: +${(28 + Math.sin(monitorTick) * 3).toFixed(1)}%  |  Uptime: 99.9%`, 30, 270);

        if (monitorTex) monitorTex.needsUpdate = true;
    }

    /* ══════════════════════════════════════════════════════════════
       SCROLL TRIGGER
    ══════════════════════════════════════════════════════════════ */
    function buildScrollTrigger() {
        ScrollTrigger.create({
            trigger: '#corridor', start: 'top top', end: 'bottom bottom',
            scrub: 1.8,
            onUpdate(self) {
                // Quote pause: t 0.46–0.54 gets squished to very slow movement
                scrollProg = pauseEase(self.progress);
                updateCorridor(scrollProg, self.progress);
            },
            onEnter() {
                toggleHint(false);
                // Fade in the label centered
                const lbl = document.getElementById('corridor-label');
                if (lbl) lbl.classList.add('is-visible');
            },
            onLeaveBack() {
                toggleHint(true);
                // Reset label to centered when scrolled back above
                const lbl = document.getElementById('corridor-label');
                if (lbl) { lbl.classList.remove('is-corner'); lbl.classList.remove('is-visible'); }
            }
        });
    }

    // Ease function that creates a near-pause around the midpoint (quote moment)
    function pauseEase(t) {
        if (t < 0.43) return t * 0.98;
        if (t < 0.57) return 0.4214 + (t - 0.43) * 0.12; // very slow here
        // We need to cover the remaining distance to 1.0 in the remaining 0.43 of t
        return 0.4382 + (t - 0.57) * (0.5618 / 0.43);
    }

    /* ══════════════════════════════════════════════════════════════
       MASTER UPDATE
    ══════════════════════════════════════════════════════════════ */
    function updateCorridor(t, rawT) {
        // Progress bar tracks raw scroll
        const bar = document.getElementById('corridor-progress');
        if (bar) bar.style.width = (rawT * 100).toFixed(1) + '%';

        // ── Label: centered → corner transition driven by scroll ──
        const lbl = document.getElementById('corridor-label');
        if (lbl) {
            if (t > 0.98) {
                lbl.style.display = 'none';
            } else {
                lbl.style.display = 'flex';
                if (t > 0.06) {
                    lbl.classList.add('is-corner');
                } else {
                    lbl.classList.remove('is-corner');
                }
            }
        }

        // Scene colour
        scene.background.copy(lerpCol(C.stoneDark, C.officeBg, easeIO(t)));
        scene.fog.color.copy(lerpCol(C.fogDark, C.fogLight, t * t));
        scene.fog.density = lerp(0.048, 0.007, t);
        renderer.toneMappingExposure = lerp(1.3, 1.6, clamp((t - 0.8) / 0.2, 0, 1));

        // Materials
        wallMeshes.forEach(m => {
            if (!m.material) return;
            const lt = clamp(t * 1.5 - (m.userData.norm || 0) * 0.5, 0, 1);
            m.material.color.copy(lerpCol(C.stoneDark, C.officeWall, lt));
            m.material.roughness = lerp(0.95, 0.52, lt);
        });
        floorMeshes.forEach(m => {
            if (!m.material) return;
            const lt = clamp(t * 1.5 - (m.userData.norm || 0) * 0.5, 0, 1);
            m.material.color.copy(lerpCol(C.stoneMid, C.officeFloor, lt));
            m.material.roughness = lerp(0.85, 0.28, lt);
            m.material.metalness = lerp(0, 0.08, lt);
        });

        // Lights
        ambientLight.color.copy(lerpCol(C.amberDim, C.sunlight, t));
        ambientLight.intensity = lerp(0.22, 1.35, t);
        officeSpot.intensity = lerp(0, 5.5, clamp((t - 0.58) / 0.38, 0, 1));
        rimLight.intensity = lerp(0, 1.2, clamp((t - 0.65) / 0.3, 0, 1));

        // Shafts pulse handled in animate loop

        // Vignette — heavier in stone zone, light at office
        if (vignetteEl) vignetteEl.style.opacity = lerp(1, 0.2, t).toFixed(2);

        // ── ZONE DETECTION: use camera Z, not scrollProg ──────
        // Map camera Z to normalised position (-1=entrance, 1=end)
        const camZNorm = camera.position.z / (CL * 0.5); // +1 → -1 as we move forward

        // Delay text panel until heading has migrated to corner (t > 0.13)
        // Also fade out text panel completely at the final stage (t > 0.98)
        const overlay = document.getElementById('corridor-text-overlay');
        if (overlay) {
            overlay.style.opacity = (t > 0.13 && t < 0.98) ? '1' : '0';
        }
        const zoneEl = document.getElementById('corridor-zone');
        if (zoneEl) {
            zoneEl.style.opacity = (t > 0.13 && t < 0.98) ? '1' : '0';
        }

        if (t > 0.13 && t < 0.98) {
            updateTextPanel(camZNorm);
            updateZoneLabel(camZNorm);
        }

        // Quote at the near-pause midpoint
        const quoteEl = document.getElementById('corridor-quote');
        if (quoteEl) quoteEl.classList.toggle('is-visible', t >= 0.44 && t <= 0.56);

        // Arrival moment at t > 0.86
        updateArrival(t);
    }

    /* ── Zone detection from camera Z ─────────────────────────── */
    function updateTextPanel(camZNorm) {
        const idx = ZONES.findIndex(z => camZNorm <= z.zRange[0] && camZNorm >= z.zRange[1]);
        // Before entrance → show Zone 0; after exit → show last zone
        const i = idx >= 0 ? idx : (camZNorm > ZONES[0].zRange[0] ? 0 : ZONES.length - 1);
        if (i === lastZoneIdx) return;

        const panel = document.querySelector('.corridor-text-panel');
        const overlay = document.getElementById('corridor-text-overlay');
        if (!panel || !overlay) return;

        clearTimeout(textRevealTimer);

        // ── Step 1: animate OUT ────────────────────────────────────
        const nextZone = ZONES[i];
        const exitDir = nextZone.side === 'right' ? '-22px' : '22px';
        panel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        panel.style.opacity = '0';
        panel.style.transform = `translateX(${exitDir})`;

        // ── Step 2: swap content & animate IN ─────────────────────
        textRevealTimer = setTimeout(() => {
            overlay.style.justifyContent = nextZone.side === 'right' ? 'flex-end' : 'flex-start';

            const labelEl = panel.querySelector('.panel-label');
            const bodyEl = panel.querySelector('.panel-body');
            if (labelEl) labelEl.textContent = nextZone.label;
            if (bodyEl) {
                bodyEl.innerHTML = nextZone.text
                    .map(l => `<span class="panel-line" style="opacity:0;transform:translateY(12px)">${l}</span>`)
                    .join('');
            }

            // Position off-screen in enter direction, then tween in
            const enterDir = nextZone.side === 'right' ? '22px' : '-22px';
            panel.style.transition = 'none';
            panel.style.transform = `translateX(${enterDir})`;
            panel.style.opacity = '0';

            // Force reflow
            void panel.offsetWidth;

            panel.style.transition = 'opacity 0.55s cubic-bezier(.23,1,.32,1), transform 0.55s cubic-bezier(.23,1,.32,1)';
            panel.style.opacity = '1';
            panel.style.transform = 'translateX(0)';

            // Stagger each text line
            if (bodyEl) {
                bodyEl.querySelectorAll('.panel-line').forEach((el, j) => {
                    setTimeout(() => {
                        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, 100 + j * 130);
                });
            }

            lastZoneIdx = i;
        }, 340); // wait for exit animation
    }

    function updateZoneLabel(camZNorm) {
        const idx = ZONES.findIndex(z => camZNorm <= z.zRange[0] && camZNorm >= z.zRange[1]);
        const zone = ZONES[idx >= 0 ? idx : (camZNorm > ZONES[0].zRange[0] ? 0 : ZONES.length - 1)];
        const zoneEl = document.getElementById('corridor-zone');
        if (!zoneEl) return;
        const nameEl = zoneEl.querySelector('.zone-name');
        if (nameEl && nameEl.textContent !== zone.name) {
            nameEl.style.opacity = '0'; nameEl.style.transform = 'translateY(-5px)';
            setTimeout(() => {
                nameEl.textContent = zone.name;
                nameEl.style.transition = 'opacity 0.5s ease,transform 0.5s ease';
                nameEl.style.opacity = '1'; nameEl.style.transform = 'translateY(0)';
            }, 220);
        }
        zoneEl.style.opacity = '1';
        if (nameEl) nameEl.classList.toggle('is-bright', scrollProg > 0.62);
    }

    /* ── Arrival moment (t > 0.86) ────────────────────────────── */
    let arrivalTriggered = false;
    function updateArrival(t) {
        if (!arrivalEl) return;
        if (t > 0.86 && !arrivalTriggered) {
            arrivalTriggered = true;
            // Warm light surge
            arrivalEl.style.background = 'rgba(240,234,218,0.28)';
            setTimeout(() => { arrivalEl.style.background = 'rgba(240,234,218,0)'; }, 1800);
        }
        if (t < 0.82 && arrivalTriggered) arrivalTriggered = false;

        // Subtle warm glow around edges at end
        if (t > 0.88) {
            const glow = clamp((t - 0.88) / 0.12, 0, 1);
            arrivalEl.style.boxShadow = `inset 0 0 ${glow * 120}px rgba(255,210,100,${glow * 0.18})`;
        } else {
            arrivalEl.style.boxShadow = 'none';
        }
    }

    /* ══════════════════════════════════════════════════════════════
       ANIMATION LOOP
    ══════════════════════════════════════════════════════════════ */
    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        /* ── 1. Camera along arc-length curve (equal speed) ── */
        const ct = clamp(scrollProg, 0, 1);
        const camPos = camCurve.getPointAt(ct);   // getPointAt = arc-length
        const lookPos = lookCurve.getPointAt(clamp(ct + 0.045, 0, 1));

        // Natural walking sway
        const swX = Math.sin(elapsed * 1.1) * 0.06 + Math.sin(elapsed * 0.43) * 0.028;
        const swY = Math.abs(Math.sin(elapsed * 1.8)) * 0.038;
        camera.position.set(camPos.x + swX, camPos.y + swY, camPos.z);
        camera.lookAt(lookPos.x, lookPos.y, lookPos.z);

        /* ── 2. Inscription proximity reveal ── */
        inscriptions.forEach(ins => {
            const dist = Math.abs(camera.position.z - ins.z);
            const alpha = clamp(1 - (dist - 5) / 10, 0, 1); // fade in when within 15 units
            if (ins.mesh.material) ins.mesh.material.opacity = alpha;
            if (ins.bk.material) ins.bk.material.opacity = alpha;
        });

        /* ── 3. Torch flicker + shadow jitter ── */
        torchSconces.forEach(sc => {
            const flicker = 1.4
                + Math.sin(elapsed * 8.2 + sc.phase) * 0.5
                + Math.sin(elapsed * 13.7 + sc.phase * 1.7) * 0.22
                + (Math.random() < 0.04 ? (Math.random() - 0.5) * 0.7 : 0);

            // Shadow jitter — light position wobbles tiny amount
            sc.light.position.x = sc.basePos.x + Math.sin(elapsed * 6.3 + sc.phase) * 0.035;
            sc.light.position.y = sc.basePos.y + Math.cos(elapsed * 4.8 + sc.phase) * 0.028;

            const dist = Math.abs(camera.position.z - sc.z);
            const prox = clamp(1 - dist / 16, 0, 1);
            const fade = clamp(1 - (scrollProg - 0.65) / 0.22, 0, 1);
            sc.light.intensity = flicker * prox * fade;
            sc.light.color.copy(lerpCol(C.amberDim, C.amber, Math.sin(elapsed * 6 + sc.phase) * 0.5 + 0.5));
            sc.ember.material.emissiveIntensity = 1.8 + flicker * 0.7;
        });

        /* ── 4. Shaft pulse ── */
        shaftMeshes.forEach((m, i) => {
            const pulse = 0.5 + Math.sin(elapsed * 0.85 + i * 1.35) * 0.5;
            m.material.opacity = m.userData.baseOpacity * (0.65 + pulse * 0.55);
        });

        /* ── Floating Icons ── */
        scene.children.forEach(child => {
            if (child.userData && child.userData.floating) {
                const ud = child.userData;
                child.position.y += Math.sin(elapsed * ud.speed + ud.phase) * 0.002;
                child.rotation.z = Math.sin(elapsed * 0.5 + ud.phase) * 0.05;
            }
        });

        /* ── 5. Animated monitor + dust ── */
        updateMonitor(elapsed);
        animateDust(scrollProg, elapsed);

        renderer.render(scene, camera);
    }

    /* ══════════════════════════════════════════════════════════════
       SERVICES OBSERVER + PANEL PATCH
    ══════════════════════════════════════════════════════════════ */
    function buildServicesObserver() {
        const h = document.querySelector('.services-heading');
        const s = document.querySelector('.services-sub');
        if (!h) return;
        const obs = new IntersectionObserver(e => {
            e.forEach(en => {
                if (en.isIntersecting) { h.classList.add('is-visible'); if (s) s.classList.add('is-visible'); obs.disconnect(); }
            });
        }, { threshold: 0.3 });
        obs.observe(h);
    }

    function patchPanelHTML() {
        const panel = document.querySelector('.corridor-text-panel');
        if (!panel) return;
        const zone = ZONES[0];
        panel.innerHTML = `
            <span class="panel-label">${zone.label}</span>
            <div class="panel-body">
                ${zone.text.map(l => `<span class="panel-line">${l}</span>`).join('')}
            </div>`;
        const st = document.createElement('style');
        st.textContent = `
            .panel-body{display:flex;flex-direction:column;gap:0.65rem;}
            .panel-line{display:block;font-family:'Playfair Display',serif;
                font-size:clamp(0.92rem,1.35vw,1.12rem);font-weight:400;
                color:rgba(255,255,255,0.84);line-height:1.72;
                transition:opacity .55s ease,transform .55s ease;}
            .panel-line strong{color:#fff;font-weight:700;}
            .corridor-text-panel{transition:opacity .65s cubic-bezier(.23,1,.32,1),transform .65s cubic-bezier(.23,1,.32,1);}
        `;
        document.head.appendChild(st);
    }

    /* ══════════════════════════════════════════════════════════════
       HELPERS
    ══════════════════════════════════════════════════════════════ */
    function mk(geo, mat) { const m = new THREE.Mesh(geo, mat); return m; }
    function mkMat(col, rough, metal) { return new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: metal }); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
    function easeIO(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    function lerpCol(a, b, t) { return new THREE.Color(lerp(a.r, b.r, clamp(t, 0, 1)), lerp(a.g, b.g, clamp(t, 0, 1)), lerp(a.b, b.b, clamp(t, 0, 1))); }
    function toggleHint(show) { const e = document.getElementById('corridor-scroll-hint'); if (e) e.classList.toggle('hidden', !show); }
    function onResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); if (dustCanvas) { dustCanvas.width = window.innerWidth; dustCanvas.height = window.innerHeight; } }

    /* ══════════════════════════════════════════════════════════════
       BOOT
    ══════════════════════════════════════════════════════════════ */
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }

})();
