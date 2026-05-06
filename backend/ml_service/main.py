from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import fetch_startups, fetch_investors, fetch_interactions
from model import RecommendationEngine
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="StartupSphere Recommendation API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    userId: str
    role: str
    count: Optional[int] = 6

@app.get("/")
def read_root():
    return {"message": "StartupSphere Recommendation Service is running"}

@app.post("/recommend")
async def get_recommendations(req: RecommendRequest):
    try:
        startups = fetch_startups()
        investors = fetch_investors()
        interactions = fetch_interactions()
        
        engine = RecommendationEngine(startups, investors, interactions)
        
        if req.role == "investor":
            recs = engine.get_recommendations_for_investor(req.userId, req.count)
            return {"recommendations": recs}
        elif req.role == "startup":
            recs = engine.get_recommendations_for_startup(req.userId, req.count)
            return {"recommendations": recs}
        else:
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'investor' or 'startup'.")
            
    except Exception as e:
        print(f"Error in recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
