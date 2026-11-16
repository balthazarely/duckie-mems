-- Create posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  name text not null check (length(name) <= 80),
  caption text check (caption is null or length(caption) <= 2000),
  image_url text
);

-- Create comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  post_id uuid not null references posts on delete cascade,
  name text not null check (length(name) <= 80),
  message text not null check (length(message) <= 1000)
);

-- Enable RLS
alter table posts enable row level security;
alter table comments enable row level security;

-- Posts policies
create policy "anyone can view posts" on posts for select using (true);
create policy "anyone can post" on posts for insert with check (true);

-- Comments policies
create policy "anyone can view comments" on comments for select using (true);
create policy "anyone can comment" on comments for insert with check (true);

-- Storage bucket for photos (run in Supabase console after creating bucket)
-- Then apply this policy to the "photos" bucket:
-- create policy "allow anon uploads" on storage.objects for insert with check (
--   bucket_id = 'photos'
--   and (storage.foldername(name))[1] = 'public'
--   and storage.extension(name) in ('jpg', 'jpeg', 'png', 'gif', 'webp')
--   and (storage.size(name)) <= 10485760
-- );
-- create policy "allow anon read" on storage.objects for select using (
--   bucket_id = 'photos'
-- );
