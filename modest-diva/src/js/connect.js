/**
 * connect.js — Sealed Envelope + Sliding Card (Option C: Blush + Dusty Gold)
 *
 * Sequence when section enters viewport:
 *  0ms   → eyebrow label fades up
 *  200ms → envelope scene drops in
 *  1100ms → wax seal "breaks" (shrinks + fades)
 *  1300ms → flap rotates open (3D rotateX)
 *  1700ms → card slides up out of envelope
 *  2000ms → card text reveals line by line (stagger)
 *  2900ms → footer availability note fades in
 */

(function () {
    'use strict';

    /* ── Build DOM ─────────────────────────────────────────────── */
    function buildHTML(section) {
        section.innerHTML = `
            <!-- Light Leak overlay -->
            <div class="ct-light-leak" id="ct-light-leak"></div>

            <!-- Dust Motes (Floating in Sunlight) -->
            <div class="ct-dust" style="top:25%; left:35%; animation-delay: 0s;"></div>
            <div class="ct-dust" style="top:45%; left:65%; animation-delay: 2s;"></div>
            <div class="ct-dust" style="top:75%; left:45%; animation-delay: 4s;"></div>
            <div class="ct-dust" style="top:35%; left:85%; animation-delay: 1s;"></div>
            <div class="ct-dust" style="top:65%; left:15%; animation-delay: 5s;"></div>

            <!-- Ambient hazes -->
            <div class="ct-haze ct-haze--pink" aria-hidden="true"></div>
            <div class="ct-haze ct-haze--gold"  aria-hidden="true"></div>

            <!-- Background Graphic Elements (Floating Orbs & Digital Marketing Icons) -->
            <div class="ct-bg-graphic ct-bg-glow-ring ct-glow-top-left" aria-hidden="true"></div>
            <div class="ct-bg-graphic ct-bg-glow-ring ct-glow-bottom-right" aria-hidden="true"></div>
            
            <!-- Targeting / Strategy -->
            <div class="ct-bg-icon ct-icon-target" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                </svg>
            </div>
            
            <!-- Network / Virality -->
            <div class="ct-bg-icon ct-icon-network" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
            </div>
            
            <!-- Analytics / Growth -->
            <div class="ct-bg-icon ct-icon-bars" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <polyline points="18 20 18 10"/>
                    <polyline points="12 20 12 4"/>
                    <polyline points="6 20 6 14"/>
                </svg>
            </div>

            <!-- Engagement / Digital -->
            <div class="ct-bg-icon ct-icon-cursor" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                    <path d="M13 13l6 6"/>
                </svg>
            </div>

            <!-- Fine gold rule at section top -->
            <div class="ct-top-rule"></div>

            <!-- Meta row above envelope -->
            <div class="ct-meta">
                <span class="ct-eyebrow" id="ct-eyebrow">Connect</span>
                <span class="ct-doc-num" id="ct-status">A message for you</span>
            </div>

            <!-- ── The Envelope Scene (with Tilt) ── -->
            <div class="ct-scene" id="ct-scene">
               <div class="ct-scene-tilt" id="ct-scene-tilt">
                
                <!-- Gold Foil Postmark (Top layer) -->
                <div class="ct-postmark" id="ct-postmark">
                    <span class="ct-pm-text">Strategic Advisory</span>
                    <span class="ct-pm-center">ZH</span>
                    <span class="ct-pm-text">Global Heritage</span>
                </div>

                <div class="ct-envelope" id="ct-envelope">
                    <!-- Envelope back -->
                    <div class="ct-env-back">
                        <div class="ct-env-fold ct-env-fold--left"></div>
                        <div class="ct-env-fold ct-env-fold--right"></div>
                    </div>

                    <!-- The letter card (Middle layer) -->
                    <div class="ct-env-card" id="ct-card">
                        <div class="ct-card-inner">
                            <!-- Human Touch: Pressed Flower -->
                            <div class="ct-flower"></div>

                            <!-- Decorative stamp (No specific year) -->
                            <div class="ct-stamp" aria-hidden="true">
                                <div class="ct-stamp-inner">PAK<br>&#x7E;&#x7E;&#x7E;<br>PERSISTENT</div>
                            </div>

                            <span class="ct-card-eyebrow" data-reveal>An Invitation</span>
                            <hr class="ct-card-rule" data-reveal>
                            <p class="ct-card-to" data-reveal>To: You.</p>

                            <h2 class="ct-card-heading" data-reveal>
                                Okay, your turn.<br>
                                Let's build something<br>
                                <em>that matters.</em>
                            </h2>

                            <hr class="ct-card-rule" data-reveal>

                            <p class="ct-card-body" data-reveal>
                                Whether you need a growth strategy, an AI-powered marketing
                                system, or someone to train your team on what actually works&nbsp;— I'm here.<br><br>
                                No fluff. No jargon. Just a conversation between two people
                                who believe in doing work that counts.
                            </p>

                            <a href="mailto:zilehuma@example.com" class="ct-card-cta" data-reveal>
                                <span>Let's Build Your Digital Legacy</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                     viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                          d="M17.25 8.75L21 12m0 0l-3.75 3.25M21 12H3"/>
                                </svg>
                            </a>

                            <hr class="ct-card-sig-line" data-reveal>
                            <p class="ct-card-sig" id="ct-signature">Zil e Huma</p>
                            <p class="ct-card-sig-sub" data-reveal>
                                Digital Strategist · Pakistan · Available Globally
                            </p>
                        </div>
                    </div>

                    <!-- Front pocket strip -->
                    <div class="ct-env-front"></div>

                    <!-- Flap with wax seal (Click trigger) -->
                    <div class="ct-env-flap" id="ct-flap">
                        <div class="ct-env-seal" id="ct-seal" title="Click to unlock">
                            <span class="ct-seal-letter">Z</span>
                        </div>
                    </div>

                </div>
               </div>
            </div>

            <!-- Availability badge (Stripped of years) -->
            <div class="ct-foot" id="ct-foot">
                <div class="ct-foot-badge">
                    <div class="ct-foot-dot"></div>
                    <span class="ct-foot-badge-text">Open for Collaboration</span>
                </div>
                <p class="ct-foot-sub">Currently accepting new clients</p>
            </div>

            <!-- Page footer (Stripped of years) -->
            <p class="ct-page-foot">&copy; <em>Zil e&nbsp;Huma</em>. All rights reserved.</p>
        `;
    }

    /* ── Animation Sequence ────────────────────────────────────── */
    function runSequence() {
        const eyebrow = document.getElementById('ct-eyebrow');
        const status = document.getElementById('ct-status');
        const envelope = document.getElementById('ct-envelope');
        const flap = document.getElementById('ct-flap');
        const seal = document.getElementById('ct-seal');
        const card = document.getElementById('ct-card');
        const foot = document.getElementById('ct-foot');
        const postmark = document.getElementById('ct-postmark');
        const signature = document.getElementById('ct-signature');

        if (seal.dataset.triggered) return;
        seal.dataset.triggered = "true";

        // 1. Break Seal
        status.textContent = "Unlocking...";
        seal.classList.add('is-breaking');

        // 2. Open Flap
        setTimeout(() => {
            envelope.classList.add('is-animating');
            flap.classList.add('is-open');
            setTimeout(() => flap.classList.add('is-behind'), 700);
        }, 300);

        // 3. Card Rise (Peak reveal)
        setTimeout(() => {
            card.classList.add('is-out');
        }, 1100);

        // 4. Staggered Content Reveal
        setTimeout(() => {
            const items = card.querySelectorAll('[data-reveal]');
            items.forEach((el, i) => {
                setTimeout(() => el.classList.add('is-visible'), i * 150);
            });
        }, 1600);

        // 5. Signature Writing
        setTimeout(() => signature.classList.add('is-written'), 2800);

        // 6. Postmark Thud
        setTimeout(() => postmark.classList.add('is-stamped'), 3300);

        // 7. Settle Card (Drop down for reading)
        setTimeout(() => {
            card.classList.remove('is-out');
            card.classList.add('is-settled');
            status.textContent = "Message Received";
        }, 4400);

        // 8. Footer Badge
        setTimeout(() => foot.classList.add('is-visible'), 5200);
    }

    /* ── Mouse Effects (Light Leak & Parallax Tilt) ────────────── */
    function initMouseEffects() {
        const contact = document.getElementById('contact');
        const leak = document.getElementById('ct-light-leak');
        const tilt = document.getElementById('ct-scene-tilt');
        const card = document.getElementById('ct-card');
        const pm = document.getElementById('ct-postmark');

        if (!contact) return;

        contact.addEventListener('mousemove', (e) => {
            const rect = contact.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 1. Update Light Leak
            const xPct = (x / rect.width) * 100;
            const yPct = (y / rect.height) * 100;
            leak.style.setProperty('--mouse-x', `${xPct}%`);
            leak.style.setProperty('--mouse-y', `${yPct}%`);

            // 2. Base 3D Tilt
            const xRotation = -((y / rect.height) - 0.5) * 12;
            const yRotation = ((x / rect.width) - 0.5) * 12;
            tilt.style.transform = `rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;

            // 3. Z-Plane Parallax (Multi-layer separation)
            const moveX = (x / rect.width - 0.5) * 24;
            const moveY = (y / rect.height - 0.5) * 24;

            // Postmark (Top layer - moves most)
            pm.style.transform = `translate3d(${moveX * 1.5}px, ${moveY * 1.5}px, 60px) rotate(-12deg)`;

            // Card (Middle layer)
            if (card.classList.contains('is-out') || card.classList.contains('is-settled')) {
                const baseShift = card.classList.contains('is-out') ? -58 : -38;
                card.style.transform = `translate3d(${moveX * 0.8}px, calc(${baseShift}% + ${moveY * 0.8}px), 30px)`;
            }
        });

        // Reset
        contact.addEventListener('mouseleave', () => {
            tilt.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    }

    /* ── IntersectionObserver ──────────────────────────────────── */
    function init() {
        const section = document.getElementById('contact');
        if (!section) return;

        buildHTML(section);
        initMouseEffects();

        // ── Click to Unlock ──
        const seal = document.getElementById('ct-seal');
        seal.addEventListener('click', runSequence);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const contact = document.getElementById('contact');
                        const eyebrow = document.getElementById('ct-eyebrow');
                        const scene = document.getElementById('ct-scene');

                        contact.classList.add('is-visible');
                        if (eyebrow) eyebrow.classList.add('is-visible');
                        if (scene) setTimeout(() => scene.classList.add('is-visible'), 200);
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.15 }
        );
        observer.observe(section);
    }

    /* ── Boot ───────────────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
