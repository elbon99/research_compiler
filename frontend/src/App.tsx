import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ScraperTool from './components/ScraperTool';
import DocumentSearch from './components/DocumentSearch';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scraper" element={<ScraperTool />} />
            <Route path="/documents" element={<DocumentSearch />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App; 