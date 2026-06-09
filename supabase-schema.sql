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

-- 2) Row Level Security ----------------------------------------------
alter table public.projects enable row level security;

-- Veřejnost (anon) vidí POUZE schválené projekty
drop policy if exists "public can read approved" on public.projects;
create policy "public can read approved"
    on public.projects
    for select
    to anon
    using (status = 'approved');

-- Přihlášený admin vidí všechny projekty (i pending/rejected)
drop policy if exists "admin can read all" on public.projects;
create policy "admin can read all"
    on public.projects
    for select
    to authenticated
    using (true);

-- Kdokoliv může přidat projekt, ale POUZE jako 'pending'
-- (nikdo zvenčí si nemůže rovnou schválit vlastní projekt)
drop policy if exists "anyone can submit pending" on public.projects;
create policy "anyone can submit pending"
    on public.projects
    for insert
    to anon, authenticated
    with check (status = 'pending');

-- Měnit (schválit/zamítnout) může jen přihlášený admin
drop policy if exists "admin can update" on public.projects;
create policy "admin can update"
    on public.projects
    for update
    to authenticated
    using (true)
    with check (true);

-- Mazat může jen přihlášený admin
drop policy if exists "admin can delete" on public.projects;
create policy "admin can delete"
    on public.projects
    for delete
    to authenticated
    using (true);

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
