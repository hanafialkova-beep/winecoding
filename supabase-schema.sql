-- ============================================
-- WineCoding — Supabase schéma (Fáze 1: sdílená data)
-- Zkopíruj celý obsah do Supabase → SQL Editor → Run
-- ============================================

-- 1) Tabulka projektů ------------------------------------------------
create table if not exists public.projects (
    id           uuid primary key default gen_random_uuid(),
    created_at   timestamptz not null default now(),
    name         text not null,
    url          text not null,
    description  text not null,
    category     text not null,
    story        text,
    author_name  text,
    email        text,
    status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
    image        text
);

-- Rychlejší filtrování galerie podle stavu
create index if not exists projects_status_idx on public.projects (status);

-- Délkové limity + povolené kategorie (tvrdá pojistka na úrovni DB —
-- formulář má maxlength, ale ten jde obejít přímým voláním API)
alter table public.projects drop constraint if exists projects_name_len;
alter table public.projects add constraint projects_name_len
    check (char_length(name) between 1 and 80);

alter table public.projects drop constraint if exists projects_url_len;
alter table public.projects add constraint projects_url_len
    check (char_length(url) between 1 and 300);

alter table public.projects drop constraint if exists projects_description_len;
alter table public.projects add constraint projects_description_len
    check (char_length(description) between 1 and 600);

alter table public.projects drop constraint if exists projects_story_len;
alter table public.projects add constraint projects_story_len
    check (story is null or char_length(story) <= 1500);

alter table public.projects drop constraint if exists projects_author_len;
alter table public.projects add constraint projects_author_len
    check (author_name is null or char_length(author_name) <= 60);

alter table public.projects drop constraint if exists projects_email_len;
alter table public.projects add constraint projects_email_len
    check (email is null or char_length(email) <= 120);

alter table public.projects drop constraint if exists projects_category_allowed;
alter table public.projects add constraint projects_category_allowed
    check (category in ('education', 'home', 'creative', 'wellbeing', 'fun', 'utility'));

-- Obrázek je malé SVG data URI (~1 kB) nebo cesta k assetu; 10 kB bohatě stačí
alter table public.projects drop constraint if exists projects_image_len;
alter table public.projects add constraint projects_image_len
    check (image is null or char_length(image) <= 10000);

-- 2) Row Level Security ----------------------------------------------
alter table public.projects enable row level security;

-- Pomocná funkce: je aktuálně přihlášený uživatel admin?
-- Admin = konkrétní e-mail v JWT tokenu. Tím je admin omezen na JEDEN účet,
-- i kdyby si někdo přes veřejný anon klíč založil další (role authenticated).
-- Pokud změníš admin e-mail, uprav ho jen tady na jednom místě.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
    select coalesce(auth.jwt() ->> 'email', '') = 'hana.fialkova@ef1.cz';
$$;

-- Kdokoliv (anon i přihlášený) vidí POUZE schválené projekty
drop policy if exists "public can read approved" on public.projects;
create policy "public can read approved"
    on public.projects
    for select
    to anon, authenticated
    using (status = 'approved');

-- Admin vidí všechny projekty (i pending/rejected)
drop policy if exists "admin can read all" on public.projects;
create policy "admin can read all"
    on public.projects
    for select
    to authenticated
    using (public.is_admin());

-- Kdokoliv může přidat projekt, ale POUZE jako 'pending'
-- (nikdo zvenčí si nemůže rovnou schválit vlastní projekt)
drop policy if exists "anyone can submit pending" on public.projects;
create policy "anyone can submit pending"
    on public.projects
    for insert
    to anon, authenticated
    with check (status = 'pending');

-- Měnit (schválit/zamítnout) může jen admin
drop policy if exists "admin can update" on public.projects;
create policy "admin can update"
    on public.projects
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Mazat může jen admin
drop policy if exists "admin can delete" on public.projects;
create policy "admin can delete"
    on public.projects
    for delete
    to authenticated
    using (public.is_admin());

-- 3) Ukázkový (první) projekt ----------------------------------------
insert into public.projects (name, url, description, category, story, author_name, status, image)
select
    'Bezpečná cesta domů',
    'https://bezpecnedomu.macaly.app',
    'Jednoduchá hra pro děti. Jak se chovat bezpečně při cestě domů. 8 situací, bodování, tipy a závěrečných 5 zlatých pravidel bezpečnosti.',
    'education',
    'Inspirovala mě Jasmína Houdek, když sdílela pravidla bezpečného chování, o kterých bychom měli mluvit s dětmi. Na základě screenshotu z LinkedInu vznikla tahle jednoduchá hra.',
    'Anonym',
    'approved',
    'assets/project-bezpecna-cesta.png'
where not exists (
    select 1 from public.projects where name = 'Bezpečná cesta domů'
);
