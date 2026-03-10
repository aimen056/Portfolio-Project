/**
 * philosophy.js — "Dictionary Redefined" + Premium Visual Polish
 */
(function () {
    'use strict';

    let canvas, ctx, particles = [];
    let mouse = { x: 0, y: 0 };
    let isActive = false;

    /* ── HTML Build ─────────────────────────────────────────────── */
    function buildHTML(section) {
        section.innerHTML = `
            <!-- Particle layer -->
            <canvas id="phil-canvas" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;"></canvas>
            
            <!-- Type Watermarks -->
            <div class="phil-watermark phil-watermark--left" id="watermark-m">M</div>
            <div class="phil-watermark phil-watermark--right" id="watermark-d">D</div>

            <div class="dict-page">
                <div class="dict-page-header">
                    <span class="dict-eyebrow">The Philosophy</span>
                    <span class="dict-header-rule"></span>
                    <span class="dict-header-right">Modest Diva — Redefined</span>
                </div>

                <div class="dict-columns">
                    <!-- MODEST -->
                    <div class="dict-entry dict-entry--modest glass-panel" id="dict-modest">
                        <div class="dict-word-line"><span class="dict-word">Modest</span></div>
                        <div class="dict-redef-label"><span class="dict-redef-star">✦</span>Redefined</div>
                        <ol class="dict-defs">
                            <li class="dict-def-item">Not the absence of ambition — <strong>the presence of roots.</strong></li>
                            <li class="dict-def-item">Service before show. <strong>Substance over spectacle.</strong></li>
                        </ol>
                    </div>

                    <div class="dict-divider" id="dict-divider"></div>

                    <!-- DIVA -->
                    <div class="dict-entry dict-entry--diva glass-panel" id="dict-diva">
                        <div class="dict-word-line"><span class="dict-word dict-word--gold">Diva</span></div>
                        <div class="dict-redef-label"><span class="dict-redef-star">✦</span>Redefined</div>
                        <ol class="dict-defs">
                            <li class="dict-def-item">Not a personality. <strong>A standard you refuse to lower.</strong></li>
                            <li class="dict-def-item"><strong>Excellence that doesn't wait for permission.</strong></li>
                        </ol>
                    </div>
                </div>

                <div class="dict-closing" id="dict-closing">
                    <span class="dict-closing-rule"></span>
                    <p class="dict-closing-text">"Together, they are the only way I know how to work."</p>
                    <span class="dict-closing-attr">— Zil e Huma, Modest Diva</span>
                </div>
            </div>
        `;
    }

    /* ── Particle System ────────────────────────────────────────── */
    class GoldDust {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 50;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedVertical = Math.random() * 0.4 + 0.1;
            this.speedHorizontal = Math.random() * 0.4 - 0.2;
            this.opacity = Math.random() * 0.4 + 0.1;
        }
        update() {
            this.y -= this.speedVertical;
            this.x += this.speedHorizontal;
            if (this.y < -20) this.reset();
        }
        draw() {
            ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        canvas = document.getElementById('phil-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resizeCanvas();
        particles = [];
        for (let i = 0; i < 60; i++) {
            particles.push(new GoldDust());
        }
        animate();
    }

    function resizeCanvas() {
        if (!canvas) return;
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }

    function animate() {
        if (!isActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    /* ── Animation Sequence ─────────────────────────────────────── */
    function runSequence() {
        isActive = true;
        initParticles();

        const section = document.getElementById('philosophy');
        const header = section.querySelector('.dict-page-header');
        const modest = document.getElementById('dict-modest');
        const diva = document.getElementById('dict-diva');
        const divider = document.getElementById('dict-divider');
        const closing = document.getElementById('dict-closing');
        const watermarks = section.querySelectorAll('.phil-watermark');

        // Mouse-reveal glow tracking
        section.addEventListener('mousemove', (e) => {
            const rect = section.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * 100;
            const py = ((e.clientY - rect.top) / rect.height) * 100;
            section.style.setProperty('--mouse-x', px + '%');
            section.style.setProperty('--mouse-y', py + '%');
        });

        // Intro timing
        if (header) header.classList.add('is-visible');
        watermarks.forEach(w => w.classList.add('is-visible'));

        setTimeout(() => {
            if (modest) modest.classList.add('is-visible');
            modest.querySelectorAll('.dict-def-item').forEach((el, i) => {
                setTimeout(() => el.classList.add('is-visible'), 400 + i * 180);
            });
        }, 300);

        setTimeout(() => {
            if (divider) divider.classList.add('is-drawn');
        }, 500);

        setTimeout(() => {
            if (diva) diva.classList.add('is-visible');
            diva.querySelectorAll('.dict-def-item').forEach((el, i) => {
                setTimeout(() => el.classList.add('is-visible'), 400 + i * 180);
            });
        }, 600);

        setTimeout(() => {
            if (closing) closing.classList.add('is-visible');
        }, 1800);
    }

    window.addEventListener('resize', resizeCanvas);

    /* ── Init ───────────────────────────────────────────────────── */
    function init() {
        const section = document.getElementById('philosophy');
        if (!section) return;
        buildHTML(section);
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { runSequence(); observer.disconnect(); }
            });
        }, { threshold: 0.15 });

        observer.observe(section);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
