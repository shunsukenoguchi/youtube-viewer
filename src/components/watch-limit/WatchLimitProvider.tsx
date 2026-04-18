"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "youtube-viewer-daily-watch-limit";
const DAILY_LIMIT_SECONDS = 60 * 60;

interface StoredWatchLimit {
  date: string;
  usedSeconds: number;
}

interface WatchLimitContextValue {
  isLoaded: boolean;
  usedSeconds: number;
  remainingSeconds: number;
  isLocked: boolean;
  canStartPlayback: () => boolean;
  startCounting: () => void;
  stopCounting: () => void;
}

const WatchLimitContext = createContext<WatchLimitContextValue | null>(null);

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeUsedSeconds(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  if (value <= 0) {
    return 0;
  }

  return Math.min(DAILY_LIMIT_SECONDS, Math.floor(value));
}

function normalizeStoredValue(value: unknown): StoredWatchLimit {
  const today = getTodayKey();

  if (!value || typeof value !== "object") {
    return { date: today, usedSeconds: 0 };
  }

  const candidate = value as Partial<StoredWatchLimit>;
  if (candidate.date !== today) {
    return { date: today, usedSeconds: 0 };
  }

  return {
    date: today,
    usedSeconds: sanitizeUsedSeconds(candidate.usedSeconds),
  };
}

function loadStoredWatchLimit(): StoredWatchLimit {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { date: getTodayKey(), usedSeconds: 0 };
    }

    return normalizeStoredValue(JSON.parse(stored));
  } catch (error) {
    console.error("Failed to load watch limit from localStorage:", error);
    return { date: getTodayKey(), usedSeconds: 0 };
  }
}

function saveStoredWatchLimit(value: StoredWatchLimit) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save watch limit to localStorage:", error);
  }
}

export function WatchLimitProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [watchLimit, setWatchLimit] = useState<StoredWatchLimit>({
    date: "",
    usedSeconds: 0,
  });
  const isCountingRef = useRef(false);

  const syncState = useCallback((nextValue?: StoredWatchLimit) => {
    const normalized = normalizeStoredValue(
      nextValue ?? loadStoredWatchLimit(),
    );
    setWatchLimit(normalized);
    saveStoredWatchLimit(normalized);
    return normalized;
  }, []);

  useEffect(() => {
    syncState();
    setIsLoaded(true);
  }, [syncState]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncState();
      }
    };

    const handleFocus = () => {
      syncState();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        syncState();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [isLoaded, syncState]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!isCountingRef.current) {
        return;
      }

      if (document.visibilityState !== "visible") {
        return;
      }

      setWatchLimit((current) => {
        const normalized = normalizeStoredValue(current);
        if (normalized.usedSeconds >= DAILY_LIMIT_SECONDS) {
          if (
            normalized.date !== current.date ||
            normalized.usedSeconds !== current.usedSeconds
          ) {
            saveStoredWatchLimit(normalized);
            return normalized;
          }
          return current;
        }

        const nextValue = {
          date: normalized.date,
          usedSeconds: Math.min(
            DAILY_LIMIT_SECONDS,
            normalized.usedSeconds + 1,
          ),
        };

        saveStoredWatchLimit(nextValue);
        return nextValue;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isLoaded]);

  const startCounting = useCallback(() => {
    const current = syncState();
    if (current.usedSeconds >= DAILY_LIMIT_SECONDS) {
      isCountingRef.current = false;
      return;
    }

    isCountingRef.current = true;
  }, [syncState]);

  const stopCounting = useCallback(() => {
    isCountingRef.current = false;
  }, []);

  const value = useMemo<WatchLimitContextValue>(() => {
    const normalized = normalizeStoredValue(watchLimit);
    const remainingSeconds = Math.max(
      0,
      DAILY_LIMIT_SECONDS - normalized.usedSeconds,
    );

    return {
      isLoaded,
      usedSeconds: normalized.usedSeconds,
      remainingSeconds,
      isLocked: remainingSeconds === 0,
      canStartPlayback: () => remainingSeconds > 0,
      startCounting,
      stopCounting,
    };
  }, [isLoaded, startCounting, stopCounting, watchLimit]);

  return (
    <WatchLimitContext.Provider value={value}>
      {children}
    </WatchLimitContext.Provider>
  );
}

export function useDailyWatchLimit() {
  const context = useContext(WatchLimitContext);

  if (!context) {
    throw new Error(
      "useDailyWatchLimit must be used within a WatchLimitProvider",
    );
  }

  return context;
}
