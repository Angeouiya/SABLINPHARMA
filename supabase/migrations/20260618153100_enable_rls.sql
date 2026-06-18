do $$
declare
  table_record record;
begin
  for table_record in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
      and tablename <> '_prisma_migrations'
  loop
    execute format('alter table %I.%I enable row level security', table_record.schemaname, table_record.tablename);
  end loop;
end $$;

revoke all on schema public from anon;
revoke all on schema public from authenticated;
