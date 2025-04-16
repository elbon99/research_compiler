import React, { useState, useEffect, useCallback } from 'react';
import { ScrapeJob, ProcessedArchive } from '../types';
import { scraperApi } from '../services/api';

const ScraperTool: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [processedUrls, setProcessedUrls] = useState<ProcessedArchive[]>([]);
  const [, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // One minute polling interval
  const POLLING_INTERVAL = 60000;

  // Load all jobs on component mount
  useEffect(() => {
    fetchAllJobs();
    
    // Set up polling for all jobs
    const interval = setInterval(() => {
      fetchAllJobs(false);
      
      // Also update selected job if any
      if (selectedJobId) {
        fetchJobDetails(selectedJobId, false);
        
        // Only update processed URLs for completed jobs
        const selectedJob = jobs.find(j => j._id === selectedJobId);
        if (selectedJob && selectedJob.status === 'completed') {
          fetchProcessedUrls(selectedJobId, false);
        }
      }
    }, POLLING_INTERVAL);
    
    setPollingInterval(interval);
    
    // Cleanup polling on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId]);

  // Function to handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchAllJobs();
      
      if (selectedJobId) {
        await fetchJobDetails(selectedJobId);
        const selectedJob = jobs.find(j => j._id === selectedJobId);
        
        if (selectedJob && (selectedJob.status === 'completed' || selectedJob.status === 'failed')) {
          await fetchProcessedUrls(selectedJobId);
        }
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedJobId, jobs, isRefreshing]);

  const fetchAllJobs = async (showLoading: boolean = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const allJobs = await scraperApi.getAllScrapeJobs();
      setJobs(allJobs);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchJobDetails = async (jobId: string, showLoading: boolean = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const jobDetails = await scraperApi.getJobStatus(jobId);
      
      // Update the job in the jobs array
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId ? jobDetails : job
        )
      );
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchProcessedUrls = async (jobId: string, showLoading: boolean = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const processed = await scraperApi.getProcessedUrls(jobId);
      setProcessedUrls(processed);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching processed URLs:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await scraperApi.startScrapeJob(url);
      
      // Fetch all jobs to get the new one
      await fetchAllJobs(false);
      
      // Select the new job
      setSelectedJobId(response.job_id);
      
      // Clear the form
      setUrl('');
    } catch (err) {
      setError('Error starting scrape job. Please check the URL and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Render status badge based on job status
  const renderStatusBadge = (status: string) => {
    let colorClass = '';
    
    switch(status) {
      case 'pending':
        colorClass = 'bg-yellow-500';
        break;
      case 'processing':
        colorClass = 'bg-blue-500';
        break;
      case 'completed':
        colorClass = 'bg-green-500';
        break;
      case 'failed':
        colorClass = 'bg-red-500';
        break;
      default:
        colorClass = 'bg-gray-500';
    }
    
    return (
      <span className={`${colorClass} text-white py-1 px-2 rounded-full text-xs`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Web Scraper Tool</h1>
      
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          Last updated: {formatTime(lastUpdated)}
        </p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Start New Scrape</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="url" className="block text-gray-700 font-medium mb-2">
                  Enter URL to scrape
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-md font-medium text-white ${
                  isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Starting...' : 'Start Scraping'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Jobs</h2>
              <div className="text-xs text-gray-500">
                Auto-refreshes every minute
              </div>
            </div>
            
            {jobs.length === 0 ? (
              <p className="text-gray-500">No jobs available yet</p>
            ) : (
              <ul className="divide-y">
                {jobs.map(job => (
                  <li 
                    key={job._id} 
                    className={`py-3 px-2 cursor-pointer hover:bg-gray-50 ${
                      selectedJobId === job._id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedJobId(job._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate max-w-xs">
                        {job.url}
                      </div>
                      {renderStatusBadge(job.status)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(job.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Right Column - Results */}
        <div className="md:col-span-2">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}

          {selectedJobId && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Job Details</h2>
              
              {jobs.find(job => job._id === selectedJobId) && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-600 text-sm">Job ID:</p>
                      <p className="font-medium">{selectedJobId}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Status:</p>
                      <p className="font-medium">{renderStatusBadge(jobs.find(job => job._id === selectedJobId)?.status || '')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">URL:</p>
                      <p className="font-medium truncate">{jobs.find(job => job._id === selectedJobId)?.url}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Created:</p>
                      <p className="font-medium">
                        {new Date(jobs.find(job => job._id === selectedJobId)?.created_at || '').toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {jobs.find(job => job._id === selectedJobId)?.error && (
                    <div className="bg-red-100 p-3 rounded-md mb-4">
                      <p className="text-sm font-medium text-red-800">Error:</p>
                      <p className="text-red-700">{jobs.find(job => job._id === selectedJobId)?.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedJobId && processedUrls.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Processed Results</h2>
              
              {processedUrls.map(processed => (
                <div key={processed._id} className="mb-6 last:mb-0">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Page Title:</h3>
                    <p className="text-gray-800 border-l-4 border-blue-500 pl-3 py-2">{processed.title}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Description:</h3>
                    <p className="text-gray-800 border-l-4 border-green-500 pl-3 py-2">{processed.description}</p>
                  </div>
                  
                  {/* Author & Metadata */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {processed.author && processed.author !== "Unknown" && (
                      <div className="text-sm">
                        <span className="text-gray-600">Author:</span>{" "}
                        <span className="font-medium">{processed.author}</span>
                      </div>
                    )}
                    
                    {processed.submitted_date && (
                      <div className="text-sm">
                        <span className="text-gray-600">Published:</span>{" "}
                        <span className="font-medium">
                          {new Date(processed.submitted_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Subjects */}
                  {processed.subjects && processed.subjects.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Subjects:</h3>
                      <div className="flex flex-wrap gap-1">
                        {processed.subjects.map((subject, index) => (
                          <span key={index} className="bg-gray-100 text-xs px-2 py-1 rounded">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* PDF Link */}
                  {processed.pdf_link && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">PDF:</h3>
                      <a 
                        href={processed.pdf_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {processed.pdf_link}
                      </a>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Links Found: {processed.extracted_links.length}
                    </h3>
                    <div className="border rounded-md overflow-auto max-h-96">
                      <ul className="divide-y">
                        {processed.extracted_links.map((link, index) => (
                          <li key={index} className="p-2 hover:bg-gray-50 break-all">
                            <a 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScraperTool; 