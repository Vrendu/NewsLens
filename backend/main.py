# backend/main.py

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from mbfc import update_mbfc_data, check_bias_data
import psycopg2
import os
import requests
from dotenv import load_dotenv
from urllib.parse import urlencode
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import ssl

# Disable SSL verification temporarily for NLTK
ssl._create_default_https_context = ssl._create_unverified_context

# Ensure that the necessary NLTK data is downloaded
nltk.download("punkt")
nltk.download("stopwords")

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI()

# Retrieve API Key from environment variables
NEWSCATCHER_API_KEY = os.getenv("NEWSCATCHER_API_KEY")


# Define Pydantic models for requests
class DomainRequest(BaseModel):
    domain: str


class TitleAndTextRequest(BaseModel):
    title: str
    innerText: str


# Function to extract keywords from text using NLTK
def extract_keywords(
    title: str,
    inner_text: str,
    max_title_keywords: int = 5,
    max_text_keywords: int = 10,
):
    """Extract and combine keywords from title and inner text."""

    # List of publisher names to filter out
    PUBLISHER_BLACKLIST = ["CNN", "Fox", "BBC", "Reuters", "Bloomberg", "Al Jazeera"]

    # Create a set of stopwords
    stop_words = set(stopwords.words("english"))

    # Tokenize the title and inner text
    title_tokens = word_tokenize(title.lower())
    text_tokens = word_tokenize(inner_text.lower())

    # Filter out stopwords, punctuation, and publisher names from the title
    filtered_title_keywords = [
        word
        for word in title_tokens
        if word.isalnum() and word not in stop_words and word not in PUBLISHER_BLACKLIST
    ]

    # Filter out stopwords, punctuation, and publisher names from the inner text
    filtered_text_keywords = [
        word
        for word in text_tokens[:1000]
        if word.isalnum() and word not in stop_words and word not in PUBLISHER_BLACKLIST
    ]

    # Combine title keywords into an exact match query
    title_query = " ".join(
        f'"{word}"' for word in filtered_title_keywords[:max_title_keywords]
    )

    # Combine inner text keywords into an exact match query
    text_query = " ".join(
        f'"{word}"' for word in filtered_text_keywords[:max_text_keywords]
    )

    # Return query for both title OR inner text using Boolean OR
    return f"({title_query}) OR ({text_query})"


# Route to get related articles from NewsCatcher API
@app.post("/related_articles_by_text")
async def get_related_articles_by_text(request: TitleAndTextRequest):
    if not NEWSCATCHER_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not found")

    # Extract keywords from both title and inner text
    query = extract_keywords(request.title, request.innerText)
    print(f"Extracted Keywords for Query: {query}")

    # Define the query parameters for the NewsCatcher API
    query_params = {
        "q": query,  # Use the extracted keywords for the query
        "lang": "en",  # Specify the language as English
        "sort_by": "relevancy",  # Sort by relevancy for best matches
    }

    # Encode the query parameters to ensure proper URL formatting
    encoded_params = urlencode(query_params)

    # Construct the full URL for the API request
    api_url = f"https://api.newscatcherapi.com/v2/search?{encoded_params}"

    # Make a request to the NewsCatcher API
    headers = {"x-api-key": NEWSCATCHER_API_KEY}

    try:
        response = requests.get(api_url, headers=headers)

        # Print the response status and content for debugging
        print(f"Response Status Code: {response.status_code}")

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch related articles: {response.text}",
            )

        # Parse the articles from the response
        articles = response.json().get("articles", [])
        return {"articles": articles}

    except Exception as e:
        # Print the exact exception and traceback for better debugging
        print(f"Exception: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching related articles: {str(e)}"
        )


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
