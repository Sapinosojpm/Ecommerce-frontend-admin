import React, { useState, useEffect } from "react";
import axios from "axios";
import HeroSection from "./HeroSection";
import AdminYoutubeEditor from "./AdminYoutubeEditor";
import Navlinks from "./NavigationLinksManager";
import AddIntro from "./AddIntro";
import LatestProductEditor from "./LatestProductEditor";
import BestSellerEditor from "./BestSellerEditor";
import PolicyEditor from "./PolicyEditor";
import LogoEditor from "./LogoEditor";
const componentEditors = {
  "Toggle Manager": null,
  "Logo": LogoEditor,
  "Navigation Links": Navlinks,
  "Hero Section": HeroSection,
  "Video/Youtube Link": AdminYoutubeEditor,
  "List of Banner": AddIntro,
  "Latest Product": LatestProductEditor,
  "Best Seller": BestSellerEditor,
  "Policy": PolicyEditor,
  // Add more components here
};

const HomePageEditor = () => {
  const [components, setComponents] = useState({});
  const [selectedComponent, setSelectedComponent] = useState('Toggle Manager');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/homepage`
        );
        setComponents(response.data.components);
      } catch (error) {
        console.error("Error fetching homepage settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (component) => {
    const updatedComponents = {
      ...components,
      [component]: !components[component],
    };
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/homepage`, {
        components: updatedComponents,
      });
      setComponents(updatedComponents);
    } catch (error) {
      console.error("Error updating homepage settings:", error);
    }
  };

  const SelectedEditor = componentEditors[selectedComponent];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Manage Home Page</h2>
          <p className="text-gray-600">Customize and control your homepage components</p>
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
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600 hover:text-indigo-500"
                }`}
              >
                {component}
              </button>
            ))}
          </div>
        </div>

        {/* Component Display Section */}
        <div className="p-6 bg-white shadow-sm rounded-xl">
          {/* Enable/Disable Toggles */}
          {selectedComponent === "Toggle Manager" && (
            <div>
              <h3 className="mb-6 text-lg font-medium text-gray-900">Component Visibility</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.keys(components).map((component) => (
                  <div
                    key={component}
                    className="flex items-center justify-between p-5 transition-shadow duration-200 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${components[component] ? "bg-green-500" : "bg-red-400"}`}></div>
                      <p className="font-medium text-gray-800">{component}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={components[component]}
                        onChange={() => handleToggle(component)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Editor Display */}
          {SelectedEditor && (
            <div>
              {/* <h3 className="mb-6 text-lg font-medium text-gray-900">{selectedComponent} Settings</h3> */}
              <SelectedEditor />
            </div>
          )}

          {!SelectedEditor && selectedComponent !== "Toggle Manager" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              <p className="text-lg text-gray-500">Select a component to customize its settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePageEditor;