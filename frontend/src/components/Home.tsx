import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        Welcome to Interview Scientist
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        A powerful web scraping application with FastAPI backend and React frontend.
      </p>
      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Features</h2>
        <ul className="text-left space-y-2 mb-6">
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Scrape websites with ease
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Modern React frontend with TailwindCSS
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Powerful FastAPI backend
          </li>
        </ul>
        <Link to="/scraper" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
          Try Scraper Tool
        </Link>
      </div>
    </div>
  );
};

export default Home; 