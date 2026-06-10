// WineCoding — datová vrstva nad Supabase (ES module)
// Vystaví globální `window.WineDB` a po inicializaci vyšle událost `winedb-ready`.
// Pokud není Supabase nakonfigurován (config.js prázdný), WineDB.configured === false
// a stránky se vrátí k localStorage fallbacku (WineCodeData).

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const cfg = window.SUPABASE_CONFIG || {};
const supabase = (cfg.url && cfg.anonKey) ? createClient(cfg.url, cfg.anonKey) : null;

// Převod řádku z DB (snake_case) na tvar používaný ve front-endu (camelCase)
function mapRow(r) {
    return {
        id: r.id,
        name: r.name,
        url: r.url,
        description: r.description,
        category: r.category,
        story: r.story || '',
        authorName: r.author_name || '',
        email: r.email || '',
        status: r.status,
        submittedAt: r.created_at,
        image: r.image || ''
    };
}

const WineDB = {
    configured: !!supabase,

    // --- Čtení ---
    async getApprovedProjects(category = null) {
        let q = supabase.from('projects')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
        if (category) q = q.eq('category', category);
        const { data, error } = await q;
        if (error) throw error;
        return data.map(mapRow);
    },

    async getAllProjects() {
        const { data, error } = await supabase.from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(mapRow);
    },

    async getPendingProjects() {
        const { data, error } = await supabase.from('projects')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(mapRow);
    },

    // --- Zápis ---
    async submitProject(p) {
        const row = {
            name: p.name,
            url: p.url,
            description: p.description,
            category: p.category,
            story: p.story || null,
            author_name: p.authorName || null,
            email: p.email || null,
            status: 'pending',
            image: p.image || null
        };
        // Bez .select() — anon nemá právo číst 'pending' řádky (RLS),
        // takže vracení reprezentace by selhalo. Stačí potvrzení bez chyby.
        const { error } = await supabase.from('projects').insert(row);
        if (error) throw error;
    },

    async updateStatus(id, status) {
        const { error } = await supabase.from('projects')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    },

    async updateImage(id, image) {
        const { error } = await supabase.from('projects')
            .update({ image })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteProject(id) {
        const { error } = await supabase.from('projects')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- Admin autentizace ---
    async login(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    },

    async logout() {
        if (supabase) await supabase.auth.signOut();
    },

    async isLoggedIn() {
        if (!supabase) return false;
        const { data } = await supabase.auth.getSession();
        return !!data.session;
    }
};

window.WineDB = WineDB;
window.dispatchEvent(new Event('winedb-ready'));
