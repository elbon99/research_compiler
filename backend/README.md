# Backend - Interview Scientist

A FastAPI backend with web scraping capabilities.

## Setup

1. Create a virtual environment:
```
python -m venv venv
.\venv\Scripts\activate
```

2. Install dependencies:
```
pip install -r requirements.txt
```

## Development

Start the development server:
```
cd app
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

API Documentation: http://localhost:8000/docs

## Features

- FastAPI REST API
- Web scraping tools with BeautifulSoup and Selenium
- CORS middleware for frontend integration 