import { useState, useEffect, useRef } from 'react'

export default function App() {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const thumbnailRefs = useRef([]);
  const extractYouTubeVideoId = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/videos');
        if (!res.ok) throw new Error('Failed to fetch videos');
        const data = await res.json();
        // Shuffle the videos
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setVideos(shuffled);
      } catch (err) {
        setError("Could not load video data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAddModalOpen || e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrevious();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, videos.length, isAddModalOpen]);

  useEffect(() => {
    thumbnailRefs.current[currentIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }, [currentIndex]);

  const navigateWithFade = (newIndex) => {
    if (newIndex === currentIndex && videos.length > 0) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsFading(false);
    }, 200);
  };

  const handleNext = () => videos.length > 0 && navigateWithFade((currentIndex + 1) % videos.length);
  const handlePrevious = () => videos.length > 0 && navigateWithFade((currentIndex - 1 + videos.length) % videos.length);
  const handleThumbnailClick = (index) => navigateWithFade(index);

  const handleAddVideo = async (newVideo) => {
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVideo)
      });

      if (!res.ok) throw new Error('Failed to add video');

      const addedVideo = await res.json();
      setVideos(prev => [addedVideo, ...prev]);
      navigateWithFade(0);
      setIsAddModalOpen(false);
    } catch (err) {
      setError("Failed to add video.");
    }
  };

  const handleDelete = async () => {
    const videoToDelete = videos[currentIndex];
    if (!videoToDelete || !window.confirm("Are you sure you want to delete this video?")) return;

    try {
      const body = videoToDelete.youtube ?
        { youtube_url: videoToDelete.youtube } :
        { video_url: videoToDelete.src };

      const res = await fetch("/api/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Failed to delete video');

      const newVideos = videos.filter((v, i) => i !== currentIndex);
      const newIndex = currentIndex >= newVideos.length ? Math.max(0, newVideos.length - 1) : currentIndex;
      setIsFading(true);
      setTimeout(() => {
        setVideos(newVideos);
        setCurrentIndex(newIndex);
        setIsFading(false);
      }, 200);
    } catch (err) {
      setError("Failed to delete video.");
    }
  };

  const YouTubePlayer = ({ videoId, isFading }) => {
    const playerRef = useRef(null);
    const containerId = `youtube-player-${videoId}-${Math.random()}`;

    useEffect(() => {
      return () => {
      };
    }, [videoId]);

    return (
      <iframe
        className={`w-full h-auto aspect-video transition-opacity duration-200 ${isFading ? "opacity-0" : "opacity-100"}`}
        id={containerId}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    );
  };

  const AddVideoModal = ({ onAddVideo, onClose }) => {
    const [tweetUrl, setTweetUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const modalRef = useRef();

    const handleSubmit = (e) => {
      e.preventDefault();
      onAddVideo({ tweet_url: tweetUrl, video_url: videoUrl });
    };

    useEffect(() => {
      const handleEsc = (event) => event.key === "Escape" && onClose();
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const handleBackdropClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    return (
      <div onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700/50 w-full max-w-lg relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold">×</button>
          <h3 className="text-xl font-bold mb-4 text-white">Add a New Video</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="url"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              placeholder="Tweet URL (for non-YouTube links)"
              className="flex-grow w-full bg-gray-700 text-white placeholder-gray-400 rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Direct Video or YouTube URL"
              required
              className="flex-grow w-full bg-gray-700 text-white placeholder-gray-400 rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-lg w-full"
            >
              Add to Collection
            </button>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center text-red-300 p-6">Error: {error}</div>
    </div>
  );

  const currentVideo = videos.length > 0 ? videos[currentIndex] : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-4">
      {isAddModalOpen && <AddVideoModal onAddVideo={handleAddVideo} onClose={() => setIsAddModalOpen(false)} />}

      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
        <main className="bg-gray-900 p-4 rounded-xl shadow-2xl border border-gray-700/50 flex flex-col gap-4">
          <div className="video-container w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
            {currentVideo ? (
              currentVideo.youtube ? (
                <YouTubePlayer videoId={extractYouTubeVideoId(currentVideo.youtube)} isFading={isFading} />
              ) : (
                <video
                  key={currentVideo.src}
                  src={currentVideo.src}
                  controls
                  autoPlay
                  muted
                  loop
                  className={`w-full h-auto transition-opacity duration-200 ${isFading ? "opacity-0" : "opacity-100"}`}
                ></video>
              )
            ) : (
              <div className="text-center text-gray-400 p-8 h-48 flex items-center justify-center">No videos to display.</div>
            )}
          </div>

          {currentVideo ? (
            <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
              <div className="text-gray-300 font-medium">
                Video <span className="text-white font-bold">{currentIndex + 1}</span> of <span className="text-white font-bold">{videos.length}</span>
              </div>
              <div className="flex items-center gap-3">
                {currentVideo.x && (
                  <a
                    href={currentVideo.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                  >
                    🔗 <span>Original Post</span>
                  </a>
                )}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  ➕ <span>Add</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  🗑️ <span>Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                ➕ <span>Add a Video</span>
              </button>
            </div>
          )}
        </main>

        <footer className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700/50 flex items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={videos.length < 2}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>

          <div className="thumbnail-scrubber flex-grow flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {videos.map((video, index) => {
              const videoId = video.youtube ? extractYouTubeVideoId(video.youtube) : null;
              return (
                <div
                  key={video.id}
                  ref={(el) => (thumbnailRefs.current[index] = el)}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative rounded-md overflow-hidden cursor-pointer flex-shrink-0 w-32 h-20 bg-black group transition-all duration-200 border-4 ${currentIndex === index ? "border-blue-500" : "border-transparent hover:border-gray-500"
                    }`}
                >
                  {videoId ? (
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      className="w-full h-full object-cover"
                      alt="YouTube thumbnail"
                    />
                  ) : (
                    <video
                      src={video.src}
                      muted
                      preload="metadata"
                      className="w-full h-full object-cover"
                    ></video>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10"></div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={videos.length < 2}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </footer>
      </div>

      <style jsx>{`
        .thumbnail-scrubber::-webkit-scrollbar { height: 8px; }
        .thumbnail-scrubber::-webkit-scrollbar-track { background: #1f2937; border-radius: 10px; }
        .thumbnail-scrubber::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
        .thumbnail-scrubber::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .thumbnail-scrubber { scrollbar-width: thin; scrollbar-color: #4b5563 #1f2937; }
      `}</style>
    </div>
  );
}