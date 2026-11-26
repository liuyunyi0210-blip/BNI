alter table member_submissions
  add column if not exists edit_token text not null default '';

update member_submissions
set edit_token = md5(random()::text || id::text || clock_timestamp()::text)
where edit_token = '';

create index if not exists member_submissions_edit_token_idx
  on member_submissions (edit_token)
  where status = 'pending' and edit_token <> '';
