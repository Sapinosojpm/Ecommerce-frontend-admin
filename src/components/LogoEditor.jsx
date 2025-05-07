import React, { useState, useEffect } from "react";
import { backendUrl } from "../App";

const LogoEditor = () => {
  const [logo, setLogo] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${backendUrl}/api/logo`)
      .then((res) => res.json())
      .then((data) => setLogo(`${backendUrl}${data.imageUrl}`))
      .catch((error) => console.error("Error fetching logo:", error));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a logo file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch(`${backendUrl}/api/logo/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setLogo(`${backendUrl}${data.imageUrl}`);
      setMessage(data.message);
    } catch (error) {
      console.error("Error uploading logo:", error);
      setMessage("Failed to upload logo.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Logo Editor</h2>

        {logo && <img src={logo} alt="Current Logo" className="w-32 mx-auto mb-4" />}

        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full p-2 border rounded mb-4"
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Upload Logo
          </button>
        </form>

        {message && <p className="mt-4 text-center text-green-500">{message}</p>}
      </div>
    </div>
  );
};

export default LogoEditor;
