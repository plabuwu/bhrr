const http = require("http");
const fs = require("fs");
const path = require("path");

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Editing Style Inspiration</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://www.youtube.com/iframe_api"></script>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
      body { font-family: "Inter", sans-serif; background-color: #0a0a0a; }
      .video-container video, .video-container iframe { max-height: 70vh; }
      .thumbnail-scrubber::-webkit-scrollbar { height: 8px; }
      .thumbnail-scrubber::-webkit-scrollbar-track { background: #1f2937; border-radius: 10px; }
      .thumbnail-scrubber::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
      .thumbnail-scrubber::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      .thumbnail-scrubber { scrollbar-width: thin; scrollbar-color: #4b5563 #1f2937; }
    </style>
  </head>
  <body class="text-gray-200 flex items-center justify-center min-h-screen p-4">
    <div id="root"></div>
    <script type="text/babel">
      const extractYouTubeVideoId = (url) => {
        const regex = /(?:https?:\\/\\/)?(?:www\\.)?(?:youtube\\.com\\/(?:[^\\/\\n\\s]+\\/\\S+\\/|(?:v|e(?:mbed)?)\\/|\\S*?[?&]v=)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
      };

      const AddVideoModal = ({ onAddVideo, onClose }) => {
        const [tweetUrl, setTweetUrl] = React.useState("");
        const [videoUrl, setVideoUrl] = React.useState("");
        const modalRef = React.useRef();

        const handleSubmit = (e) => {
          e.preventDefault();
          onAddVideo({ tweet_url: tweetUrl, video_url: videoUrl });
        };

        React.useEffect(() => {
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
                <input type="url" value={tweetUrl} onChange={(e) => setTweetUrl(e.target.value)} placeholder="Tweet URL (for non-YouTube links)" className="flex-grow w-full bg-gray-700 text-white placeholder-gray-400 rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"/>
                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Direct Video or YouTube URL" required className="flex-grow w-full bg-gray-700 text-white placeholder-gray-400 rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"/>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-lg w-full">Add to Collection</button>
              </form>
            </div>
          </div>
        );
      };

      const YouTubePlayer = ({ videoId, isFading }) => {
        const playerRef = React.useRef(null);
        const containerId = \`youtube-player-\${videoId}-\${Math.random()}\`;

        React.useEffect(() => {
          if (!window.YT) return;
          const createPlayer = () => {
            playerRef.current = new YT.Player(containerId, {
              height: "100%", width: "100%", videoId: videoId,
              playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: videoId },
            });
          };
          if (!playerRef.current) createPlayer();
          else playerRef.current.loadVideoById(videoId);
          return () => playerRef.current?.destroy?.();
        }, [videoId]);

        return <div className={\`w-full h-auto aspect-video transition-opacity duration-200 \${isFading ? "opacity-0" : "opacity-100"}\`} id={containerId}></div>;
      };
      
      const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      const App = () => {
        const [videos, setVideos] = React.useState([]);
        const [currentIndex, setCurrentIndex] = React.useState(0);
        const [isLoading, setIsLoading] = React.useState(true);
        const [error, setError] = React.useState(null);
        const [isFading, setIsFading] = React.useState(false);
        const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
        const thumbnailRefs = React.useRef([]);

        React.useEffect(() => {
          fetch("./editingstyle.json")
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => setVideos(data && data.length > 0 ? shuffleArray(data) : []))
            .catch(err => setError("Could not load video data."))
            .finally(() => setIsLoading(false));
        }, []);

        React.useEffect(() => {
          const handleKeyDown = (e) => {
            if (isAddModalOpen || e.target.tagName === "INPUT") return;
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrevious();
          };
          window.addEventListener("keydown", handleKeyDown);
          return () => window.removeEventListener("keydown", handleKeyDown);
        }, [currentIndex, videos.length, isAddModalOpen]);

        React.useEffect(() => {
          thumbnailRefs.current[currentIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }, [currentIndex]);

        const navigateWithFade = (newIndex) => {
          if (newIndex === currentIndex && videos.length > 0) return;
          setIsFading(true);
          setTimeout(() => { setCurrentIndex(newIndex); setIsFading(false); }, 200);
        };

        const handleNext = () => videos.length > 0 && navigateWithFade((currentIndex + 1) % videos.length);
        const handlePrevious = () => videos.length > 0 && navigateWithFade((currentIndex - 1 + videos.length) % videos.length);
        const handleThumbnailClick = (index) => navigateWithFade(index);

        const handleAddVideo = React.useCallback((newVideo) => {
          fetch("/add-video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newVideo) })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(addedVideo => {
              setVideos(prev => [addedVideo, ...prev]);
              navigateWithFade(0);
              setIsAddModalOpen(false);
            })
            .catch(err => setError("Failed to add video."));
        }, [setError]);

        const handleDelete = React.useCallback(() => {
          const videoToDelete = videos[currentIndex];
          if (!videoToDelete || !window.confirm("Are you sure you want to delete this video?")) return;

          const body = videoToDelete.youtube_url ? { youtube_url: videoToDelete.youtube_url } : { video_url: videoToDelete.video_url };
          
          fetch("/delete-video", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(() => {
              const newVideos = videos.filter((v, i) => i !== currentIndex);
              const newIndex = currentIndex >= newVideos.length ? Math.max(0, newVideos.length - 1) : currentIndex;
              setIsFading(true);
              setTimeout(() => { setVideos(newVideos); setCurrentIndex(newIndex); setIsFading(false); }, 200);
            })
            .catch(err => setError("Failed to delete video."));
        }, [currentIndex, videos, setError]);

        if (isLoading) return <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>;
        if (error) return <div className="text-center text-red-300 p-6">Error: {error}</div>;
        
        const currentVideo = videos.length > 0 ? videos[currentIndex] : null;

        return (
          <>
            {isAddModalOpen && <AddVideoModal onAddVideo={handleAddVideo} onClose={() => setIsAddModalOpen(false)} />}
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
              <main className="bg-gray-900 p-4 rounded-xl shadow-2xl border border-gray-700/50 flex flex-col gap-4">
                <div className="video-container w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  {currentVideo ? (
                    currentVideo.youtube_url ? (
                      <YouTubePlayer videoId={extractYouTubeVideoId(currentVideo.youtube_url)} isFading={isFading} />
                    ) : (
                      <video key={currentVideo.video_url} src={currentVideo.video_url} controls autoPlay muted loop className={\`w-full h-auto transition-opacity duration-200 \${isFading ? "opacity-0" : "opacity-100"}\`}></video>
                    )
                  ) : (
                    <div className="text-center text-gray-400 p-8 h-48 flex items-center justify-center">No videos to display.</div>
                  )}
                </div>
                {currentVideo ? (
                  <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-gray-300 font-medium">Video <span className="text-white font-bold">{currentIndex + 1}</span> of <span className="text-white font-bold">{videos.length}</span></div>
                    <div className="flex items-center gap-3">
                      {currentVideo.tweet_url && <a href={currentVideo.tweet_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2">🔗 <span>Original Post</span></a>}
                      <button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2">➕ <span>Add</span></button>
                      <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2">🗑️ <span>Delete</span></button>
                    </div>
                  </div>
                ) : (
                   <div className="flex justify-center"><button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all">➕ <span>Add a Video</span></button></div>
                )}
              </main>
              <footer className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700/50 flex items-center gap-4">
                <button onClick={handlePrevious} disabled={videos.length < 2} className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed">←</button>
                <div className="thumbnail-scrubber flex-grow flex items-center gap-3 overflow-x-auto pb-2">
                  {videos.map((video, index) => {
                      const videoId = video.youtube_url ? extractYouTubeVideoId(video.youtube_url) : null;
                      return (
                          <div key={video.youtube_url || video.video_url} ref={(el) => (thumbnailRefs.current[index] = el)} onClick={() => handleThumbnailClick(index)} className={\`relative rounded-md overflow-hidden cursor-pointer flex-shrink-0 w-32 h-20 bg-black group transition-all duration-200 border-4 \${currentIndex === index ? "border-blue-500" : "border-transparent hover:border-gray-500"}\`}>
                              {videoId ? ( <img src={\`https://img.youtube.com/vi/\${videoId}/mqdefault.jpg\`} className="w-full h-full object-cover" alt="YouTube thumbnail"/> ) : ( <video src={video.video_url} muted preload="metadata" className="w-full h-full object-cover"></video> )}
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10"></div>
                          </div>
                      );
                  })}
                </div>
                <button onClick={handleNext} disabled={videos.length < 2} className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed">→</button>
              </footer>
            </div>
          </>
        );
      };
      ReactDOM.createRoot(document.getElementById("root")).render(<App />);
    </script>
  </body>
</html>
`;

function extractYouTubeVideoId(url) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function handleAddVideo(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", () => {
    try {
      const { tweet_url, video_url } = JSON.parse(body);
      if (!video_url) throw new Error("Missing video_url");

      const newVideo = extractYouTubeVideoId(video_url)
        ? { youtube_url: video_url }
        : { tweet_url, video_url };

      const dataFilePath = path.join(__dirname, "editingstyle.json");
      fs.readFile(dataFilePath, "utf8", (err, data) => {
        if (err) throw err;
        let videos = JSON.parse(data);
        videos.unshift(newVideo);
        fs.writeFile(
          dataFilePath,
          JSON.stringify(videos, null, 2),
          "utf8",
          (writeErr) => {
            if (writeErr) throw writeErr;
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify(newVideo));
          }
        );
      });
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Bad Request" }));
    }
  });
}

function handleDeleteVideo(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", () => {
    try {
      const { video_url, youtube_url } = JSON.parse(body);
      if (!video_url && !youtube_url)
        throw new Error("Missing video identifier");

      const dataFilePath = path.join(__dirname, "editingstyle.json");
      fs.readFile(dataFilePath, "utf8", (err, data) => {
        if (err) throw err;
        let videos = JSON.parse(data);
        const updatedVideos = videos.filter(
          (v) => v.video_url !== video_url && v.youtube_url !== youtube_url
        );

        if (videos.length === updatedVideos.length) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Video not found" }));
        }

        fs.writeFile(
          dataFilePath,
          JSON.stringify(updatedVideos, null, 2),
          "utf8",
          (writeErr) => {
            if (writeErr) throw writeErr;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Video deleted" }));
          }
        );
      });
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Bad Request" }));
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(htmlContent);
  } else if (req.url === "/editingstyle.json" && req.method === "GET") {
    fs.readFile(path.join(__dirname, "editingstyle.json"), (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Not Found");
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
    });
  } else if (req.url === "/add-video" && req.method === "POST") {
    handleAddVideo(req, res);
  } else if (req.url === "/delete-video" && req.method === "DELETE") {
    handleDeleteVideo(req, res);
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
