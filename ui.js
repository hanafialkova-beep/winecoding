// WineCoding — sdílené UI efekty (všechny stránky)
(function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    // Scroll progress + nav state
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.prepend(bar);
    const nav = document.getElementById('mainNav') || document.querySelector('nav');
    function onScroll() {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.setProperty('--progress', max > 0 ? (scrollY / max).toFixed(4) : 0);
        if (nav) nav.classList.toggle('scrolled', scrollY > 30);
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Reveal on scroll
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    if (reduce) return;

    // Běžící pás: jede doprava, při scrollování zrychlí (podle rychlosti scrollu)
    const track = document.querySelector('.marquee-track');
    if (track) {
        let x = 0, boost = 0, lastY = scrollY, hover = false;
        const base = 0.45; // px za snímek
        track.parentElement.addEventListener('mouseenter', () => { hover = true; });
        track.parentElement.addEventListener('mouseleave', () => { hover = false; });
        addEventListener('scroll', () => {
            boost = Math.min(boost + Math.abs(scrollY - lastY) * 0.08, 14);
            lastY = scrollY;
        }, { passive: true });
        (function tick() {
            const half = track.scrollWidth / 2;
            const speed = hover ? 0.12 : base + boost;
            x += speed;
            if (half > 0 && x >= 0) x -= half;
            boost *= 0.93;
            track.style.transform = `translate3d(${x}px,0,0)`;
            requestAnimationFrame(tick);
        })();
        // start uprostřed, ať pás hned jede doprava bez prázdného místa
        requestAnimationFrame(() => { x = -track.scrollWidth / 2; });
    }

    // Custom cursor dot
    if (finePointer) {
        const dot = document.createElement('div');
        dot.className = 'cursor-dot';
        document.body.appendChild(dot);
        let x = -100, y = -100, cx = x, cy = y;
        addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; dot.classList.add('on'); }, { passive: true });
        document.addEventListener('mouseleave', () => dot.classList.remove('on'));
        (function loop() {
            cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
            dot.style.transform = `translate(${cx}px, ${cy}px)`;
            requestAnimationFrame(loop);
        })();
        document.addEventListener('mouseover', (e) => {
            dot.classList.toggle('big', !!e.target.closest('a, button, .project-card, .category-card'));
        });
    }

    if (!finePointer) return;

    // Hero card tilt
    const visual = document.querySelector('.hero-visual');
    const card = document.querySelector('.hero-card');
    if (visual && card) {
        visual.addEventListener('mousemove', (e) => {
            const r = visual.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.setProperty('--ry', (px * 12).toFixed(2) + 'deg');
            card.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg');
        });
        visual.addEventListener('mouseleave', () => {
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--rx', '0deg');
        });
    }

    // Magnetic buttons
    document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
})();
