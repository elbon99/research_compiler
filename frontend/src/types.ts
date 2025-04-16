export interface ScrapedData {
  title: string;
  links: string[];
}

export interface ApiError {
  status: number;
  message: string;
}

export interface ScrapeJob {
  _id: string;
  url: string;
  status: string;
  created_at: string;
  updated_at?: string;
  error?: string;
}

export interface ProcessedArchive {
  _id: string;
  url: string;
  title: string;
  description: string;
  extracted_links: string[];
  pdf_data: string;
  pdf_link: string;
  author: string;
  submitted_date?: string;
  subjects: string[];
  created_at: string;
  updated_at: string;
  job_id: string;
}

export interface ScrapeJobResponse {
  job_id: string;
  status: string;
} 