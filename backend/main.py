import os
import time
import psycopg2
import requests
import zipfile
import pandas as pd
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime, timedelta
from dotenv import load_dotenv

app = FastAPI()

# Load environment variables from .env file
load_dotenv()

# PostgreSQL connection details from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# GDELT base URL for GKG files from .env
GDELT_BASE_URL = os.getenv("GDELT_BASE_URL")

# MBFC API details from .env
MBFC_API_URL = os.getenv("MBFC_API_URL")
BEARER_TOKEN = os.getenv("BEARER_TOKEN")


# -------------------- GDELT Data Handling --------------------


# Download GDELT files for the past 3 days
def download_gdelt_files(days=3):
    os.makedirs("gdelt_data", exist_ok=True)  # Ensure the directory exists

    now = datetime.utcnow()
    past_days = now - timedelta(days=days)

    current_time = past_days
    retries = 3  # Number of retries in case of failure

    while current_time <= now:
        file_name = current_time.strftime("%Y%m%d%H%M00.gkg.csv.zip")
        url = GDELT_BASE_URL + file_name
        print(f"Attempting to download {url}")

        for attempt in range(retries):
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    zip_file_path = f"gdelt_data/{file_name}"

                    # Save the zip file
                    with open(zip_file_path, "wb") as file:
                        file.write(response.content)

                    # Unzip the file
                    with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
                        zip_ref.extractall("gdelt_data")

                    # Remove the zip file after extracting
                    os.remove(zip_file_path)
                    print(f"Downloaded and extracted: {file_name}")
                    break
                else:
                    print(f"File not found: {url} (Attempt {attempt + 1})")
                    time.sleep(2)  # Wait before retrying

            except Exception as e:
                print(f"Error downloading {url}: {e}")
                if attempt + 1 == retries:
                    print(f"Failed to download {url} after {retries} attempts")

        current_time += timedelta(hours=1)


# Parse GDELT CSV files and store them in PostgreSQL
def parse_and_store_gdelt_data():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS news_articles (
            id SERIAL PRIMARY KEY,
            date TIMESTAMP,
            source TEXT,
            url TEXT,
            keywords TEXT
        )
        """
    )

    # Assuming the downloaded GDELT file is stored in 'gdelt_data' folder
    for file_name in os.listdir("gdelt_data"):
        if file_name.endswith(".csv"):
            csv_file_path = f"gdelt_data/{file_name}"

            # Load the GDELT GKG data, handling specific columns for parsing
            col_names = [
                "V1Date",
                "DocumentIdentifier",
                "V2Themes",  # Only parse relevant columns
            ]
            df = pd.read_csv(
                csv_file_path,
                sep="\t",
                header=None,
                usecols=[0, 2, 7],
                names=col_names,
                on_bad_lines="skip",  # Skip lines with errors
            )

            # Convert V1Date to a proper timestamp and filter out missing entries
            df["V1Date"] = pd.to_datetime(
                df["V1Date"], format="%Y%m%d%H%M%S", errors="coerce"
            )
            filtered_data = df.dropna(subset=["DocumentIdentifier", "V2Themes"])

            # Insert filtered data into PostgreSQL
            for _, row in filtered_data.iterrows():
                cursor.execute(
                    """
                    INSERT INTO news_articles (date, source, url, keywords)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        row["V1Date"],
                        "GDELT",
                        row["DocumentIdentifier"],
                        row["V2Themes"],
                    ),
                )

    conn.commit()
    cursor.close()
    conn.close()


# Prune GDELT data older than 3 days
def prune_old_gdelt_data():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM news_articles
        WHERE date < NOW() - INTERVAL '3 days'
        """
    )

    conn.commit()
    cursor.close()
    conn.close()


# Route to trigger the GDELT data update and pruning
@app.post("/update_gdelt_data")
async def update_gdelt_data(background_tasks: BackgroundTasks):
    background_tasks.add_task(download_gdelt_files)
    background_tasks.add_task(parse_and_store_gdelt_data)
    background_tasks.add_task(prune_old_gdelt_data)
    return {
        "message": "GDELT data update and pruning has been triggered in the background."
    }


# -------------------- MBFC Data Handling --------------------


# Define a Pydantic model for the domain request
class DomainRequest(BaseModel):
    domain: str


# Fetch full MBFC dataset
def fetch_mbfc_data():
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
    }

    response = requests.get(MBFC_API_URL, headers=headers)

    if response.status_code == 200:
        return response.json()  # Assuming response is JSON
    else:
        raise Exception(
            f"Error fetching data from MBFC API: {response.status_code}, {response.text}"
        )


# Prune old MBFC data and insert fresh MBFC data
def update_mbfc_data():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Prune old data
    cursor.execute("DELETE FROM mbfc_data")

    # Fetch fresh data from MBFC API
    mbfc_data = fetch_mbfc_data()
    print(f"MBFC data fetched: {len(mbfc_data)} entries")
    # Insert fresh data
    for entry in mbfc_data:
        cursor.execute(
            """
            INSERT INTO mbfc_data (name, mbfc_url, domain, bias, factual_reporting, country, credibility)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                entry["Name"],
                entry["MBFC URL"],
                entry["Domain"],
                entry["Bias"],
                entry["Factual Reporting"],
                entry["Country"],
                entry["Credibility"],
            ),
        )

    conn.commit()
    cursor.close()
    conn.close()


# Route to trigger MBFC data update
@app.post("/update_mbfc_data")
async def update_data(background_tasks: BackgroundTasks):
    background_tasks.add_task(update_mbfc_data)
    return {"message": "MBFC data update has been triggered in the background."}


# Route to check bias data based on the domain
@app.post("/check_bias_data")
async def check_bias_data(request: DomainRequest):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    domain = request.domain

    cursor.execute(
        """
    SELECT name, bias
    FROM mbfc_data
    WHERE domain = REGEXP_REPLACE(%s, '^www\\.', '')
    """,
        (domain,),
    )

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    return {"data": [{"name": row[0], "bias": row[1]} for row in data]}


# -------------------- Startup Event --------------------


# FastAPI startup event to ensure necessary tables are set up
@app.on_event("startup")
async def startup_event():
    setup_database()


# Function to set up necessary tables for GDELT and MBFC
def setup_database():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Create table for GDELT articles
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS news_articles (
            id SERIAL PRIMARY KEY,
            date TIMESTAMP,
            source TEXT,
            url TEXT,
            keywords TEXT
        )
        """
    )

    # Create table for MBFC data
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
