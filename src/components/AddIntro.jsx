import React, { useState, useEffect } from "react";
import { PlusCircle, X, Upload, Trash2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "../App";
import axios from "axios";

const AddIntro = () => {
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intros, setIntros] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const token = localStorage.getItem("authToken");

  // Fetch intros from the backend
  const fetchIntros = async () => {
    if (!token) {
      toast.error("Unauthorized: Please log in.");
      return;
    }

    try {
      const response = await axios.get(`${backendUrl}/api/intro/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setIntros(response.data.intros);
      } else {
        throw new Error(response.data.message || "Failed to fetch intros");
      }
    } catch (error) {
      console.error("Error fetching intros:", error);
      toast.error("Failed to fetch intros.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchIntros();
    } else {
      toast.error("Unauthorized: Please log in.");
    }
  }, [token]);

  const handleImageChange = (file) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.warn("Image size should be less than 2MB");
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.warn("Only JPG and PNG formats are allowed");
      return;
    }

    setImage(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!token) {
      toast.error("Unauthorized: Please log in.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (image) formData.append("image", image);

      const response = await axios.post(
        `${backendUrl}/api/intro/addIntro`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Intro added successfully!");
        setName("");
        setDescription("");
        setImage(null);
        setIsModalOpen(false);
        fetchIntros();
      } else {
        throw new Error(response.data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error adding intro:", error);
      toast.error("Failed to add intro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIntro = async (introId) => {
    if (!token) {
      toast.error("Unauthorized: Please log in.");
      return;
    }

    try {
      const response = await axios.delete(
        `${backendUrl}/api/intro/remove?id=${introId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Intro removed successfully!");
        fetchIntros();
      } else {
        throw new Error(response.data.message || "Failed to remove intro.");
      }
    } catch (error) {
      console.error("Error removing intro:", error);
      toast.error("Failed to remove intro.");
    }
  };

  return (
    <div className="w-full p-8 shadow-lg bg-gradient-to-br from-white to-gray-50 rounded-xl">
      <div className="flex flex-col gap-8">
        {/* Header & Add Button */}
        <div className="flex items-center justify-between">
          {/* <h1 className="text-3xl font-bold text-gray-800">Intro Management</h1> */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 text-white transition-all duration-300 transform bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1"
          >
            <PlusCircle size={20} />
            <span>Add New Banner</span>
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 bg-black bg-opacity-60 backdrop-blur-sm">
            <div 
              className="relative w-full max-w-md p-8 transition-all duration-300 ease-out transform bg-white shadow-2xl rounded-2xl"
              style={{
                animation: "fadeIn 0.3s ease-out forwards",
              }}
            >
              <button
                className="absolute text-gray-500 transition-colors duration-300 right-4 top-4 hover:text-gray-700 focus:outline-none"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={24} />
              </button>
              
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Add Banner</h2>
              
              <form onSubmit={onSubmitHandler} className="flex flex-col gap-6">
                {/* File Upload Zone */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                    isDragging 
                      ? "border-indigo-500 bg-indigo-50" 
                      : image 
                        ? "border-green-400 bg-green-50" 
                        : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-upload").click()}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/jpeg, image/png"
                    onChange={(e) => handleImageChange(e.target.files[0])}
                  />
                  
                  {image ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        className="object-cover h-40 rounded-lg shadow-md"
                      />
                      <div className="flex items-center gap-1 text-green-600">
                        <span className="text-sm font-medium">Image selected</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                        }}
                        className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <p className="text-sm text-center">
                        <span className="font-medium">Click or drag</span> to upload an image
                        <br />
                        <span className="text-xs text-gray-400">JPG or PNG (max 2MB)</span>
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a descriptive name"
                    className="w-full px-4 py-3 transition-all duration-300 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                    required
                  />
                </div>
                
                {/* Description Field */}
                <div>
                  <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a detailed description"
                    rows={4}
                    className="w-full px-4 py-3 transition-all duration-300 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                    required
                  ></textarea>
                </div>
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-lg font-medium text-white transition-all duration-300 ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  }`}
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* List of Intros */}
        <div className="mt-4">
          {/* <h2 className="mb-6 text-2xl font-semibold text-gray-800">Your Banners</h2> */}
          
          {intros.length === 0 ? (
            <div className="p-10 text-center bg-white shadow-md rounded-xl">
              <div className="mb-3 text-gray-400">
                <PlusCircle size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500">No intros found. Create your first intro!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {intros.map((intro) => (
                <div 
                  key={intro._id}
                  className="overflow-hidden transition-all duration-300 transform bg-white shadow-md rounded-xl hover:shadow-xl hover:-translate-y-2"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={intro.image || "/api/placeholder/400/320"}
                      alt={intro.name}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-gray-800">{intro.name}</h3>
                    <p className="mb-4 text-sm text-gray-600">{intro.description}</p>
                    
                    <button
                      onClick={() => handleRemoveIntro(intro._id)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-red-600 transition-colors duration-300 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="bottom-right" />
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AddIntro;