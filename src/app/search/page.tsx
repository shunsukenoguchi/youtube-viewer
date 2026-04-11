"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFavoriteChannels } from "@/hooks/useFavoriteChannels";
import { useFavoriteVideos } from "@/hooks/useFavoriteVideos";

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
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [selectedChannelName, setSelectedChannelName] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageToken, setPrevPageToken] = useState<string | null>(null);

  const scrollPositionRef = useRef(0);
  const { isFavorite, toggleFavorite } = useFavoriteChannels();
  const { isFavorite: isVideoFavorite, toggleFavorite: toggleVideoFavorite } =
    useFavoriteVideos();

  useEffect(() => {
    history.replaceState({ view: "search" }, "");
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { view: string } | null;
      if (state?.view === "search") {
        setSelectedChannelId(null);
        setSelectedChannelName("");
        setVideos([]);
        setSelectedVideo(null);
        setNextPageToken(null);
        setPrevPageToken(null);
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPositionRef.current);
        });
      } else if (
        state?.view === "channelVideos" ||
        state?.view === "videoSearch"
      ) {
        setSelectedVideo(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const searchVideos = async (query: string, pageToken?: string | null) => {
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
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query,
        )}&type=video&maxResults=20&order=date${pageTokenParam}&key=${apiKey}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`検索に失敗しました: ${errorMessage}`);
      }

      const data = await response.json();
      setVideos(data.items || []);
      setNextPageToken(data.nextPageToken || null);
      setPrevPageToken(data.prevPageToken || null);

      if (data.items?.length === 0) {
        setError("動画が見つかりませんでした");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError(
        searchMode === "channel"
          ? "チャンネル名を入力してください"
          : "動画タイトルを入力してください",
      );
      return;
    }

    setChannels([]);
    setVideos([]);
    setSelectedChannelId(null);
    setNextPageToken(null);
    setPrevPageToken(null);

    if (searchMode === "video") {
      history.replaceState({ view: "videoSearch" }, "");
      await searchVideos(searchQuery);
      return;
    }

    history.replaceState({ view: "search" }, "");

    // チャンネル検索
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

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery,
        )}&type=channel&maxResults=10&key=${apiKey}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`検索に失敗しました: ${errorMessage}`);
      }

      const data = await response.json();
      setChannels(data.items || []);
      if (data.items?.length === 0) {
        setError("チャンネルが見つかりませんでした");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelVideos = async (
    channelId: string,
    pageToken?: string | null,
  ) => {
    setLoading(true);
    setError("");

    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

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

  const handleChannelClick = async (channelId: string, channelName: string) => {
    scrollPositionRef.current = window.scrollY;
    history.pushState({ view: "channelVideos" }, "");
    setSelectedChannelId(channelId);
    setSelectedChannelName(channelName);
    setNextPageToken(null);
    setPrevPageToken(null);
    await fetchChannelVideos(channelId);
  };

  const handleVideoClick = (videoId: string) => {
    history.pushState({ view: "player" }, "");
    setSelectedVideo(videoId);
  };

  const handleClear = () => {
    history.replaceState({ view: "search" }, "");
    setSelectedVideo(null);
    setVideos([]);
    setChannels([]);
    setSearchQuery("");
    setSelectedChannelId(null);
    setSelectedChannelName("");
    setError("");
    setNextPageToken(null);
    setPrevPageToken(null);
  };

  const handleBackToChannels = () => {
    history.back();
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
    setNextPageToken(null);
    setPrevPageToken(null);
  };

  const handleNextPage = () => {
    if (!nextPageToken) return;
    if (selectedChannelId) {
      fetchChannelVideos(selectedChannelId, nextPageToken);
    } else if (searchQuery) {
      searchVideos(searchQuery, nextPageToken);
    }
  };

  const handlePrevPage = () => {
    if (!prevPageToken) return;
    if (selectedChannelId) {
      fetchChannelVideos(selectedChannelId, prevPageToken);
    } else if (searchQuery) {
      searchVideos(searchQuery, prevPageToken);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent, channel: ChannelItem) => {
    e.stopPropagation();
    toggleFavorite({
      channelId: channel.id.channelId,
      title: channel.snippet.title,
      thumbnailUrl: channel.snippet.thumbnails.medium.url,
    });
  };

  const handleVideoFavoriteClick = (e: React.MouseEvent, video: VideoItem) => {
    e.stopPropagation();
    toggleVideoFavorite({
      videoId: video.id.videoId,
      title: video.snippet.title,
      thumbnailUrl: video.snippet.thumbnails.medium.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">動画検索</h1>
          <div className="flex gap-2">
            <Link
              href="/favorites"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              お気に入り
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              URL入力へ
            </Link>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
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
            type="button"
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
              placeholder={
                searchMode === "channel"
                  ? "チャンネル名を入力"
                  : "動画タイトルを入力"
              }
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
              type="button"
              onClick={() => history.back()}
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
              type="button"
              onClick={handleBackToChannels}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← チャンネル一覧に戻る
            </button>
            <h2 className="text-2xl font-bold mb-6">
              {selectedChannelName} の動画
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {videos.map((video) => (
                <div
                  key={video.id.videoId}
                  className="relative h-full bg-gray-800 rounded-2xl overflow-hidden transition-all shadow-lg hover:bg-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                >
                  <button
                    type="button"
                    onClick={(e) => handleVideoFavoriteClick(e, video)}
                    className="absolute top-3 right-3 z-10 p-2 bg-gray-900/80 hover:bg-gray-700 rounded-full transition-colors"
                    title={
                      isVideoFavorite(video.id.videoId)
                        ? "お気に入りから削除"
                        : "お気に入りに追加"
                    }
                  >
                    {isVideoFavorite(video.id.videoId) ? (
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
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(video.snippet.publishedAt).toLocaleDateString(
                          "ja-JP",
                        )}
                      </p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
            {/* チャンネル動画ページネーション */}
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
        ) : videos.length > 0 && searchMode === "video" ? (
          <>
            <h2 className="text-2xl font-bold mb-6">検索結果</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {videos.map((video) => (
                <div
                  key={video.id.videoId}
                  className="relative h-full bg-gray-800 rounded-2xl overflow-hidden transition-all shadow-lg hover:bg-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                >
                  <button
                    type="button"
                    onClick={(e) => handleVideoFavoriteClick(e, video)}
                    className="absolute top-3 right-3 z-10 p-2 bg-gray-900/80 hover:bg-gray-700 rounded-full transition-colors"
                    title={
                      isVideoFavorite(video.id.videoId)
                        ? "お気に入りから削除"
                        : "お気に入りに追加"
                    }
                  >
                    {isVideoFavorite(video.id.videoId) ? (
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
                        {new Date(video.snippet.publishedAt).toLocaleDateString(
                          "ja-JP",
                        )}
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
          <>
            {channels.length > 0 && searchMode === "channel" && (
              <>
                <h2 className="text-2xl font-bold mb-6">チャンネル一覧</h2>
                <div className="flex flex-col gap-4">
                  {channels.map((channel) => (
                    <div
                      key={channel.id.channelId}
                      className="bg-gray-800 rounded-2xl overflow-hidden transition-all shadow-lg relative group hover:bg-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleFavoriteClick(e, channel)}
                        className="absolute top-3 right-3 z-10 p-2 bg-gray-900/80 hover:bg-gray-700 rounded-full transition-colors"
                        title={
                          isFavorite(channel.id.channelId)
                            ? "お気に入りから削除"
                            : "お気に入りに追加"
                        }
                      >
                        {isFavorite(channel.id.channelId) ? (
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
                        onClick={() =>
                          handleChannelClick(
                            channel.id.channelId,
                            channel.snippet.title,
                          )
                        }
                        className="flex w-full cursor-pointer flex-col text-left sm:flex-row sm:items-center"
                      >
                        <Image
                          src={channel.snippet.thumbnails.medium.url}
                          alt={channel.snippet.title}
                          width={144}
                          height={144}
                          className="w-full sm:w-32 md:w-36 aspect-video sm:aspect-square object-cover flex-shrink-0"
                        />
                        <div className="flex-1 p-4 sm:p-5 pr-16 sm:pr-20">
                          <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">
                            {channel.snippet.title}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-3">
                            {channel.snippet.description ||
                              "チャンネルの説明はありません"}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loading &&
              channels.length === 0 &&
              videos.length === 0 &&
              !error && (
                <div className="text-center text-gray-400 mt-16">
                  <p className="text-lg mb-2">
                    {searchMode === "channel"
                      ? "チャンネル名で検索"
                      : "動画タイトルで検索"}
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
