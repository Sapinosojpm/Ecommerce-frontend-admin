import React, { useState, useEffect } from "react";
import { backendUrl } from "../App";

const AdminPanel = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isYoutubeActive, setIsYoutubeActive] = useState(false);

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
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* <h2 className="text-2xl font-bold mb-6 text-center"></h2> */}

        {/* Active Status */}
        <div className="flex justify-center mb-6">
          <span
            className={`px-4 py-2 text-white font-bold rounded ${
              isYoutubeActive ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {isYoutubeActive ? "Active: YouTube" : "Active: Local Video"}
          </span>
        </div>

        {/* YouTube URL Update */}
        <form onSubmit={handleUrlSubmit} className="mb-6">
          <label htmlFor="youtubeUrl" className="block text-gray-700 text-sm font-bold mb-2">
            YouTube URL
          </label>
          <input
            id="youtubeUrl"
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            type="submit"
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Update URL
          </button>
        </form>

        {/* Video Upload */}
        <form onSubmit={handleVideoUpload}>
          <label htmlFor="videoUpload" className="block text-gray-700 text-sm font-bold mb-2">
            Upload Local Video
          </label>
          <input
            id="videoUpload"
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            type="submit"
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Upload Video
          </button>
        </form>

        {message && <p className="mt-4 text-center text-green-500">{message}</p>}
      </div>
    </div>
  );
};

export default AdminPanel;
