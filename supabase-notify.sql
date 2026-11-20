-- WineCoding: e-mailová upozornění (spouští funkci https://winecoding.com/api/notify)
-- Tajný klíč je jen v lokální verzi supabase-notify.local.sql (není na GitHubu)
-- a ve Vercelu v proměnné WEBHOOK_SECRET. Zde je místo něj ZDE_TAJNY_KLIC.

create extension if not exists pg_net;

create or replace function public.notify_project_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform net.http_post(
        url := 'https://winecoding.com/api/notify',
        body := jsonb_build_object(
            'type', tg_op,
            'record', to_jsonb(new),
            'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end
        ),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', 'ZDE_TAJNY_KLIC'
        ),
        timeout_milliseconds := 10000
    );
    return new;
end;
$$;

drop trigger if exists projects_notify on public.projects;
create trigger projects_notify
    after insert or update of status on public.projects
    for each row execute function public.notify_project_change();
