import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "startusphere"

def get_db():
    client = MongoClient(MONGO_URI)
    return client[DB_NAME]

def fetch_startups():
    db = get_db()
    startups = list(db.startups.find())
    # Convert ObjectId to string
    for s in startups:
        s["_id"] = str(s["_id"])
    return startups

def fetch_investors():
    db = get_db()
    # Join with users collection to get the name
    investors = list(db.investors.aggregate([
        {
            "$lookup": {
                "from": "users",
                "let": { "uid": "$userId" },
                "pipeline": [
                    { 
                        "$match": { 
                            "$expr": { 
                                "$eq": [{ "$toString": "$_id" }, "$$uid"] 
                            } 
                        } 
                    }
                ],
                "as": "user_info"
            }
        },
        {
            "$unwind": {
                "path": "$user_info",
                "preserveNullAndEmptyArrays": True
            }
        },
        {
            "$project": {
                "_id": 1,
                "userId": 1,
                "investmentSectors": 1,
                "investmentAmount": 1,
                "preferredStage": 1,
                "name": "$user_info.name"
            }
        }
    ]))
    
    for i in investors:
        i["_id"] = str(i["_id"])
        if not i.get("name"):
            i["name"] = "Angel Investor" # Fallback
    return investors

def fetch_interactions(user_id=None):
    db = get_db()
    # For now, we consider bookmarks and messages as interactions
    query = {}
    if user_id:
        query["investorUserId"] = user_id
    
    bookmarks = list(db.bookmarks.find(query))
    # Map bookmarks to a standard interaction format
    interactions = []
    for b in bookmarks:
        interactions.append({
            "user_id": b["investorUserId"],
            "startup_id": b["startupUserId"],
            "action": "save",
            "weight": 3.0
        })
    
    # Could also add messages here as 'click' interactions
    return interactions
