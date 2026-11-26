create table if not exists members (
  id bigserial primary key,
  name text not null,
  chapter text not null default '',
  role text not null default '',
  company text not null default '',
  industry text not null default '',
  chain text not null default '',
  have text not null default '',
  want text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists members_name_chapter_active_uidx
  on members (lower(name), lower(chapter))
  where active;

create index if not exists members_chapter_idx on members (chapter) where active;
create index if not exists members_updated_idx on members (updated_at desc);

create table if not exists events (
  id bigserial primary key,
  title text not null,
  group_size int not null default 4,
  rounds int not null default 3,
  plan_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists feedback_edges (
  id bigserial primary key,
  event_id bigint references events (id) on delete cascade,
  round int not null,
  giver text not null,
  receiver text not null,
  kind text not null check (kind in ('network', 'business')),
  created_at timestamptz not null default now()
);

create unique index if not exists feedback_edges_dedupe_uidx
  on feedback_edges (event_id, round, giver, receiver, kind);
