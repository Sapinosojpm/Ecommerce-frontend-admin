import React, { useEffect, useState } from 'react';


  const backendUrl = import.meta.env.VITE_BACKEND_URL;

const HeroSection = () => {
  const [hero, setHero] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Error state for handling API errors

  // Fetch hero data from the backend
  useEffect(() => {
    const fetchHero = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/hero`);

        if (!response.ok) {
          throw new Error('Failed to fetch hero data');
        }
        const data = await response.json();
        setHero(data);
        setTitle(data?.title || '');
        setSubtitle(data?.subtitle || '');
      } catch (error) {
        console.error('Error fetching hero data:', error);
        setError('Failed to load hero data');
      } finally {
        setLoading(false);
      }
    };

    fetchHero();
  }, []);

  // Handle form submission for updating hero section
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    if (image) formData.append('image', image);

    try {
      const response = await fetch('http://localhost:4000/api/hero', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update hero section');
      }

      const data = await response.json();
      setHero(data); // Update the hero state with the new data
      alert('Hero section updated successfully!');
    } catch (error) {
      console.error('Error updating hero section:', error);
      setError('Failed to update hero section');
    }
  };

  // Handle image change
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  // Display loading, error, or hero data
  if (loading) {
    return <div className="text-center text-xl text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 text-xl">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
      {/* Hero image and overlay */}
      <div className="relative w-full h-96">
        <img
          src={`http://localhost:4000${hero?.image}`}
          alt="Hero"
          className="object-cover w-full h-full rounded-lg shadow-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-center p-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{hero?.title}</h1>
          <h2 className="text-lg md:text-2xl text-white">{hero?.subtitle}</h2>
        </div>
      </div>

      {/* Form for updating hero section */}
      <div className="w-full text-center text-white">
        <form onSubmit={handleSubmit} className="bg-white  p-8 rounded-xl mx-4 shadow-2xl">
          <div className="mb-6">
            <label htmlFor="title" className="block text-lg font-medium mb-3 text-white">Title</label>
            <textarea
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-lg text-gray-700 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter hero title"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="subtitle" className="block text-lg font-medium mb-3 text-white">Subtitle</label>
            <textarea
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full p-4 rounded-lg text-gray-700  bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter hero subtitle"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="image" className="block text-lg font-medium mb-3 text-white">Hero Image</label>
            <input
              type="file"
              id="image"
              onChange={handleImageChange}
              className="w-full p-4 rounded-lg text-gray-700  bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-500 text-white rounded-lg mt-6 hover:bg-green-600 transition-all duration-300"
          >
            Update Hero Section
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeroSection;
