import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const AdminFAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });
  const [editFAQ, setEditFAQ] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  }

  const closeModal = () => {
    setIsOpen(false);
  }


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
    <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">Manage FAQs</h1>
        <button className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-800" onClick={openModal}>Add New FAQ</button>
      </div>



     {isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="relative w-full max-w-lg p-6 mx-4 bg-white shadow-2xl rounded-xl">
      
      {/* Close button */}
      <button
        className="absolute text-xl text-gray-500 top-4 right-4 hover:text-black"
        onClick={closeModal}
      >
        ✕
      </button>

      {/* Form */}
      <div className="mt-6 space-y-4 ">
        <input
          type="text"
          placeholder="Question"
          value={newFAQ.question}
          onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
         rows="6"
          placeholder="Answer"
          value={newFAQ.answer}
          onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddFAQ}
          className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Add FAQ
        </button>
      </div>
    </div>
  </div>
)}


      {/* Edit FAQ Section */}
      {editFAQ && (
        <div className="mb-6">
          <h3 className="mb-4 text-xl font-semibold text-gray-700">Edit FAQ</h3>
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
              className="w-full py-3 font-semibold text-white transition duration-300 bg-indigo-600 rounded-lg hover:bg-indigo-800"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Scrollable FAQ List */}
    <div>
  <div className="p-6 overflow-y-auto border border-gray-200 rounded-xl max-h-[500px] bg-white shadow-sm">
    {faqs.length > 0 ? (
      faqs.map((faq) => (
        <div
          key={faq._id}
          className="mb-5 transition duration-300 border border-gray-200 rounded-xl bg-gray-50 hover:shadow"
        >
          <div className="">
            <h4 className="p-4 text-lg font-bold text-white bg-gray-800 rounded-t-lg">{faq.question}</h4>
            <div className="p-4 bg-white border border-gray-200">
 <p className="mt-2 text-gray-600 whitespace-pre-line">{faq.answer}</p>
            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={() => setEditFAQ(faq)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteFAQ(faq._id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
           
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="text-center text-gray-500">No FAQs available.</p>
    )}
  </div>
</div>

    </div>
  );
};

export default AdminFAQPage;
