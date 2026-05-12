-- Make city and region nullable — remove hardcoded defaults
alter table public.spaces
  alter column city drop not null,
  alter column city drop default,
  alter column region drop not null,
  alter column region drop default;
