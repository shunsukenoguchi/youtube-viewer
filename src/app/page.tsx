"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { extractYouTubeVideoId, looksLikeUrl } from "@/lib/youtube";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [videoId, setVideoId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();

    if (!value) {
      setError("YouTube URLまたは検索キーワードを入力してください");
      return;
    }

    const id = extractYouTubeVideoId(value);
    if (id) {
      setError("");
      setVideoId(id);
      return;
    }

    if (looksLikeUrl(value)) {
      setError("有効なYouTube URLを入力してください");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(value)}&mode=video`);
  };

  const handleClear = () => {
    setInput("");
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
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="YouTube URLまたは検索キーワードを入力"
              aria-label="YouTube URLまたは検索キーワード"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              表示・検索
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

        {videoId && <VideoPlayer videoId={videoId} />}

        {!videoId && (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-lg mb-2">
              YouTube URLを貼り付けるか、見たい動画を検索
            </p>
            <p className="text-sm">
              URLはその場で再生、キーワードは動画検索を表示します
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
