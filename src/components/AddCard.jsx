import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App"; // Adjust if needed

const AddCard = () => {
    const [image, setImage] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [cards, setCards] = useState([]);
    const token = localStorage.getItem("authToken");
    // Fetch the list of cards from the backend
    const fetchCards = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/card/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setCards(response.data.cards);
            } else {
                throw new Error("Failed to fetch cards");
            }
        } catch (error) {
            console.error("Error fetching cards:", error);
            setError(error.response?.data?.message || "An unexpected error occurred.");
        }
    };

    useEffect(() => {
        fetchCards();
    }, [token]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
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
        setError("");

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            if (image) formData.append("image", image);

            const response = await axios.post(`${backendUrl}/api/card/addCard`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });

            if (response.data.success) {
                alert("Card added successfully!");
                setName("");
                setDescription("");
                setImage(null);
                fetchCards();
            } else {
                throw new Error(response.data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error("Error adding card:", error);
            setError(error.response?.data?.message || "An unexpected error occurred.");
            alert("Something went wrong. Please try again!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveCard = async (cardId) => {
        if (!window.confirm("Are you sure you want to remove this card?")) return;

        setIsSubmitting(true);
        try {
            const response = await axios.delete(`${backendUrl}/api/card/remove?id=${cardId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                alert("Card removed successfully!");
                fetchCards();
            } else {
                throw new Error(response.data.message || "Failed to remove card.");
            }
        } catch (error) {
            console.error("Error removing card:", error);
            setError(error.response?.data?.message || "An unexpected error occurred.");
            alert("Something went wrong. Please try again!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-start w-full gap-6">
            {error && <p className="text-red-600">{error}</p>}

            {/* Add Card Form */}
            <form onSubmit={onSubmitHandler} className="flex flex-col items-start w-full gap-3">
                <div className="w-full">
                    <p className="mb-2">Upload Card Image</p>

                    {/* File Input */}
                    <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleImageChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full max-w-[500px]"
                        required
                    />

                    {/* Preview Image */}
                    {image && (
                        <div className="mt-3">
                            <img
                                className="object-cover w-24 h-24 border border-gray-300 rounded"
                                src={URL.createObjectURL(image)}
                                alt="Preview"
                            />
                        </div>
                    )}
                </div>

                <div className="w-full">
                    <p className="mb-2">Card Name</p>
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
                    <p className="mb-2">Card Description</p>
                    <textarea
                        className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded"
                        placeholder="Enter description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="py-3 mt-4 text-white bg-green-600 rounded w-28 hover:bg-green-800" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "ADD"}
                </button>
            </form>

            {/* List of Cards with Scrollable Container */}
            <div className="mt-8 w-full max-h-[500px] overflow-y-auto border border-gray-300 rounded-lg p-4">
                <h2 className="mb-4 text-2xl font-semibold text-gray-800">List of Cards</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.length === 0 ? (
                        <p className="text-gray-500">No cards found.</p>
                    ) : (
                        cards.map((card) => (
                            <div key={card._id} className="p-4 border rounded-lg shadow-lg">
                                <img
                                    src={card.image || "https://via.placeholder.com/150"}
                                    alt={card.name}
                                    className="object-cover w-full h-48 mb-4 rounded-md"
                                />
                                <h3 className="text-xl font-semibold">{card.name}</h3>
                                <p className="mt-2 text-gray-600">{card.description}</p>
                                <button
                                    onClick={() => handleRemoveCard(card._id)}
                                    className="mt-4 text-red-600 hover:text-red-800"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Removing..." : "Remove Card"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCard;
