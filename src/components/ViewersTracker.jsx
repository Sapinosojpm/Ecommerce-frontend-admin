import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ViewersTracker = () => {
  const [pageViews, setPageViews] = useState([]);
  const [timeFilter, setTimeFilter] = useState("monthly"); // daily or monthly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch page views from backend based on filter
  useEffect(() => {
    const fetchPageViews = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/pageviews/views?filter=${timeFilter}`,
          { headers }
        );

        setPageViews(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("⚠️ You must be logged in as an admin to view analytics.");
        } else {
          setError("❌ Error fetching page views.");
        }
        console.error("Error fetching page views:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPageViews();
  }, [timeFilter]);

  // Aggregate total views by timePeriod for the chart
  const aggregateViewsByTime = () => {
    const agg = {};
    pageViews.forEach(({ timePeriod, views }) => {
      agg[timePeriod] = (agg[timePeriod] || 0) + views;
    });

    const labels = Object.keys(agg).sort();
    const dataPoints = labels.map((label) => agg[label]);

    return { labels, dataPoints };
  };

  const { labels, dataPoints } = aggregateViewsByTime();

  const lineChartData = {
    labels,
    datasets: [
      {
        label: "Total Views",
        data: dataPoints,
        borderColor: "rgba(99, 102, 241, 1)", // Indigo-500
        backgroundColor: "rgba(99, 102, 241, 0.2)", // Indigo-500 with opacity
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { color: "#4c51bf" } }, // Indigo-600 text
      title: {
        display: true,
        text: "Page Views Over Time",
        color: "#4c51bf",
        font: { size: 18, weight: "bold" },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#4c51bf",
        titleColor: "#fff",
        bodyColor: "#fff",
      },
    },
    scales: {
      x: {
        ticks: { color: "#4c51bf" },
        grid: { color: "#c3dafe" }, // Indigo-200 grid
      },
      y: {
        ticks: { color: "#4c51bf" },
        grid: { color: "#c3dafe" },
      },
    },
  };

  return (
    <div className="max-w-4xl p-6 mx-auto mt-8 shadow-xl bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
      <motion.h2
        className="mb-6 text-2xl font-bold text-center text-indigo-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Page View Statistics
      </motion.h2>

      {/* Time Filter Dropdown */}
      <div className="flex justify-end mb-4">
        <select
          className="p-2 text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && <p className="text-center text-indigo-500">Loading page views...</p>}

      {/* Error Message */}
      {error && <p className="text-center text-red-600">{error}</p>}

      {/* Chart */}
      {!loading && !error && labels.length > 0 && (
        <div className="p-4 my-8 bg-white rounded-lg shadow-md">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      )}

      {/* Table */}
      {!loading && !error && pageViews.length > 0 && (
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="w-full border border-indigo-200 rounded-lg bg-indigo-50">
            <thead className="text-white bg-indigo-600">
              <tr>
                <th className="p-3 text-left">Page</th>
                <th className="p-3 text-left">{timeFilter === "daily" ? "Date" : "Month"}</th>
                <th className="p-3 text-left">User Type</th>
                <th className="p-3 text-left">Views</th>
              </tr>
            </thead>
            <tbody>
              {pageViews.map((page, index) => (
                <motion.tr
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-indigo-200 hover:bg-indigo-100"
                >
                  <td className="p-3 font-semibold text-indigo-800">{page.page}</td>
                  <td className="p-3 text-indigo-700">{page.timePeriod}</td>
                  <td className="p-3 text-indigo-700">{page.userType}</td>
                  <td className="p-3 font-bold text-indigo-900">{page.views}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Data */}
      {!loading && !error && pageViews.length === 0 && (
        <p className="text-center text-indigo-500">No page view data available.</p>
      )}
    </div>
  );
};

export default ViewersTracker;
