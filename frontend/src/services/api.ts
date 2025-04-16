import axios from 'axios';
import { ScrapeJob, ProcessedArchive, ScrapeJobResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const scraperApi = {  
  startScrapeJob: async (url: string): Promise<ScrapeJobResponse> => {
    const response = await axios.post(`${API_BASE_URL}/api/scrape/website`, { url });
    return response.data;
  },
  
  getAllScrapeJobs: async (): Promise<ScrapeJob[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/scrape`);
    return response.data;
  },
  
  getJobStatus: async (jobId: string): Promise<ScrapeJob> => {
    const response = await axios.get(`${API_BASE_URL}/api/scrape/status/${jobId}`);
    return response.data;
  },
  
  getProcessedUrls: async (jobId: string): Promise<ProcessedArchive[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/scrape/processed/${jobId}`);
    return response.data;
  },
  
  searchDocuments: async (query?: string): Promise<ProcessedArchive[]> => {
    const url = query 
      ? `${API_BASE_URL}/api/documents?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/api/documents`;
    const response = await axios.get(url);
    return response.data;
  }
}; 