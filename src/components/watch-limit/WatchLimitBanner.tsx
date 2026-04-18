"use client";

import { useDailyWatchLimit } from "./WatchLimitProvider";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}`;
}

export function WatchLimitBanner() {
  const { isLoaded, remainingSeconds, isLocked } = useDailyWatchLimit();

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 text-sm text-white sm:px-8">
        <p className="font-medium">1日の視聴時間は60分までです</p>
        <div
          className={`rounded-full px-3 py-1 font-semibold ${
            isLocked
              ? "bg-red-500/20 text-red-200"
              : "bg-emerald-500/15 text-emerald-200"
          }`}
        >
          {isLocked
            ? "本日の上限に達しました"
            : `残り ${formatDuration(remainingSeconds)} / 60:00`}
        </div>
      </div>
    </div>
  );
}
