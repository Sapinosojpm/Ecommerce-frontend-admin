import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HomePageEditor = () => {
  const [components, setComponents] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/homepage`);
        setComponents(response.data.components);
      } catch (error) {
        console.error('Error fetching homepage settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (component) => {
    const updatedComponents = { ...components, [component]: !components[component] };

    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/homepage`, { components: updatedComponents });
      setComponents(updatedComponents);
    } catch (error) {
      console.error('Error updating homepage settings:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Home Page Components</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(components).map((component) => (
          <div key={component} className="p-4 bg-gray-100 rounded flex justify-between items-center">
            <p>{component}</p>
            <button
              onClick={() => handleToggle(component)}
              className={`px-4 py-2 rounded ${components[component] ? 'bg-green-500' : 'bg-red-500'} text-white`}
            >
              {components[component] ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePageEditor;
