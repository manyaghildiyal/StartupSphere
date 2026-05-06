import pandas as pd
from database import fetch_startups, fetch_investors
import os

def sync_to_csv():
    print("Syncing live data to CSV...")
    
    startups = fetch_startups()
    investors = fetch_investors()
    
    startups_df = pd.DataFrame(startups)
    investors_df = pd.DataFrame(investors)
    
    # Save to the same directory as the notebook for easy use
    output_dir = os.path.join(os.path.dirname(__file__), "../../scratch/ML_Projects/3_Startup_Recommendation_System")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    startups_df.to_csv(os.path.join(output_dir, "live_startups.csv"), index=False)
    investors_df.to_csv(os.path.join(output_dir, "live_investors.csv"), index=False)
    
    print(f"Data synced to {output_dir}")

if __name__ == "__main__":
    sync_to_csv()
