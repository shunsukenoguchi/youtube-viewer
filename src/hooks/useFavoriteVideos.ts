"use client";

import { useCallback, useEffect, useState } from "react";

export interface FavoriteVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
}

const STORAGE_KEY = "youtube-viewer-favorite-videos";

export function useFavoriteVideos() {
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load video favorites from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  const saveFavorites = useCallback((newFavorites: FavoriteVideo[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error("Failed to save video favorites to localStorage:", error);
    }
  }, []);

  const addFavorite = useCallback(
    (video: FavoriteVideo) => {
      const exists = favorites.some((f) => f.videoId === video.videoId);
      if (!exists) {
        saveFavorites([...favorites, video]);
      }
    },
    [favorites, saveFavorites],
  );

  const removeFavorite = useCallback(
    (videoId: string) => {
      saveFavorites(favorites.filter((f) => f.videoId !== videoId));
    },
    [favorites, saveFavorites],
  );

  const isFavorite = useCallback(
    (videoId: string) => {
      return favorites.some((f) => f.videoId === videoId);
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    (video: FavoriteVideo) => {
      if (isFavorite(video.videoId)) {
        removeFavorite(video.videoId);
      } else {
        addFavorite(video);
      }
    },
    [addFavorite, isFavorite, removeFavorite],
  );

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
