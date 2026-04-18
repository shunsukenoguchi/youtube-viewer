"use client";

import { useEffect, useId, useRef } from "react";
import { useDailyWatchLimit } from "./WatchLimitProvider";

interface VideoPlayerWithLimitProps {
  videoId: string;
  onLimitReached?: () => void;
}

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  destroy: () => void;
  stopVideo: () => void;
  getPlayerState: () => number;
}

interface YouTubePlayerOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: () => void;
    onStateChange?: (event: { data: number }) => void;
  };
}

interface YouTubeIframeApi {
  Player: new (
    elementId: string,
    options: YouTubePlayerOptions,
  ) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

let youtubeApiPromise: Promise<YouTubeIframeApi> | null = null;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("YouTube API can only load in the browser"),
    );
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeIframeApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube API loaded without Player"));
      }
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load YouTube API"));
    document.body.appendChild(script);
  });

  return youtubeApiPromise;
}

export function VideoPlayerWithLimit({
  videoId,
  onLimitReached,
}: VideoPlayerWithLimitProps) {
  const { isLoaded, isLocked, startCounting, stopCounting } =
    useDailyWatchLimit();
  const containerId = useId().replace(/:/g, "");
  const playerRef = useRef<YouTubePlayer | null>(null);
  const isMountedRef = useRef(true);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || isLocked) {
      return;
    }

    let cancelled = false;
    hasNotifiedRef.current = false;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !isMountedRef.current) {
          return;
        }

        playerRef.current?.destroy();
        playerRef.current = new YT.Player(containerId, {
          videoId,
          playerVars: {
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
          },
          events: {
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                startCounting();
                return;
              }

              stopCounting();
            },
          },
        });
      })
      .catch((error) => {
        console.error("Failed to initialize YouTube player:", error);
      });

    return () => {
      cancelled = true;
      stopCounting();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [containerId, isLoaded, isLocked, startCounting, stopCounting, videoId]);

  useEffect(() => {
    if (!isLocked || hasNotifiedRef.current === true) {
      return;
    }

    hasNotifiedRef.current = true;
    stopCounting();
    playerRef.current?.stopVideo();
    onLimitReached?.();
  }, [isLocked, onLimitReached, stopCounting]);

  if (!isLoaded) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-800 text-gray-300 shadow-2xl">
        読み込み中...
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border border-red-700 bg-red-950/40 px-6 text-center text-red-100 shadow-2xl">
        本日の視聴時間60分に達しました。次の再生は明日0時以降に利用できます。
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <div
        id={containerId}
        className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-lg shadow-2xl"
      />
    </div>
  );
}
