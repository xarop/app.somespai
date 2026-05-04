-- Allow admin-imported spaces without an owner
alter table spaces alter column owner_id drop not null;
