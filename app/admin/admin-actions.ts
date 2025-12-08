"use server";

import { supabaseServer } from "@/lib/supabaseClient";
import sharp from "sharp";
import { randomUUID } from "crypto";
import slugify from "slugify";

// =============================================
//  ХЕЛПЕР: Генерация миниатюры из Buffer
// =============================================
async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(300, 300, { fit: "cover" })
    .jpeg({ quality: 80 })
    .toBuffer();
}

// =============================================
//  ДОБАВЛЕНИЕ НОВОЙ РАСКРАСКИ (авто-миниатюры)
// =============================================
export async function uploadItem(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const subcategory = formData.get("subcategory")?.toString().trim();
  const file = formData.get("file") as File;

  if (!title || !category || !subcategory || !file) {
    throw new Error("Не все данные переданы.");
  }

  // Создаём slug
  const slugBase = slugify(`${title} ${category} ${subcategory}`, {
    lower: true,
    strict: true,
    locale: "ru",
  });

  const uniqueId = randomUUID().slice(0, 8);
  const slug = `${slugBase}-${uniqueId}`;

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";

  // Папка в Supabase Storage
  const folder = `${category}/${subcategory}`;

  const mainFileName = `${slug}.${ext}`;
  const thumbFileName = `${slug}-thumb.jpg`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const thumbBuffer = await generateThumbnail(fileBuffer);

  const supabase = supabaseServer();

  // ------------------ ЗАГРУЗКА ОСНОВНОГО ФАЙЛА ------------------
  const { error: uploadErr1 } = await supabase.storage
    .from("coloring")
    .upload(`${folder}/${mainFileName}`, fileBuffer, {
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (uploadErr1) {
    console.error(uploadErr1);
    throw new Error("Ошибка загрузки основного файла.");
  }

  // ------------------ ЗАГРУЗКА МИНИАТЮРЫ ------------------
  const { error: uploadErr2 } = await supabase.storage
    .from("coloring")
    .upload(`${folder}/${thumbFileName}`, thumbBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadErr2) {
    console.error(uploadErr2);
    throw new Error("Ошибка загрузки миниатюры.");
  }

  const image_url = supabase.storage
    .from("coloring")
    .getPublicUrl(`${folder}/${mainFileName}`).data.publicUrl;

  const thumbnail_url = supabase.storage
    .from("coloring")
    .getPublicUrl(`${folder}/${thumbFileName}`).data.publicUrl;

  // ------------------ ДОБАВЛЕНИЕ В ТАБЛИЦУ ------------------
  const { error: dbError } = await supabase
    .from("coloring_items")
    .insert({
      title,
      category,
      subcategory,
      slug,
      image_url,
      thumbnail_url,
    });

  if (dbError) {
    console.error(dbError);
    throw new Error("Ошибка записи в базу данных.");
  }
}
// =============================================
// УДАЛЕНИЕ
// =============================================
export async function deleteItem(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Нет ID");

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("coloring_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Элемент не найден");

  // Удаляем файлы
  const mainPath = data.image_url.split("/storage/v1/object/public/coloring/")[1];
  const thumbPath = data.thumbnail_url.split("/storage/v1/object/public/coloring/")[1];

  await supabase.storage.from("coloring").remove([mainPath]);
  await supabase.storage.from("coloring").remove([thumbPath]);

  // Удаляем запись
  await supabase.from("coloring_items").delete().eq("id", id);
}


// =============================================
// ОБНОВЛЕНИЕ (редактирование)
// =============================================
export async function updateItem(formData: FormData) {
  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString();
  const category = formData.get("category")?.toString();
  const subcategory = formData.get("subcategory")?.toString();
  const file = formData.get("file") as File | null;

  const supabase = supabaseServer();

  // Загружаем текущие данные
  const { data, error } = await supabase
    .from("coloring_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Элемент не найден");

  let image_url = data.image_url;
  let thumbnail_url = data.thumbnail_url;

  // Если заменили изображение → пересоздать файлы
  if (file && file.size > 0) {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const thumbBuffer = await generateThumbnail(fileBuffer);

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";

    const folder = `${category}/${subcategory}`;
    const mainPath = `${folder}/${data.slug}.${ext}`;
    const thumbPath = `${folder}/${data.slug}-thumb.jpg`;

    await supabase.storage.from("coloring").upload(mainPath, fileBuffer, { upsert: true });
    await supabase.storage.from("coloring").upload(thumbPath, thumbBuffer, { upsert: true });

    image_url = supabase.storage.from("coloring").getPublicUrl(mainPath).data.publicUrl;
    thumbnail_url = supabase.storage.from("coloring").getPublicUrl(thumbPath).data.publicUrl;
  }

  // Обновляем запись
  await supabase
    .from("coloring_items")
    .update({
      title,
      category,
      subcategory,
      image_url,
      thumbnail_url,
    })
    .eq("id", id);
}

// =============================================
//  ПАЗЛЫ: ДОБАВЛЕНИЕ
// =============================================
export async function uploadPuzzle(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const subcategory = formData.get("subcategory")?.toString().trim();
  const file = formData.get("file") as File;

  if (!title || !category || !subcategory || !file) {
    throw new Error("Не все данные переданы.");
  }

  // Создаём slug
  const slugBase = slugify(`${title} ${category} ${subcategory}`, {
    lower: true,
    strict: true,
    locale: "ru",
  });

  const uniqueId = randomUUID().slice(0, 8);
  const slug = `${slugBase}-${uniqueId}`;

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";

  // Папка в Supabase Storage
  const folder = `${category}/${subcategory}`;

  const mainFileName = `${slug}.${ext}`;
  const thumbFileName = `${slug}-thumb.jpg`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const thumbBuffer = await generateThumbnail(fileBuffer);

  const supabase = supabaseServer();

  // ------------------ ЗАГРУЗКА ОСНОВНОГО ФАЙЛА ------------------
  const { error: uploadErr1 } = await supabase.storage
    .from("puzzles")
    .upload(`${folder}/${mainFileName}`, fileBuffer, {
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (uploadErr1) {
    console.error(uploadErr1);
    throw new Error("Ошибка загрузки основного файла пазла.");
  }

  // ------------------ ЗАГРУЗКА МИНИАТЮРЫ ------------------
  const { error: uploadErr2 } = await supabase.storage
    .from("puzzles")
    .upload(`${folder}/${thumbFileName}`, thumbBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadErr2) {
    console.error(uploadErr2);
    throw new Error("Ошибка загрузки миниатюры пазла.");
  }

  const image_url = supabase.storage
    .from("puzzles")
    .getPublicUrl(`${folder}/${mainFileName}`).data.publicUrl;

  const thumbnail_url = supabase.storage
    .from("puzzles")
    .getPublicUrl(`${folder}/${thumbFileName}`).data.publicUrl;

  // ------------------ ДОБАВЛЕНИЕ В ТАБЛИЦУ ------------------
  const { error: dbError } = await supabase
    .from("puzzle_items")
    .insert({
      title,
      category,
      subcategory,
      slug,
      image_url,
      thumbnail_url,
    });

  if (dbError) {
    console.error(dbError);
    throw new Error("Ошибка записи пазла в базу данных.");
  }
}

// =============================================
// ПАЗЛЫ: УДАЛЕНИЕ
// =============================================
export async function deletePuzzle(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Нет ID");

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("puzzle_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Пазл не найден");

  // Удаляем файлы
  const mainPath = data.image_url.split("/storage/v1/object/public/puzzles/")[1];
  const thumbPath = data.thumbnail_url.split("/storage/v1/object/public/puzzles/")[1];

  if (mainPath) await supabase.storage.from("puzzles").remove([mainPath]);
  if (thumbPath) await supabase.storage.from("puzzles").remove([thumbPath]);

  // Удаляем запись
  await supabase.from("puzzle_items").delete().eq("id", id);
}

// =============================================
// ПАЗЛЫ: ОБНОВЛЕНИЕ
// =============================================
export async function updatePuzzle(formData: FormData) {
  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString();
  const category = formData.get("category")?.toString();
  const subcategory = formData.get("subcategory")?.toString();
  const file = formData.get("file") as File | null;

  const supabase = supabaseServer();

  // Загружаем текущие данные
  const { data, error } = await supabase
    .from("puzzle_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Пазл не найден");

  let image_url = data.image_url;
  let thumbnail_url = data.thumbnail_url;

  // Если заменили изображение → пересоздать файлы
  if (file && file.size > 0) {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const thumbBuffer = await generateThumbnail(fileBuffer);

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";

    const folder = `${category}/${subcategory}`;
    const mainPath = `${folder}/${data.slug}.${ext}`;
    const thumbPath = `${folder}/${data.slug}-thumb.jpg`;

    await supabase.storage.from("puzzles").upload(mainPath, fileBuffer, { upsert: true });
    await supabase.storage.from("puzzles").upload(thumbPath, thumbBuffer, { upsert: true });

    image_url = supabase.storage.from("puzzles").getPublicUrl(mainPath).data.publicUrl;
    thumbnail_url = supabase.storage.from("puzzles").getPublicUrl(thumbPath).data.publicUrl;
  }

  // Обновляем запись
  await supabase
    .from("puzzle_items")
    .update({
      title,
      category,
      subcategory,
      image_url,
      thumbnail_url,
    })
    .eq("id", id);
}