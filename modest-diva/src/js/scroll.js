// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

class ScrollManager {
    constructor() {
        this.init();
    }

    init() {
        // ── Hero content fades out on scroll ──────────────────
        gsap.to('.hero-content', {
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            },
            opacity: 0,
            y: -100,
            filter: 'blur(10px)'
        });

        // ── Hero scroll indicator fades out on first scroll ───
        gsap.to('.hero-scroll-indicator', {
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: '15% top',
                scrub: true
            },
            opacity: 0,
            y: 20
        });

        // ── "My Story" eyebrow heading fade-in on enter ───────
        gsap.fromTo('.tl-story-eyebrow',
            { opacity: 0, y: 40 },
            {
                scrollTrigger: {
                    trigger: '.tl-story-eyebrow',
                    start: 'top 80%',
                    end: 'top 40%',
                    scrub: 1
                },
                opacity: 1,
                y: 0
            }
        );

        // Fade out the eyebrow children as user scrolls past them
        gsap.to('.tl-story-eyebrow-heading', {
            scrollTrigger: {
                trigger: '.tl-story-eyebrow',
                start: 'bottom 60%',
                end: 'bottom top',
                scrub: 1
            },
            opacity: 0,
            y: -30
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ScrollManager();
});
