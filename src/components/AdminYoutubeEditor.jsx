import React, { useState, useEffect } from "react";
import { backendUrl } from "../App";

const AdminPanel = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isYoutubeActive, setIsYoutubeActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch current video URL when component mounts
  useEffect(() => {
    fetch(`${backendUrl}/api/youtube-url`)
      .then((res) => res.json())
      .then((data) => {
        setYoutubeUrl(data.youtubeUrl);
        setIsYoutubeActive(data.youtubeUrl.includes("youtube.com")); // Detect if it's a YouTube URL
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${backendUrl}/api/youtube-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUrl: youtubeUrl }),
      });
      const data = await res.json();
      setMessage(data.message);
      setIsYoutubeActive(true); // Set YouTube as active
    } catch (error) {
      console.error("Error updating URL:", error);
      setMessage("Failed to update URL");
    }
  };

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setMessage("Please select a video file to upload.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      const res = await fetch(`${backendUrl}/api/youtube/upload-video`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setMessage(data.message || "Video uploaded successfully!");
      setIsYoutubeActive(false); // Set Local Video as active
    } catch (error) {
      console.error("Error uploading video:", error);
      setMessage("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        {/* <h2 className="mb-6 text-2xl font-bold text-center"></h2> */}

        {/* Active Status */}
        <div className="flex justify-center mb-6">
          <span
            className={`px-4 py-2 text-white font-bold rounded ${
              isYoutubeActive ? "bg-indigo-500" : "bg-indigo-500"
            }`}
          >
            {isYoutubeActive ? "Active: YouTube" : "Active: Local Video"}
          </span>
        </div>

        {/* YouTube URL Update */}
        <form onSubmit={handleUrlSubmit} className="mb-6">
          <label htmlFor="youtubeUrl" className="block mb-2 text-sm font-bold text-gray-700">
            YouTube URL
          </label>
          <input
            id="youtubeUrl"
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 mt-4 font-bold text-white transition duration-500 bg-black rounded hover:bg-indigo-700 focus:outline-none focus:shadow-outline"
          >
            Update URL
          </button>
        </form>

        {/* Video Upload */}
        <form onSubmit={handleVideoUpload}>
          <label htmlFor="videoUpload" className="block mb-2 text-sm font-bold text-gray-700">
            Upload Local Video
          </label>
          <input
            id="videoUpload"
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            className="block w-full text-sm border rounded-lg shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 mt-4 font-bold text-white transition duration-500 bg-black rounded hover:bg-indigo-700 focus:outline-none focus:shadow-outline"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Video"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-green-500">{message}</p>}
      </div>
    </div>
  );
};

export default AdminPanel;
