import React, { useState, useEffect } from "react";
import axios from "axios";
import AboutSection from "./AboutSection";
import AdminLocationEditor from "./AdminLocationEditor";

const componentEditors = {
  "About Us": AboutSection,
  "Location": AdminLocationEditor,
};

const AboutPageEditor = () => {
  const [selectedComponent, setSelectedComponent] = useState(Object.keys(componentEditors)[0]);
  const [aboutData, setAboutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    mainTitle: "",
    description: "",
    mission: "",
    qualityAssurance: "",
    convenience: "",
    customerService: ""
  });

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const response = await axios.get('/api/about');
      setAboutData(response.data);
      setFormData({
        mainTitle: response.data.mainTitle || "",
        description: response.data.description || "",
        mission: response.data.mission || "",
        qualityAssurance: response.data.qualityAssurance || "",
        convenience: response.data.convenience || "",
        customerService: response.data.customerService || ""
      });
      if (response.data.image) {
        setImagePreview(response.data.image);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching about data:', error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });

    const imageInput = document.querySelector('input[type="file"]');
    if (imageInput.files[0]) {
      formDataToSend.append('image', imageInput.files[0]);
    }

    const response = await axios.put('/api/about', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    setAboutData(response.data);
    if (response.data.image) {
      setImagePreview(response.data.image);
    }

    alert('About data updated successfully!');
  } catch (error) {
    console.error('Error updating about data:', error);
    alert('Failed to update about data');
  } finally {
    setIsSubmitting(false);
  }
};


  const AboutSection = () => (
    <div>
      <h3 className="mb-6 text-xl font-semibold text-gray-800">About Us Section Editor</h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Main Title</label>
              <input
                type="text"
                name="mainTitle"
                value={formData.mainTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">About Image</label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Choose Image
                  </button>
                </div>
                {imagePreview && (
                  <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-md">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Mission</label>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Quality Assurance</label>
            <textarea
              name="qualityAssurance"
              value={formData.qualityAssurance}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Convenience</label>
            <textarea
              name="convenience"
              value={formData.convenience}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Customer Service</label>
            <textarea
              name="customerService"
              value={formData.customerService}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

         <button
  type="submit"
  disabled={isSubmitting}
  className={`px-6 py-2 font-medium text-white transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
    isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {isSubmitting ? (
    <span className="flex items-center space-x-2">
      <svg
        className="w-5 h-5 text-white animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
        ></path>
      </svg>
      <span>Saving...</span>
    </span>
  ) : (
    "Save Changes"
  )}
</button>

        </form>
      )}
    </div>
  );

  const SelectedEditor = componentEditors[selectedComponent] || AboutSection;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Manage About Page</h2>
        </header>

        {/* Modern Tabs */}
        <div className="mb-8 bg-white shadow-sm rounded-xl">
          <div className="flex overflow-x-auto scrollbar-hide">
            {Object.keys(componentEditors).map((component) => (
              <button
                key={component}
                onClick={() => setSelectedComponent(component)}
                className={`px-6 py-4 font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedComponent === component
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                {component}
              </button>
            ))}
          </div>
        </div>

        {/* Component Display Section */}
        <div className="p-6 bg-white shadow-sm rounded-xl">
          {SelectedEditor ? (
            <div>
              <SelectedEditor />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="w-16 h-16 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                ></path>
              </svg>
              <p className="text-lg text-gray-500">Select a component to customize its settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPageEditor;