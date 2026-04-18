"use client";

import Link from "next/link";
import { useState } from "react";
import { VideoPlayerWithLimit } from "@/components/watch-limit/VideoPlayerWithLimit";
import { useDailyWatchLimit } from "@/components/watch-limit/WatchLimitProvider";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [error, setError] = useState("");
  const { canStartPlayback } = useDailyWatchLimit();

  const extractVideoId = (youtubeUrl: string): string | null => {
    // YouTube URLからビデオIDを抽出
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = youtubeUrl.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(url);
    if (id) {
      if (!canStartPlayback()) {
        setError("本日の視聴時間60分に達したため、再生できません");
        return;
      }
      setError("");
      setVideoId(id);
    } else {
      setError("有効なYouTube URLを入力してください");
    }
  };

  const handleClear = () => {
    setUrl("");
    setVideoId("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">YouTube Viewer</h1>
          <div className="flex gap-2">
            <Link
              href="/favorites"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              お気に入り
            </Link>
            <Link
              href="/search"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              動画検索へ
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube URLを入力してください"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              表示
            </button>
            {videoId && (
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                クリア
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/50 p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {videoId && (
          <VideoPlayerWithLimit
            videoId={videoId}
            onLimitReached={() => {
              setVideoId("");
              setError("本日の視聴時間60分に達したため、再生を停止しました");
            }}
          />
        )}

        {!videoId && (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-lg mb-2">YouTube URLを入力して動画を表示</p>
            <p className="text-sm">
              例: https://www.youtube.com/watch?v=xxxxx または
              https://youtu.be/xxxxx
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
