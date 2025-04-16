from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from pymongo import MongoClient

# Define Pydantic model for the scrape_jobs collection
class ScrapeJob(BaseModel):
    id: str = Field(..., alias="_id")
    url: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None  # Optional because your field is empty

# Define Pydantic model for the processed_archives collection
class ProcessedArchive(BaseModel):
    url: str
    title: str
    description: str
    extracted_links: dict
    pdf_data: str
    pdf_link: str
    authors: str
    submitted_date: Optional[datetime] = None
    subjects: List[str] = []
    created_at: datetime
    updated_at: datetime
    job_id: str

# Setup MongoDB connection
client = MongoClient("mongodb://localhost:27017")
db = client.interview_scientist  # Database name for our application

# Function to save a scrape job to MongoDB
def save_scrape_job(job: ScrapeJob):
    # Convert model to a dict using aliases (_id, etc.)
    data = job.model_dump()
    result = db.scrape_jobs.insert_one(data)
    return result.inserted_id

# Function to save a processed archive to MongoDB
def save_processed_archive(archive: ProcessedArchive):
    data = archive.model_dump()
    result = db.processed_archives.insert_one(data)
    return result.inserted_id

# Function to get a scrape job by ID
def get_scrape_job(job_id: str):
    return db.scrape_jobs.find_one({"_id": job_id})

# Function to get all scrape jobs
def get_all_scrape_jobs():
    return list(db.scrape_jobs.find())

# Function to get processed archives by job ID
def get_processed_archives_by_job(job_id: str):
    return list(db.processed_archives.find({"job_id": job_id}))

# Function to search processed archives
def search_processed_archives(query: str):
    return list(db.processed_archives.find({
        "$or": [
            {"title": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
            {"author": {"$regex": query, "$options": "i"}},
            {"subjects": {"$regex": query, "$options": "i"}}
        ]
    })) 