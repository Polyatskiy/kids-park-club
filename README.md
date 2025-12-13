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

## 🌍 Internationalization (i18n)

This project uses `next-intl` for internationalization with the following setup:

### Supported Locales
- **English (en)** - Default locale, accessible without prefix (e.g., `/`, `/coloring`)
- **Polish (pl)** - Accessible at `/pl`, `/pl/coloring`, etc.
- **Russian (ru)** - Accessible at `/ru`, `/ru/coloring`, etc.
- **Ukrainian (uk)** - Accessible at `/uk`, `/uk/coloring`, etc.

### How It Works
- **Locale Detection**: The system detects locale in this order:
  1. URL prefix (e.g., `/pl/coloring`)
  2. Cookie (`NEXT_LOCALE`)
  3. Browser `Accept-Language` header
  4. Default (English)

- **Routing**: English routes have no prefix, other locales use `/pl`, `/ru`, `/uk` prefixes.

- **Safe Fallbacks**: Missing translation keys automatically fall back to English, preventing blank UI or crashes.

### Adding a New Locale

1. **Add locale to routing config** (`i18n/routing.ts`):
   ```typescript
   locales: ['en', 'pl', 'ru', 'uk', 'de'], // Add 'de' for German
   ```

2. **Create translation file** (`messages/de.json`):
   ```json
   {
     "common": {
       "home": "Startseite",
       "coloring": "Ausmalbilder",
       ...
     }
   }
   ```

3. **Update locale names** in `components/language-switcher.tsx`:
   ```typescript
   const LOCALE_NAMES: Record<string, string> = {
     ...
     de: "DE",
   };
   ```

4. **Add translations**: Copy structure from `messages/en.json` and translate all keys.

### Adding Translation Keys

1. **Add to English** (`messages/en.json`):
   ```json
   {
     "common": {
       "newKey": "New Text"
     }
   }
   ```

2. **Add to other locales** (`messages/pl.json`, `messages/ru.json`, etc.):
   ```json
   {
     "common": {
       "newKey": "Nowy Tekst" // Polish translation
     }
   }
   ```

3. **Use in components**:
   ```typescript
   import { useTranslations } from "next-intl";
   
   const t = useTranslations("common");
   return <div>{t("newKey")}</div>;
   ```

### Using Locale-Aware Navigation

Always use the `Link` component from `@/i18n/routing` instead of `next/link`:

```typescript
import { Link } from "@/i18n/routing";

<Link href="/coloring">Coloring</Link> // Automatically includes locale prefix
```

## ☁️ Деплой на Vercel

1. Залей репозиторий на GitHub.
2. В Vercel создай новый проект и выбери этот репозиторий.
3. В разделе Environment Variables добавь переменные из `.env.local`.
4. Нажми Deploy.
