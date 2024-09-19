import psycopg2  # PostgreSQL adapter for Python
import csv
import os
import requests
import zipfile
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import pandas as pd
from datetime import datetime, timedelta

app = FastAPI()

# PostgreSQL connection details
DATABASE_URL = "postgresql://postgres:yourpassword@localhost:5432/newslens_db"  # Update your password here

# GDELT base URL for GKG files
GDELT_BASE_URL = "http://data.gdeltproject.org/gdeltv2/"


# Download GDELT files for the past 3 days
def download_gdelt_files(days=3):
    os.makedirs("gdelt_data", exist_ok=True)  # Ensure the directory exists

    now = datetime.utcnow()
    past_days = now - timedelta(days=days)

    current_time = past_days
    while current_time <= now:
        file_name = current_time.strftime("%Y%m%d%H%M00.gkg.csv.zip")
        url = GDELT_BASE_URL + file_name
        print(f"Downloading {url}")

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
        else:
            print(f"File not found: {url}")

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
                usecols=[
                    0,
                    2,
                    7,
                ],  # Columns: V1Date (col 0), DocumentIdentifier (col 2), V2Themes (col 7)
                names=col_names,
                error_bad_lines=False,  # Skip lines with errors
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


# Function to load AllSides CSV data into the PostgreSQL database (unchanged)
def load_allsides_data():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS bias_data (
            name TEXT,
            bias TEXT,
            total_votes INTEGER,
            agree INTEGER,
            disagree INTEGER,
            agree_ratio REAL,
            agreeance_text TEXT,
            allsides_page TEXT,
            url_pattern TEXT
        )
        """
    )

    cursor.execute("SELECT COUNT(*) FROM bias_data")
    row_count = cursor.fetchone()[0]

    if row_count == 0:
        with open("allsides.csv", newline="", encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)
            for row in reader:
                cursor.execute(
                    """
                    INSERT INTO bias_data (name, bias, total_votes, agree, disagree, agree_ratio, agreeance_text, allsides_page, url_pattern)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    row,
                )
        conn.commit()
        print("AllSides CSV data loaded into database.")
    else:
        print("Bias data already loaded.")

    cursor.close()
    conn.close()


# FastAPI startup event to load AllSides data
@app.on_event("startup")
async def startup_event():
    load_allsides_data()


class QueryRequest(BaseModel):
    url: str  # Expect the tab URL from background.js


@app.post("/check_bias")
async def check_bias(query: QueryRequest):
    url = query.url
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT name, bias, total_votes, agree, disagree, agree_ratio, agreeance_text, allsides_page, url_pattern FROM bias_data"
    )
    rows = cursor.fetchall()
    conn.close()

    matched_data = None
    for row in rows:
        pattern = row[8]
        if pattern and re.match(pattern, url):
            matched_data = {
                "name": row[0],
                "bias": row[1],
                "total_votes": row[2],
                "agree": row[3],
                "disagree": row[4],
                "agree_ratio": row[5],
                "agreeance_text": row[6],
                "allsides_page": row[7],
            }
            break

    if matched_data:
        return matched_data
    else:
        return {"bias": f"No bias information found for {url}"}
