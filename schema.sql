-- =========================================================================
-- CREATIVE FREELANCER OS - DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- =========================================================================
-- Bu SQL kodlarını Supabase projenizin SQL Editor kısmına yapıştırıp çalıştırın.
-- =========================================================================

-- 1. KULLANICI PROFİLLERİ (USERS)
-- auth.users tablosuyla eşleşen profil tablosu
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar text,
  created_at timestamp with time zone default now()
);

-- 2. MÜŞTERİLER (CLIENTS)
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  instagram text,
  company text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 3. PROJELER / İŞLER (PROJECTS)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'Yeni Talep', -- 'Yeni Talep', 'Görüşme', 'Teklif Gönderildi', 'Onaylandı', 'Çekim Planlandı', 'Çekim Yapıldı', 'Kurgu Süreci', 'Revize', 'Teslim Edildi', 'Ödeme Bekliyor', 'Tamamlandı'
  project_type text,
  priority text default 'Orta', -- 'Düşük', 'Orta', 'Yüksek'
  price numeric default 0,
  expense numeric default 0,
  net_profit numeric default 0,
  start_date date,
  due_date date,
  completed boolean default false,
  -- Medya Linkleri
  drive_link text,
  frameio_link text,
  moodboard_link text,
  created_at timestamp with time zone default now()
);

-- 4. YAPILACAK GÖREVLER (TASKS)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  due_date date,
  created_at timestamp with time zone default now()
);

-- 5. REVİZYON NOTLARI (REVISIONS)
create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  note text not null,
  created_at timestamp with time zone default now()
);

-- 6. FİNANSAL İŞLEMLER / GELİR-GİDER (TRANSACTIONS)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  type text not null, -- 'Gelir' veya 'Gider'
  category text not null,
  amount numeric not null default 0,
  note text,
  created_at timestamp with time zone default now()
);

-- 7. TAKVİM ETKİNLİKLERİ (CALENDAR EVENTS)
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  event_type text not null, -- 'Çekim', 'Teslim', 'Toplantı', 'Ödeme', 'Revize'
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null
);

-- 8. BİLDİRİMLER (NOTIFICATIONS)
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  body text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS (ROW LEVEL SECURITY) ETKİNLEŞTİRME
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.revisions enable row level security;
alter table public.transactions enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notifications enable row level security;

-- POLICIES (Kullanıcılar sadece kendi verilerini görebilir/değiştirebilir)
create policy "Users can see own profile" on public.users for all using (auth.uid() = id);
create policy "Users can see own clients" on public.clients for all using (auth.uid() = user_id);
create policy "Users can see own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can see own tasks" on public.tasks for all using (
  exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid())
);
create policy "Users can see own revisions" on public.revisions for all using (
  exists (select 1 from public.projects where projects.id = revisions.project_id and projects.user_id = auth.uid())
);
create policy "Users can see own transactions" on public.transactions for all using (auth.uid() = user_id);
create policy "Users can see own calendar_events" on public.calendar_events for all using (auth.uid() = user_id);
create policy "Users can see own notifications" on public.notifications for all using (auth.uid() = user_id);

-- GÜVENLİK TETİKLEYİCİSİ (TRIGGER)
-- Yeni bir kullanıcı kaydolduğunda otomatik olarak public.users profilini oluştur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Kullanıcı'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- 9. TEKLİFLER / CRM (PROPOSALS) TABLOSU
-- =========================================================================
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  project_idea text,
  proposal_amount numeric not null default 0,
  status text not null default 'Teklif Hazırlanıyor', -- 'Teklif Hazırlanıyor', 'Teklif Gönderildi', 'Onay Bekliyor', 'Onaylandı', 'Reddedildi'
  contact_date date not null default current_date,
  project_type text, -- 'Kurgu', 'Çekim', 'Web Tasarım' vb.
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- RLS ETKİNLEŞTİRME
alter table public.proposals enable row level security;

-- POLICIES
create policy "Users can see own proposals" on public.proposals for all using (auth.uid() = user_id);

-- =========================================================================
-- 10. PROJELER GÜNCELLEMESİ (ARŞİV VE REVİZYON SÜTUNLARI)
-- =========================================================================
alter table public.projects add column if not exists backup_disk text;
alter table public.projects add column if not exists revision_count integer default 0;

-- =========================================================================
-- 11. EKİPMAN VE REZERVASYON MODÜLLERİ (EQUIPMENT & BOOKINGS)
-- =========================================================================
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  status text not null default 'Aktif', -- 'Aktif', 'Bakımda', 'Pasif'
  notes text,
  created_at timestamp with time zone default now()
);

create table public.equipment_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  equipment_id uuid references public.equipment(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone default now()
);

-- RLS ETKİNLEŞTİRME
alter table public.equipment enable row level security;
alter table public.equipment_bookings enable row level security;

-- POLICIES
create policy "Users can see own equipment" on public.equipment for all using (auth.uid() = user_id);
create policy "Users can see own equipment bookings" on public.equipment_bookings for all using (auth.uid() = user_id);

-- =========================================================================
-- 12. ARŞİVLEME SÜTUNLARI VE GÜNCELLEMELERİ
-- =========================================================================
alter table public.transactions add column if not exists archived boolean default false;


-- =========================================================================
-- 13. GÜNDELİK PLAN VE MİKRO GÖREVLER (GOREVLER) TABLOSU
-- =========================================================================
create table if not exists public.gorevler (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  proje_id uuid references public.projects(id) on delete cascade, -- Opsiyonel (alt görev ilişkisi için)
  gorev_adi text not null,
  detay text,
  kategori text not null check (kategori in ('Prodüksiyon', 'Sosyal Medya', 'Vize', 'Kişisel / Rutin')),
  sutun_durumu text not null check (sutun_durumu in ('Yapılmayı Bekleyenler', 'Yapılacaklar', 'Yapılıyor', 'Test', 'Tamamlandı')),
  planlanan_tarih date not null,
  oncelik text not null check (oncelik in ('Düşük', 'Orta', 'Yüksek')),
  checklist jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- RLS ETKİNLEŞTİRME
alter table public.gorevler enable row level security;

-- POLICIES
create policy "Users can see own gorevler" on public.gorevler for all using (auth.uid() = user_id);


