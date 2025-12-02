"use server";

import { supabaseServer } from "@/lib/supabaseClient";

// Вход пользователя
export async function signInWithEmail(email: string, password: string) {
  const supabase = supabaseServer();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  return data.user;
}

// Регистрация пользователя
export async function signUpWithEmail(email: string, password: string) {
  const supabase = supabaseServer();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  return data.user;
}

// Получение текущего пользователя
export async function getCurrentUser() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
