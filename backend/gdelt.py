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


# Download GDELT files for the past 3 days
def download_gdelt_files(days=1):
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

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS news_articles (
            id SERIAL PRIMARY KEY,
            V1Date TIMESTAMP,
            DocumentIdentifier TEXT,
            V2Themes TEXT,
            V2Locations TEXT,
            V2Persons TEXT,
            V2Organizations TEXT,
            V2Counts TEXT,
            V2Images TEXT,
            V2Videos TEXT,
            V2Quotes TEXT,
            V2Summary TEXT
        )
        """
    )

    for file_name in os.listdir("gdelt_data"):
        # if file_name.endswith(".csv"):
        csv_file_path = f"gdelt_data/{file_name}"

        #     col_names = ["V1Date", "DocumentIdentifier", "V2Themes"]
        #     df = pd.read_csv(
        #         csv_file_path,
        #         sep="\t",
        #         header=None,
        #         usecols=[0, 2, 7],
        #         names=col_names,
        #         on_bad_lines="skip",
        #     )

        #     df["V1Date"] = pd.to_datetime(
        #         df["V1Date"], format="%Y%m%d%H%M%S", errors="coerce"
        #     )
        #     filtered_data = df.dropna(subset=["DocumentIdentifier", "V2Themes"])

        #     for _, row in filtered_data.iterrows():
        #         cursor.execute(
        #             """
        #             INSERT INTO news_articles (date, source, url, keywords)
        #             VALUES (%s, %s, %s, %s)
        #             """,
        #             (
        #                 row["V1Date"],
        #                 "GDELT",
        #                 row["DocumentIdentifier"],
        #                 row["V2Themes"],
        #             ),
        #         )

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

    cursor.execute(
        """
        DELETE FROM news_articles
        WHERE date < NOW() - INTERVAL '3 days'
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
