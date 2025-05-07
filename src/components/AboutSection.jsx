import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';

const AboutSection = () => {
  const [aboutData, setAboutData] = useState({
    mainTitle: '', 
    descriptionTitle: 'Description',
    description: '',
    missionTitle: 'Mission',
    mission: '',
    qualityAssuranceTitle: 'Quality Assurance',
    qualityAssurance: '',
    convenienceTitle: 'Convenience',
    convenience: '',
    customerServiceTitle: 'Customer Service',
    customerService: '',
    image: ''
  });

  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/about`);
        if (!response.ok) {
          throw new Error('Failed to fetch about data');
        }
        const data = await response.json();
        setAboutData(data); 
      } catch (error) {
        console.error('Error fetching about data:', error);
        alert('Error fetching About data');
      }
    };

    fetchAboutData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAboutData({ ...aboutData, [name]: value });
  };

  const handleImageChange = (e) => {
    setAboutImageFile(e.target.files[0]);
  };

  const handleAboutSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(aboutData).forEach((key) => {
      formData.append(key, aboutData[key]);
    });

    if (aboutImageFile) {
      formData.append('image', aboutImageFile);
    }

    try {
      const response = await axios.put(`${backendUrl}/api/about`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAboutData(response.data);
      setIsEditing(false);
      alert('About section updated!');
    } catch (error) {
      console.error('Error updating About section:', error);
      alert('Error updating About section');
    }
  };

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="px-6 py-3 mb-6 text-white bg-green-500 rounded-lg hover:bg-green-600"
      >
        {isEditing ? 'Cancel Editing' : 'Edit About Section'}
      </button>

      {isEditing ? (
        <form onSubmit={handleAboutSubmit} className="p-8 space-y-6 bg-white shadow-lg rounded-xl">
          {/* Main Title */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">Main Title</label>
            <input
              type="text"
              name="mainTitle"
              value={aboutData.mainTitle}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter main title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">Description</label>
            <textarea
              type="text"
              name="description"
              value={aboutData.description}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter main title"
            />
          </div>

          {/* Mission */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">Mission</label>
            <input
              type="text"
              name="missionTitle"
              value={aboutData.missionTitle}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter mission title"
            />
            <textarea
                    name="mission"
                    value={aboutData.mission} // ✅ Make sure this matches the MongoDB field
                    onChange={handleInputChange}
                    className="w-full p-4 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mission"
                  />
          </div>
           {/* Quality Assurance Section */}
                <div>
                  <label className="block mb-2 text-lg font-medium text-gray-700">Section Title:</label>
                  <input
                    type="text"
                    name="qualityAssuranceTitle"
                    value={aboutData.qualityAssuranceTitle} // ✅ Make sure you're using the correct state key
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    name="qualityAssurance"
                    value={aboutData.qualityAssurance} // ✅ Make sure this matches the MongoDB field
                    onChange={handleInputChange}
                    className="w-full p-4 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quality assurance details"
                  />
                </div>


          {/* Convenience Section */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">Section Title:</label>
            <input
              type="text"
              name="convenienceTitle"
              value={aboutData.convenienceTitle}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="convenience"
              value={aboutData.convenience}
              onChange={handleInputChange}
              className="w-full p-4 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter convenience details"
            />
          </div>

          {/* Customer Service Section */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">Section Title:</label>
            <input
              type="text"
              name="customerServiceTitle"
              value={aboutData.customerServiceTitle}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="customerService"
              value={aboutData.customerService}
              onChange={handleInputChange}
              className="w-full p-4 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer service details"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">About Image</label>
            <input
              type="file"
              name="image"
              onChange={handleImageChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 text-white transition-all duration-300 bg-green-600 rounded-lg hover:bg-green-700"
          >
            Update About Section
          </button>
        </form>
      ) : (
        <div className="p-8 space-y-4 bg-white shadow-lg rounded-xl">
          <h2 className="text-3xl font-bold text-center">{aboutData.mainTitle}</h2>
          
          <h3 className="text-xl font-semibold">{aboutData.descriptionTitle}</h3>
          <p className="text-lg">{aboutData.description}</p>

          <h3 className="text-xl font-semibold">{aboutData.missionTitle}</h3>
          <p className="text-lg">{aboutData.mission}</p>

          <h3 className="text-xl font-semibold">{aboutData.qualityAssuranceTitle}</h3>
          <p className="text-lg">{aboutData.qualityAssurance}</p>

          {/* ✅ Now showing Convenience Section */}
          <h3 className="text-xl font-semibold">{aboutData.convenienceTitle}</h3>
          <p className="text-lg">{aboutData.convenience}</p>

          {/* ✅ Now showing Customer Service Section */}
          <h3 className="text-xl font-semibold">{aboutData.customerServiceTitle}</h3>
          <p className="text-lg">{aboutData.customerService}</p>

          {aboutData.image && (
            <img src={aboutData.image} alt="About Section" className="h-auto max-w-full mt-4 rounded-lg" />
          )}
        </div>
      )}
    </div>
  );
};

export default AboutSection;
