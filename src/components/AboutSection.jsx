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
        if (!response.ok) throw new Error('Failed to fetch about data');
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

  // Helper to upload image to S3 and return the URL
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const presignRes = await fetch(`${backendUrl}/api/upload/presigned-url`, {
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

  const handleAboutSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = aboutData.image;
    if (aboutImageFile) {
      imageUrl = await uploadImageToS3(aboutImageFile);
      if (!imageUrl) return;
    }
    try {
      const response = await axios.put(`${backendUrl}/api/about`, {
        ...aboutData,
        image: imageUrl,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      setAboutData(response.data);
      setIsEditing(false);
      alert('About section updated!');
    } catch (error) {
      console.error('Error updating About section:', error);
      alert('Error updating About section');
    }
  };

  const InputGroup = ({ label, name, value, type = 'input', placeholder }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full p-4 text-sm border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full p-4 text-sm border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-4xl px-4 py-10 mx-auto">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="px-6 py-3 mb-8 font-semibold text-white transition-all duration-300 bg-indigo-600 rounded-lg hover:bg-indigo-700"
      >
        {isEditing ? 'Cancel Editing' : 'Edit About Section'}
      </button>

      {isEditing ? (
        <form
          onSubmit={handleAboutSubmit}
          className="p-8 space-y-6 bg-white shadow-xl rounded-2xl"
        >
          <InputGroup label="Main Title" name="mainTitle" value={aboutData.mainTitle} placeholder="Enter main title" />
          <InputGroup label="Description" name="description" value={aboutData.description} type="textarea" placeholder="Enter description" />
          <InputGroup label="Mission Title" name="missionTitle" value={aboutData.missionTitle} placeholder="Enter mission title" />
          <InputGroup label="Mission" name="mission" value={aboutData.mission} type="textarea" placeholder="Enter mission" />
          <InputGroup label="Quality Assurance Title" name="qualityAssuranceTitle" value={aboutData.qualityAssuranceTitle} />
          <InputGroup label="Quality Assurance" name="qualityAssurance" value={aboutData.qualityAssurance} type="textarea" />
          <InputGroup label="Convenience Title" name="convenienceTitle" value={aboutData.convenienceTitle} />
          <InputGroup label="Convenience" name="convenience" value={aboutData.convenience} type="textarea" />
          <InputGroup label="Customer Service Title" name="customerServiceTitle" value={aboutData.customerServiceTitle} />
          <InputGroup label="Customer Service" name="customerService" value={aboutData.customerService} type="textarea" />

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Upload Image</label>
            <input
              type="file"
              name="image"
              onChange={handleImageChange}
              className="block w-full text-sm border rounded-lg shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 text-white transition-all duration-300 bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </form>
      ) : (
        <div className="p-8 space-y-6 bg-white shadow-xl rounded-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-700">{aboutData.mainTitle}</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{aboutData.descriptionTitle}</h3>
              <p className="text-gray-700">{aboutData.description}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{aboutData.missionTitle}</h3>
              <p className="text-gray-700">{aboutData.mission}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{aboutData.qualityAssuranceTitle}</h3>
              <p className="text-gray-700">{aboutData.qualityAssurance}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{aboutData.convenienceTitle}</h3>
              <p className="text-gray-700">{aboutData.convenience}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{aboutData.customerServiceTitle}</h3>
              <p className="text-gray-700">{aboutData.customerService}</p>
            </div>

            {aboutData.image && (
              <img
                src={
                  aboutData.image?.startsWith('http')
                    ? aboutData.image
                    : `${backendUrl}${aboutData.image || ''}`
                }
                alt="About Section"
                className="w-full mt-6 shadow-md rounded-xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutSection;
