"use client";

import { useEffect, useId, useRef } from "react";

interface VideoPlayerProps {
  videoId: string;
}

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  destroy: () => void;
}

interface YouTubePlayerOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
}

interface YouTubeIframeApi {
  Player: new (
    elementId: string,
    options: YouTubePlayerOptions,
  ) => YouTubePlayer;
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

export function VideoPlayer({ videoId }: VideoPlayerProps) {
  const containerId = useId().replace(/:/g, "");
  const playerRef = useRef<YouTubePlayer | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

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
        });
      })
      .catch((error) => {
        console.error("Failed to initialize YouTube player:", error);
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [containerId, videoId]);

  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <div
        id={containerId}
        className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-lg shadow-2xl"
      />
    </div>
  );
}
