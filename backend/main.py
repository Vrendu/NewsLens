from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from mbfc import update_mbfc_data, check_bias_data
import psycopg2
import os
import requests
from dotenv import load_dotenv
from urllib.parse import urlencode
import spacy

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI()

# Retrieve API Key from environment variables
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
NEWSCATCHER_API_KEY = os.getenv("NEWSCATCHER_API_KEY")

# Define Pydantic models for requests
class DomainRequest(BaseModel):
    domain: str


class TitleAndTextRequest(BaseModel):
    title: str
    innerText: str


# Simplified function to extract keywords from the title (excluding stopwords)
def extract_keywords_from_title(title: str, max_keywords=10):
    doc = nlp(title)
    keywords = [token.text for token in doc if not token.is_stop and token.is_alpha]
    return keywords[:max_keywords]


# Route to get related articles from News API
@app.post("/related_articles_by_text")
async def get_related_articles_by_text(request: TitleAndTextRequest):
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not found")

    # Extract keywords from title
    keywords = extract_keywords_from_title(request.title)

    # Connect to the database and fetch all publication names
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT name FROM mbfc_data
        """
    )
    publication_names_to_remove = [
        row[0].lower() for row in cursor.fetchall()
    ]  # Convert to lowercase for comparison
    cursor.close()
    conn.close()

    # Remove keywords that contain any publication names
    filtered_keywords = [
        keyword
        for keyword in keywords
        if keyword.lower() not in publication_names_to_remove
    ]
    print(f"Extracted Keywords for Query: {filtered_keywords}")
    print("Number of keywords:", len(filtered_keywords))

    # Join keywords to form a query string
    query = " OR ".join(filtered_keywords)

    # Define the query parameters for the News API
    query_params = {
        "q": query,  # Use the extracted keywords for the query
        "language": "en",  # Specify the language as English
        "sortBy": "relevancy",  # Sort by relevancy for best matches
        #"sort_by": "relevancy",  # Sort by relevancy for best matches
    }

    # Encode the query parameters to ensure proper URL formatting
    encoded_params = urlencode(query_params)

    # Construct the full URL for the API request
    api_url = f"https://newsapi.org/v2/everything?{encoded_params}"
    #api_url = f"https://api.newscatcherapi.com/v2/search?q={encoded_params}"

    # Make a request to the News API
    headers = {"X-Api-Key": NEWS_API_KEY}
    #headers = {"X-Api-Key": NEWSCATCHER_API_KEY}

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
        print(len(articles), "articles fetched")
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
