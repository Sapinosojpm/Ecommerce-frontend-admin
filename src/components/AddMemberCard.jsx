import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App"; // Adjust if needed

const AddMemberCard = ({ token }) => {
    const [image, setImage] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(""); // For error handling
    const [memberCards, setMemberCards] = useState([]); // Store the list of cards

    // Debug: Log token
    useEffect(() => {
        console.log("Token received in AddMemberCard:", token);
    }, [token]);

    // Check if the token is expired
    const isTokenExpired = (token) => {
        try {
            const [, payload] = token.split(".");
            const decoded = JSON.parse(atob(payload));
            return decoded.exp * 1000 < Date.now();
        } catch (error) {
            return true; // Assume expired if decoding fails
        }
    };

    if (!token || isTokenExpired(token)) {
        return <p className="text-red-600">Session expired. Please log in again.</p>;
    }

    // Fetch the list of cards from the backend
    const fetchMemberCards = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/memberCard/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setMemberCards(response.data.memberCards);
            } else {
                throw new Error("Failed to fetch cards");
            }
        } catch (error) {
            console.error("Error fetching cards:", error);
            setError(error.message || "An unexpected error occurred.");
        }
    };

    useEffect(() => {
        fetchMemberCards(); // Load cards on component mount
    }, [token]);

    const handleImageChange = (file) => {
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Image size should be less than 2MB");
            return;
        }

        if (!["image/jpeg", "image/png"].includes(file.type)) {
            alert("Only JPG and PNG formats are allowed");
            return;
        }

        setImage(file);
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(""); // Reset error before submission

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            if (image) formData.append("image", image);

            console.log("Form Data Sent:", [...formData.entries()]); // Debug log

            // Send the form data to the backend
            const response = await axios.post(`${backendUrl}/api/memberCard/addMemberCard`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                alert("Card added successfully!");
                setName("");
                setDescription("");
                setImage(null);
                fetchMemberCards(); // Refresh the list of cards after adding
            } else {
                throw new Error(response.data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error("Error adding card:", error);
            setError(error.message || "An unexpected error occurred.");
            alert("Something went wrong. Please try again!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMemberCard = async (memberCardId) => {
        try {
            const response = await axios.delete(`${backendUrl}/api/memberCard/remove?id=${memberCardId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                alert("Card removed successfully!");
                fetchMemberCards(); // Refresh the list after removal
            } else {
                throw new Error(response.data.message || "Failed to remove card.");
            }
        } catch (error) {
            console.error("Error removing card:", error);
            setError(error.message || "An unexpected error occurred.");
            alert("Something went wrong. Please try again!");
        }
    };

    return (
        <div className="flex flex-col w-full items-start gap-6">
            {error && <p className="text-red-600">{error}</p>} {/* Display error message if any */}

            {/* Add Card Form */}
            <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
                
                {/* File Upload */}
                <div className="w-full">
                    <p className="mb-2">Upload Member Image</p>
                    <input
                        type="file"
                        className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded"
                        accept="image/jpeg, image/png"
                        onChange={(e) => handleImageChange(e.target.files[0])}
                        required/>
                    {image && (
                        <img
                            className="w-20 mt-2 border border-gray-300 rounded"
                            src={URL.createObjectURL(image)}
                            alt="Uploaded Preview"
                        />
                    )}
                </div>

                <div className="w-full">
                    <p className="mb-2">Member Name</p>
                    <input
                        type="text"
                        className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded"
                        placeholder="Enter name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="w-full">
                    <p className="mb-2">Member Description</p>
                    <textarea
                        className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded"
                        placeholder="Enter description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="w-28 py-3 mt-4 bg-green-600 hover:bg-green-700 text-white rounded" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "ADD"}
                </button>
            </form>

            {/* List of Cards */}
            <div className="mt-8 w-full">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">List of Transactions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memberCards.length === 0 ? (
                        <p>No cards found.</p>
                    ) : (
                        memberCards.map((memberCard) => (
                            <div key={memberCard._id} className="border p-4 rounded-lg shadow-lg">
                                <img
                                    src={memberCard.image || "https://via.placeholder.com/150"}
                                    alt={memberCard.name}
                                    className="w-full h-48 object-cover rounded-md mb-4"
                                />
                                <h3 className="font-semibold text-xl">{memberCard.name}</h3>
                                <p className="text-gray-600 mt-2">{memberCard.description}</p>
                                <button
                                    onClick={() => handleRemoveMemberCard(memberCard._id)}
                                    className="mt-4 bg-green-600 p-2 rounded-lg text-white hover:bg-green-700"
                                >
                                    Remove Card
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddMemberCard;
