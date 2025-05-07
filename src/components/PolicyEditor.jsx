import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PolicyEditor = () => {
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/policies`);
        setPolicies(response.data);
      } catch (error) {
        console.error('Error fetching policies:', error);
      }
    };

    fetchPolicies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (image) formData.append('image', image);

    try {
      if (editingPolicy) {
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/policies/${editingPolicy}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setPolicies((prev) =>
          prev.map((policy) => (policy._id === editingPolicy ? response.data : policy))
        );
      } else {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/policies`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setPolicies([...policies, response.data]);
      }

      setTitle('');
      setDescription('');
      setImage(null);
      setEditingPolicy(null);
    } catch (error) {
      console.error('Error saving policy:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/policies/${id}`);
      setPolicies(policies.filter((policy) => policy._id !== id));
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy._id);
    setTitle(policy.title);
    setDescription(policy.description);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center">Manage Policies</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-md"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border rounded-md"
          required
        />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} className="w-full p-2 border rounded-md" />
        <button
          type="submit"
          className="w-full py-3 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition duration-300"
        >
          {editingPolicy ? 'Update Policy' : 'Add Policy'}
        </button>
      </form>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <div key={policy._id} className="bg-white p-6 rounded-lg shadow-md text-center">
            {policy.image && (
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${policy.image}`}
                alt={policy.title}
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
            )}
            <h3 className="text-lg font-bold">{policy.title}</h3>
            <p className="text-gray-600 mb-4">{policy.description}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleEdit(policy)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(policy._id)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PolicyEditor;
