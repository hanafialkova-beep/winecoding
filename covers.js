// WineCoding: automatické obálky projektů
// Obálka se skládá z obsahu projektu (název, popis, příběh, kategorie):
// motiv určí barvy, vzor na pozadí a "nálepky". Nic se neukládá, nic se nestahuje,
// každý nový projekt má obálku hned.
(function () {
    // Motivy podle obsahu. První, který sedí na klíčová slova, vyhrává.
    const MOTIFS = [
        { id: 'language', words: ['pravopis', 'jazyk', 'češtin', 'vyjmenovan', 'slovíčk', 'gramat', 'angličt', 'language', 'vocab', 'spelling'],
          colors: ['#dcd3f7', '#fbe7a8', '#ffc9d6'], ink: '#3b2a7a', pattern: 'glyphs',
          glyphs: ['y', 'i', 'ý', 'í', 'Aa', 'ř', 'č', 'ě', 'b', 'z', 's'], stickers: ['✏️', '⭐', '📚'] },
        { id: 'safety', words: ['bezpeč', 'cesta domů', 'cizí', 'přechod', 'silnic', 'doprav', 'safety', 'traffic'],
          colors: ['#cfe3f7', '#c9ead6', '#fbe7a8'], ink: '#1f3a5a', pattern: 'zebra',
          stickers: ['🎒', '🚦', '🏠'] },
        { id: 'math', words: ['matemat', 'počít', 'čísl', 'násob', 'math', 'number', 'kalkul'],
          colors: ['#ffd9bd', '#cfe3f7', '#fbe7a8'], ink: '#5a2a12', pattern: 'glyphs',
          glyphs: ['+', '−', '×', '÷', '=', '7', '3', '%', '9', '2'], stickers: ['🔢', '🧮', '⭐'] },
        { id: 'music', words: ['hudb', 'music', 'píseň', 'song', 'zvuk', 'rytm'],
          colors: ['#ffc9d6', '#dcd3f7', '#cfe3f7'], ink: '#5a1630', pattern: 'waves',
          stickers: ['🎵', '🎧', '🎹'] },
        { id: 'food', words: ['recept', 'vař', 'jídl', 'kuch', 'food', 'cook', 'recipe', 'peč'],
          colors: ['#ffd9bd', '#fbe7a8', '#ffc9d6'], ink: '#5a2a12', pattern: 'dots',
          stickers: ['🍳', '🥕', '🧁'] },
        { id: 'wellbeing', words: ['medit', 'mindful', 'klid', 'dech', 'relax', 'spánek', 'spánk', 'wellbeing', 'habit', 'návyk'],
          colors: ['#c9ead6', '#dcd3f7', '#ffd9bd'], ink: '#1e4a35', pattern: 'rings',
          stickers: ['🧘', '🌿', '☁️'] },
        { id: 'nature', words: ['zahrad', 'rostlin', 'garden', 'plant', 'kytk', 'příroda', 'zvíř', 'animal', 'pes', 'kočk'],
          colors: ['#c9ead6', '#fbe7a8', '#cfe3f7'], ink: '#1e4a35', pattern: 'dots',
          stickers: ['🌱', '🐾', '🌻'] },
        { id: 'money', words: ['peníz', 'financ', 'rozpoč', 'money', 'budget', 'úspor', 'kapesn'],
          colors: ['#c9ead6', '#fbe7a8', '#ffd9bd'], ink: '#1e4a35', pattern: 'glyphs',
          glyphs: ['Kč', '€', '%', '+', '₿', '$'], stickers: ['💰', '🐷', '📈'] },
        { id: 'home', words: ['domácnost', 'úklid', 'odpad', 'nákup', 'rodin', 'plánov', 'todo', 'úkol', 'checklist'],
          colors: ['#c9ead6', '#cfe3f7', '#fbe7a8'], ink: '#1f3a5a', pattern: 'grid',
          stickers: ['🏡', '✅', '🗓️'] },
        { id: 'game', words: ['hra', 'game', 'kvíz', 'quiz', 'puzzle', 'zábav'],
          colors: ['#ffc9d6', '#fbe7a8', '#dcd3f7'], ink: '#5a1630', pattern: 'glyphs',
          glyphs: ['★', '♥', '◆', '●', '▲', '✦'], stickers: ['🎮', '🏆', '🎲'] }
    ];

    const CATEGORY_FALLBACK = {
        education: { colors: ['#ffd9bd', '#ffc9d6', '#fbe7a8'], ink: '#5a1630', pattern: 'glyphs', glyphs: ['A', 'b', '1', '?', '!', 'z'], stickers: ['📚', '💡', '⭐'] },
        home:      { colors: ['#c9ead6', '#cfe3f7', '#fbe7a8'], ink: '#1f3a5a', pattern: 'grid', stickers: ['🏠', '✅', '🪴'] },
        creative:  { colors: ['#dcd3f7', '#ffc9d6', '#fbe7a8'], ink: '#3b2a7a', pattern: 'waves', stickers: ['🎨', '✨', '🖍️'] },
        wellbeing: { colors: ['#c9ead6', '#dcd3f7', '#ffd9bd'], ink: '#1e4a35', pattern: 'rings', stickers: ['🧘', '🌿', '💜'] },
        fun:       { colors: ['#ffc9d6', '#fbe7a8', '#dcd3f7'], ink: '#5a1630', pattern: 'glyphs', glyphs: ['★', '♥', '◆', '●', '✦'], stickers: ['🎮', '🎉', '🎲'] },
        utility:   { colors: ['#cfe3f7', '#dcd3f7', '#c9ead6'], ink: '#1f3a5a', pattern: 'grid', stickers: ['🔧', '⚡', '🧩'] }
    };
    const CATEGORY_NAMES = { education: 'vzdělávání', home: 'domácnost', creative: 'kreativita', wellbeing: 'wellbeing', fun: 'zábava', utility: 'utility' };

    function hash(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }
    // Deterministický generátor: stejný projekt = vždy stejná obálka
    function rng(seed) {
        let s = seed || 1;
        return () => { s = Math.imul(s ^ (s >>> 15), 1 | s); s ^= s + Math.imul(s ^ (s >>> 7), 61 | s); return ((s ^ (s >>> 14)) >>> 0) / 4294967296; };
    }
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function pickMotif(p) {
        const text = [p.name, p.description, p.story].join(' ').toLowerCase();
        for (const m of MOTIFS) if (m.words.some(w => text.includes(w))) return m;
        return CATEGORY_FALLBACK[p.category] || CATEGORY_FALLBACK.fun;
    }

    function patternHTML(m, r) {
        switch (m.pattern) {
            case 'glyphs': {
                let out = '';
                const n = 14;
                for (let i = 0; i < n; i++) {
                    const g = m.glyphs[Math.floor(r() * m.glyphs.length)];
                    const x = (i % 5) * 22 + r() * 14 - 4;
                    const y = Math.floor(i / 5) * 36 + r() * 18 - 6;
                    const size = 1.6 + r() * 2.6;
                    const rot = Math.round(r() * 50 - 25);
                    const outline = r() > 0.5 ? ' o' : '';
                    out += `<span class="cv-glyph${outline}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;font-size:${size.toFixed(2)}rem;transform:rotate(${rot}deg)">${esc(g)}</span>`;
                }
                return `<div class="cv-pattern">${out}</div>`;
            }
            case 'zebra':
                return `<div class="cv-pattern cv-zebra" style="transform:rotate(${Math.round(r() * 16 - 8)}deg)"></div>`;
            case 'waves':
                return `<svg class="cv-pattern" viewBox="0 0 400 250" preserveAspectRatio="none" aria-hidden="true">${
                    [0, 1, 2, 3, 4].map(i => { const y = 40 + i * 42 + r() * 10; const a = 14 + r() * 18;
                        return `<path d="M-10 ${y} C 80 ${y - a}, 160 ${y + a}, 240 ${y} S 400 ${y - a}, 420 ${y}" />`; }).join('')}</svg>`;
            case 'rings':
                return `<div class="cv-pattern cv-rings" style="--rx:${Math.round(55 + r() * 30)}%;--ry:${Math.round(20 + r() * 30)}%"></div>`;
            case 'grid':
                return `<div class="cv-pattern cv-grid"></div>`;
            default:
                return `<div class="cv-pattern cv-dots"></div>`;
        }
    }

    function render(p, opts) {
        opts = opts || {};
        const m = pickMotif(p);
        const r = rng(hash((p.id || '') + (p.name || '')));
        const [c1, c2, c3] = m.colors;
        const order = r() > 0.5 ? m.stickers : [m.stickers[1], m.stickers[0], m.stickers[2]];
        const num = String((hash(p.name || '') % 89) + 10);
        const blobs = `
            <span class="cv-blob" style="background:${c2};left:${Math.round(r() * 60 - 10)}%;top:${Math.round(r() * 50 - 25)}%"></span>
            <span class="cv-blob b2" style="background:${c3};left:${Math.round(40 + r() * 40)}%;top:${Math.round(35 + r() * 40)}%"></span>`;
        return `
        <div class="cover cover-${m.id || p.category || 'x'}${opts.large ? ' cover-lg' : ''}" style="--cv-bg:${c1};--cv-ink:${m.ink}" aria-hidden="true">
            ${blobs}
            ${patternHTML(m, r)}
            <div class="cv-stickers">
                <span class="cv-st s1">${order[0]}</span>
                <span class="cv-st s2">${order[1]}</span>
                <span class="cv-st s3">${order[2]}</span>
            </div>
            <span class="cv-label">N°${num} · ${esc(CATEGORY_NAMES[p.category] || 'projekt')}</span>
            <span class="cv-title">${esc(p.name)}</span>
        </div>`;
    }

    window.WineCovers = { render, pickMotif };
})();
