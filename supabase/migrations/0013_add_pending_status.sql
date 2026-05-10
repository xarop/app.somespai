alter table spaces drop constraint if exists spaces_status_check;
alter table spaces add constraint spaces_status_check
  check (status in ('active', 'paused', 'removed', 'pending'));
