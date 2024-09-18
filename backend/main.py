import sqlite3
import re  # For matching URL patterns
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class QueryRequest(BaseModel):
    url: str  # Expect the tab URL from background.js


import sqlite3
import csv
import os
from fastapi import FastAPI

app = FastAPI()

# Path to your CSV file (adjust the path accordingly)
CSV_FILE_PATH = (
    "allsides.csv"  # Update to the path where you host the CSV file on your server
)


def load_allsides_data():
    # Connect to the SQLite database
    conn = sqlite3.connect("allsides_data.db")
    cursor = conn.cursor()

    # Create table if it doesn't exist
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

    # Check if the table is already populated
    cursor.execute("SELECT COUNT(*) FROM bias_data")
    row_count = cursor.fetchone()[0]

    # If the table is empty, populate it with CSV data
    if row_count == 0:
        with open(CSV_FILE_PATH, newline="", encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip the header row
            for row in reader:
                cursor.execute(
                    """
                INSERT INTO bias_data (name, bias, total_votes, agree, disagree, agree_ratio, agreeance_text, allsides_page)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    row,
                )

        conn.commit()
        print("Database populated with CSV data.")
    else:
        print("Database already populated.")

    conn.close()


# FastAPI startup event to load the CSV data when the app starts
@app.on_event("startup")
async def startup_event():
    load_allsides_data()


@app.post("/check_bias")
async def check_bias(query: QueryRequest):
    url = query.url

    # Connect to the SQLite database
    conn = sqlite3.connect("allsides_data.db")
    cursor = conn.cursor()

    # Query the database for all URL patterns
    cursor.execute(
        "SELECT name, bias, total_votes, agree, disagree, agree_ratio, agreeance_text, allsides_page, url_pattern FROM bias_data"
    )
    rows = cursor.fetchall()
    conn.close()

    # Try to match the URL against each pattern in the database
    matched_data = None
    for row in rows:
        pattern = row[8]  # url_pattern column
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

    # Return the matched bias data if found
    if matched_data:
        return matched_data
    else:
        return {"bias": f"No bias information found for {url}"}
