import io
import json
import PyPDF2
import aiohttp
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime
import uuid
import re
from ..db_models import ScrapeJob, ProcessedArchive, save_scrape_job, save_processed_archive, db
from ..util import ensure_absolute_url, scrape_example, fetch_webpage, parse_html, extract_urls, is_citation_main, is_citation_pdf, is_search_url
import asyncio
from collections import deque

router = APIRouter(prefix="/api/scrape", tags=["scraper"])

class ScrapeWebsiteRequest(BaseModel):
    url: HttpUrl


DOMAIN = "https://arxiv.org"

@router.post("/website")
async def scrape_website(request: ScrapeWebsiteRequest):
    """
    Start a new website scraping job
    """
    job_id = str(uuid.uuid4())
    
    # Create a new job record
    job = ScrapeJob(
        _id=job_id,
        url=str(request.url),
        status="pending",
        created_at=datetime.now()
    )
    
    # Save to MongoDB
    save_scrape_job(job)
    
    # Start the scraping process in the background
    asyncio.create_task(process_scrape_job(job_id, str(request.url)))
    
    return {"job_id": job_id, "status": "pending"}

@router.get("", response_model=List[dict])
async def get_all_jobs():
    """
    Get all scraping jobs
    """
    jobs = list(db.scrape_jobs.find())
    # Convert ObjectId to string for JSON serialization
    for job in jobs:
        if '_id' in job:
            job['_id'] = str(job['_id'])
    return jobs

@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get the status of a specific job
    """
    job = db.scrape_jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Convert ObjectId to string for JSON serialization
    if '_id' in job:
        job['_id'] = str(job['_id'])
    
    return job

@router.get("/processed/{job_id}", response_model=List[dict])
async def get_processed_urls(job_id: str):
    """
    Get all processed URLs for a specific job
    """
    processed = list(db.processed_archives.find({"job_id": job_id}))
    
    # Convert ObjectId to string for JSON serialization
    for item in processed:
        if '_id' in item:
            item['_id'] = str(item['_id'])
    
    return processed

async def process_scrape_job(job_id: str, url: str):
    """Process a scraping job in the background"""
    print("Processing scrape job")
    try:
        # Create an empty queue
        queue = deque([ensure_absolute_url(url, DOMAIN)])
        count = 0

        while queue:
            if count > 50:
                break
            count += 1
            url = queue.popleft()
            print(f"Processing URL: {url}")
        
            # # Fetch and parse the webpage
            html_content = await fetch_webpage(url)
            soup = parse_html(html_content)

            extracted_urls = extract_urls(soup)

            if is_citation_main(url):
                # Extract URLs from the citation main page
                pdf_url = 'https://arxiv.org' + extracted_urls['citation_pdf'][0]
                extracted_data = await process_citation_main(soup)
                pdf_data = await process_citation_pdf(pdf_url)
        
                # Create processed archive
                archive = ProcessedArchive(
                    _id=str(uuid.uuid4()),
                    url=str(url),
                    title=extracted_data["title"],
                    description=extracted_data["description"][:500],  # Truncate to reasonable length
                    extracted_links=extracted_urls,
                    pdf_data=pdf_data,  # No PDF data for basic scraping
                    pdf_link=pdf_url,
                    author=extracted_data["author"],
                    authors=extracted_data["authors"],
                    submitted_date=extracted_data["submitted_date"],
                    subjects=extracted_data["subjects"],
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    job_id=job_id
                )
                
                # Save to MongoDB
                save_processed_archive(archive)
            
            # Add extracted URLs to the queue
            for url in extracted_urls['citation_main']:
                queue.append(ensure_absolute_url(url, DOMAIN))

            for url in extracted_urls['search']:
                queue.append(ensure_absolute_url(url, DOMAIN))

            for url in extracted_urls['prevnext']:
                queue.append(ensure_absolute_url(url, DOMAIN))
        
        # Update job as completed
        db.scrape_jobs.update_one(
            {"_id": job_id},
            {"$set": {"status": "completed", "updated_at": datetime.now()}}
        )
        
    except Exception as e:
        print("Error processing scrape job: ", e)
        # Update job with error status
        db.scrape_jobs.update_one(
            {"_id": job_id},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.now()}}
        ) 

async def process_citation_main(content: BeautifulSoup):
    """Process a citation main page"""
    # Extract specific elements using the provided selectors
    extracted_data = {}
    
    # Extract title
    title_elem = content.select_one("#abs-outer #abs .title")
    if title_elem:
        extracted_data["title"] = title_elem.get_text(strip=True).replace("Title:", "").strip()
    else:
        extracted_data["title"] = "No title found"
    
    # Extract authors
    authors_elem = content.select_one("#abs-outer #abs .authors")
    if authors_elem:
        authors_text = authors_elem.get_text(strip=True)
        extracted_data["authors"] = authors_text.replace("Authors:", "").strip()
        # First author for the author field
        first_author = extracted_data["authors"].split(',')[0] if authors_text else ""
        extracted_data["author"] = first_author
    else:
        extracted_data["authors"] = ""
        extracted_data["author"] = "Unknown"
    
    # Extract abstract/description (note: fixing typo from 'blackquote' to 'blockquote')
    abstract_elem = content.select_one("#abs-outer #abs blockquote.abstract")
    if abstract_elem:
        extracted_data["description"] = abstract_elem.get_text(strip=True).replace("Abstract:", "").strip()
    else:
        extracted_data["description"] = ""
    
    # Extract submitted date
    dateline_elem = content.select_one("#abs-outer #abs .dateline")
    if dateline_elem:
        date_text = dateline_elem.get_text(strip=True).replace("Submitted on", "").replace("[", "").replace("]", "").strip()
        date_format = "%d %b %Y"
        extracted_data["submitted_date"] = datetime.strptime(date_text, date_format)
    else:
        extracted_data["submitted_date"] = None

    subjects_elem = content.select_one("#abs-outer #abs .subjects")
    if subjects_elem:
        extracted_data["subjects"] = subjects_elem.get_text(strip=True).replace("Subjects:", "").strip().split(";")
    else:
        extracted_data["subjects"] = []
    return extracted_data

async def process_citation_pdf(url: str) -> str:
    """
    Download a PDF from the specified URL and extract its text content.
    
    Args:
        url (str): The URL of the PDF file.
    
    Returns:
        str: The extracted text from the PDF, or an empty string if extraction fails.
    """
    print(f"Processing citation PDF page: {url}")
    
    # Create an async HTTP session to fetch the PDF
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                print(f"Failed to fetch PDF: HTTP {response.status}")
                return ""
            # Read the content of the PDF as bytes
            pdf_bytes = await response.read()
    
    # Load the PDF content from the bytes using a BytesIO stream
    pdf_stream = io.BytesIO(pdf_bytes)
    
    try:
        reader = PyPDF2.PdfReader(pdf_stream)
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""
    
    # Extract text from each page in the PDF
    extracted_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            extracted_text += text
    
    return extracted_text

