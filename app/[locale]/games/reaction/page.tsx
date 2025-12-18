"use client";

import { useState, useEffect } from "react";
import { Container } from "@/ui/container";
import { useTranslations } from "next-intl";

export default function ReactionGamePage() {
  const t = useTranslations("common.gameDetails.reaction");
  const [status, setStatus] = useState<"idle" | "wait" | "go">("idle");
  const [message, setMessage] = useState(t("clickStart"));
  const [startTime, setStartTime] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    setResult(null);
    setStatus("wait");
    setMessage(t("waitForGreen"));
    const delay = 1000 + Math.random() * 3000;
    const id = setTimeout(() => {
      setStatus("go");
      setMessage(t("click"));
      setStartTime(performance.now());
    }, delay);
    setTimeoutId(id);
  };

  const handleClick = () => {
    if (status === "wait") {
      if (timeoutId) clearTimeout(timeoutId);
      setStatus("idle");
      setMessage(t("tooEarly"));
    } else if (status === "go" && startTime) {
      const elapsed = performance.now() - startTime;
      setResult(elapsed);
      setStatus("idle");
      setMessage(t("clickStartAgain"));
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (
    <Container className="pt-16 md:pt-20 pb-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-600">
          {t("pageDescription")}
        </p>
        <div className="space-y-4">
          <button
            onClick={start}
            className="px-5 py-3 rounded-2xl bg-secondary font-semibold"
          >
            {t("start")}
          </button>
          <div
            onClick={handleClick}
            className={
              "h-32 rounded-2xl flex items-center justify-center cursor-pointer select-none text-lg font-semibold " +
              (status === "go"
                ? "bg-green-400"
                : status === "wait"
                ? "bg-red-300"
                : "bg-gray-200")
            }
          >
            {status === "go" ? t("click") : status === "wait" ? t("wait") : t("clickWhenGreen")}
          </div>
          <p className="text-sm text-gray-700">{message}</p>
          {result && (
            <p className="text-lg font-semibold">
              {t("yourReaction", { ms: Math.round(result) })}
            </p>
          )}
        </div>
      </Container>
  );
}
