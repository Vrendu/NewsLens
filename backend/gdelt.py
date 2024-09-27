# backend/gdelt.py

import os
import psycopg2
import requests
import zipfile
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv
import time

# Load environment variables from .env
load_dotenv()

# PostgreSQL connection details from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# GDELT base URL for GKG files from .env
GDELT_BASE_URL = os.getenv("GDELT_BASE_URL")

# Define the columns (now including GKGRECORDID as the first column)
GDELT_COLUMNS = [
    "GKGRECORDID",
    "DATE",
    "SourceCollectionIdentifier",
    "SourceCommonName",
    "DocumentIdentifier",
    "Counts",
    "V2Counts",
    "Themes",
    "V2Themes",
    "Locations",
    "V2Locations",
    "Persons",
    "V2Persons",
    "Organizations",
    "V2Organizations",
    "V2Tone",
    "Dates",
    "GCAM",
    "SharingImage",
    "RelatedImages",
    "SocialImageEmbeds",
    "SocialVideoEmbeds",
    "Quotations",
    "AllNames",
    "Amounts",
    "TranslationInfo",
    "Extras",
]




# Download GDELT files for the past 3 days
def download_gdelt_files(days=3):
    os.makedirs("gdelt_data", exist_ok=True)

    now = datetime.utcnow()
    past_days = now - timedelta(days=days)

    current_time = past_days
    retries = 3  # Number of retries in case of failure

    while current_time <= now:
        minutes = (current_time.minute // 15) * 15
        file_name = current_time.replace(minute=minutes, second=0).strftime(
            "%Y%m%d%H%M00.gkg.csv.zip"
        )
        url = GDELT_BASE_URL + file_name
        print(f"Attempting to download {url}")

        for attempt in range(retries):
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    zip_file_path = f"gdelt_data/{file_name}"

                    with open(zip_file_path, "wb") as file:
                        file.write(response.content)

                    with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
                        zip_ref.extractall("gdelt_data")

                    os.remove(zip_file_path)
                    print(f"Downloaded and extracted: {file_name}")
                    break
                else:
                    print(f"File not found: {url} (Attempt {attempt + 1})")
                    time.sleep(2)

            except Exception as e:
                print(f"Error downloading {url}: {e}")
                if attempt + 1 == retries:
                    print(f"Failed to download {url} after {retries} attempts")

        current_time += timedelta(minutes=15)


# Parse GDELT CSV files and store them in PostgreSQL
def parse_and_store_gdelt_data():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    for file_name in os.listdir("gdelt_data"):
        if file_name.endswith(".csv"):
            csv_file_path = f"gdelt_data/{file_name}"

            # Parse the CSV (including GKGRECORDID), using a more flexible encoding (ISO-8859-1)
            try:
                df = pd.read_csv(
                    csv_file_path,
                    sep="\t",
                    header=None,
                    names=GDELT_COLUMNS,
                    encoding="ISO-8859-1",
                    on_bad_lines="skip",
                )
            except UnicodeDecodeError as e:
                print(f"Encoding error: {e}")
                continue  # Skip problematic files

            # Convert DATE column to proper timestamp
            df["DATE"] = pd.to_datetime(
                df["DATE"], format="%Y%m%d%H%M%S", errors="coerce"
            )

            # Ensure SourceCollectionIdentifier is an integer (replace invalid data with None)
            df["SourceCollectionIdentifier"] = pd.to_numeric(
                df["SourceCollectionIdentifier"], errors="coerce"
            )

            # Insert each row into the database
            for _, row in df.iterrows():
                try:
                    # Insert row into the table
                    cursor.execute(
                        """
                        INSERT INTO news_articles (
                            GKGRECORDID, DATE, SourceCollectionIdentifier, 
                            SourceCommonName, DocumentIdentifier, Counts, V2Counts, 
                            Themes, V2Themes, Locations, V2Locations, Persons, V2Persons, 
                            Organizations, V2Organizations, V2Tone, Dates, GCAM, 
                            SharingImage, RelatedImages, SocialImageEmbeds, SocialVideoEmbeds, 
                            Quotations, AllNames, Amounts, TranslationInfo, Extras
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            row.get("GKGRECORDID", None),
                            row.get("DATE", None),
                            row.get("SourceCollectionIdentifier", None),
                            row.get("SourceCommonName", None),
                            row.get("DocumentIdentifier", None),
                            row.get("Counts", None),
                            row.get("V2Counts", None),
                            row.get("Themes", None),
                            row.get("V2Themes", None),
                            row.get("Locations", None),
                            row.get("V2Locations", None),
                            row.get("Persons", None),
                            row.get("V2Persons", None),
                            row.get("Organizations", None),
                            row.get("V2Organizations", None),
                            row.get("V2Tone", None),
                            row.get("Dates", None),
                            row.get("GCAM", None),
                            row.get("SharingImage", None),
                            row.get("RelatedImages", None),
                            row.get("SocialImageEmbeds", None),
                            row.get("SocialVideoEmbeds", None),
                            row.get("Quotations", None),
                            row.get("AllNames", None),
                            row.get("Amounts", None),
                            row.get("TranslationInfo", None),
                            row.get("Extras", None),
                        ),
                    )
                except Exception as e:
                    print(f"Error inserting row: {row}")
                    print(f"Exception: {e}")

            # Delete the CSV file after processing
            os.remove(csv_file_path)
            print(f"Deleted file: {csv_file_path}")

    conn.commit()
    cursor.close()
    conn.close()


# Prune GDELT data older than 3 days and delete old CSV files
def prune_old_gdelt_data():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Delete records older than 3 days
    cursor.execute(
        """
        DELETE FROM news_articles
        WHERE DATE::timestamp < NOW() - INTERVAL '3 days'
        """
    )

    conn.commit()
    cursor.close()
    conn.close()

    # Delete old CSV files in the gdelt_data directory
    for file_name in os.listdir("gdelt_data"):
        csv_file_path = f"gdelt_data/{file_name}"
        os.remove(csv_file_path)
        print(f"Deleted old CSV file: {csv_file_path}")
