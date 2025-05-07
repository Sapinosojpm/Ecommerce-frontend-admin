import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App"; // Adjust if needed

const AddCard = ({ token }) => {
    const [image, setImage] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [cards, setCards] = useState([]);

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
        <div className="flex flex-col w-full items-start gap-6">
            {error && <p className="text-red-600">{error}</p>}

            {/* Add Card Form */}
            <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
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
                                className="w-24 h-24 object-cover border border-gray-300 rounded"
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

                <button type="submit" className="w-28 py-3 mt-4 bg-green-600 hover:bg-green-800 text-white rounded" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "ADD"}
                </button>
            </form>

            {/* List of Cards with Scrollable Container */}
            <div className="mt-8 w-full max-h-[500px] overflow-y-auto border border-gray-300 rounded-lg p-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">List of Cards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.length === 0 ? (
                        <p className="text-gray-500">No cards found.</p>
                    ) : (
                        cards.map((card) => (
                            <div key={card._id} className="border p-4 rounded-lg shadow-lg">
                                <img
                                    src={card.image || "https://via.placeholder.com/150"}
                                    alt={card.name}
                                    className="w-full h-48 object-cover rounded-md mb-4"
                                />
                                <h3 className="font-semibold text-xl">{card.name}</h3>
                                <p className="text-gray-600 mt-2">{card.description}</p>
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
