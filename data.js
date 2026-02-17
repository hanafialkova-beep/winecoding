// WineCoding Data Store
// Všechny texty a data na jednom místě - editovatelné přes admin

const WineCodeData = {
    // EmailJS konfigurace - VYPLŇ SVÉ ÚDAJE z emailjs.com
    emailConfig: {
        serviceId: '',      // např. 'service_xxx'
        templateIdSubmit: '', // template pro potvrzení odeslání
        templateIdApproved: '', // template pro schválení
        publicKey: ''       // tvůj public key
    },

    // Hlavní texty stránky
    texts: {
        hero: {
            badge: "✨ Nová platforma pro passion projekty",
            title: "Sip. Code. Share.",
            subtitle: "Místo, kde se sdílí projekty vytvořené z radosti, ne pro zisk. Vzdělávací apky, pomocné nástroje, hry pro děti — cokoliv, co vzniklo v dobré náladě za pomoci vibecodingu (a třeba při skleničce vína)."
        },
        concept: {
            title: "Vibecoding pro radost",
            lead: "Ne každý projekt musí vydělávat. Některé vznikají prostě proto, že to tvůrce baví. WineCoding je platforma, kde tyto projekty najdou reálné uživatele.",
            cards: [
                {
                    icon: "lightbulb",
                    title: "Sdílej své nápady",
                    text: "Vytvořil/a jsi něco cool při večerním codingu? Nahraj to a poděl se s ostatními. Žádné složité procesy, žádné poplatky."
                },
                {
                    icon: "search",
                    title: "Objevuj poklady",
                    text: "Najdi vzdělávací hry pro děti, produktivní nástroje, kreativní apky — věci, které by jinak zůstaly schované na něčím GitHubu."
                },
                {
                    icon: "heart",
                    title: "Příběhy za kódem",
                    text: "Každý projekt má svůj příběh. Proč vznikl? Co autora inspirovalo? Tady nejde jen o kód, ale o lidi za ním."
                }
            ]
        },
        categories: {
            title: "Co tu najdeš?",
            subtitle: "Projekty všech barev a chutí — jako dobře vybavený wine bar"
        },
        story: {
            title: "Příběhy u vína",
            subtitle: "",
            quote: "Jednou večer, když dcera usnula, jsem si nalila skleničku vína a začala přemýšlet, jak jí usnadnit učení matematiky. Do půlnoci jsem měla hotovou první verzi hry s příklady. Teď ji používá celá její třída.",
            author: "Inspirační příběh",
            authorSub: ""
        },
        cta: {
            title: "Máš projekt, který stojí za sdílení?",
            subtitle: "Přidej ho na WineCoding, aby se mohl dostat k lidem, kterým pomůže nebo je pobaví. Žádné poplatky, žádné složitosti — jen tvůj projekt a jeho příběh.",
            note: ""
        },
        footer: {
            tagline: "Code with joy, share with love."
        }
    },

    // Kategorie projektů
    categories: [
        { id: "education", name: "Vzdělávání", description: "Apky pro děti, učební pomůcky, kvízy", color: "#E8B4B8" },
        { id: "home", name: "Domácnost", description: "Organizace, rodinný život, plánování", color: "#B8D4E8" },
        { id: "creative", name: "Kreativita", description: "Generátory, nástroje pro tvůrce", color: "#D4B8E8" },
        { id: "wellbeing", name: "Wellbeing", description: "Zdraví, mindfulness, habits", color: "#B8E8C4" },
        { id: "fun", name: "Zábava", description: "Hry, kvízy, fun projekty", color: "#E8D4B8" },
        { id: "utility", name: "Utility", description: "Pomocné nástroje, kalkulačky", color: "#C4C4C4" }
    ],

    // Admin heslo (v reálu by bylo na serveru)
    adminPassword: "wine2026",

    // Výchozí/ukázkové projekty
    defaultProjects: [
        {
            id: "1769167885674",
            name: "Bezpečná cesta domů",
            url: "https://bezpecnedomu.macaly.app",
            description: "Jednoduchá hra pro děti. Jak se chovat bezpečně při cestě domů. 8 situací, bodování, tipy a závěrečných 5 zlatých pravidel bezpečnosti.",
            category: "education",
            story: "Inspirovala mě Jasmína Houdek, když sdílela pravidla bezpečného chování, o kterých bychom měli mluvit s dětmi. Na základě screenshotu z LinkedInu vznikla tahle jednoduchá hra.",
            authorName: "Anonym",
            status: "approved",
            submittedAt: "2026-01-23T11:31:25.674Z",
            image: "" // will be auto-generated
        }
    ],

    // Pomocné funkce
    save() {
        localStorage.setItem('winecoding_texts', JSON.stringify(this.texts));
    },

    load() {
        const saved = localStorage.getItem('winecoding_texts');
        if (saved) {
            this.texts = JSON.parse(saved);
        }
    },

    // Projekty - kombinuje výchozí projekty s těmi z localStorage
    getProjects() {
        const localProjects = JSON.parse(localStorage.getItem('winecoding_projects') || '[]');
        
        // Přidáme výchozí projekty (s vygenerovanými obrázky)
        const defaultWithImages = this.defaultProjects.map(p => {
            const project = { ...p };
            if (!project.image) {
                project.image = this.generateProjectImage(project.name, project.description, project.category);
            }
            return project;
        });
        
        // Kombinujeme - filtrujeme duplicity podle názvu
        const allProjects = [...defaultWithImages];
        const defaultNames = defaultWithImages.map(p => p.name.toLowerCase());
        
        localProjects.forEach(lp => {
            if (!defaultNames.includes(lp.name.toLowerCase())) {
                if (!lp.image && lp.name && lp.description && lp.category) {
                    lp.image = this.generateProjectImage(lp.name, lp.description, lp.category);
                }
                allProjects.push(lp);
            }
        });
        
        return allProjects;
    },

    saveProject(project) {
        const projects = this.getProjects();
        project.id = Date.now().toString();
        project.status = 'pending';
        project.submittedAt = new Date().toISOString();
        projects.push(project);
        localStorage.setItem('winecoding_projects', JSON.stringify(projects));
        return project;
    },

    updateProject(id, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            localStorage.setItem('winecoding_projects', JSON.stringify(projects));
        }
    },

    getApprovedProjects(category = null) {
        let projects = this.getProjects().filter(p => p.status === 'approved');
        if (category) {
            projects = projects.filter(p => p.category === category);
        }
        return projects;
    },

    getPendingProjects() {
        return this.getProjects().filter(p => p.status === 'pending');
    },

    // Strip diacritics / special chars and translate to English keywords
    _simplifyText(text) {
        // Remove diacritics
        const stripped = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Keep only basic ASCII letters, numbers, spaces
        return stripped.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    },

    // Generate AI image using Pollinations.ai (short English prompts only)
    generateProjectImage(name, description, category) {
        const categoryStyles = {
            education: 'education kids learning colorful school',
            home: 'home family cozy domestic organization',
            creative: 'creative artistic design colorful paint',
            wellbeing: 'wellness health nature meditation peaceful',
            fun: 'fun games playful entertainment bright',
            utility: 'tools technology productivity digital modern'
        };
        
        const style = categoryStyles[category] || 'digital modern app';
        
        // Build SHORT English-only prompt (max ~120 chars to keep URL safe)
        const cleanName = this._simplifyText(name).substring(0, 30);
        const cleanDesc = this._simplifyText(description).substring(0, 40);
        
        const prompt = `minimalist flat illustration ${cleanName} ${cleanDesc} ${style} soft colors no text abstract`;
        
        // URL-encode the clean prompt
        const encoded = encodeURIComponent(prompt);
        
        // Consistent seed from name
        const seed = this.hashCode(name);
        
        return `https://image.pollinations.ai/prompt/${encoded}?width=600&height=400&seed=${seed}&nologo=true`;
    },

    // Hash string to number
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    // Odeslání emailu přes EmailJS
    async sendEmail(type, data) {
        if (!this.emailConfig.serviceId || !this.emailConfig.publicKey) {
            console.log('📧 Email by byl odeslán (EmailJS není nakonfigurovaný):', type, data);
            return { success: false, reason: 'not_configured' };
        }

        if (typeof emailjs === 'undefined') {
            console.warn('EmailJS knihovna není načtená');
            return { success: false, reason: 'library_not_loaded' };
        }

        try {
            const templateId = type === 'submit' 
                ? this.emailConfig.templateIdSubmit 
                : this.emailConfig.templateIdApproved;

            await emailjs.send(
                this.emailConfig.serviceId,
                templateId,
                data,
                this.emailConfig.publicKey
            );
            
            console.log('✅ Email odeslán:', type);
            return { success: true };
        } catch (error) {
            console.error('❌ Chyba při odesílání emailu:', error);
            return { success: false, error };
        }
    },

    async sendSubmitConfirmation(project) {
        if (!project.email) return;
        return this.sendEmail('submit', {
            to_email: project.email,
            to_name: project.authorName || 'Příteli',
            project_name: project.name,
            message: `Děkujeme za přidání projektu "${project.name}" na WineCoding! Tvůj projekt nyní projde rychlou kontrolou. Jakmile bude schválen, dáme ti vědět.`
        });
    },

    async sendApprovalEmail(project) {
        if (!project.email) return;
        return this.sendEmail('approved', {
            to_email: project.email,
            to_name: project.authorName || 'Příteli',
            project_name: project.name,
            project_url: project.url,
            message: `Skvělá zpráva! Tvůj projekt "${project.name}" byl schválen a je nyní živý na WineCoding. Díky, že sdílíš svou práci s komunitou!`
        });
    }
};

// Load saved texts and email config on init
WineCodeData.load();

const savedEmailConfig = localStorage.getItem('winecoding_email_config');
if (savedEmailConfig) {
    WineCodeData.emailConfig = JSON.parse(savedEmailConfig);
}
