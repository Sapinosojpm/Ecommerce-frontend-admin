import React, { useState, useEffect } from "react";
import { backendUrl } from "../App";

const LogoEditor = () => {
  const [logo, setLogo] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${backendUrl}/api/logo`)
      .then((res) => res.json())
      .then((data) => setLogo(data.imageUrl)) 
      .catch((error) => console.error("Error fetching logo:", error));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a logo file to upload.");
      return;
    }
    try {
      // 1. Get pre-signed URL from backend
      const presignRes = await fetch(`${backendUrl}/api/upload/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: file.type }),
      });
      if (!presignRes.ok) throw new Error('Failed to get S3 pre-signed URL');
      const { uploadUrl, fileUrl } = await presignRes.json();
      // 2. Upload logo to S3
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error('Failed to upload logo to S3');
      // 3. Send S3 URL to backend
      const res = await fetch(`${backendUrl}/api/logo/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: fileUrl }),
      });
      const data = await res.json();
      setLogo(fileUrl);
      setMessage(data.message);
    } catch (error) {
      console.error("Error uploading logo:", error);
      setMessage("Failed to upload logo.");
    }
  };

  return (
    <div className="flex justify-center bg-gray-100">
      <div className="flex items-center justify-center gap-4 w-full p-8 m-8 bg-white rounded-lg shadow-lg">
        {/* <h2 className="mb-6 text-2xl font-bold text-center">Logo</h2> */}

        

        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full my-6 text-sm border rounded-lg shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 text-white transition duration-500 bg-indigo-500 rounded hover:bg-black"
          >
            Upload Logo
          </button>
        </form>
        <div className="flex items-center justify-center m-6">
        {logo && <img src={logo} alt="Current Logo" className="w-60 mx-auto mb-4" />}
        </div>
        

        {message && <p className="mt-4 text-center text-green-500">{message}</p>}
      </div>
    </div>
  );
};

export default LogoEditor;
