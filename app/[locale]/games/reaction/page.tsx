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
  const [pulse, setPulse] = useState(false);

  const start = () => {
    setResult(null);
    setStatus("wait");
    setMessage(t("waitForGreen"));
    const delay = 1000 + Math.random() * 3000;
    const id = setTimeout(() => {
      setStatus("go");
      setMessage(t("click"));
      setStartTime(performance.now());
      setPulse(true);
      setTimeout(() => setPulse(false), 100);
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

  // Pulse animation for start button
  useEffect(() => {
    if (status === "idle") {
      const interval = setInterval(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <Container className="pt-16 md:pt-20 pb-8 min-h-screen">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            {t("pageTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            {t("pageDescription")}
          </p>
        </div>

        {/* Main game area */}
        <div className="relative mb-4 sm:mb-6">
          <div
            onClick={handleClick}
            className={`
              relative w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto 
              h-64 sm:h-80 md:h-96 rounded-2xl sm:rounded-3xl
              flex items-center justify-center cursor-pointer transition-all duration-300
              shadow-xl sm:shadow-2xl overflow-hidden
              ${
                status === "wait"
                  ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-yellow-900"
                  : status === "go"
                  ? `bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 text-white ${pulse ? "scale-105" : "scale-100"} ring-2 sm:ring-4 ring-green-300 ring-offset-2 sm:ring-offset-4`
                  : "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-500"
              }
            `}
          >
            {/* Animated background effect for "go" state */}
            {status === "go" && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-green-500 to-green-600 animate-pulse opacity-75" />
            )}

            {/* Shimmer effect for "go" state */}
            {status === "go" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] transform -skew-x-12" />
            )}

            {/* Content */}
            <div className="relative z-10 text-center px-4">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-lg">
                {status === "go" && (
                  <span className="inline-block animate-bounce">🚀</span>
                )}
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold">
                {status === "go" ? t("click") : status === "wait" ? t("waitForGreen") : t("clickWhenGreen")}
              </p>
              {status === "wait" && (
                <div className="mt-2 sm:mt-4 flex justify-center gap-2">
                  <div className="w-2 h-2 bg-yellow-800 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-yellow-800 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-yellow-800 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>

            {/* Glow effect for "go" state */}
            {status === "go" && (
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-green-400 opacity-50 blur-3xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Start button */}
        {status === "idle" && (
          <div className="text-center mb-4 sm:mb-6">
            <button
              onClick={start}
              className={`
                relative inline-flex items-center justify-center gap-2 sm:gap-3
                px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5
                text-base sm:text-lg md:text-xl font-bold text-white
                rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl
                bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600
                hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700
                active:scale-95
                transition-all duration-200
                transform
                ${pulse ? "scale-105 sm:scale-110 ring-2 sm:ring-4 ring-blue-300 ring-offset-2 sm:ring-offset-4" : "scale-100"}
              `}
            >
              {/* Shimmer effect */}
              <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] transform -skew-x-12" />
              
              {/* Icon */}
              <span className="relative z-10 text-xl sm:text-2xl md:text-3xl">▶</span>
              
              {/* Text */}
              <span className="relative z-10">{t("start")}</span>

              {/* Glow effect */}
              <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-blue-400 opacity-50 blur-xl animate-pulse" />
            </button>

            {/* Hint text */}
            <p className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-500 animate-pulse">
              {t("clickStartHint", { defaultValue: "Нажмите кнопку выше, чтобы начать" })}
            </p>
          </div>
        )}

        {/* Result display */}
        {result !== null && (
          <div className="text-center mb-4">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl max-w-full">
              <p className="text-xs sm:text-sm text-white/90 mb-1 sm:mb-2 font-medium">
                {t("yourReaction")}
              </p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                {(result / 1000).toFixed(3)}s
              </p>
              {result < 200 && (
                <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg font-bold text-yellow-300 animate-pulse">
                  🏆 {t("excellent")}
                </p>
              )}
              {result >= 200 && result < 300 && (
                <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg font-bold text-green-300">
                  ✨ {t("good")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Add custom animation keyframes to global styles */}
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-12deg);
            }
            100% {
              transform: translateX(200%) skewX(-12deg);
            }
          }
        `}</style>
      </div>
    </Container>
  );
}
