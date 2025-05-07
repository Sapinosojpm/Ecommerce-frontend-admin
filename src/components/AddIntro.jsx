import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "../App";

const AddIntro = ({ token }) => {
    const [image, setImage] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [intros, setIntros] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal State

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
        fetchIntros();
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

            const response = await axios.post(`${backendUrl}/api/intro/addIntro`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                toast.success("Intro added successfully!");
                setName("");
                setDescription("");
                setImage(null);
                setIsModalOpen(false); // Close modal
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
            const response = await axios.delete(`${backendUrl}/api/intro/remove?id=${introId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

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
        <div className="flex flex-col w-full items-start gap-6 p-6 bg-white shadow-md rounded-md">
            {/* Add Intro Button */}
            <button 
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition" 
                onClick={() => setIsModalOpen(true)}
            >
                Add Intro
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white w-full max-w-lg p-6 rounded shadow-lg relative">
                        <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                            onClick={() => setIsModalOpen(false)}
                        >
                            ✖
                        </button>
                        <h2 className="text-xl font-semibold mb-4">Add New Intro</h2>
                        <form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
                            {/* File Upload */}
                            <div>
                                <p className="mb-2 font-semibold">Upload Intro Image</p>
                                <input
                                    type="file"
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    accept="image/jpeg, image/png"
                                    onChange={(e) => handleImageChange(e.target.files[0])}
                                    required
                                />
                                {image && (
                                    <img
                                        className="w-20 mt-2 border border-gray-300 rounded"
                                        src={URL.createObjectURL(image)}
                                        alt="Uploaded Preview"
                                    />
                                )}
                            </div>

                            <div>
                                <p className="mb-2 font-semibold">Intro Name</p>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    placeholder="Enter name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <p className="mb-2 font-semibold">Intro Description</p>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    placeholder="Enter description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="w-full py-3 mt-4 bg-green-600 text-white rounded hover:bg-green-700 transition" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Adding..." : "ADD"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* List of Intros */}
            <div className="mt-8 w-full">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">List of Intros</h2>
                <div className="border rounded p-4 max-h-[400px] overflow-y-auto shadow-md">
                    {intros.length === 0 ? (
                        <p className="text-gray-500 text-center">No intros found.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {intros.map((intro) => (
                                <div key={intro._id} className="border p-4 rounded-lg shadow-lg">
                                    <img 
                                        src={intro.image || "https://via.placeholder.com/150"} 
                                        alt={intro.name} 
                                        className="w-full h-48 object-cover rounded-md mb-4" 
                                    />
                                    <h3 className="font-semibold text-xl">{intro.name}</h3>
                                    <p className="text-gray-600 mt-2">{intro.description}</p>
                                    <button
                                        onClick={() => handleRemoveIntro(intro._id)}
                                        className="mt-4 text-red-600 hover:text-red-800 transition"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={2000} />
        </div>
    );
};

export default AddIntro;
