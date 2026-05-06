import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from typing import List, Dict, Optional, Tuple

class RecommendationEngine:
    def __init__(self, startups: List[Dict], investors: List[Dict], interactions: List[Dict]):
        self.startups_df = pd.DataFrame(startups)
        self.investors_df = pd.DataFrame(investors)
        self.interactions = interactions
        
        if self.startups_df.empty or self.investors_df.empty:
            return

        self.SECTOR_LIST = sorted(list(set([str(s).lower() for s in self.startups_df["industry"].unique()])))
        self.STAGE_LIST = ["idea", "mvp", "growth", "scale"]
        
        self.feature_matrix, self.scaler, self.tfidf = self._build_startup_features()
        self.content_sim = cosine_similarity(self.feature_matrix)
        
        self.svd = TruncatedSVD(n_components=min(20, self.feature_matrix.shape[1]-1), random_state=42)
        self.latent_matrix = self.svd.fit_transform(self.feature_matrix)
        self.latent_sim = cosine_similarity(self.latent_matrix)
        
        self.startup_id_to_idx = {row["userId"]: i for i, (_, row) in enumerate(self.startups_df.iterrows())}
        self.investor_id_to_idx = {row["userId"]: i for i, (_, row) in enumerate(self.investors_df.iterrows())}

    def _build_startup_features(self):
        rows, texts = [], []
        for _, row in self.startups_df.iterrows():
            sector_vec = [5.0 if str(row["industry"]).lower() == s else 0.0 for s in self.SECTOR_LIST]
            stage_vec = [1 if str(row["stage"]).lower() == s else 0 for s in self.STAGE_LIST]
            numeric = [
                float(row.get("fundingNeeded", 0)),
                float(row.get("teamSize", 1)),
            ]
            rows.append(sector_vec + stage_vec + numeric)
            texts.append(str(row.get("description", "")))

        mat = np.array(rows, dtype=float)
        scaler = MinMaxScaler()
        if mat.shape[0] > 0:
            mat[:, -2:] = scaler.fit_transform(mat[:, -2:])

        tfidf = TfidfVectorizer(max_features=60, stop_words="english")
        tfidf_mat = tfidf.fit_transform(texts).toarray()

        feature_matrix = np.hstack([mat, tfidf_mat])
        return feature_matrix, scaler, tfidf

    def encode_investor_preferences(self, inv_row: pd.Series) -> np.ndarray:
        sectors = [str(s).lower() for s in inv_row.get("investmentSectors", [])]
        stage = str(inv_row.get("preferredStage", "growth")).lower()
        
        # Industry/Sector match is the most important signal, so we weight it heavily
        sector_vec = [5.0 if s in sectors else 0.0 for s in self.SECTOR_LIST]
        stage_vec = [1.0 if stage == s else 0.0 for s in self.STAGE_LIST]
        
        # Scale numeric preferences using the same scaler
        amount = float(inv_row.get("investmentAmount", 0))
        numeric = np.array([[amount, 5.0]])
        if hasattr(self, 'scaler'):
            numeric = self.scaler.transform(numeric)[0]
        else:
            numeric = [0.5, 0.5]
            
        vec = np.array(sector_vec + stage_vec + list(numeric), dtype=float)
        
        # Use sectors as the primary text focus for the investor
        tfidf_focus = self.tfidf.transform([" ".join(sectors)]).toarray()[0]
        full_vec = np.hstack([vec, tfidf_focus])
        return full_vec

    def get_recommendations_for_investor(self, user_id: str, n: int = 6):
        if self.startups_df.empty: return []
        
        inv_row = self.investors_df[self.investors_df["userId"] == user_id]
        if inv_row.empty: return []
        
        pref_vec = self.encode_investor_preferences(inv_row.iloc[0]).reshape(1, -1)
        
        # Calculate similarity between investor preferences and startups
        sims = cosine_similarity(pref_vec, self.feature_matrix)[0]
        
        # Boost based on interactions (bookmarks)
        user_interactions = [i for i in self.interactions if i["user_id"] == user_id]
        if user_interactions:
            # If user has bookmarked startups, boost similar startups
            for inter in user_interactions:
                if inter["startup_id"] in self.startup_id_to_idx:
                    idx = self.startup_id_to_idx[inter["startup_id"]]
                    sims += self.content_sim[idx] * 0.2 # 20% boost from content similarity to bookmarked
        
        ranked_indices = np.argsort(sims)[::-1]
        
        results = []
        for idx in ranked_indices[:n]:
            startup = self.startups_df.iloc[idx].to_dict()
            results.append({
                "startup": startup,
                "score": float(sims[idx]),
                "reason": "Matches your investment focus"
            })
        return results

    def get_recommendations_for_startup(self, user_id: str, n: int = 6):
        if self.investors_df.empty: return []
        
        startup_row = self.startups_df[self.startups_df["userId"] == user_id]
        if startup_row.empty: return []
        
        # Encode startup as a feature vector
        startup_idx = self.startup_id_to_idx[user_id]
        startup_vec = self.feature_matrix[startup_idx].reshape(1, -1)
        
        # Calculate similarity against all investor preference vectors
        inv_pref_vecs = []
        for _, inv in self.investors_df.iterrows():
            inv_pref_vecs.append(self.encode_investor_preferences(inv))
        
        inv_pref_matrix = np.array(inv_pref_vecs)
        sims = cosine_similarity(startup_vec, inv_pref_matrix)[0]
        
        ranked_indices = np.argsort(sims)[::-1]
        
        results = []
        for idx in ranked_indices[:n]:
            investor = self.investors_df.iloc[idx].to_dict()
            results.append({
                "investor": investor,
                "score": float(sims[idx]),
                "reason": "Interested in your sector and stage"
            })
        return results
