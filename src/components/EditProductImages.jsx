import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App';
import { TrashIcon } from '@heroicons/react/24/outline';

const EditProductImages = ({ product, onUpdate }) => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);
  const [video, setVideo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (file, setImage) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG formats are allowed");
      return;
    }
    setImage(file);
  };

  const handleVideoChange = (file) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video size should be less than 100MB");
      return;
    }
    if (!["video/mp4", "video/avi", "video/mkv"].includes(file.type)) {
      toast.error("Only MP4, AVI, and MKV formats are allowed");
      return;
    }
    setVideo(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Add images to formData
      const imageFiles = [image1, image2, image3, image4].filter(Boolean);
      for (const [index, file] of imageFiles.entries()) {
        formData.append(`image${index + 1}`, file);
      }

      // Add video if exists
      if (video) {
        formData.append("video", video);
      }

      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `${backendUrl}/api/product/updateImages/${product._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Product images updated successfully!");
        onUpdate(response.data.product);
        // Reset form
        setImage1(null);
        setImage2(null);
        setImage3(null);
        setImage4(null);
        setVideo(null);
      } else {
        throw new Error(response.data.message || "Failed to update product images");
      }
    } catch (error) {
      console.error("Error updating product images:", error);
      toast.error(error.message || "Failed to update product images. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Edit Product Images</h3>
      
      {/* Current Images */}
      {product.image && product.image.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-gray-700">Current Images</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {product.image.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={img}
                  alt={`Product ${index + 1}`}
                  className="object-cover w-full h-32 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Upload Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">Upload New Images (Max 4)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[image1, image2, image3, image4].map((image, index) => (
              <label
                key={index}
                htmlFor={`new-image${index + 1}`}
                className="relative cursor-pointer group"
              >
                <div className="flex items-center justify-center overflow-hidden transition-colors border-2 border-gray-300 border-dashed rounded-lg aspect-square bg-gray-50 hover:border-indigo-300">
                  <img
                    className="object-cover w-full h-full"
                    src={image ? URL.createObjectURL(image) : product.image?.[index] || "https://via.placeholder.com/150"}
                    alt={image ? `Preview ${index + 1}` : `Upload ${index + 1}`}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 group-hover:bg-opacity-10">
                  {!image && (
                    <span className="text-xs text-gray-500">Click to upload</span>
                  )}
                </div>
                <input
                  onChange={(e) =>
                    handleImageChange(
                      e.target.files[0],
                      [setImage1, setImage2, setImage3, setImage4][index]
                    )
                  }
                  type="file"
                  id={`new-image${index + 1}`}
                  hidden
                />
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Supported formats: JPG, PNG (Max 5MB each)
          </p>
        </div>

        {/* Video Upload */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Product Video (Optional)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1">
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleVideoChange(e.target.files[0])}
                  accept="video/mp4,video/avi,video/mkv"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </label>
            {video && (
              <button
                type="button"
                onClick={() => setVideo(null)}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          {video && (
            <div className="mt-3">
              <video controls className="max-w-xs border rounded-lg">
                <source src={URL.createObjectURL(video)} type={video.type} />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Supported formats: MP4, AVI, MKV (Max 100MB)
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 text-white transition-colors bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {isSubmitting ? "Updating..." : "Update Images"}
        </button>
      </form>
    </div>
  );
};

export default EditProductImages; 