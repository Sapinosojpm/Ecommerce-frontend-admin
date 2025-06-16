import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { Pie } from "react-chartjs-2";

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  // Fetch reviews from backend
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("No token found, please login again.");
        return;
      }

      const response = await axios.get(`${backendUrl}/api/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setReviews(response.data.reviews);
        calculateAnalytics(response.data.reviews);
        setSelectedIds([]); // clear selections on reload
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to fetch reviews.");
      toast.error("Failed to fetch reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const calculateAnalytics = (reviews) => {
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(2) : 0;

    const ratingDistribution = reviews.reduce((acc, r) => {
      acc[r.rating] = acc[r.rating] + 1 || 1;
      return acc;
    }, {});

    setAnalytics({ totalReviews, averageRating, ratingDistribution });
  };

  const pieData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        data: [1, 2, 3, 4, 5].map((num) => analytics.ratingDistribution[num] || 0),
        backgroundColor: [
          "#c7d2fe",
          "#a5b4fc",
          "#818cf8",
          "#6366f1",
          "#4f46e5",
        ],
        hoverBackgroundColor: [
          "#a5b4fc",
          "#818cf8",
          "#6366f1",
          "#4f46e5",
          "#4338ca",
        ],
      },
    ],
  };

  // Handle checkbox toggle for selecting reviews
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Select or deselect all reviews
  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map((r) => r._id));
    }
  };

  // Delete selected reviews
  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.info("No reviews selected.");
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} selected review(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${backendUrl}/api/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: selectedIds },
      });
      toast.success(`${selectedIds.length} review(s) deleted.`);
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete reviews.");
    }
  };

  // Delete all reviews
  const deleteAll = async () => {
    if (reviews.length === 0) {
      toast.info("No reviews to delete.");
      return;
    }

    if (!window.confirm(`Delete ALL ${reviews.length} reviews? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const allIds = reviews.map((r) => r._id);
      await axios.delete(`${backendUrl}/api/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: allIds },
      });
      toast.success("All reviews deleted.");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete all reviews.");
    }
  };

  if (loading)
    return (
      <div className="mt-6 text-xl font-semibold text-center text-indigo-600">
        Loading reviews...
      </div>
    );

  if (error)
    return (
      <div className="mt-6 text-lg font-medium text-center text-red-500">
        {error}
      </div>
    );

  return (
    <div className="container p-4 mx-auto md:p-6">
      <h1 className="mb-6 text-3xl font-bold text-center text-indigo-800">
        Customer Reviews & Insights
      </h1>

      {/* Analytics Section */}
      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <div className="flex flex-col items-center p-6 shadow-lg bg-indigo-50 rounded-2xl">
          <p className="text-lg font-medium text-indigo-700">Total Reviews</p>
          <p className="text-4xl font-extrabold text-indigo-900">
            {analytics.totalReviews}
          </p>
        </div>

        <div className="flex flex-col items-center p-6 shadow-lg bg-indigo-50 rounded-2xl">
          <p className="text-lg font-medium text-indigo-700">Average Rating</p>
          <p className="text-4xl font-extrabold text-indigo-900">
            {analytics.averageRating} / 5
          </p>
        </div>

        <div className="p-4 shadow-lg bg-indigo-50 rounded-2xl">
          <p className="mb-2 text-lg font-medium text-center text-indigo-700">
            Rating Distribution
          </p>
          <div className="h-64">
            <Pie data={pieData} />
          </div>
        </div>
      </div>

      {/* Controls for deleting */}
      <div className="flex items-center justify-between mb-4 space-x-4">
        <label className="inline-flex items-center space-x-2 text-indigo-700">
          <input
            type="checkbox"
            checked={selectedIds.length === reviews.length && reviews.length > 0}
            onChange={toggleSelectAll}
          />
          <span>Select All</span>
        </label>

        <button
          onClick={deleteSelected}
          disabled={selectedIds.length === 0}
          className={`px-4 py-2 font-semibold text-white rounded-lg transition ${
            selectedIds.length === 0
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Delete Selected
        </button>

        <button
          onClick={deleteAll}
          disabled={reviews.length === 0}
          className={`px-4 py-2 font-semibold text-white rounded-lg transition ${
            reviews.length === 0
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Delete All
        </button>
      </div>

      {/* Review List */}
      <div className="bg-white p-4 rounded-xl shadow-inner max-h-[400px] overflow-y-auto space-y-4 border border-indigo-100">
        {reviews.length === 0 ? (
          <p className="text-center text-indigo-600">No reviews available.</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="flex items-start p-4 space-x-4 border border-indigo-100 rounded-lg shadow-sm bg-indigo-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(review._id)}
                onChange={() => toggleSelect(review._id)}
                className="mt-1"
              />
              <div>
                <h2 className="text-lg font-semibold text-indigo-800">
                  {review.name}
                </h2>
                <p className="text-indigo-600">Rating: {review.rating}</p>
                <p className="mt-1 text-sm text-indigo-900 max-w-prose">{review.review}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Review;
