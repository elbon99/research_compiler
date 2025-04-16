from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import scrape, documents

app = FastAPI(title="Interview Scientist API")

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scrape.router)
app.include_router(documents.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Interview Scientist API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 