# backend/main.py

from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel
from mbfc import update_mbfc_data, check_bias_data
import psycopg2
import os
import ssl
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# Initialize FastAPI
app = FastAPI()

# Retrieve API Key from environment variables
NEWSCATCHER_API_KEY = os.getenv("NEWSCATCHER_API_KEY")

# Define Pydantic models for requests
class DomainRequest(BaseModel):
    domain: str


# Define Pydantic models for requests
class RelatedArticleRequest(BaseModel):
    title: str
    innerText: str


# Function to extract keywords from text
def extract_keywords(text: str, max_keywords: int = 5):
    """Extract keywords from the text using simple filtering and ranking."""
    stop_words = set(stopwords.words("english"))
    words = word_tokenize(text.lower())  # Tokenize the text
    keywords = [
        word for word in words if word.isalnum() and word not in stop_words
    ]  # Remove stopwords and punctuation

    # Rank keywords by frequency and select the most common
    keyword_freq = {}
    for word in keywords:
        if word in keyword_freq:
            keyword_freq[word] += 1
        else:
            keyword_freq[word] = 1

    # Sort keywords by frequency and select top max_keywords
    sorted_keywords = sorted(
        keyword_freq.items(), key=lambda item: item[1], reverse=True
    )
    top_keywords = [keyword for keyword, _ in sorted_keywords[:max_keywords]]
    return " ".join(top_keywords)  # Join keywords into a single string for the query


class TitleAndTextRequest(BaseModel):
    title: str
    innerText: str


# Route to get related articles based on title and inner text
@app.post("/related_articles_by_text")
async def get_related_articles_by_text(request: TitleAndTextRequest):
    # Print the received title and inner text for debugging
    print(f"Received title: {request.title}")
    print(f"Received text (first 500 characters): {request.innerText[:500]}")  # Print only first 500 characters to reduce console clutter
    return {"message": "Title and text received successfully"}


# Route to trigger MBFC data update
@app.post("/update_mbfc_data")
async def update_mbfc_data_route(background_tasks: BackgroundTasks):
    # Trigger the update as a background task
    background_tasks.add_task(update_mbfc_data)
    return {"message": "MBFC data update has been triggered in the background."}


# Route to check bias data based on the domain
@app.post("/check_bias_data")
async def check_bias_data_route(request: DomainRequest):
    return check_bias_data(request.domain)


# Function to set up necessary tables for GDELT and MBFC
def setup_database():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS mbfc_data (
            id SERIAL PRIMARY KEY,
            name TEXT,
            mbfc_url TEXT,
            domain TEXT,
            bias TEXT,
            factual_reporting TEXT,
            country TEXT,
            credibility TEXT
        )
        """
    )

    conn.commit()
    cursor.close()
    conn.close()


# FastAPI startup event to ensure necessary tables are created
@app.on_event("startup")
async def startup():
    setup_database()
