import { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const AdsEditor = () => {
  const [ads, setAds] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/ads`);
      setAds(Array.isArray(data) ? data : []);
    } catch (error) {
      setError("Failed to fetch ads.");
      setAds([]);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and GIF are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Max file size is 10MB.");
      return;
    }

    setError("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImageToServer = async () => {
    const formData = new FormData();
    formData.append("image", image);

    try {
      const { data } = await axios.post(`${backendUrl}/api/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.imageUrl; // Expecting `{ imageUrl: "uploaded_url" }`
    } catch (error) {
      setError("Image upload failed.");
      return null;
    }
  };

  const handleAddAd = async () => {
    if (!image) {
      setError("Please upload an image.");
      return;
    }

    setLoading(true);
    const uploadedImageUrl = await uploadImageToServer();
    if (!uploadedImageUrl) {
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${backendUrl}/api/ads`, {
        imageUrl: uploadedImageUrl,
        link,
        isActive,
      });

      // Reset form fields
      setImage(null);
      setImagePreview(null);
      setLink("");
      setIsActive(true);
      setError("");

      fetchAds();
    } catch (error) {
      setError("Failed to add ad.");
    }
    setLoading(false);
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;

    setDeleteLoading(id);
    try {
      await axios.delete(`${backendUrl}/api/ads/${id}`);
      fetchAds();
    } catch (error) {
      setError("Failed to delete ad.");
    }
    setDeleteLoading(null);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="mb-4 text-2xl font-semibold">Manage Ads</h2>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {/* Image Upload */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Upload Ad Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      {/* Ad Preview */}
      {imagePreview && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-medium">Preview:</p>
          <img
            src={imagePreview}
            alt="Preview"
            className="w-40 h-auto rounded-lg shadow-md"
          />
        </div>
      )}

      {/* Ad Link Input */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Ad Link</label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          placeholder="Enter ad link"
          required
        />
      </div>

      {/* Active Toggle */}
      <div className="mb-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
          />
          <span>Active</span>
        </label>
      </div>

      {/* Add Ad Button */}
      <button
        onClick={handleAddAd}
        disabled={loading}
        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Adding..." : "Add Ad"}
      </button>

      {/* Ads Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Link</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad._id} className="text-center border">
                <td className="p-2 border">
                  <img
                    src={ad.imageUrl}
                    alt="Ad"
                    className="w-20 h-auto mx-auto rounded-lg"
                  />
                </td>
                <td className="p-2 border">
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {ad.link}
                  </a>
                </td>
                <td className="p-2 border">{ad.isActive ? "Yes" : "No"}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleDeleteAd(ad._id)}
                    className="px-3 py-1 text-white bg-red-600 rounded-lg hover:bg-red-700"
                    disabled={deleteLoading === ad._id}
                  >
                    {deleteLoading === ad._id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdsEditor;
