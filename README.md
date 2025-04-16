# Interview Scientist Monorepo

A monorepo containing a FastAPI backend with web scraping capabilities (focused on arXiv papers) and a React TypeScript frontend.

## Project Structure

```
├── backend/            # FastAPI backend
│   ├── app/            # Application code
│   │   ├── main.py     # Entry point
│   │   ├── util.py     # Utility functions for scraping
│   │   ├── db_models.py # MongoDB data models
│   │   └── routers/    # API routes
│   │       ├── scrape.py  # Scraping endpoints
│   │       └── documents.py # Document search endpoints
│   └── requirements.txt # Python dependencies
│
├── frontend/           # React TypeScript frontend
│   ├── src/            # Source files
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   └── types.ts    # TypeScript type definitions
│   └── package.json    # Frontend dependencies
│
└── package.json        # Root package.json for monorepo
```

## Features

- **arXiv Paper Scraping**: Automatically extracts titles, authors, abstracts, and subjects from arXiv papers
- **PDF Processing**: Downloads and extracts text from PDF files
- **MongoDB Integration**: Stores scraped data in MongoDB collections
- **Real-time Job Status**: API polling with a refresh button to track job progress
- **Document Search**: Search through processed documents by query terms

## API Endpoints

- `POST /api/scrape/website`: Start a new scraping job with a URL
- `GET /api/scrape`: Get all scraping jobs
- `GET /api/scrape/status/{job_id}`: Get the status of a specific job
- `GET /api/scrape/processed/{job_id}`: Get all processed URLs under a job ID
- `GET /api/documents`: Search documents with optional query parameter

## Setup and Development

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MongoDB (running locally on port 27017)
- npm or yarn
- Required Python packages: FastAPI, PyPDF2, BeautifulSoup4, aiohttp

### Installation

1. Clone the repo
2. Install root dependencies:
```
npm install
```

3. Set up the backend:
```
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

4. Set up MongoDB:
MongoDB should be running locally on the default port (27017).
The application will automatically create the necessary collections.

5. Set up the frontend:
```
cd frontend
npm install
```

### Running the Application

From the root directory, start both services:
```
npm run dev
```

## Services

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- MongoDB: mongodb://localhost:27017 