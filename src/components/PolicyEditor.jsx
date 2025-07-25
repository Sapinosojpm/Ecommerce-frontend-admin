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

  // Helper to upload image to S3 and return the URL
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const presignRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileType: file.type }),
      });
      if (!presignRes.ok) throw new Error('Failed to get S3 pre-signed URL');
      const { uploadUrl, fileUrl } = await presignRes.json();
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file,
      });
      if (!s3Res.ok) throw new Error('Failed to upload file to S3');
      return fileUrl;
    } catch (err) {
      alert('Image upload to S3 failed.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = '';
    if (image) {
      imageUrl = await uploadImageToS3(image);
      if (!imageUrl) return;
    }
    try {
      if (editingPolicy) {
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/policies/${editingPolicy}`,
          {
            title,
            description,
            image: imageUrl || undefined,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        setPolicies((prev) =>
          prev.map((policy) => (policy._id === editingPolicy ? response.data : policy))
        );
      } else {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/policies`,
          {
            title,
            description,
            image: imageUrl,
          },
          { headers: { 'Content-Type': 'application/json' } }
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
    <div className="min-h-screen p-8 bg-gray-50">
      <h2 className="mb-8 text-3xl font-bold text-center text-gray-700">Policy Manager</h2>

      <form onSubmit={handleSubmit} className="max-w-xl p-6 mx-auto space-y-4 bg-white shadow rounded-2xl">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-full p-2 border border-gray-300 rounded-xl"
        />
        <button
          type="submit"
          className="w-full py-3 font-semibold text-white transition duration-300 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          {editingPolicy ? 'Update Policy' : 'Add Policy'}
        </button>
      </form>

      <div className="grid gap-6 mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {policies.map((policy) => (
          <div key={policy._id} className="p-6 space-y-4 text-center bg-white shadow rounded-2xl">
            {policy.image && (
              <img
                src={
                  policy.image?.startsWith('http')
                    ? policy.image
                    : `${import.meta.env.VITE_BACKEND_URL}${policy.image || ''}`
                }
                alt={policy.title}
                className="object-contain w-20 h-20 mx-auto"
              />
            )}
            <h3 className="text-lg font-semibold text-indigo-700">{policy.title}</h3>
            <p className="text-sm text-gray-600">{policy.description}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleEdit(policy)}
                className="px-4 py-2 text-white transition bg-indigo-500 rounded-lg hover:bg-indigo-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(policy._id)}
                className="px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600"
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
