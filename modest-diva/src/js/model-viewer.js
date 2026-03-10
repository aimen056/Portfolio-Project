/**
 * model-viewer.js  (ES Module)
 * Loads GLB files into Three.js canvases using ES module imports.
 * Imported from esm.sh which serves proper ES modules without ORB blocking.
 *
 * Key fixes vs previous version:
 *  - Canvas resize is checked every time startRender fires (panels start display:none → 0px)
 *  - IntersectionObserver threshold lowered to 0 so any visibility triggers it
 *  - MutationObserver watches for display:flex being applied to panels
 *  - No top-level await — uses promise chain instead for better compatibility
 */

import * as THREE from 'https://esm.sh/three@0.148.0';
import { GLTFLoader } from 'https://esm.sh/three@0.148.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.148.0/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.148.0/examples/jsm/controls/OrbitControls.js';

/* ─── Shared Draco decoder (reused across all viewers) ───────── */
const dracoLoader = new DRACOLoader();
// Google's hosted Draco WASM decoder (no ORB issues — served as application/wasm)
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

/* ─── Wait for timeline DOM ──────────────────────────────────── */
function waitForTimeline() {
    return new Promise(resolve => {
        // Already built?
        if (document.querySelector('.tl-model-canvas')) { resolve(); return; }
        // Event-based
        document.addEventListener('timeline:ready', resolve, { once: true });
        // Polling fallback (catches missed events)
        let tries = 0;
        const poll = setInterval(() => {
            tries++;
            if (document.querySelector('.tl-model-canvas') || tries > 50) {
                clearInterval(poll);
                resolve();
            }
        }, 200);
    });
}

/* ─── Brand lights ───────────────────────────────────────────── */
function addLights(scene) {
    // Warm cream ambient
    scene.add(new THREE.AmbientLight(0xfff8e7, 1.6));
    // Gold key light (top-left-front)
    const key = new THREE.DirectionalLight(0xffd700, 2.2);
    key.position.set(-3, 5, 4);
    key.castShadow = true;
    scene.add(key);
    // Soft fill (opposite side)
    const fill = new THREE.DirectionalLight(0xffffff, 0.9);
    fill.position.set(4, 2, -3);
    scene.add(fill);
    // Subtle rim from below
    const rim = new THREE.DirectionalLight(0xffecd2, 0.5);
    rim.position.set(0, -4, 2);
    scene.add(rim);
}

/* ─── Viewer registry ────────────────────────────────────────── */
const viewerMap = new Map(); // canvas → viewer

/* ─── Boot ───────────────────────────────────────────────────── */
waitForTimeline().then(() => {
    document.querySelectorAll('.tl-model-canvas').forEach(canvas => {
        const path = canvas.dataset.model;
        if (path) createViewer(canvas, path);
    });

    // Watch for panels going from display:none to display:flex
    // This triggers a resize fix for the canvas that was 0×0 when created
    const mo = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if (m.type === 'attributes' && m.attributeName === 'style') {
                const panel = m.target;
                if (panel.classList.contains('tl-panel')) {
                    panel.querySelectorAll('.tl-model-canvas').forEach(canvas => {
                        const viewer = viewerMap.get(canvas);
                        if (viewer) resizeViewer(viewer);
                    });
                }
            }
        });
    });

    document.querySelectorAll('.tl-panel').forEach(panel => {
        mo.observe(panel, { attributes: true, attributeFilter: ['style'] });
    });
});

/* ─── Create a Single Viewer ─────────────────────────────────── */
function createViewer(canvas, modelPath) {
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // size set in resizeViewer()

    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 1000);
    camera.position.set(0, 0.3, 2.8);

    addLights(scene);

    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.6;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.8;

    const viewer = {
        scene, renderer, camera, controls,
        canvas, rafId: null, visible: false, loaded: false
    };
    viewerMap.set(canvas, viewer);

    /* Load GLB */
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);  // enable Draco decompression
    loader.load(
        modelPath,
        gltf => {
            const model = gltf.scene;
            // Normalise: centre + scale to fit within a radius-1 sphere
            const box = new THREE.Box3().setFromObject(model);
            const centre = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const scale = 1.9 / Math.max(size.x, size.y, size.z);
            model.position.copy(centre).negate().multiplyScalar(scale);
            model.scale.setScalar(scale);
            model.traverse(child => {
                if (!child.isMesh) return;
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) child.material.needsUpdate = true;
            });
            scene.add(model);
            viewer.loaded = true;
            resizeViewer(viewer);       // fix size now that model is ready
            if (viewer.visible) startRender(viewer);
        },
        undefined,
        err => {
            console.warn('[ModelViewer] Failed to load:', modelPath, err.message || err);
            const wrap = canvas.closest('.tl-model-wrap');
            if (wrap) wrap.style.visibility = 'hidden';
        }
    );

    /* IntersectionObserver — only render when on-screen */
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            viewer.visible = e.isIntersecting;
            if (viewer.visible) {
                resizeViewer(viewer);   // re-check size each time panel appears
                if (viewer.loaded) startRender(viewer);
            } else {
                stopRender(viewer);
            }
        });
    }, { threshold: 0 });   // fire even at 1px visibility
    io.observe(canvas);

    /* Global resize */
    window.addEventListener('resize', () => resizeViewer(viewer));

    return viewer;
}

/* ─── Resize helper ──────────────────────────────────────────── */
function resizeViewer(viewer) {
    const canvas = viewer.canvas;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    viewer.camera.aspect = w / h;
    viewer.camera.updateProjectionMatrix();
    viewer.renderer.setSize(w, h, false);
}

/* ─── Render loop ────────────────────────────────────────────── */
function startRender(viewer) {
    if (viewer.rafId) return;
    resizeViewer(viewer);   // always size-check when starting
    function loop() {
        if (!viewer.visible) { viewer.rafId = null; return; }
        viewer.rafId = requestAnimationFrame(loop);
        viewer.controls.update();
        viewer.renderer.render(viewer.scene, viewer.camera);
    }
    loop();
}

function stopRender(viewer) {
    if (viewer.rafId) {
        cancelAnimationFrame(viewer.rafId);
        viewer.rafId = null;
    }
}
