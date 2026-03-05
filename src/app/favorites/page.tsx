"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type FavoriteChannel,
  useFavoriteChannels,
} from "@/hooks/useFavoriteChannels";

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

export default function FavoritesPage() {
  const { favorites, isLoaded, removeFavorite } = useFavoriteChannels();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] =
    useState<FavoriteChannel | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageToken, setPrevPageToken] = useState<string | null>(null);

  const fetchChannelVideos = async (
    channelId: string,
    pageToken?: string | null,
  ) => {
    setLoading(true);
    setError("");

    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

      if (!apiKey) {
        setError(
          "YouTube API Keyが設定されていません。.env.localファイルにNEXT_PUBLIC_YOUTUBE_API_KEYを設定してください。",
        );
        setLoading(false);
        return;
      }

      const pageTokenParam = pageToken ? `&pageToken=${pageToken}` : "";

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=20${pageTokenParam}&key=${apiKey}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`動画の取得に失敗しました: ${errorMessage}`);
      }

      const data = await response.json();
      setVideos(data.items || []);
      setNextPageToken(data.nextPageToken || null);
      setPrevPageToken(data.prevPageToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = async (channel: FavoriteChannel) => {
    setSelectedChannel(channel);
    setSelectedVideo(null);
    setNextPageToken(null);
    setPrevPageToken(null);
    await fetchChannelVideos(channel.channelId);
  };

  const handleVideoClick = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const handleBackToChannels = () => {
    setSelectedChannel(null);
    setVideos([]);
    setSelectedVideo(null);
    setError("");
    setNextPageToken(null);
    setPrevPageToken(null);
  };

  const handleNextPage = () => {
    if (nextPageToken && selectedChannel) {
      fetchChannelVideos(selectedChannel.channelId, nextPageToken);
    }
  };

  const handlePrevPage = () => {
    if (prevPageToken && selectedChannel) {
      fetchChannelVideos(selectedChannel.channelId, prevPageToken);
    }
  };

  const handleRemoveFavorite = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    removeFavorite(channelId);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    callback: () => void,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-400 mt-16">
            <p className="text-lg">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">お気に入り</h1>
          <div className="flex gap-2">
            <Link
              href="/search"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              動画検索へ
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              URL入力へ
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {selectedVideo ? (
          <div className="mb-8">
            <button
              type="button"
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
        ) : selectedChannel ? (
          <>
            <button
              type="button"
              onClick={handleBackToChannels}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← お気に入り一覧に戻る
            </button>
            <h2 className="text-2xl font-bold mb-6">
              {selectedChannel.title} の動画
            </h2>
            {loading ? (
              <div className="text-center text-gray-400 mt-8">
                <p className="text-lg">読み込み中...</p>
              </div>
            ) : videos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <div
                      key={video.id.videoId}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleVideoClick(video.id.videoId)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, () => handleVideoClick(video.id.videoId))
                      }
                      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-750 transition-all hover:scale-105 shadow-lg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                          {new Date(video.snippet.publishedAt).toLocaleDateString(
                            "ja-JP",
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* ページネーション */}
                {(prevPageToken || nextPageToken) && (
                  <div className="flex justify-center gap-4 mt-8">
                    <button
                      type="button"
                      disabled={!prevPageToken || loading}
                      onClick={handlePrevPage}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      ← 前へ
                    </button>
                    <button
                      type="button"
                      disabled={!nextPageToken || loading}
                      onClick={handleNextPage}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      次へ →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <p className="text-lg">動画が見つかりませんでした</p>
              </div>
            )}
          </>
        ) : favorites.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold mb-6">
              お気に入りチャンネル一覧
            </h2>
            <div className="flex flex-col gap-2">
              {favorites.map((channel) => (
                <div
                  key={channel.channelId}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleChannelClick(channel)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, () => handleChannelClick(channel))
                  }
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-all shadow-lg relative group flex items-center gap-4 px-4 py-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={channel.thumbnailUrl}
                    alt={channel.title}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                  <h3 className="font-semibold flex-1 line-clamp-2">
                    {channel.title}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFavorite(e, channel.channelId)}
                    className="p-2 bg-gray-900/80 hover:bg-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="お気に入りから削除"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-lg mb-2">お気に入りチャンネルがありません</p>
            <p className="text-sm mb-6">
              検索ページでチャンネルをお気に入りに登録してください
            </p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              動画検索へ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
