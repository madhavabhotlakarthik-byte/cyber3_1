# Cybersecurity Attendance

> **Made by Karthik — Cyber Security branch, DRK Institute of Science and Technology**

Class attendance management portal for Cyber Security 3-1 at DRK Institute of Science and Technology.

## Tech Stack

- **React 19** with **TanStack Start** v1
- **Tailwind CSS** 4
- **Supabase** (PostgreSQL)
- **shadcn/ui** components
- **TanStack Query** for data fetching
- **TanStack Router** for routing

## Local Setup

```sh
git clone <your-repo-url>
cd cybersecurity-attendance
npm install
```

## Environment Variables

Create a `.env` file with your own Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ATTENDANCE_ADMIN_EMAIL=your_admin_email
ATTENDANCE_ADMIN_PASSWORD=your_admin_password
ATTENDANCE_SESSION_SECRET=your_random_session_secret
```

### Environment Variables Explained

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (public) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key — **never expose in frontend** |
| `ATTENDANCE_ADMIN_EMAIL` | Admin login email |
| `ATTENDANCE_ADMIN_PASSWORD` | Admin login password |
| `ATTENDANCE_SESSION_SECRET` | Random string for session encryption |

## Supabase Setup

### Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Students table
create table public.students (
  id uuid primary key default gen_random_uuid(),
  roll_number text not null unique,
  name text not null,
  section text not null check (section in ('main', 'l_section')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.students to anon;
grant select on public.students to authenticated;
grant all on public.students to service_role;

alter table public.students enable row level security;

create policy "Anyone can view active students"
on public.students
for select
to anon, authenticated
using (active = true);

-- Attendance table
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_date date not null,
  is_present boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

grant select on public.attendance to anon;
grant select on public.attendance to authenticated;
grant all on public.attendance to service_role;

alter table public.attendance enable row level security;

create policy "Anyone can view attendance"
on public.attendance
for select
to anon, authenticated
using (true);

create index attendance_date_idx on public.attendance (attendance_date);
create index attendance_student_idx on public.attendance (student_id);

create or replace function public.update_attendance_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_students_updated_at
before update on public.students
for each row execute function public.update_attendance_updated_at();

create trigger update_attendance_updated_at
before update on public.attendance
for each row execute function public.update_attendance_updated_at();
```

### Seed Student Data

Insert your students into the `students` table. The application includes seed data for the Cyber Security 3-1 class.

## Development

```sh
npm run dev
```

Open http://localhost:3000

## Production Build

```sh
npm run build
npm run preview
```

## Deployment

This project can be deployed to **Vercel**:

1. Push to a GitHub repository
2. Import into Vercel
3. Set environment variables in Vercel project settings
4. Deploy

## Admin Usage

- Navigate to `/admin/dashboard`
- Log in with your admin credentials
- Select a date, mark attendance, and save
- Public users can view attendance at the homepage

## Features

- Dark mode toggle
- Mobile-first admin interface
- Keyboard shortcuts (press `?` to see them)
- Attendance percentage calculation
- Search by roll number or name
- Attendance history
- Cookie consent banner
- Toast notifications
- Responsive design
