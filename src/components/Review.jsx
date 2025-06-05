import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App"; // Update this with your actual backend URL
import { Pie } from 'react-chartjs-2'; // Install chart.js and react-chartjs-2 for pie chart

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  // Fetch all reviews from the backend
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
        calculateAnalytics(response.data.reviews); // Calculate analytics after fetching reviews
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      setError("Failed to fetch reviews.");
      toast.error("Failed to fetch reviews.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (reviews) => {
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(2) : 0;

    // Calculate rating distribution
    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = acc[review.rating] + 1 || 1;
      return acc;
    }, {});

    setAnalytics({
      totalReviews,
      averageRating,
      ratingDistribution,
    });
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) return <div className="mt-6 text-xl font-bold text-center text-blue-500">Loading reviews...</div>;
  if (error) return <div className="text-lg text-center text-red-500">{error}</div>;

  // Prepare data for pie chart
  const pieData = {
    labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
    datasets: [{
      data: Object.values(analytics.ratingDistribution),
      backgroundColor: ['#FF6F61', '#FFB74D', '#FFEB3B', '#4CAF50', '#2196F3'],
      hoverBackgroundColor: ['#FF5733', '#FF9800', '#FBC02D', '#388E3C', '#1976D2'],
    }],
  };

  return (
    <div className="container p-4 mx-auto md:p-6">
      <h1 className="mb-6 text-2xl font-semibold text-center md:text-3xl">Reviews</h1>

      {/* Analytics Section */}
      <div className="grid gap-6 mb-6 md:grid-cols-3">
        {/* Total Reviews Card */}
        <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
          <p className="text-xl font-semibold text-gray-700">Total Reviews</p>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalReviews}</p>
        </div>

        {/* Average Rating Card */}
        <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
          <p className="text-xl font-semibold text-gray-700">Average Rating</p>
          <p className="text-3xl font-bold text-gray-900">{analytics.averageRating} / 5</p>
        </div>

        {/* Rating Distribution Pie Chart */}
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <p className="text-xl font-semibold text-center text-gray-700">Rating Distribution</p>
          <div className="h-64">
            <Pie data={pieData} />
          </div>
        </div>
      </div>

      {/* Review List */}
      {reviews.length === 0 ? (
        <p className="text-center text-gray-500">No reviews found.</p>
      ) : (
        <div className="p-2 overflow-y-auto border rounded max-h-60">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="p-4 mb-4 bg-white rounded-lg shadow-md"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-700">{review.name}</h2>
                <p className="text-gray-500">Rating: {review.rating}</p>
                <div className="mt-2 overflow-y-auto max-h-48">
                  <p className="text-gray-700">{review.review}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Review;
