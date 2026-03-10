/**
 * timeline.js  —  "My Story" scroll-driven narrative
 * Architecture:
 *  - 5 story sections mapped to provided paragraphs
 *  - Left nav: short chapter labels
 *  - Center: static golden sphere on vertical motion line
 *  - Right: alternating text + 3D model (side by side)
 *  - GSAP ScrollTrigger maps scroll progress to sections
 */

(function () {
    'use strict';

    gsap.registerPlugin(ScrollTrigger);

    /* ─── Story Sections ────────────────────────────────────────── */
    const SECTIONS = [
        {
            nav: 'roots',
            body: `I grew up in a small village in Punjab where ambition wasn't something people talked about — it was something you <strong>carried quietly.</strong>`,
            image: '/public/images/vill.png'
        },
        {
            nav: 'the truth',
            body: `My family didn't hand me connections or a startup fund. What they gave me was something better: <strong>the belief that hard work doesn't whisper — it roars.</strong>`,
            image: '/public/images/no plan.png'
        },
        {
            nav: 'the spark',
            body: `So when I picked up my first freelance project, I had no fancy degree in marketing, no agency behind me. But I had something most people underestimate — <strong>the hunger to figure it out.</strong>`,
            image: '/public/images/first.png'
        },
        {
            nav: 'the climb',
            body: `That one project turned into ten. Ten turned into fifty. And before I knew it, I wasn't just freelancing anymore. <strong>I was running my own Digital Marketing Agency.</strong>`,
            image: '/public/images/Diva-Logo.png'
        },
        {
            nav: 'the agency',
            body: `Five years later, I lead a team that serves clients from Pakistan to the Middle East to Europe. Built digital presences that don't just look good — <strong>they work.</strong>`,
            image: '/public/images/globe.png'
        },
        {
            nav: 'now',
            image: '/public/images/weapon.png',
            isQuote: true,
            html: `
                <div class="tl-panel-inner">
                    <div class="tl-quote-content">
                        <span class="tl-quote-mark">&ldquo;</span>
                        <span class="tl-quote-lead">But my favorite part?</span>
                        <span class="tl-quote-main">I'm still that<br><em>village girl.</em></span>
                        <hr class="tl-quote-rule">
                        <span class="tl-quote-punchline">
                            I just learned how to turn<br>
                            <strong>WiFi into a weapon.</strong>
                        </span>
                    </div>
                    <div class="tl-model-wrap">
                        <img src="/public/images/weapon.png" class="tl-story-img" alt="Weapon">
                    </div>
                </div>
            `
        }
    ];

    const NUM_SECTIONS = SECTIONS.length;

    /* ─── SVG Path — vertical line with gentle top curve ───────── */
    const PATH_D = 'M72 0 C72 80, 48 180, 60 300 S60 500, 60 700 S60 900, 60 1000';

    /* ─── Build DOM ─────────────────────────────────────────────── */
    function buildTimeline() {
        const section = document.getElementById('timeline');
        if (!section) return;

        // Create the sticky inner wrapper
        const inner = document.createElement('div');
        inner.className = 'tl-inner';
        inner.innerHTML = `
            <!-- Left: Chapter Navigation -->
            <nav class="tl-left-nav" aria-label="Story chapters">
                <ul>
                    ${SECTIONS.map((s, i) => `
                        <li class="tl-nav-item ${i === 0 ? 'is-active' : ''}" data-section="${i}">
                            ${s.nav}
                        </li>
                    `).join('')}
                </ul>
            </nav>

            <!-- Center: Static Golden Motion Line + Sphere -->
            <div class="tl-line-wrap">
                <svg id="tl-svg"
                     xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 120 1000"
                     preserveAspectRatio="none">
                    <path id="tl-path-bg" d="${PATH_D}"/>
                </svg>
                <div id="tl-sphere"></div>
            </div>

            <!-- Right: Story content panels -->
            <div class="tl-panels">
                ${SECTIONS.map((s, i) => `
                    <div class="tl-panel${i === 0 ? ' is-active' : ''}${s.isQuote ? ' is-quote' : ''}" data-section="${i}">
                        ${s.html ? s.html : `
                        <div class="tl-panel-inner">
                            <p class="tl-chapter-body">${s.body}</p>
                            <div class="tl-model-wrap">
                                <img src="${s.image}" class="tl-story-img" alt="${s.nav}">
                            </div>
                        </div>
                        `}
                    </div>
                `).join('')}
            </div>
        `;
        section.appendChild(inner);
    }

    /* ─── Section Switching ──────────────────────────────────────── */
    let currentSection = 0;

    function showSection(index) {
        if (index === currentSection) return;

        const panels = document.querySelectorAll('.tl-panel');
        const navs = document.querySelectorAll('.tl-nav-item');
        const prev = currentSection;
        const goingDown = index > prev;

        // ── Fade out old panel (with blur)
        const prevPanel = panels[prev];
        if (prevPanel) {
            gsap.to(prevPanel, {
                opacity: 0,
                y: goingDown ? -40 : 40,
                filter: 'blur(6px)',
                duration: 0.42,
                ease: 'power2.in',
                onComplete: () => prevPanel.classList.remove('is-active')
            });
        }

        // ── Fade in new panel (blur clears, children stagger in)
        const nextPanel = panels[index];
        if (nextPanel) {
            nextPanel.classList.add('is-active');

            // Whole panel fades + unblurs
            gsap.fromTo(nextPanel,
                { opacity: 0, y: goingDown ? 40 : -40, filter: 'blur(6px)' },
                {
                    opacity: 1, y: 0, filter: 'blur(0px)',
                    duration: 0.65, ease: 'power3.out', delay: 0.08
                }
            );

            // Stagger the individual text / child elements
            const staggerEls = nextPanel.querySelectorAll(
                '.tl-chapter-body, .tl-quote-mark, .tl-quote-lead, ' +
                '.tl-quote-main, .tl-quote-rule, .tl-quote-punchline'
            );
            if (staggerEls.length) {
                gsap.fromTo(staggerEls,
                    { opacity: 0, y: 18 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.55, ease: 'power2.out',
                        stagger: 0.10, delay: 0.18
                    }
                );
            }
        }

        // ── Nav highlight
        navs.forEach((item, i) => item.classList.toggle('is-active', i === index));

        currentSection = index;
    }

    /* ─── ScrollTrigger ─────────────────────────────────────────── */
    function initScrollTrigger() {
        ScrollTrigger.create({
            trigger: '#timeline',
            start: 'top top',
            end: 'bottom bottom',
            onUpdate(self) {
                const idx = Math.min(
                    NUM_SECTIONS - 1,
                    Math.floor(self.progress * NUM_SECTIONS)
                );
                showSection(idx);
            },
            onLeaveBack: () => showSection(0)
        });
    }

    /* ─── Init ───────────────────────────────────────────────────── */
    function init() {
        buildTimeline();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                initScrollTrigger();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
