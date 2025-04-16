# Interview Scientist Monorepo

A monorepo containing a FastAPI backend with web scraping capabilities and a React TypeScript frontend.

## Project Structure

```
├── backend/            # FastAPI backend
│   ├── app/            # Application code
│   │   ├── main.py     # Entry point
│   │   ├── scraper.py  # Scraping utilities
│   │   └── routers/    # API routes
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

## Setup and Development

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- npm or yarn

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

4. Set up the frontend:
```
cd frontend
npm install
```

### Running the Application

From the root directory, start both services:
```
npm run dev
```

Or run them separately:
- Backend: `npm run backend`
- Frontend: `npm run frontend`

## Services

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Documentation: http://localhost:8000/docs 