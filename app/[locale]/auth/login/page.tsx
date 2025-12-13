"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const t = useTranslations("common.auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: any) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t("loginSuccessful"));

    // РЕДИРЕКТ через 0.5 сек
    setTimeout(() => {
      router.push("/"); // ← переход на главную
    }, 500);
  }

  return (
    <div className="max-w-md mx-auto mt-14">
      <h1 className="text-2xl font-bold mb-6">{t("login")}</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder={t("email")}
          className="p-3 rounded-lg border"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder={t("password")}
          className="p-3 rounded-lg border"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="bg-blue-500 text-white p-3 rounded-lg">
          {t("login")}
        </button>
      </form>

      <p className="mt-3 text-sm text-red-600">{message}</p>

      <Link href="/auth/register" className="block mt-5 text-blue-600">
        {t("createAccountLink")}
      </Link>
    </div>
  );
}
