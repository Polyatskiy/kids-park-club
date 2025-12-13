"use client";

import { useState, useEffect } from "react";
import { Container } from "@/ui/container";
import { BackArrow } from "@/components/back-arrow";

export default function ReactionGamePage() {
  const [status, setStatus] = useState<"idle" | "wait" | "go">("idle");
  const [message, setMessage] = useState("Click «Start» to begin.");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    setResult(null);
    setStatus("wait");
    setMessage("Wait for green...");
    const delay = 1000 + Math.random() * 3000;
    const id = setTimeout(() => {
      setStatus("go");
      setMessage("Click!");
      setStartTime(performance.now());
    }, delay);
    setTimeoutId(id);
  };

  const handleClick = () => {
    if (status === "wait") {
      if (timeoutId) clearTimeout(timeoutId);
      setStatus("idle");
      setMessage("Too early! Try again.");
    } else if (status === "go" && startTime) {
      const elapsed = performance.now() - startTime;
      setResult(elapsed);
      setStatus("idle");
      setMessage("Click «Start» to play again.");
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (
    <>
      <BackArrow />
      <Container className="pt-16 md:pt-20 pb-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reaction Game</h1>
        <p className="text-sm text-gray-600">
          Click the button as soon as it turns green.
        </p>
        <div className="space-y-4">
          <button
            onClick={start}
            className="px-5 py-3 rounded-2xl bg-secondary font-semibold"
          >
            Start
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
            {status === "go" ? "Click!" : status === "wait" ? "Wait..." : "Click when green"}
          </div>
          <p className="text-sm text-gray-700">{message}</p>
          {result && (
            <p className="text-lg font-semibold">
              Your reaction: {Math.round(result)} ms
            </p>
          )}
        </div>
      </Container>
    </>
  );
}
