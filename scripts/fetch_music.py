#!/usr/bin/env python3
"""
fetch_music.py — Sur Sansar: Weekly Music Link Fetcher
======================================================
Sources:
  1. Internet Archive  — https://archive.org/advancedsearch.php
  2. Wikimedia Commons — https://commons.wikimedia.org/w/api.php

Run via GitHub Actions (see .github/workflows/fetch-music.yml).
Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Optional: DRY_RUN=true (fetch but do not insert)
"""

import os
import json
import time
import re
import requests
import urllib.parse
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
DRY_RUN = os.environ.get("DRY_RUN", "false").lower() == "true"

# Respect Internet Archive's rate limit (1 req/s recommended)
IA_RATE_LIMIT_SECONDS = 1.2
WIKIMEDIA_RATE_LIMIT_SECONDS = 0.5

# Max tracks to attempt per state per source
MAX_PER_STATE_IA = 10
MAX_PER_STATE_WIKI = 5

# State names → search keywords for Internet Archive
STATES_SEARCH_MAP = {
    "Andaman and Nicobar Islands": ["Andaman folk music", "Nicobar tribal music"],
    "Andhra Pradesh": ["Andhra folk music", "Telugu folk songs", "Kuchipudi classical"],
    "Arunachal Pradesh": ["Arunachal folk music", "Monpa tribal songs"],
    "Assam": ["Bihu music Assam", "Assamese folk songs", "Borgeet Assam"],
    "Bihar": ["Bihar folk music", "Chhath Puja songs", "Bhojpuri folk"],
    "Chandigarh": ["Punjab folk music chandigarh", "Punjabi classical"],
    "Chhattisgarh": ["Chhattisgarh folk music", "Pandavani music"],
    "Dadra and Nagar Haveli": ["Warli tribal music", "Dadra folk"],
    "Daman and Diu": ["Ghumat music", "Portuguese Indian folk"],
    "Delhi": ["Delhi Qawwali", "Hindustani classical Delhi", "Sufi music Delhi"],
    "Goa": ["Goan folk music", "Konkani Mando", "Goa traditional"],
    "Gujarat": ["Garba folk Gujarat", "Gujarati folk music", "Dayro Gujarat"],
    "Haryana": ["Haryanvi folk music", "Ragini Haryana", "Saang folk"],
    "Himachal Pradesh": ["Himachal folk music", "Kinnauri folk", "Pahari music"],
    "Jammu and Kashmir": ["Kashmir Sufi music", "Sufiana Kalam", "Kashmiri folk"],
    "Jharkhand": ["Santhali folk music", "Jharkhand tribal songs", "Jharkhandi folk"],
    "Karnataka": ["Carnatic music Karnataka", "Karnataka folk", "Yakshagana music"],
    "Kerala": ["Kerala folk music", "Chenda Melam", "Sopana Sangeetham"],
    "Lakshadweep": ["Lakshadweep folk", "Lava dance music"],
    "Madhya Pradesh": ["Malwa folk music", "Dhrupad Gwalior", "Bundeli folk"],
    "Maharashtra": ["Lavani Maharashtra", "Marathi folk music", "Powada"],
    "Manipur": ["Manipuri classical music", "Pung Cholom", "Nata Sankirtana"],
    "Meghalaya": ["Meghalaya folk music", "Khasi folk songs", "Garo tribal"],
    "Mizoram": ["Mizoram folk music", "Cheraw bamboo dance"],
    "Nagaland": ["Naga folk music", "Hornbill festival music"],
    "Odisha": ["Odissi music", "Sambalpuri folk", "Odia folk songs"],
    "Puducherry": ["Puducherry folk music", "Tamil classical Pondicherry"],
    "Punjab": ["Bhangra folk music", "Punjab Sufi Kafi", "Punjabi folk"],
    "Rajasthan": ["Rajasthani folk music", "Manganiyar music", "Maand Rajasthan"],
    "Sikkim": ["Sikkim folk music", "Maruni dance", "Lepcha folk"],
    "Tamil Nadu": ["Tamil folk music", "Carnatic music Chennai", "Nadaswaram"],
    "Telangana": ["Telangana folk music", "Bathukamma songs", "Lambadi folk"],
    "Tripura": ["Tripura folk music", "Hojagiri dance", "Tripuri tribal"],
    "Uttar Pradesh": ["UP Thumri", "Awadhi folk music", "Banaras classical"],
    "Uttarakhand": ["Garhwali folk music", "Kumaoni folk", "Jagar chants"],
    "West Bengal": ["Baul music Bengal", "Rabindra Sangeet", "Bengali folk"],
}

WIKIMEDIA_CATEGORIES = [
    "Folk_music_of_India",
    "Classical_music_of_India",
    "Music_of_Rajasthan",
    "Music_of_Kerala",
    "Music_of_Punjab,_India",
    "Music_of_Gujarat",
    "Music_of_Maharashtra",
    "Music_of_Karnataka",
    "Music_of_Tamil_Nadu",
    "Music_of_Bengal",
    "Music_of_Andhra_Pradesh",
]

# ── Helpers ──────────────────────────────────────────────────────────────────

report = {
    "run_at": datetime.utcnow().isoformat() + "Z",
    "dry_run": DRY_RUN,
    "inserted": 0,
    "skipped_duplicates": 0,
    "errors": [],
    "tracks": [],
}

def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] {msg}")

def clean_title(title: str) -> str:
    """Remove file extension, underscores, excess whitespace."""
    title = re.sub(r'\.(mp3|ogg|flac|wav)$', '', title, flags=re.IGNORECASE)
    title = title.replace('_', ' ').strip()
    return title

def is_audio_url(url: str) -> bool:
    return bool(re.search(r'\.(mp3|ogg)(\?|$)', url, re.IGNORECASE))

# ── Internet Archive ─────────────────────────────────────────────────────────

def fetch_ia_identifiers(query: str, rows: int = 10) -> list[dict]:
    """Search Internet Archive and return list of {identifier, title, creator}."""
    params = {
        "q": f"({query}) AND mediatype:(audio) AND licenseurl:(creativecommons.org)",
        "fl[]": ["identifier", "title", "creator", "subject"],
        "output": "json",
        "rows": rows,
        "sort[]": "downloads desc",
    }
    url = "https://archive.org/advancedsearch.php?" + urllib.parse.urlencode(params, doseq=True)
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", {}).get("docs", [])
    except Exception as e:
        log(f"  IA search error: {e}")
        return []

def fetch_ia_audio_urls(identifier: str) -> list[dict]:
    """Get direct .mp3/.ogg URLs for a given Internet Archive identifier."""
    url = f"https://archive.org/metadata/{identifier}"
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        meta = resp.json()
        files = meta.get("files", [])
        server = meta.get("server", "archive.org")
        d = meta.get("dir", "")

        results = []
        for f in files:
            fname = f.get("name", "")
            fmt = f.get("format", "").lower()
            if fmt in ("mp3", "ogg vorbis", "vbr mp3") or fname.lower().endswith((".mp3", ".ogg")):
                stream_url = f"https://{server}{d}/{urllib.parse.quote(fname)}"
                size = int(f.get("size", 0))
                # Skip huge files > 50MB or tiny files < 10KB
                if size and (size > 50 * 1024 * 1024 or size < 10 * 1024):
                    continue
                title = clean_title(f.get("title") or fname)
                creator = f.get("creator") or meta.get("metadata", {}).get("creator", "Unknown")
                if isinstance(creator, list):
                    creator = creator[0]
                results.append({
                    "track_title": title,
                    "artist": str(creator)[:200],
                    "stream_url": stream_url,
                    "source": "Internet Archive",
                    "license_type": "CC-BY",
                })
        return results[:3]  # Max 3 tracks per IA item
    except Exception as e:
        log(f"  IA metadata error ({identifier}): {e}")
        return []

def fetch_from_internet_archive(state_name: str, queries: list[str]) -> list[dict]:
    """Fetch tracks for a state from Internet Archive."""
    all_tracks = []
    seen_urls = set()

    for query in queries:
        if len(all_tracks) >= MAX_PER_STATE_IA:
            break
        log(f"  IA search: '{query}'")
        docs = fetch_ia_identifiers(query, rows=5)
        time.sleep(IA_RATE_LIMIT_SECONDS)

        for doc in docs:
            if len(all_tracks) >= MAX_PER_STATE_IA:
                break
            identifier = doc.get("identifier")
            if not identifier:
                continue

            tracks = fetch_ia_audio_urls(identifier)
            time.sleep(IA_RATE_LIMIT_SECONDS)

            for t in tracks:
                if t["stream_url"] not in seen_urls:
                    seen_urls.add(t["stream_url"])
                    t["state_name"] = state_name
                    all_tracks.append(t)

    return all_tracks

# ── Wikimedia Commons ────────────────────────────────────────────────────────

def fetch_wikimedia_category(category: str) -> list[dict]:
    """Fetch .ogg audio files from a Wikimedia Commons category."""
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{category}",
        "cmtype": "file",
        "cmprop": "title|ids",
        "cmlimit": 20,
        "format": "json",
    }
    url = "https://commons.wikimedia.org/w/api.php"
    try:
        resp = requests.get(url, params=params, timeout=15,
                            headers={"User-Agent": "SurSansar/1.0 (folk music archival project)"})
        resp.raise_for_status()
        data = resp.json()
        members = data.get("query", {}).get("categorymembers", [])
        return [m for m in members if m.get("title", "").lower().endswith((".ogg", ".mp3"))]
    except Exception as e:
        log(f"  Wikimedia category error ({category}): {e}")
        return []

def get_wikimedia_direct_url(file_title: str) -> str | None:
    """Get direct media URL for a Wikimedia Commons file title."""
    params = {
        "action": "query",
        "titles": file_title,
        "prop": "imageinfo",
        "iiprop": "url|size",
        "format": "json",
    }
    url = "https://commons.wikimedia.org/w/api.php"
    try:
        resp = requests.get(url, params=params, timeout=15,
                            headers={"User-Agent": "SurSansar/1.0"})
        resp.raise_for_status()
        data = resp.json()
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            ii = page.get("imageinfo", [{}])[0]
            stream_url = ii.get("url", "")
            size = ii.get("size", 0)
            if stream_url and is_audio_url(stream_url):
                # Skip huge (>30MB) or tiny (<5KB)
                if size and (size > 30 * 1024 * 1024 or size < 5 * 1024):
                    return None
                return stream_url
        return None
    except Exception as e:
        log(f"  Wikimedia URL error: {e}")
        return None

def fetch_from_wikimedia(state_name: str) -> list[dict]:
    """Fetch tracks related to a state from Wikimedia Commons."""
    tracks = []
    seen_urls = set()

    # Map state to relevant categories
    state_lower = state_name.lower()
    relevant_cats = [c for c in WIKIMEDIA_CATEGORIES if "India" in c]
    if "rajasthan" in state_lower:
        relevant_cats = ["Music_of_Rajasthan"] + relevant_cats
    elif "kerala" in state_lower:
        relevant_cats = ["Music_of_Kerala"] + relevant_cats
    elif "punjab" in state_lower or "chandigarh" in state_lower:
        relevant_cats = ["Music_of_Punjab,_India"] + relevant_cats
    elif "gujarat" in state_lower:
        relevant_cats = ["Music_of_Gujarat"] + relevant_cats
    elif "maharashtra" in state_lower or "goa" in state_lower:
        relevant_cats = ["Music_of_Maharashtra"] + relevant_cats
    elif "karnataka" in state_lower:
        relevant_cats = ["Music_of_Karnataka"] + relevant_cats
    elif "tamil" in state_lower or "puducherry" in state_lower:
        relevant_cats = ["Music_of_Tamil_Nadu"] + relevant_cats
    elif "bengal" in state_lower:
        relevant_cats = ["Music_of_Bengal"] + relevant_cats
    elif "andhra" in state_lower or "telangana" in state_lower:
        relevant_cats = ["Music_of_Andhra_Pradesh"] + relevant_cats

    for cat in relevant_cats[:2]:  # Max 2 categories per state
        if len(tracks) >= MAX_PER_STATE_WIKI:
            break
        log(f"  Wikimedia category: {cat}")
        members = fetch_wikimedia_category(cat)
        time.sleep(WIKIMEDIA_RATE_LIMIT_SECONDS)

        for member in members[:15]:
            if len(tracks) >= MAX_PER_STATE_WIKI:
                break
            file_title = member.get("title", "")
            stream_url = get_wikimedia_direct_url(file_title)
            time.sleep(WIKIMEDIA_RATE_LIMIT_SECONDS)

            if stream_url and stream_url not in seen_urls:
                seen_urls.add(stream_url)
                raw_title = file_title.replace("File:", "").strip()
                tracks.append({
                    "state_name": state_name,
                    "track_title": clean_title(raw_title)[:200],
                    "artist": "Wikimedia Commons",
                    "stream_url": stream_url,
                    "source": "Wikimedia Commons",
                    "license_type": "CC-BY",
                })

    return tracks

# ── Supabase Upsert ──────────────────────────────────────────────────────────

def get_existing_urls() -> set[str]:
    """Fetch all existing stream_urls to avoid duplicate inserts."""
    if not SUPABASE_URL:
        return set()
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/state_music_links?select=stream_url&limit=10000",
            headers=headers, timeout=20
        )
        resp.raise_for_status()
        return {row["stream_url"] for row in resp.json()}
    except Exception as e:
        log(f"Error fetching existing URLs: {e}")
        return set()

def insert_tracks(tracks: list[dict], existing_urls: set[str]) -> int:
    """Insert new tracks into Supabase, skip duplicates. Returns count inserted."""
    if DRY_RUN:
        log(f"  [DRY RUN] Would insert {len(tracks)} tracks")
        return 0

    new_tracks = [t for t in tracks if t["stream_url"] not in existing_urls]
    if not new_tracks:
        return 0

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/state_music_links",
            headers=headers,
            json=new_tracks,
            timeout=30,
        )
        resp.raise_for_status()
        log(f"  ✓ Inserted {len(new_tracks)} tracks")
        return len(new_tracks)
    except Exception as e:
        log(f"  ✗ Insert error: {e}")
        report["errors"].append(str(e))
        return 0

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    log("=" * 60)
    log(f"Sur Sansar — Music Fetch Script")
    log(f"Dry run: {DRY_RUN}")
    log(f"Supabase configured: {bool(SUPABASE_URL and SERVICE_KEY)}")
    log("=" * 60)

    existing_urls = get_existing_urls()
    log(f"Found {len(existing_urls)} existing URLs in DB")

    total_inserted = 0
    total_skipped = 0
    all_fetched_tracks = []

    for state_name, queries in STATES_SEARCH_MAP.items():
        log(f"\n── {state_name} ──")
        state_tracks = []

        # Source 1: Internet Archive
        ia_tracks = fetch_from_internet_archive(state_name, queries)
        log(f"  IA: found {len(ia_tracks)} candidate tracks")
        state_tracks.extend(ia_tracks)

        # Source 2: Wikimedia Commons
        wiki_tracks = fetch_from_wikimedia(state_name)
        log(f"  Wikimedia: found {len(wiki_tracks)} candidate tracks")
        state_tracks.extend(wiki_tracks)

        # Dedupe within this batch
        seen = set()
        deduped = []
        for t in state_tracks:
            if t["stream_url"] not in seen:
                seen.add(t["stream_url"])
                deduped.append(t)

        new_count = sum(1 for t in deduped if t["stream_url"] not in existing_urls)
        skip_count = len(deduped) - new_count
        log(f"  → {new_count} new, {skip_count} already in DB")

        inserted = insert_tracks(deduped, existing_urls)
        total_inserted += inserted
        total_skipped += skip_count

        # Update existing_urls to avoid re-inserting across state iterations
        for t in deduped:
            existing_urls.add(t["stream_url"])

        all_fetched_tracks.extend(deduped)

        # Rate limit between states
        time.sleep(1)

    # Write report
    report["inserted"] = total_inserted
    report["skipped_duplicates"] = total_skipped
    report["tracks"] = [
        {"state": t["state_name"], "title": t["track_title"], "source": t["source"], "url": t["stream_url"]}
        for t in all_fetched_tracks
    ]

    with open("fetch_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    log("\n" + "=" * 60)
    log(f"Done! Inserted: {total_inserted} | Skipped duplicates: {total_skipped} | Errors: {len(report['errors'])}")
    log("Report saved to fetch_report.json")

if __name__ == "__main__":
    main()
