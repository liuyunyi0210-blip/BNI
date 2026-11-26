create table if not exists member_submissions (
  id bigserial primary key,
  name text not null,
  chapter text not null default '',
  role text not null default '',
  company text not null default '',
  industry text not null default '',
  chain text not null default '',
  have text not null default '',
  want text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index if not exists member_submissions_pending_name_chapter_uidx
  on member_submissions (lower(name), lower(chapter))
  where status = 'pending';

create index if not exists member_submissions_status_idx
  on member_submissions (status, created_at desc);
