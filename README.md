# Kids Fun Hub

Детская платформа с разукрасками, аудиосказками, книгами и мини-играми.  
Стек: Next.js 14 (App Router) + React + TypeScript + Tailwind + Supabase.



```bash
npm install
npm run dev
```

По умолчанию проект доступен на http://localhost:3000.

## ⚙️ Настройка Supabase

1. Создай проект в Supabase.
2. В настройках API скопируй:
   - `Project URL`
   - `anon public key`
   - `service_role key`.
3. Создай файл `.env.local` и добавь:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Создай таблицы:

```sql
create table coloring (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text,
  file_path text not null
);

create table audio_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  duration text,
  description text,
  audio_url text not null
);

create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  cover_color text,
  pages jsonb
);
```

5. В Supabase Storage создай bucket, например `audio`, и загружай туда mp3.  
   Публичный URL используй как `audio_url`.

> Если Supabase недоступен или таблицы пустые — проект использует локальные seed-данные из `/data`.

## 🔐 Авторизация

Supabase Auth по email/password.

- Регистрация: `/auth/register`
- Вход: `/auth/login`

## ☁️ Деплой на Vercel

1. Залей репозиторий на GitHub.
2. В Vercel создай новый проект и выбери этот репозиторий.
3. В разделе Environment Variables добавь переменные из `.env.local`.
4. Нажми Deploy.
