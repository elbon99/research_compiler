from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..db_models import db

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("", response_model=List[dict])
async def search_documents(query: Optional[str] = Query(None)):
    """
    Search documents with an optional query parameter
    """
    if query:
        # Perform a text search on title and description
        search_filter = {
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        }
        documents = list(db.processed_archives.find(search_filter))
    else:
        # Return all documents if no query is provided
        documents = list(db.processed_archives.find())
    
    # Convert ObjectId to string for JSON serialization
    for doc in documents:
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
    
    return documents 