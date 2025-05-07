import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const AdminFAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });
  const [editFAQ, setEditFAQ] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/faqs`);
        setFaqs(response.data);
      } catch (error) {
        console.error("Error fetching FAQs", error);
      }
    };
    fetchFAQs();
  }, []);

  const handleAddFAQ = async () => {
    if (newFAQ.question && newFAQ.answer) {
      try {
        const response = await axios.post(`${backendUrl}/api/faqs`, newFAQ);
        setFaqs([...faqs, response.data]);
        setNewFAQ({ question: "", answer: "" });
      } catch (error) {
        console.error("Error adding FAQ", error);
      }
    }
  };

  const handleEditFAQ = async () => {
    if (editFAQ && editFAQ.question && editFAQ.answer) {
      try {
        const response = await axios.put(
          `${backendUrl}/api/faqs/${editFAQ._id}`,
          editFAQ
        );
        setFaqs(faqs.map((faq) => (faq._id === response.data._id ? response.data : faq)));
        setEditFAQ(null);
      } catch (error) {
        console.error("Error updating FAQ", error);
      }
    }
  };

  const handleDeleteFAQ = async (id) => {
    try {
      await axios.delete(`${backendUrl}/api/faqs/${id}`);
      setFaqs(faqs.filter((faq) => faq._id !== id));
    } catch (error) {
      console.error("Error deleting FAQ", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Manage FAQs</h1>

      {/* Add New FAQ Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Add New FAQ</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Question"
            value={newFAQ.question}
            onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Answer"
            value={newFAQ.answer}
            onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddFAQ}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300"
          >
            Add FAQ
          </button>
        </div>
      </div>

      {/* Edit FAQ Section */}
      {editFAQ && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Edit FAQ</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={editFAQ.question}
              onChange={(e) => setEditFAQ({ ...editFAQ, question: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={editFAQ.answer}
              onChange={(e) => setEditFAQ({ ...editFAQ, answer: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleEditFAQ}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Scrollable FAQ List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">All FAQs</h3>
        <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
          {faqs.length > 0 ? (
            faqs.map((faq) => (
              <div key={faq._id} className="border p-4 rounded-lg shadow-md bg-white mb-4">
                <h4 className="text-lg font-semibold text-gray-800">{faq.question}</h4>
                <p className="text-gray-600 mt-2">{faq.answer}</p>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => setEditFAQ(faq)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFAQ(faq._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No FAQs available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFAQPage;
