import React, { useEffect, useState } from 'react';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const HeroSection = () => {
  const [hero, setHero] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState('image');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/hero`);
        if (!response.ok) throw new Error('Failed to fetch hero data');
        const data = await response.json();
        setHero(data);
        setTitle(data?.title || '');
        setSubtitle(data?.subtitle || '');
        setType(data?.type || 'image');
      } catch (error) {
        console.error('Error fetching hero data:', error);
        setError('Failed to load hero data');
      } finally {
        setLoading(false);
      }
    };

    fetchHero();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('type', type);
    if (image) formData.append('image', image);
    if (video) formData.append('video', video);

    try {
      const response = await fetch(`${backendUrl}/api/hero`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update hero section');
      const data = await response.json();
      setHero(data);
      alert('Hero section updated successfully!');
    } catch (error) {
      console.error('Error updating hero section:', error);
      setError('Failed to update hero section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => setImage(e.target.files[0]);
  const handleVideoChange = (e) => setVideo(e.target.files[0]);

  if (loading) return <div className="text-xl text-center text-gray-600">Loading...</div>;
  if (error) return <div className="text-xl text-center text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
      {/* Preview */}
      <div className="relative w-full h-96">
        {hero?.type === 'video' ? (
          <video
            src={`${backendUrl}${hero.video}`}
            autoPlay
            loop
            muted
            className="object-cover w-full h-full rounded-lg shadow-lg"
          />
        ) : (
          <img
            src={`${backendUrl}${hero.image}`}
            alt="Hero"
            className="object-cover w-full h-full rounded-lg shadow-lg"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black bg-opacity-50">
          <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">{hero?.title}</h1>
          <h2 className="text-lg text-white md:text-2xl">{hero?.subtitle}</h2>
        </div>
      </div>

      {/* Admin Form */}
      <div className="w-full text-center text-white">
        <form onSubmit={handleSubmit} className="p-8 mx-4 bg-white shadow-2xl rounded-xl">
          <div className="mb-4">
            <label className="block mb-2 text-lg font-medium text-gray-800">Title</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 text-gray-700 bg-gray-200 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-lg font-medium text-gray-800">Subtitle</label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full p-3 text-gray-700 bg-gray-200 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-lg font-medium text-gray-800">Background Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 text-gray-700 bg-gray-200 rounded-lg"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
          {type === 'image' && (
            <div className="mb-4">
              <label className="block mb-2 text-lg font-medium text-gray-800">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-3 bg-gray-200 rounded-lg"
              />
            </div>
          )}
          {type === 'video' && (
            <div className="mb-4">
              <label className="block mb-2 text-lg font-medium text-gray-800">Upload Video</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full p-3 bg-gray-200 rounded-lg"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 mt-6 text-white rounded-lg transition ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isSubmitting ? 'Uploading...' : 'Update Hero Section'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeroSection;
