import pandas as pd
import numpy as np
import json
import os
import time
import pickle
from datetime import datetime
from collections import defaultdict, deque
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple

from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import Pipeline

np.random.seed(42)
print("imports ok")

startups_df  = pd.read_csv("startups.csv")
investors_df = pd.read_csv("investors.csv")

# parse pipe-delimited list columns
startups_df["tags"] = startups_df["tags"].fillna("").apply(lambda x: x.split("|") if x else [])
investors_df["preferred_sectors"] = investors_df["preferred_sectors"].apply(lambda x: str(x).split("|"))
investors_df["preferred_stages"]  = investors_df["preferred_stages"].apply(lambda x: str(x).split("|"))
investors_df["notable_exits"]     = investors_df["notable_exits"].fillna("").apply(lambda x: x.split("|") if x else [])

print(f"startups  : {len(startups_df)} rows")
print(f"investors : {len(investors_df)} rows")
print()
print("startup columns :", list(startups_df.columns))
print("investor columns:", list(investors_df.columns))

print("startup sample (first 5)")
print(startups_df[["id","name","sector","stage","revenue_arr","traction","team_score","market_size"]].head().to_string(index=False))
print()
print("investor sample")
print(investors_df[["id","name","firm","preferred_sectors","preferred_stages"]].to_string(index=False))

SECTOR_LIST = sorted(startups_df["sector"].unique().tolist())
STAGE_LIST  = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C"]

def build_startup_features(df: pd.DataFrame) -> np.ndarray:
    rows, texts = [], []
    for _, row in df.iterrows():
        sector_vec = [1 if row["sector"] == s else 0 for s in SECTOR_LIST]
        stage_vec  = [1 if row["stage"]  == s else 0 for s in STAGE_LIST]
        numeric    = [
            float(row["funding_needed"]),
            float(row["traction"]),
            float(row["team_score"]),
            float(row["market_size"]),
            float(row["revenue_arr"]),
            float(row["employees"]),
        ]
        rows.append(sector_vec + stage_vec + numeric)
        tags = row["tags"] if isinstance(row["tags"], list) else []
        texts.append(
            str(row["description"]) + " " +
            str(row["problem"])     + " " +
            str(row["solution"])    + " " +
            " ".join(tags)
        )

    mat = np.array(rows, dtype=float)
    scaler = MinMaxScaler()
    mat[:, -(6):] = scaler.fit_transform(mat[:, -(6):])

    tfidf    = TfidfVectorizer(max_features=60, stop_words="english", ngram_range=(1,2))
    tfidf_mat = tfidf.fit_transform(texts).toarray()

    feature_matrix = np.hstack([mat, tfidf_mat])
    return feature_matrix, scaler, tfidf

FEATURE_MATRIX, SCALER, TFIDF = build_startup_features(startups_df)
print(f"feature matrix shape : {FEATURE_MATRIX.shape}")
print(f"  = {len(SECTOR_LIST)} sector + {len(STAGE_LIST)} stage + 6 numeric + 60 tfidf = {FEATURE_MATRIX.shape[1]} features")

CONTENT_SIM = cosine_similarity(FEATURE_MATRIX)

STARTUP_ID_TO_IDX = {row["id"]: i for i, (_, row) in enumerate(startups_df.iterrows())}
STARTUP_IDX_TO_ID = {i: row["id"] for i, (_, row) in enumerate(startups_df.iterrows())}

print(f"content similarity matrix : {CONTENT_SIM.shape}")
print()

# top3 most similar startups for a sample startup
sample_id  = startups_df.iloc[0]["id"]
sample_idx = STARTUP_ID_TO_IDX[sample_id]
sim_scores = list(enumerate(CONTENT_SIM[sample_idx]))
sim_scores.sort(key=lambda x: x[1], reverse=True)

print(f"most similar to '{startups_df.iloc[0]['name']}' ({startups_df.iloc[0]['sector']}):")
for idx, score in sim_scores[1:5]:
    row = startups_df.iloc[idx]
    print(f"  {row['name']:<18} {row['sector']:<14} score={score:.3f}")

KNN_MODEL = NearestNeighbors(n_neighbors=11, metric="cosine", algorithm="brute")
KNN_MODEL.fit(FEATURE_MATRIX)

# test
distances, indices = KNN_MODEL.kneighbors(FEATURE_MATRIX[0].reshape(1, -1))
sample_name = startups_df.iloc[0]["name"]
print(f"knn neighbours for '{sample_name}':")
for dist, idx in zip(distances[0][1:], indices[0][1:]):
    row = startups_df.iloc[idx]
    print(f"  {row['name']:<18} {row['sector']:<14} distance={dist:.3f}")

SVD_MODEL = TruncatedSVD(n_components=20, random_state=42)
LATENT_MATRIX = SVD_MODEL.fit_transform(FEATURE_MATRIX)

print(f"latent matrix shape  : {LATENT_MATRIX.shape}")
print(f"explained variance   : {SVD_MODEL.explained_variance_ratio_.sum():.3f} ({SVD_MODEL.explained_variance_ratio_.sum()*100:.1f}%)")
print()

LATENT_SIM = cosine_similarity(LATENT_MATRIX)
print(f"latent similarity matrix : {LATENT_SIM.shape}")

# verify it captures different nuances than raw content sim
sample_idx = 0
raw_top    = sorted(enumerate(CONTENT_SIM[sample_idx]), key=lambda x: x[1], reverse=True)[1:4]
latent_top = sorted(enumerate(LATENT_SIM[sample_idx]),  key=lambda x: x[1], reverse=True)[1:4]

print()
print(f"raw content top-3 for '{startups_df.iloc[0]['name']}'  :", [startups_df.iloc[i]['name'] for i,_ in raw_top])
print(f"svd latent   top-3 for '{startups_df.iloc[0]['name']}'  :", [startups_df.iloc[i]['name'] for i,_ in latent_top])

def encode_investor_preferences(investor_row: pd.Series) -> np.ndarray:
    sectors  = investor_row["preferred_sectors"]
    stages   = investor_row["preferred_stages"]
    sector_vec = [1 if s in sectors else 0 for s in SECTOR_LIST]
    stage_vec  = [1 if s in stages  else 0 for s in STAGE_LIST]
    invest_range = float(investor_row["max_investment"]) - float(investor_row["min_investment"])
    numeric = [
        float(investor_row["max_investment"]),
        7.0, 7.0,
        float(investor_row["max_investment"]) * 10,
        float(investor_row["max_investment"]) * 0.3,
        80.0,
    ]
    vec = np.array(sector_vec + stage_vec + numeric, dtype=float)
    tfidf_focus = TFIDF.transform([str(investor_row["focus"])]).toarray()[0]
    full_vec = np.hstack([vec, tfidf_focus])
    return full_vec

INVESTOR_PREF_VECS = {}
for _, inv_row in investors_df.iterrows():
    INVESTOR_PREF_VECS[inv_row["id"]] = encode_investor_preferences(inv_row)

print(f"encoded {len(INVESTOR_PREF_VECS)} investor preference vectors")
print(f"vector shape : {list(INVESTOR_PREF_VECS.values())[0].shape}")

SESSION_FILE = "user_sessions.json"

def load_sessions() -> dict:
    if os.path.exists(SESSION_FILE):
        with open(SESSION_FILE, "r") as f:
            data = json.load(f)
        print(f"loaded {len(data)} existing user sessions from {SESSION_FILE}")
        for uid, sess in data.items():
            print(f"  user {uid} : {len(sess.get('interactions', []))} interactions, "
                  f"sectors={list(sess.get('sector_affinity', {}).keys())}")
        return data
    print(f"no existing sessions found — starting fresh")
    return {}

def save_sessions(sessions: dict):
    with open(SESSION_FILE, "w") as f:
        json.dump(sessions, f, indent=2)

def get_or_create_session(sessions: dict, user_id: str, user_type: str, name: str) -> dict:
    if user_id not in sessions:
        sessions[user_id] = {
            "user_id":        user_id,
            "user_type":      user_type,
            "name":           name,
            "created_at":     datetime.now().isoformat(),
            "last_active":    datetime.now().isoformat(),
            "interactions":   [],
            "sector_affinity": {},
            "stage_affinity":  {},
            "funded":          [],
            "saved":           [],
            "skipped":         [],
        }
    return sessions[user_id]

SESSIONS = load_sessions()
print()
print("session store ready")

INTERACTION_WEIGHTS = {"fund": 5.0, "save": 3.0, "click": 1.0, "skip": -1.5}

def record_interaction(sessions: dict, user_id: str, startup_id: str, action: str):
    sess   = sessions[user_id]
    weight = INTERACTION_WEIGHTS.get(action, 0.0)
    s_row  = startups_df[startups_df["id"] == startup_id].iloc[0]

    event = {
        "startup_id":   startup_id,
        "startup_name": s_row["name"],
        "sector":       s_row["sector"],
        "stage":        s_row["stage"],
        "action":       action,
        "weight":       weight,
        "timestamp":    datetime.now().isoformat(),
    }
    sess["interactions"].append(event)

    sec = s_row["sector"]
    stg = s_row["stage"]
    sess["sector_affinity"][sec] = sess["sector_affinity"].get(sec, 0.0) + weight
    sess["stage_affinity"][stg]  = sess["stage_affinity"].get(stg, 0.0)  + weight

    if action == "fund" and startup_id not in sess["funded"]:
        sess["funded"].append(startup_id)
    elif action == "save" and startup_id not in sess["saved"]:
        sess["saved"].append(startup_id)
    elif action == "skip" and startup_id not in sess["skipped"]:
        sess["skipped"].append(startup_id)

    sess["last_active"] = datetime.now().isoformat()
    save_sessions(sessions)

def get_seen_ids(sessions: dict, user_id: str) -> set:
    sess = sessions.get(user_id, {})
    return {e["startup_id"] for e in sess.get("interactions", [])}

def get_interaction_vector(sessions: dict, user_id: str) -> np.ndarray:
    sess    = sessions.get(user_id, {})
    id_map  = {e["startup_id"]: e["weight"] for e in sess.get("interactions", [])}
    return np.array([id_map.get(sid, 0.0) for sid in startups_df["id"].tolist()])

def get_normalised_sector_weights(sessions: dict, user_id: str) -> dict:
    raw = sessions.get(user_id, {}).get("sector_affinity", {})
    if not raw:
        return {}
    total = sum(abs(v) for v in raw.values()) or 1.0
    return {k: v / total for k, v in sorted(raw.items(), key=lambda x: x[1], reverse=True)}

print("interaction engine ready")

W_CONTENT = 0.35
W_LATENT  = 0.20
W_CF      = 0.25
W_PREF    = 0.20

def collaborative_scores(sessions: dict, user_id: str, candidates: list) -> dict:
    all_ids    = list(sessions.keys())
    if len(all_ids) < 2:
        return {}
    all_startup_ids = startups_df["id"].tolist()
    inv_vecs   = np.array([get_interaction_vector(sessions, uid) for uid in all_ids])
    target_vec = get_interaction_vector(sessions, user_id)
    if target_vec.sum() == 0:
        return {}
    sims  = cosine_similarity(target_vec.reshape(1, -1), inv_vecs)[0]
    top_k = sorted(
        [(all_ids[i], float(s)) for i, s in enumerate(sims) if all_ids[i] != user_id],
        key=lambda x: x[1], reverse=True
    )[:5]
    cf        = defaultdict(float)
    total_sim = sum(s for _, s in top_k) or 1.0
    for uid2, sim in top_k:
        vec = get_interaction_vector(sessions, uid2)
        for i, sid in enumerate(all_startup_ids):
            if sid in candidates:
                cf[sid] += sim * vec[i] / total_sim
    if cf:
        max_cf = max(abs(v) for v in cf.values()) or 1.0
        cf = {k: v / max_cf for k, v in cf.items()}
    return dict(cf)


def recommend(
    sessions:        dict,
    user_id:         str,
    seed_startup_id: Optional[str] = None,
    n:               int = 8,
    exclude_seen:    bool = True,
) -> List[Tuple[dict, float, str]]:

    seen_ids   = get_seen_ids(sessions, user_id) if exclude_seen else set()
    skipped    = set(sessions.get(user_id, {}).get("skipped", []))
    all_ids    = startups_df["id"].tolist()
    candidates = [sid for sid in all_ids
                  if sid not in seen_ids and sid not in skipped and sid != seed_startup_id]

    scores = {sid: {"content": 0.0, "latent": 0.0, "cf": 0.0, "pref": 0.0}
              for sid in candidates}

    # s1 — contrnt similarity to seed
    if seed_startup_id and seed_startup_id in STARTUP_ID_TO_IDX:
        seed_idx = STARTUP_ID_TO_IDX[seed_startup_id]
        for sid in candidates:
            idx = STARTUP_ID_TO_IDX[sid]
            scores[sid]["content"] = float(CONTENT_SIM[seed_idx][idx])

    # s2 — svd latent similarity to seed
    if seed_startup_id and seed_startup_id in STARTUP_ID_TO_IDX:
        seed_idx = STARTUP_ID_TO_IDX[seed_startup_id]
        for sid in candidates:
            idx = STARTUP_ID_TO_IDX[sid]
            scores[sid]["latent"] = float(LATENT_SIM[seed_idx][idx])

    # s3 — collaborative filtering
    cf_scores = collaborative_scores(sessions, user_id, set(candidates))
    for sid in candidates:
        scores[sid]["cf"] = cf_scores.get(sid, 0.0)

    # s4 — real-time preference boost
    sector_w   = get_normalised_sector_weights(sessions, user_id)
    stage_aff  = sessions.get(user_id, {}).get("stage_affinity", {})
    stage_total = sum(abs(v) for v in stage_aff.values()) or 1.0
    stage_w    = {k: v / stage_total for k, v in stage_aff.items()}

    for sid in candidates:
        s_row = startups_df[startups_df["id"] == sid].iloc[0]
        pref  = sector_w.get(s_row["sector"], 0.0) * 0.7
        pref += stage_w.get(s_row["stage"],   0.0) * 0.3
        scores[sid]["pref"] = min(max(pref, -1.0), 1.0)

    # combine signals
    final = []
    for sid, sig in scores.items():
        score  = (W_CONTENT * sig["content"] +
                  W_LATENT  * sig["latent"]  +
                  W_CF      * sig["cf"]      +
                  W_PREF    * sig["pref"])
        dominant = max(sig, key=sig.get)
        reason   = {
            "content": "similar to startups you viewed",
            "latent":  "deep pattern match with your interests",
            "cf":      "users like you funded this",
            "pref":    "matches your sector/stage preference",
        }[dominant]
        s_row = startups_df[startups_df["id"] == sid].iloc[0]
        final.append((s_row.to_dict(), score, reason))

    final.sort(key=lambda x: x[1], reverse=True)
    return final[:n]


def get_feed(sessions: dict, user_id: str, n: int = 8) -> List[Tuple[dict, float, str]]:
    interactions = sessions.get(user_id, {}).get("interactions", [])
    if not interactions:
        inv_row = investors_df[investors_df["id"] == user_id]
        if not inv_row.empty:
            pref_vec = INVESTOR_PREF_VECS[user_id].reshape(1, -1)
            sims     = cosine_similarity(pref_vec, FEATURE_MATRIX)[0]
            ranked   = sorted(enumerate(sims), key=lambda x: x[1], reverse=True)
            results  = []
            for idx, score in ranked[:n]:
                row = startups_df.iloc[idx].to_dict()
                results.append((row, float(score), "matches your stated investment focus"))
            return results
        startups_df["_score"] = startups_df["traction"] + startups_df["team_score"]
        ranked = startups_df.nlargest(n, "_score")
        return [(row.to_dict(), (row["traction"] + row["team_score"]) / 20.0, "trending")
                for _, row in ranked.iterrows()]
    recent_sid = interactions[-1]["startup_id"]
    return recommend(sessions, user_id, seed_startup_id=recent_sid, n=n)

print("hybrid recommender ready")
print(f"signal weights: content={W_CONTENT}, latent={W_LATENT}, cf={W_CF}, pref={W_PREF}")

def print_startup_card(s: dict, score: float, reason: str, rank: int = 0):
    tags = s["tags"] if isinstance(s["tags"], list) else []
    prefix = f"[{rank}] " if rank else ""
    print(f"  {prefix}{s['name']}  ({s['sector']} | {s['stage']})")
    print(f"      location      : {s['location']}")
    print(f"      arr           : ${s['revenue_arr']}m    funding ask : ${s['funding_needed']}m")
    print(f"      traction      : {s['traction']}/10  team : {s['team_score']}/10  market : ${s['market_size']}b")
    print(f"      model         : {s['business_model']}")
    print(f"      website       : {s['website']}")
    print(f"      problem       : {str(s['problem'])[:100]}...")
    print(f"      solution      : {str(s['solution'])[:100]}...")
    print(f"      tags          : {', '.join(tags[:6])}")
    print(f"      score         : {score:.4f}  |  reason : {reason}")
    print()

def print_affinity_profile(sessions: dict, user_id: str):
    sector_w = get_normalised_sector_weights(sessions, user_id)
    stage_aff = sessions.get(user_id, {}).get("stage_affinity", {})
    stage_total = sum(abs(v) for v in stage_aff.values()) or 1.0
    stage_w = {k: v / stage_total for k, v in sorted(stage_aff.items(), key=lambda x: x[1], reverse=True)}

    print("  sector affinity:")
    for sec, w in list(sector_w.items())[:6]:
        bar = "#" * max(0, int(w * 35))
        print(f"    {sec:<15} {bar:<37} {w:.3f}")
    print()
    print("  stage affinity:")
    for stg, w in list(stage_w.items())[:5]:
        bar = "#" * max(0, int(w * 35))
        print(f"    {stg:<12} {bar:<37} {w:.3f}")

def print_session_summary(sessions: dict, user_id: str):
    sess = sessions.get(user_id, {})
    print(f"  user id      : {user_id}")
    print(f"  name         : {sess.get('name', 'unknown')}")
    print(f"  user type    : {sess.get('user_type', 'unknown')}")
    print(f"  created      : {sess.get('created_at', '-')[:19]}")
    print(f"  last active  : {sess.get('last_active', '-')[:19]}")
    print(f"  interactions : {len(sess.get('interactions', []))}")
    print(f"  funded       : {len(sess.get('funded', []))}")
    print(f"  saved        : {len(sess.get('saved', []))}")
    print(f"  skipped      : {len(sess.get('skipped', []))}")

print("display helpers ready")

def investor_session(sessions: dict, user_id: str):
    sess = sessions[user_id]
    name = sess["name"]

    while True:
        print()
        print(f"--- {name}'s feed ---")
        feed = get_feed(sessions, user_id, n=5)

        for i, (s, score, reason) in enumerate(feed, 1):
            print_startup_card(s, score, reason, rank=i)

        print("options:")
        print("  enter a rank number (1-5) to interact with a startup")
        print("  type 'search <sector>'   to filter by sector")
        print("  type 'profile'           to see your affinity profile")
        print("  type 'history'           to see your interaction history")
        print("  type 'quit'              to exit")
        print()

        cmd = input("your choice: ").strip().lower()

        if cmd == "quit":
            print(f"session saved. goodbye, {name}.")
            break

        elif cmd == "profile":
            print()
            print_session_summary(sessions, user_id)
            print()
            print_affinity_profile(sessions, user_id)

        elif cmd == "history":
            print()
            history = sess.get("interactions", [])
            if not history:
                print("  no interactions yet")
            else:
                print(f"  last {min(10, len(history))} interactions:")
                for ev in history[-10:]:
                    print(f"    {ev['timestamp'][:19]}  {ev['action']:<6}  {ev['startup_name']} ({ev['sector']})")

        elif cmd.startswith("search "):
            sector_query = cmd.replace("search ", "").strip().title()
            filtered = startups_df[startups_df["sector"].str.contains(sector_query, case=False)]
            if filtered.empty:
                print(f"  no startups found for '{sector_query}'")
                print(f"  available sectors: {', '.join(SECTOR_LIST)}")
            else:
                print(f"  found {len(filtered)} startups in '{sector_query}':")
                for _, row in filtered.iterrows():
                    print(f"    {row['name']:<18} {row['stage']:<12} arr=${row['revenue_arr']}m  traction={row['traction']}")

        elif cmd.isdigit() and 1 <= int(cmd) <= len(feed):
            idx     = int(cmd) - 1
            startup = feed[idx][0]
            sid     = startup["id"]

            print()
            print(f"  selected: {startup['name']} ({startup['sector']} | {startup['stage']})")
            print()
            print(f"  problem  : {startup['problem']}")
            print()
            print(f"  solution : {startup['solution']}")
            print()
            print(f"  overview : {startup['description']}")
            print()
            print("  what would you like to do?")
            print("    1 = click (view)    2 = save    3 = fund    4 = skip    5 = back")
            action_map = {"1": "click", "2": "save", "3": "fund", "4": "skip"}
            act_input  = input("  action: ").strip()

            if act_input in action_map:
                action = action_map[act_input]
                record_interaction(sessions, user_id, sid, action)
                print(f"  recorded: {action} on {startup['name']} (saved to {SESSION_FILE})")

                if action in ("save", "fund"):
                    print()
                    print(f"  finding more like {startup['name']}...")
                    similar = recommend(sessions, user_id, seed_startup_id=sid, n=3)
                    for s, score, reason in similar:
                        print_startup_card(s, score, reason)
            elif act_input == "5":
                pass
            else:
                print("  invalid action")
        else:
            print("  invalid input — enter a rank number, 'search <sector>', 'profile', 'history', or 'quit'")

print("investor session loop ready")

def startup_session(sessions: dict, user_id: str):
    sess    = sessions[user_id]
    name    = sess["name"]
    my_row  = startups_df[startups_df["name"].str.lower() == name.lower()]

    if my_row.empty:
        print(f"  startup '{name}' not found in the database.")
        print(f"  available: {', '.join(startups_df['name'].tolist())}")
        return

    my_data = my_row.iloc[0].to_dict()
    my_id   = my_data["id"]

    while True:
        print()
        print(f"--- {name} startup dashboard ---")
        print(f"  sector : {my_data['sector']}  |  stage : {my_data['stage']}")
        print(f"  arr    : ${my_data['revenue_arr']}m  |  traction : {my_data['traction']}/10  |  team : {my_data['team_score']}/10")
        print()
        print("options:")
        print("  1 = see similar startups in my sector")
        print("  2 = see which investors are most likely to fund me")
        print("  3 = see my full profile")
        print("  4 = quit")
        print()

        cmd = input("your choice: ").strip()

        if cmd == "4":
            print(f"session saved. goodbye, {name}.")
            break

        elif cmd == "1":
            print()
            print(f"  startups most similar to {name}:")
            my_idx   = STARTUP_ID_TO_IDX[my_id]
            sim_list = sorted(enumerate(CONTENT_SIM[my_idx]), key=lambda x: x[1], reverse=True)[1:7]
            for rank, (idx, score) in enumerate(sim_list, 1):
                row = startups_df.iloc[idx]
                print(f"  [{rank}] {row['name']:<18} {row['sector']:<14} {row['stage']:<12} score={score:.3f}")
                print(f"       arr=${row['revenue_arr']}m  traction={row['traction']}  team={row['team_score']}")

        elif cmd == "2":
            print()
            print(f"  investors most likely to fund {name}:")
            print(f"  (ranked by preference vector similarity + sector/stage match)")
            print()
            matches = []
            my_vec  = FEATURE_MATRIX[STARTUP_ID_TO_IDX[my_id]].reshape(1, -1)
            for inv_id, pref_vec in INVESTOR_PREF_VECS.items():
                sim     = float(cosine_similarity(my_vec, pref_vec.reshape(1, -1))[0][0])
                inv_row = investors_df[investors_df["id"] == inv_id].iloc[0]
                sector_match = my_data["sector"] in inv_row["preferred_sectors"]
                stage_match  = my_data["stage"]  in inv_row["preferred_stages"]
                boost = (0.15 if sector_match else 0.0) + (0.10 if stage_match else 0.0)
                final_score = sim + boost
                matches.append((inv_row, final_score, sector_match, stage_match))
            matches.sort(key=lambda x: x[1], reverse=True)
            for rank, (inv_row, score, sec_m, stg_m) in enumerate(matches, 1):
                sec_tag = "sector-match" if sec_m else ""
                stg_tag = "stage-match"  if stg_m else ""
                tags_str = "  ".join(filter(None, [sec_tag, stg_tag]))
                print(f"  [{rank}] {inv_row['name']:<22} {inv_row['firm']:<26} score={score:.3f}  {tags_str}")
                print(f"       focus : {inv_row['focus'][:70]}...")

        elif cmd == "3":
            print()
            print(f"  startup profile: {name}")
            for key in ["sector","stage","location","founded_year","employees","revenue_arr",
                        "funding_needed","traction","team_score","market_size","website","business_model"]:
                print(f"    {key:<18} : {my_data.get(key, '-')}")
            print()
            print(f"  problem  : {my_data['problem']}")
            print()
            print(f"  solution : {my_data['solution']}")
        else:
            print("  invalid input")

print("startup session loop ready")

def run():
    print("=" * 55)
    print("  startup-investor recommendation system")
    print("=" * 55)
    print()

    name = input("enter your name: ").strip()
    if not name:
        print("name cannot be empty")
        return

    print()
    print("are you:")
    print("  1 = an investor  (get startup recommendations)")
    print("  2 = a startup    (find matching investors)")
    print()
    user_type_input = input("your choice (1 or 2): ").strip()

    if user_type_input == "1":
        user_type = "investor"
    elif user_type_input == "2":
        user_type = "startup"
    else:
        print("invalid choice — enter 1 or 2")
        return

    # match to existing investor record if possible
    matched_inv = investors_df[investors_df["name"].str.lower() == name.lower()]
    if not matched_inv.empty and user_type == "investor":
        user_id = matched_inv.iloc[0]["id"]
        print()
        print(f"  welcome back, {name}! matched to investor profile:")
        print(f"  firm    : {matched_inv.iloc[0]['firm']}")
        print(f"  focus   : {matched_inv.iloc[0]['focus']}")
    else:
        # create a new user id
        user_id = f"user_{name.lower().replace(' ', '_')}_{int(time.time()) % 100000}"

    sess = get_or_create_session(SESSIONS, user_id, user_type, name)

    existing_count = len(sess.get("interactions", []))
    if existing_count > 0:
        print()
        print(f"  welcome back, {name}.")
        print(f"  loaded {existing_count} previous interactions from {SESSION_FILE}")
    else:
        print()
        print(f"  hello {name}, new session created.")

    save_sessions(SESSIONS)
    print()

    if user_type == "investor":
        investor_session(SESSIONS, user_id)
    else:
        startup_session(SESSIONS, user_id)

print("=" * 55)
print("  all cells loaded — model is trained and ready")
print("  run the cell below to start")
print("=" * 55)

run()

SESSIONS = load_sessions()

if not SESSIONS:
    print("no sessions saved yet")
else:
    print(f"total sessions stored: {len(SESSIONS)}")
    print()
    for uid, sess in SESSIONS.items():
        print(f"user: {sess.get('name','?')} ({sess.get('user_type','?')})  id={uid}")
        print(f"  interactions : {len(sess.get('interactions', []))}")
        print(f"  funded       : {sess.get('funded', [])}")
        print(f"  saved        : {sess.get('saved', [])}")
        sec_w = {k:round(v,3) for k,v in get_normalised_sector_weights(SESSIONS, uid).items()}
        print(f"  sector aff.  : {sec_w}")
        print()

print("model analytics")
print()

# top 10 startups by composite score
startups_df["composite"] = startups_df["traction"] + startups_df["team_score"]
top10 = startups_df.nlargest(10, "composite")[
    ["name","sector","stage","traction","team_score","revenue_arr","market_size"]
].reset_index(drop=True)
print("top 10 startups by traction + team score:")
print(top10.to_string(index=True))
print()

# sector distribution
sec_dist = startups_df["sector"].value_counts()
print("startups per sector:")
for sec, cnt in sec_dist.items():
    bar = "#" * cnt
    print(f"  {sec:<15} {bar}  ({cnt})")
print()

# average similarity by sector
print("average intra-sector cosine similarity:")
for sec in SECTOR_LIST:
    idxs = startups_df[startups_df["sector"] == sec].index.tolist()
    if len(idxs) < 2:
        continue
    sims = [CONTENT_SIM[i][j] for i in idxs for j in idxs if i != j]
    print(f"  {sec:<15} avg={np.mean(sims):.3f}  min={np.min(sims):.3f}  max={np.max(sims):.3f}")
print()

# svd variance
print(f"svd explained variance ratio (20 components): {SVD_MODEL.explained_variance_ratio_.sum():.3f}")
print(f"per component: {[round(v,3) for v in SVD_MODEL.explained_variance_ratio_[:5]]} ...")

