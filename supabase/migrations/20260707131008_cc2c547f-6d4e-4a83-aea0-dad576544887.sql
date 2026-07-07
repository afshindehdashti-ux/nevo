create or replace function public.get_backend_health_metrics()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  q_auth bigint := 0;
  q_tx bigint := 0;
  q_auth_dlq bigint := 0;
  q_tx_dlq bigint := 0;
  cron_jobname text;
  cron_schedule text;
  cron_active boolean;
  result jsonb;
begin
  begin execute 'select count(*) from pgmq.q_auth_emails' into q_auth;
  exception when others then q_auth := 0; end;
  begin execute 'select count(*) from pgmq.q_transactional_emails' into q_tx;
  exception when others then q_tx := 0; end;
  begin execute 'select count(*) from pgmq.q_auth_emails_dlq' into q_auth_dlq;
  exception when others then q_auth_dlq := 0; end;
  begin execute 'select count(*) from pgmq.q_transactional_emails_dlq' into q_tx_dlq;
  exception when others then q_tx_dlq := 0; end;

  begin
    execute $sql$
      select jobname, schedule, active from cron.job
      where jobname = 'process-email-queue' limit 1
    $sql$ into cron_jobname, cron_schedule, cron_active;
  exception when others then
    cron_jobname := null;
  end;

  result := jsonb_build_object(
    'queues', jsonb_build_object(
      'auth_emails', q_auth,
      'transactional_emails', q_tx,
      'auth_emails_dlq', q_auth_dlq,
      'transactional_emails_dlq', q_tx_dlq
    ),
    'cron', case
      when cron_jobname is not null then jsonb_build_object(
        'scheduled', true,
        'jobname', cron_jobname,
        'schedule', cron_schedule,
        'active', cron_active
      )
      else jsonb_build_object('scheduled', false)
    end,
    'server_time', now()
  );
  return result;
end;
$$;

revoke all on function public.get_backend_health_metrics() from public, anon, authenticated;
grant execute on function public.get_backend_health_metrics() to service_role;