import React, { useState, useEffect, useCallback } from 'react';
import { ProcessedArchive } from '../types';
import { scraperApi } from '../services/api';

const DocumentSearch: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [documents, setDocuments] = useState<ProcessedArchive[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // One minute polling interval
  const POLLING_INTERVAL = 60000;
  
  // Set up polling for search results if a search has been performed
  useEffect(() => {
    if (!searched || !query) return;
    
    const interval = setInterval(() => {
      refreshSearch(false);
    }, POLLING_INTERVAL);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, query]);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const results = await scraperApi.searchDocuments(query);
      setDocuments(results);
      setSearched(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshSearch = useCallback(async (showRefreshing: boolean = true) => {
    if (!query || (showRefreshing && isRefreshing)) return;
    
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      const results = await scraperApi.searchDocuments(query);
      setDocuments(results);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing search:', error);
    } finally {
      if (showRefreshing) setIsRefreshing(false);
    }
  }, [query, isRefreshing]);

  // Format date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Document Search</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-grow">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search documents..."
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 rounded-md font-medium text-white ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {searched && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Last updated: {formatTime(lastUpdated)}
              {query && <span className="ml-2">(Auto-refreshes every minute)</span>}
            </p>
            <button
              onClick={() => refreshSearch()}
              disabled={isRefreshing || !query}
              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Search Results {documents.length > 0 ? `(${documents.length})` : ''}
            </h2>
            
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No documents found matching your search.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {documents.map(document => (
                  <div key={document._id} className="border-b pb-6 last:border-b-0">
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">
                      <a href={document.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {document.title}
                      </a>
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {document.url}
                    </p>
                    <p className="text-gray-800 mt-2">
                      {document.description}
                    </p>
                    
                    {/* Metadata section */}
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      <div className="flex flex-wrap gap-2 items-center">
                        {document.author && document.author !== "Unknown" && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Author: {document.author}
                          </span>
                        )}
                        
                        {formatDate(document.submitted_date) && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            Published: {formatDate(document.submitted_date)}
                          </span>
                        )}
                        
                        {document.pdf_link && (
                          <a
                            href={document.pdf_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full hover:bg-red-200"
                          >
                            PDF Available
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Subjects section */}
                    {document.subjects && document.subjects.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.subjects.map((subject, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Added: {new Date(document.created_at).toLocaleDateString()} | 
                      Job ID: {document.job_id.substring(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentSearch; 