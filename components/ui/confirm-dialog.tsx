"use client";
import { useState } from "react";

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [resolver, setResolver] = useState<
    ((v: boolean) => void) | null
  >(null);

  const confirm = () =>
    new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
      setOpen(true);
    });

  const handle = (result: boolean) => {
    setOpen(false);
    resolver?.(result);
  };

  return {
    ConfirmDialog: () =>
      open ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-[85%] max-w-[380px] text-center">
            <div className="text-lg font-semibold mb-2">
              Очистить рисунок?
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Это действие нельзя отменить.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => handle(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={() => handle(true)}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
      ) : null,

    confirm,
  };
}
