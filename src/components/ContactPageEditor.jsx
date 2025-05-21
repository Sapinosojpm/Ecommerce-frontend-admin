import React, { useState, useEffect } from "react";
import axios from "axios";
import ContactSection from "./ContactSection";
import AdminDiscount from "./adminDiscount";
const componentEditors = {
    "Contact Us": ContactSection,
    "Newsletter Discount": AdminDiscount,

  

};

const HomePageEditor = () => {
 const [selectedComponent, setSelectedComponent] = useState(Object.keys(componentEditors)[0]);


  const SelectedEditor = componentEditors[selectedComponent];

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
          {SelectedEditor ? (
            <div>
              {/* <h3 className="mb-6 text-lg font-medium text-gray-900">{selectedComponent} Settings</h3> */}
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

export default HomePageEditor;
