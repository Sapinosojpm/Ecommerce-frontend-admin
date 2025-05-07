import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FooterSection = () => {
  const [footerData, setFooterData] = useState({
    companyInfo: '',
    companyLinks: [],
    contactInfo: [],
    copyrightText: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [footerLogo, setFooterLogo] = useState(null);  // For storing logo image

  const backendUrl = 'http://localhost:4000'; // Make sure this matches your backend URL

  // Fetch footer data when the component mounts
  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/footer`);
        setFooterData(response.data);
      } catch (error) {
        console.error('Error fetching footer data:', error);
      }
    };

    fetchFooterData();
  }, []);

  // Handle the form submission to update the footer data
  const handleFooterSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('companyInfo', footerData.companyInfo);
    formData.append('companyLinks', footerData.companyLinks.join(', '));
    formData.append('contactInfo', footerData.contactInfo.join(', '));
    formData.append('copyrightText', footerData.copyrightText);
    if (footerLogo) {
      formData.append('logoUrl', footerLogo);  // If logo is uploaded
    }

    try {
      const response = await axios.put(`${backendUrl}/api/footer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFooterData(response.data);  // Update the footerData state with the new data
      setIsEditing(false); // Stop editing
      alert('Footer updated successfully!');
    } catch (error) {
      console.error('Error updating footer:', error);
      alert('Error updating footer');
    }
  };

  return (
    <div className="card mb-10 shadow-lg p-6 rounded-xl bg-white">
      <h2 className="text-xl font-semibold mb-6">Footer Section</h2>
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-6"
      >
        {isEditing ? 'Cancel Editing' : 'Edit Footer Section'}
      </button>

      {isEditing ? (
        <form onSubmit={handleFooterSubmit}>
          {/* Company Information */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Company Information</label>
            <input
              type="text"
              value={footerData.companyInfo}
              onChange={(e) => setFooterData({ ...footerData, companyInfo: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none"
            />
          </div>

          {/* Company Links */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Company Links</label>
            <input
              type="text"
              value={footerData.companyLinks.join(', ')}
              onChange={(e) => setFooterData({ 
                ...footerData, 
                companyLinks: e.target.value.split(',').map(link => link.trim()) 
              })}
              className="w-full p-3 border rounded-lg focus:outline-none"
              placeholder="Enter links separated by commas"
            />
          </div>

          {/* Contact Information */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Contact Information</label>
            <input
              type="text"
              value={footerData.contactInfo.join(', ')}
              onChange={(e) => setFooterData({ 
                ...footerData, 
                contactInfo: e.target.value.split(',').map(info => info.trim()) 
              })}
              className="w-full p-3 border rounded-lg focus:outline-none"
              placeholder="Enter contact info separated by commas"
            />
          </div>

          {/* Copyright Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Copyright Text</label>
            <input
              type="text"
              value={footerData.copyrightText}
              onChange={(e) => setFooterData({ ...footerData, copyrightText: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none"
            />
          </div>

          {/* Footer Logo */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Footer Logo</label>
            <input
              type="file"
              onChange={(e) => setFooterLogo(e.target.files[0])}
              className="w-full p-3 border rounded-lg focus:outline-none"
            />
            {footerData.logoUrl && !footerLogo && (
              <img src={footerData.logoUrl} alt="Footer Logo" className="mt-2 max-w-full h-auto" />
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Update Footer Section
          </button>
        </form>
      ) : (
        <div>
          <p><strong>Company Information:</strong> {footerData.companyInfo}</p>
          <p><strong>Company Links:</strong> {footerData.companyLinks.join(', ')}</p>
          <p><strong>Contact Information:</strong> {footerData.contactInfo.join(', ')}</p>
          <p><strong>Copyright Text:</strong> {footerData.copyrightText}</p>
          {footerData.logoUrl && <img src={footerData.logoUrl} alt="Footer Logo" className="mt-4 max-w-full h-auto" />}
        </div>
      )}
    </div>
  );
};

export default FooterSection;
