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

  // Helper to upload a file to S3 and return the URL
  async function uploadToS3(file, token) {
    const presignRes = await fetch(`${backendUrl}/api/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ fileType: file.type }),
    });
    if (!presignRes.ok) throw new Error('Failed to get S3 pre-signed URL');
    const { uploadUrl, fileUrl } = await presignRes.json();
    const s3Res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!s3Res.ok) throw new Error('Failed to upload file to S3');
    return fileUrl;
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required');
    }
    let imageUrl = null;
    let videoUrl = null;
    if (type === 'image' && image) {
      imageUrl = await uploadToS3(image, token);
    }
    if (type === 'video' && video) {
      videoUrl = await uploadToS3(video, token);
    }
    const payload = {
      title,
      subtitle,
      type,
      image: imageUrl,
      video: videoUrl,
    };
    const response = await fetch(`${backendUrl}/api/hero`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update hero section');
    }

    setHero(result.data);
    alert('Hero section updated successfully!');
  } catch (error) {
    console.error('Full error:', error);
    setError(error.message || 'Failed to update hero section');
    
    // Additional debug logging
    if (error.response) {
      console.error('Response error:', await error.response.json());
    }
  } finally {
    setIsSubmitting(false);
  }
};


  const handleImageChange = (e) => setImage(e.target.files[0]);
  const handleVideoChange = (e) => setVideo(e.target.files[0]);

  if (loading) return <div className="text-xl text-center text-gray-600">Loading...</div>;
  if (error) return <div className="text-xl text-center text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-1">
      {/* Preview */}
      <div className="relative w-full h-96">
        {hero?.type === 'video' ? (
          <video
            src={hero.video}
            autoPlay
            loop
            muted
            className="object-cover w-full h-full rounded-lg shadow-lg"
          />
        ) : (
          <img
            src={hero?.image}
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
                className="block w-full text-sm border rounded-lg shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
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
                className="block w-full text-sm border rounded-lg shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 mt-6 text-white rounded-lg transition ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
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