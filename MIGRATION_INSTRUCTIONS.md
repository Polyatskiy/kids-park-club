# Как запустить SQL миграцию в Supabase

## Способ 1: SQL Editor (Рекомендуется для начала)

### Шаги:

1. **Откройте Supabase Dashboard**
   - Перейдите на https://supabase.com/dashboard
   - Войдите в свой аккаунт
   - Выберите проект `kids-park-club` (или ваш проект)

2. **Откройте SQL Editor**
   - В левом меню найдите **"SQL Editor"** (иконка с символом `</>`)
   - Нажмите на него

3. **Создайте новый запрос**
   - Нажмите кнопку **"New query"** или **"+"**

4. **Скопируйте содержимое миграции**
   - Откройте файл `supabase/migrations/001_content_i18n_schema.sql`
   - Скопируйте **весь** содержимый файла (Ctrl+A, Ctrl+C)

5. **Вставьте SQL в редактор**
   - Вставьте скопированный SQL в SQL Editor (Ctrl+V)

6. **Запустите миграцию**
   - Нажмите кнопку **"Run"** (или Ctrl+Enter)
   - Дождитесь завершения выполнения

7. **Проверьте результат**
   - Должно появиться сообщение об успешном выполнении
   - Проверьте, что таблицы созданы: перейдите в **"Table Editor"** и убедитесь, что видны новые таблицы:
     - `categories`
     - `category_i18n`
     - `subcategories`
     - `subcategory_i18n`
     - `items`
     - `item_i18n`

---

## Способ 2: Supabase CLI (Для разработчиков)

Если у вас установлен Supabase CLI:

### Установка CLI (если еще не установлен):

```bash
# Windows (PowerShell)
npm install -g supabase

# Или через Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Шаги:

1. **Войдите в Supabase CLI**
   ```bash
   supabase login
   ```

2. **Свяжите проект**
   ```bash
   cd c:\Users\polya\Documents\kids-park-club
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Project ref можно найти в URL проекта: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`)

3. **Запустите миграцию**
   ```bash
   supabase db push
   ```
   
   Или напрямую:
   ```bash
   supabase migration up
   ```

---

## Способ 3: Прямое выполнение через psql (Продвинутый)

Если у вас есть доступ к базе данных через psql:

1. **Получите connection string**
   - В Supabase Dashboard: Settings → Database
   - Скопируйте "Connection string" (URI или Session mode)

2. **Выполните миграцию**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/001_content_i18n_schema.sql
   ```

---

## ⚠️ Важные предупреждения

### Перед запуском миграции:

1. **Сделайте резервную копию базы данных**
   - В Supabase Dashboard: Settings → Database → Backups
   - Или экспортируйте данные через SQL Editor

2. **Проверьте, что у вас нет важных данных**
   - Миграция содержит `DROP TABLE IF EXISTS` - это удалит старые таблицы!
   - Если у вас есть данные в старых таблицах (`coloring_items`, `puzzle_items`), их нужно будет мигрировать вручную

3. **Убедитесь, что вы в правильном проекте**
   - Проверьте название проекта в верхней части Dashboard

---

## После выполнения миграции

### Проверка:

1. **Проверьте таблицы**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('categories', 'category_i18n', 'subcategories', 'subcategory_i18n', 'items', 'item_i18n');
   ```

2. **Проверьте индексы**
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename IN ('categories', 'items');
   ```

3. **Проверьте RLS политики**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

### Создание Storage Buckets:

После миграции создайте bucket'ы для хранения файлов:

1. Перейдите в **Storage** в левом меню
2. Создайте bucket:
   - Название: `coloring`
   - Public: ✅ (включено)
3. Создайте второй bucket:
   - Название: `puzzles`
   - Public: ✅ (включено)

---

## Если что-то пошло не так

### Откат миграции:

Если нужно откатить изменения, выполните:

```sql
-- Удалить все созданные таблицы
DROP TABLE IF EXISTS item_i18n CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS subcategory_i18n CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS category_i18n CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Удалить функцию
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

### Частые ошибки:

1. **"relation already exists"**
   - Таблицы уже существуют - сначала удалите их или используйте `DROP TABLE IF EXISTS`

2. **"permission denied"**
   - Убедитесь, что используете правильные права доступа
   - Проверьте, что вы вошли в правильный проект

3. **"syntax error"**
   - Проверьте, что скопировали весь файл целиком
   - Убедитесь, что нет лишних символов

---

## Следующие шаги

После успешной миграции:

1. ✅ Создайте Storage buckets (`coloring` и `puzzles`)
2. ✅ Создайте первую категорию через `/admin/categories`
3. ✅ Загрузите первый контент через `/admin/items`
4. ✅ Проверьте, что все работает на публичных страницах

---

## Нужна помощь?

Если возникли проблемы:
- Проверьте логи в Supabase Dashboard → Logs
- Убедитесь, что все переменные окружения настроены
- Проверьте, что RLS политики правильно настроены
