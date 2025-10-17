"use client";

import { useState } from "react";
import Link from "next/link";

type SearchMode = "channel" | "video";

interface ChannelItem {
  id: {
    channelId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
}

interface VideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

export default function SearchPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("channel");
  const [searchQuery, setSearchQuery] = useState("");
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError(searchMode === "channel" ? "チャンネル名を入力してください" : "動画タイトルを入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setChannels([]);
    setVideos([]);
    setSelectedChannelId(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      
      if (!apiKey) {
        setError("YouTube API Keyが設定されていません。.env.localファイルにNEXT_PUBLIC_YOUTUBE_API_KEYを設定してください。");
        setLoading(false);
        return;
      }

      const searchType = searchMode === "channel" ? "channel" : "video";
      const maxResults = searchMode === "channel" ? 10 : 20;
      const orderParam = searchMode === "video" ? "&order=date" : "";
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery
        )}&type=${searchType}&maxResults=${maxResults}${orderParam}&key=${apiKey}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`検索に失敗しました: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (searchMode === "channel") {
        setChannels(data.items || []);
        if (data.items?.length === 0) {
          setError("チャンネルが見つかりませんでした");
        }
      } else {
        setVideos(data.items || []);
        if (data.items?.length === 0) {
          setError("動画が見つかりませんでした");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = async (channelId: string, channelName: string) => {
    setSelectedChannelId(channelId);
    setSelectedChannelName(channelName);
    setLoading(true);
    setError("");

    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=20&key=${apiKey}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`動画の取得に失敗しました: ${errorMessage}`);
      }

      const data = await response.json();
      setVideos(data.items || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const handleClear = () => {
    setSelectedVideo(null);
    setVideos([]);
    setChannels([]);
    setSearchQuery("");
    setSelectedChannelId(null);
    setSelectedChannelName("");
    setError("");
  };

  const handleBackToChannels = () => {
    setVideos([]);
    setSelectedChannelId(null);
    setSelectedChannelName("");
    setSelectedVideo(null);
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchQuery("");
    setChannels([]);
    setVideos([]);
    setSelectedChannelId(null);
    setSelectedChannelName("");
    setSelectedVideo(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            動画検索
          </h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            URL入力へ
          </Link>
        </div>

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleModeChange("channel")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              searchMode === "channel"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            チャンネル検索
          </button>
          <button
            onClick={() => handleModeChange("video")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              searchMode === "video"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            動画検索
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchMode === "channel" ? "チャンネル名を入力" : "動画タイトルを入力"}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? "検索中..." : "検索"}
            </button>
            {(channels.length > 0 || videos.length > 0 || selectedVideo) && (
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
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {selectedVideo ? (
          <div className="mb-8">
            <button
              onClick={() => setSelectedVideo(null)}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← 動画一覧に戻る
            </button>
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-2xl"
                src={`https://www.youtube.com/embed/${selectedVideo}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : selectedChannelId && videos.length > 0 ? (
          <>
            <button
              onClick={handleBackToChannels}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← チャンネル一覧に戻る
            </button>
            <h2 className="text-2xl font-bold mb-6">{selectedChannelName} の動画</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id.videoId}
                  onClick={() => handleVideoClick(video.id.videoId)}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-750 transition-all hover:scale-105 shadow-lg"
                >
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {video.snippet.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(
                        video.snippet.publishedAt
                      ).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : videos.length > 0 && searchMode === "video" ? (
          <>
            <h2 className="text-2xl font-bold mb-6">検索結果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id.videoId}
                  onClick={() => handleVideoClick(video.id.videoId)}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-750 transition-all hover:scale-105 shadow-lg"
                >
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {video.snippet.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-1">
                      {video.snippet.channelTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(
                        video.snippet.publishedAt
                      ).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {channels.length > 0 && searchMode === "channel" && (
              <>
                <h2 className="text-2xl font-bold mb-6">チャンネル一覧</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {channels.map((channel) => (
                    <div
                      key={channel.id.channelId}
                      onClick={() => handleChannelClick(channel.id.channelId, channel.snippet.title)}
                      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-750 transition-all hover:scale-105 shadow-lg"
                    >
                      <img
                        src={channel.snippet.thumbnails.medium.url}
                        alt={channel.snippet.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">
                          {channel.snippet.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {channel.snippet.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loading && channels.length === 0 && videos.length === 0 && !error && (
              <div className="text-center text-gray-400 mt-16">
                <p className="text-lg mb-2">
                  {searchMode === "channel" ? "チャンネル名で検索" : "動画タイトルで検索"}
                </p>
                <p className="text-sm">
                  {searchMode === "channel" 
                    ? "チャンネルを選択すると、そのチャンネルの動画一覧が表示されます"
                    : "検索結果から動画を選択して視聴できます"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
