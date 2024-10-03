# backend/main.py

from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel
from mbfc import update_mbfc_data, check_bias_data
import psycopg2
import os
import ssl
import nltk
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure SSL context for NLTK downloads if necessary
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download required NLTK resources
nltk.download("punkt")
nltk.download("stopwords")

# Initialize FastAPI
app = FastAPI()

# Retrieve API Key from environment variables
API_KEY = os.getenv("API_KEY")


# Define Pydantic models for requests
class DomainRequest(BaseModel):
    domain: str


class TitleAndTextRequest(BaseModel):
    title: str
    innerText: str


# Function to extract keywords from the title and text using NLTK
def extract_keywords_from_text(text: str, min_length: int = 3):
    """Extract keywords from text by splitting and filtering based on length."""
    stop_words = set(nltk.corpus.stopwords.words("english"))
    words = nltk.word_tokenize(text.lower())
    keywords = [
        word for word in words if word not in stop_words and len(word) >= min_length
    ]
    return keywords


# Route to get related articles based on title and inner text
@app.post("/related_articles_by_text")
async def get_related_articles_by_text(request: TitleAndTextRequest):
    print("Getting related articles by text")
    # Extract keywords from both the title and the inner text
    title_keywords = extract_keywords_from_text(request.title)
    inner_text_keywords = extract_keywords_from_text(request.innerText)
    print(title_keywords, inner_text_keywords)
    # Combine keywords from both sources
    keywords = set(title_keywords + inner_text_keywords)
    if not keywords:
        return {"message": "No keywords extracted from the title or text"}

    # Connect to the database
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()

    # Create a SQL query to search for articles with matching themes, locations, persons, or organizations
    query = """
    SELECT DocumentIdentifier, Themes, SourceCommonName, DATE, Locations, Persons, Organizations
    FROM news_articles
    WHERE 
    """

    # Add conditions for matching themes, locations, persons, or organizations using the keywords
    conditions = " OR ".join(
        [
            f"Themes ILIKE '%{keyword}%' OR Locations ILIKE '%{keyword}%' OR Persons ILIKE '%{keyword}%' OR Organizations ILIKE '%{keyword}%'"
            for keyword in keywords
        ]
    )
    query += conditions + " ORDER BY DATE DESC LIMIT 10"

    cursor.execute(query)
    results = cursor.fetchall()

    cursor.close()
    conn.close()

    # Convert results to a list of dictionaries
    related_articles = [
        {
            "DocumentIdentifier": row[0],
            "Themes": row[1],
            "SourceCommonName": row[2],
            "DATE": row[3],
            "Locations": row[4],
            "Persons": row[5],
            "Organizations": row[6],
        }
        for row in results
    ]

    return {"related_articles": related_articles}



# Route to trigger MBFC data update
@app.post("/update_mbfc_data")
async def update_mbfc_data_route(
    background_tasks: BackgroundTasks, api_key: str = Header(...)
):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

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
