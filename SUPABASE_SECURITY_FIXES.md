# Исправление проблем безопасности Supabase

## Проблема 1: Function Search Path Mutable ⚠️

**Проблема:** Функция `update_updated_at_column` имеет изменяемый `search_path`, что может привести к атакам через манипуляцию search_path.

**Решение:** Установить фиксированный `search_path` в определении функции.

### Как исправить:

#### Способ 1: Через Supabase Dashboard (РЕКОМЕНДУЕТСЯ)

1. Откройте **Supabase Dashboard** → ваш проект → **SQL Editor**
2. Нажмите **"New query"**
3. Вставьте и выполните следующий SQL:

```sql
-- Исправление функции с фиксированным search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

4. Нажмите **"Run"**
5. Проверьте результат: должно быть "Success"

#### Способ 2: Через Supabase CLI

```bash
cd C:\Users\Povelitelnica\Documents\kids-park-club
supabase db push
```

---

## Проблема 2: Leaked Password Protection Disabled ⚠️

**Проблема:** Защита от использования утечек паролей отключена в Auth.

**Решение:** Включить в настройках Supabase Auth.

### Как исправить:

1. Откройте **Supabase Dashboard** → ваш проект
2. Перейдите в **Authentication** → **Policies** (или **Settings**)
3. Найдите раздел **"Password Security"** или **"Leaked Password Protection"**
4. Включите опцию **"Leaked Password Protection"** / **"Check passwords against Have I Been Pwned"**
5. Сохраните изменения

**Альтернативный путь:**
- **Authentication** → **Settings** → **Password Security**
- Включите **"Leaked Password Protection"**

Эта функция проверяет пароли пользователей против базы данных HaveIBeenPwned.org, чтобы предотвратить использование скомпрометированных паролей.

---

## Проверка исправлений

### Проверка функции:

Выполните в SQL Editor:

```sql
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'update_updated_at_column';
```

В определении функции должно быть: `SET search_path = public`

### Проверка Auth настроек:

1. Перейдите в **Authentication** → **Settings**
2. Убедитесь, что **"Leaked Password Protection"** включена (Enabled/ON)

---

## Примечания

- Исправление функции безопасно: функция только обновляет timestamp
- `SECURITY DEFINER` здесь безопасен, так как функция не выполняет чувствительных операций
- Фиксированный `search_path` предотвращает атаки через манипуляцию search_path
- Защита от утечек паролей работает автоматически после включения

