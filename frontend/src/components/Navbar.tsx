import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl">
              Interview Scientist
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md hover:bg-blue-500">
              Home
            </Link>
            <Link to="/scraper" className="px-3 py-2 rounded-md hover:bg-blue-500">
              Scraper Tool
            </Link>
            <Link to="/documents" className="px-3 py-2 rounded-md hover:bg-blue-500">
              Documents
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 