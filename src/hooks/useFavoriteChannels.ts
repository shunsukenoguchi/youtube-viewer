"use client";

import { useState, useEffect, useCallback } from "react";

export interface FavoriteChannel {
  channelId: string;
  title: string;
  thumbnailUrl: string;
}

const STORAGE_KEY = "youtube-viewer-favorite-channels";

export function useFavoriteChannels() {
  const [favorites, setFavorites] = useState<FavoriteChannel[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初期読み込み（クライアントサイドのみ）
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // localStorageへの保存
  const saveFavorites = useCallback((newFavorites: FavoriteChannel[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error);
    }
  }, []);

  // お気に入りに追加
  const addFavorite = useCallback(
    (channel: FavoriteChannel) => {
      const exists = favorites.some((f) => f.channelId === channel.channelId);
      if (!exists) {
        saveFavorites([...favorites, channel]);
      }
    },
    [favorites, saveFavorites],
  );

  // お気に入りから削除
  const removeFavorite = useCallback(
    (channelId: string) => {
      saveFavorites(favorites.filter((f) => f.channelId !== channelId));
    },
    [favorites, saveFavorites],
  );

  // お気に入りかどうかをチェック
  const isFavorite = useCallback(
    (channelId: string) => {
      return favorites.some((f) => f.channelId === channelId);
    },
    [favorites],
  );

  // お気に入りの切り替え
  const toggleFavorite = useCallback(
    (channel: FavoriteChannel) => {
      if (isFavorite(channel.channelId)) {
        removeFavorite(channel.channelId);
      } else {
        addFavorite(channel);
      }
    },
    [isFavorite, removeFavorite, addFavorite],
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
