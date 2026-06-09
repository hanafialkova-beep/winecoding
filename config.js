// WineCoding — konfigurace Supabase
// Vyplň hodnoty z Supabase → Project Settings → API.
// Anon (publishable) klíč je VEŘEJNÝ a je bezpečné ho mít zde — data
// chrání Row Level Security pravidla v databázi (viz supabase-schema.sql).
//
// Dokud jsou hodnoty prázdné, web jede ve "fallback" režimu (localStorage).

window.SUPABASE_CONFIG = {
    url: '',       // např. 'https://abcdxyz.supabase.co'
    anonKey: ''    // dlouhý 'eyJ...' řetězec (anon / publishable key)
};
