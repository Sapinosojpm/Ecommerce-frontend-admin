import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContactSection = () => {
  const [contactData, setContactData] = useState({
    businessName: '',
    address: '',
    telephone: [],
    email: [],
    image: ''
  });
  const [contactImageFile, setContactImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [show,setShow] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL; // Set the correct backend URL here

  const handleShow = () => {
    setShow(!show);
  }
  


  // Fetch contact data when the component mounts
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/contact`);
        const data = await response.json();
        setContactData(data);
      } catch (error) {
        console.error('Error fetching contact data:', error);
        alert('Error fetching contact data');
      }
    };

    fetchContactData();
  }, []);

  // Handle form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append('businessName', contactData.businessName);
    formData.append('address', contactData.address);
    formData.append('telephone', contactData.telephone);
    formData.append('email', contactData.email);
  
    if (contactImageFile) {
      formData.append('image', contactImageFile);  // Image file to be uploaded
    }
  
    try {
      const response = await axios.put(`${backendUrl}/api/contact`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setContactData(response.data); // Update with new data
      alert('Contact section updated!');
      setIsEditing(false); // Stop editing
    } catch (error) {
      console.error('Error updating contact section:', error);
      alert('Error updating contact section');
    }
  };

  return (
    <div className="max-w-4xl p-6 mx-auto">
     <button
  onClick={handleShow}
  className="px-6 py-3 mb-6 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
>
  {show ? 'Cancel Editing' : 'Edit Contact Section'}
</button>


      {show ? (
        <form onSubmit={handleContactSubmit} className="p-8 space-y-6 bg-white shadow-lg rounded-xl">
          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block mb-2 text-lg font-medium text-gray-700">Business Name</label>
            <input
              type="text"
              id="businessName"
              value={contactData.businessName}
              onChange={(e) => setContactData({ ...contactData, businessName: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter business name"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block mb-2 text-lg font-medium text-gray-700">Address</label>
            <input
              type="text"
              id="address"
              value={contactData.address}
              onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address"
            />
          </div>

          {/* Telephone Numbers */}
          <div>
            <label htmlFor="telephone" className="block mb-2 text-lg font-medium text-gray-700">Telephone</label>
            <input
              type="text"
              id="telephone"
              value={contactData.telephone.join(', ')} // Display as comma-separated values
              onChange={(e) => setContactData({ 
                ...contactData, 
                telephone: e.target.value.split(',').map((num) => num.trim()) 
              })}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone numbers"
            />
          </div>

          {/* Emails */}
          <div>
            <label htmlFor="email" className="block mb-2 text-lg font-medium text-gray-700">Email</label>
            <input
              type="text"
              id="email"
              value={contactData.email.join(', ')} // Display as comma-separated values
              onChange={(e) => setContactData({
                ...contactData,
                email: e.target.value.split(',').map((email) => email.trim())
              })}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter emails"
            />
          </div>

          {/* Image */}
          <div>
            <label htmlFor="image" className="block mb-2 text-lg font-medium text-gray-700">Image</label>
            <input
              type="file"
              id="image"
              onChange={(e) => setContactImageFile(e.target.files[0])}
              className="block w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="px-6 py-3 mt-6 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </form>
      ) : (
        <div className="p-8 bg-white shadow-lg rounded-xl">
          <h2 className="mb-4 text-3xl font-bold text-gray-800">{contactData.businessName}</h2>
          <p className="mb-2 text-lg text-gray-600">{contactData.address}</p>
          <p className="mb-2 text-lg text-gray-600">
            {contactData.telephone.join(', ')}
          </p>
          <p className="mb-2 text-lg text-gray-600">
            {contactData.email.join(', ')}
          </p>
          <div>
            {contactData.image && (
              <img 
                src={contactData.image}  // Directly use the Cloudinary URL
                alt="Contact Section" 
                className="mt-4 max-w-[200px] h-auto"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSection;
