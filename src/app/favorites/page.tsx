"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { VideoPlayerWithLimit } from "@/components/watch-limit/VideoPlayerWithLimit";
import { useDailyWatchLimit } from "@/components/watch-limit/WatchLimitProvider";
import {
  type FavoriteChannel,
  useFavoriteChannels,
} from "@/hooks/useFavoriteChannels";
import {
  type FavoriteVideo,
  useFavoriteVideos,
} from "@/hooks/useFavoriteVideos";

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

type FavoriteTab = "videos" | "channels";
type PlayerSource = "channelVideos" | "favoriteVideos" | null;

export default function FavoritesPage() {
  const { favorites, isLoaded, removeFavorite } = useFavoriteChannels();
  const {
    favorites: favoriteVideos,
    isLoaded: isFavoriteVideosLoaded,
    isFavorite: isFavoriteVideo,
    removeFavorite: removeFavoriteVideo,
    toggleFavorite: toggleFavoriteVideo,
  } = useFavoriteVideos();
  const scrollPositionRef = useRef(0);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] =
    useState<FavoriteChannel | null>(null);
  const [selectedFavoriteVideo, setSelectedFavoriteVideo] =
    useState<FavoriteVideo | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FavoriteTab>("channels");
  const [playerSource, setPlayerSource] = useState<PlayerSource>(null);
  const [error, setError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageToken, setPrevPageToken] = useState<string | null>(null);
  const { canStartPlayback } = useDailyWatchLimit();

  useEffect(() => {
    history.replaceState({ view: "channels" }, "");
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { view: string } | null;
      if (state?.view === "channels") {
        setSelectedChannel(null);
        setSelectedFavoriteVideo(null);
        setVideos([]);
        setSelectedVideo(null);
        setPlayerSource(null);
        setError("");
        setNextPageToken(null);
        setPrevPageToken(null);
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPositionRef.current);
        });
      } else if (state?.view === "videos") {
        setSelectedVideo(null);
        setPlayerSource(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (
      activeTab === "channels" &&
      favorites.length === 0 &&
      favoriteVideos.length > 0
    ) {
      setActiveTab("videos");
    } else if (
      activeTab === "videos" &&
      favoriteVideos.length === 0 &&
      favorites.length > 0
    ) {
      setActiveTab("channels");
    }
  }, [activeTab, favoriteVideos.length, favorites.length]);

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
    scrollPositionRef.current = window.scrollY;
    history.pushState({ view: "videos" }, "");
    setSelectedChannel(channel);
    setSelectedVideo(null);
    setNextPageToken(null);
    setPrevPageToken(null);
    await fetchChannelVideos(channel.channelId);
  };

  const handleVideoClick = (videoId: string) => {
    if (!canStartPlayback()) {
      setError("本日の視聴時間60分に達したため、再生できません");
      return;
    }

    setError("");
    history.pushState({ view: "player" }, "");
    setSelectedFavoriteVideo(null);
    setSelectedVideo(videoId);
    setPlayerSource("channelVideos");
  };

  const handleFavoriteVideoClick = (video: FavoriteVideo) => {
    if (!canStartPlayback()) {
      setError("本日の視聴時間60分に達したため、再生できません");
      return;
    }

    setError("");
    scrollPositionRef.current = window.scrollY;
    history.pushState({ view: "player" }, "");
    setSelectedChannel(null);
    setVideos([]);
    setSelectedFavoriteVideo(video);
    setSelectedVideo(video.videoId);
    setPlayerSource("favoriteVideos");
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
    if (playerSource === "channelVideos") {
      setSelectedFavoriteVideo(null);
      setPlayerSource(null);
      history.replaceState({ view: "videos" }, "");
      return;
    }

    if (playerSource === "favoriteVideos") {
      setSelectedFavoriteVideo(null);
      setSelectedChannel(null);
      setVideos([]);
      setActiveTab("videos");
      setPlayerSource(null);
      history.replaceState({ view: "channels" }, "");
      return;
    }

    if (selectedChannel) {
      setPlayerSource(null);
      history.replaceState({ view: "videos" }, "");
      return;
    }

    setSelectedFavoriteVideo(null);
    setPlayerSource(null);
    history.replaceState({ view: "channels" }, "");
  };

  const handleBackToChannels = () => {
    setSelectedChannel(null);
    setSelectedFavoriteVideo(null);
    setVideos([]);
    setSelectedVideo(null);
    setPlayerSource(null);
    setError("");
    setNextPageToken(null);
    setPrevPageToken(null);
    history.replaceState({ view: "channels" }, "");
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

  const handleRemoveFavoriteVideo = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    removeFavoriteVideo(videoId);
    if (selectedFavoriteVideo?.videoId === videoId) {
      history.back();
    }
  };

  const handleToggleFavoriteVideo = (e: React.MouseEvent, video: VideoItem) => {
    e.stopPropagation();
    toggleFavoriteVideo({
      videoId: video.id.videoId,
      title: video.snippet.title,
      thumbnailUrl: video.snippet.thumbnails.medium.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
    });
  };

  if (!isLoaded || !isFavoriteVideosLoaded) {
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
              onClick={handleClosePlayer}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ←{" "}
              {selectedFavoriteVideo
                ? "お気に入り一覧に戻る"
                : "動画一覧に戻る"}
            </button>
            <VideoPlayerWithLimit
              videoId={selectedVideo}
              onLimitReached={() => {
                handleClosePlayer();
                setError("本日の視聴時間60分に達したため、再生を停止しました");
              }}
            />
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
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {videos.map((video) => (
                    <div
                      key={video.id.videoId}
                      className="relative h-full bg-gray-800 rounded-2xl overflow-hidden transition-all shadow-lg hover:bg-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavoriteVideo(e, video)}
                        className="absolute top-3 right-3 z-10 p-2 bg-gray-900/80 hover:bg-gray-700 rounded-full transition-colors"
                        title={
                          isFavoriteVideo(video.id.videoId)
                            ? "お気に入りから削除"
                            : "お気に入りに追加"
                        }
                      >
                        {isFavoriteVideo(video.id.videoId) ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-300 hover:text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVideoClick(video.id.videoId)}
                        className="flex h-full w-full cursor-pointer flex-col text-left"
                      >
                        <Image
                          src={video.snippet.thumbnails.medium.url}
                          alt={video.snippet.title}
                          width={320}
                          height={180}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="flex flex-1 flex-col justify-between p-3 pr-14 sm:p-4 sm:pr-16">
                          <div>
                            <h3 className="mb-2 line-clamp-2 text-sm font-semibold sm:text-base">
                              {video.snippet.title}
                            </h3>
                            <p className="mb-2 text-xs text-gray-400 sm:text-sm">
                              {video.snippet.channelTitle}
                            </p>
                            <p className="line-clamp-2 text-xs text-gray-500 sm:text-sm">
                              {video.snippet.description || "説明はありません"}
                            </p>
                          </div>
                          <p className="mt-3 text-xs text-gray-500">
                            {new Date(
                              video.snippet.publishedAt,
                            ).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                      </button>
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
        ) : favorites.length > 0 || favoriteVideos.length > 0 ? (
          <>
            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("channels")}
                disabled={favorites.length === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500 ${
                  activeTab === "channels"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                お気に入りチャンネル
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                disabled={favoriteVideos.length === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500 ${
                  activeTab === "videos"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                お気に入り動画
              </button>
            </div>

            {activeTab === "channels" && favorites.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mb-6">
                  お気に入りチャンネル一覧
                </h2>
                <div className="flex flex-col gap-4">
                  {favorites.map((channel) => (
                    <div
                      key={channel.channelId}
                      className="bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-700 transition-all shadow-lg relative group flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4 sm:px-5"
                    >
                      <button
                        type="button"
                        onClick={() => handleChannelClick(channel)}
                        className="flex flex-1 min-w-0 cursor-pointer flex-col gap-4 text-left sm:flex-row sm:items-center"
                      >
                        <Image
                          src={channel.thumbnailUrl}
                          alt={channel.title}
                          width={80}
                          height={80}
                          className="w-20 h-20 rounded-full object-cover flex-shrink-0 self-start sm:self-center"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
                            {channel.title}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            チャンネルを開いて最新動画を確認
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleRemoveFavorite(e, channel.channelId)
                        }
                        className="p-2 bg-gray-900/80 hover:bg-red-600 rounded-full transition-colors flex-shrink-0 self-end sm:self-center"
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
            )}
            {activeTab === "videos" && favoriteVideos.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mb-6">お気に入り動画一覧</h2>
                <div className="grid grid-cols-2 gap-3 mb-10 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {favoriteVideos.map((video) => (
                    <div
                      key={video.videoId}
                      className="relative h-full bg-gray-800 rounded-2xl overflow-hidden transition-all shadow-lg hover:bg-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                    >
                      <button
                        type="button"
                        onClick={(e) =>
                          handleRemoveFavoriteVideo(e, video.videoId)
                        }
                        className="absolute top-3 right-3 z-10 p-2 bg-gray-900/80 hover:bg-red-600 rounded-full transition-colors"
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
                      <button
                        type="button"
                        onClick={() => handleFavoriteVideoClick(video)}
                        className="flex h-full w-full cursor-pointer flex-col text-left"
                      >
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          width={320}
                          height={180}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="flex flex-1 flex-col justify-between p-3 pr-14 sm:p-4 sm:pr-16">
                          <div>
                            <h3 className="mb-2 line-clamp-2 text-sm font-semibold sm:text-base">
                              {video.title}
                            </h3>
                            <p className="mb-2 text-xs text-gray-400 sm:text-sm">
                              {video.channelTitle}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(video.publishedAt).toLocaleDateString(
                              "ja-JP",
                            )}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-lg mb-2">お気に入りがありません</p>
            <p className="text-sm mb-6">
              検索ページでチャンネルや動画をお気に入りに登録してください
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
