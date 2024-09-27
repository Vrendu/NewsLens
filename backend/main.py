from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel
from gdelt import download_gdelt_files, parse_and_store_gdelt_data, prune_old_gdelt_data
from mbfc import update_mbfc_data, check_bias_data
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

API_KEY = os.getenv("API_KEY")


# Define Pydantic model for domain request
class DomainRequest(BaseModel):
    domain: str


# Route to trigger the GDELT data update and pruning
@app.post("/update_gdelt_data")
async def update_gdelt_data(background_tasks: BackgroundTasks):
    background_tasks.add_task(download_gdelt_files)
    background_tasks.add_task(parse_and_store_gdelt_data)
    background_tasks.add_task(prune_old_gdelt_data)
    return {
        "message": "GDELT data update and pruning has been triggered in the background."
    }


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
        CREATE TABLE IF NOT EXISTS news_articles (
            id SERIAL PRIMARY KEY,
            GKGRECORDID TEXT,
            DATE TIMESTAMP,
            SourceCollectionIdentifier INT,
            SourceCommonName TEXT,
            DocumentIdentifier TEXT,
            Counts TEXT,
            V2Counts TEXT,
            Themes TEXT,
            V2Themes TEXT,
            Locations TEXT,
            V2Locations TEXT,
            Persons TEXT,
            V2Persons TEXT,
            Organizations TEXT,
            V2Organizations TEXT,
            V2Tone TEXT,
            Dates TEXT,
            GCAM TEXT,
            SharingImage TEXT,
            RelatedImages TEXT,
            SocialImageEmbeds TEXT,
            SocialVideoEmbeds TEXT,
            Quotations TEXT,
            AllNames TEXT,
            Amounts TEXT,
            TranslationInfo TEXT,
            Extras TEXT
        )
        """
    )

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


# FastAPI startup event to ensure necessary
@app.on_event("startup")
async def startup():
    setup_database()
