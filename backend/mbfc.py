import os
import psycopg2
import requests
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection details from .env
DATABASE_URL = os.getenv("DATABASE_URL")
MBFC_API_URL = os.getenv("MBFC_API_URL")
BEARER_TOKEN = os.getenv("BEARER_TOKEN")


# Fetch full MBFC dataset
def fetch_mbfc_data():
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
    }

    response = requests.get(MBFC_API_URL, headers=headers)

    if response.status_code == 200:
        return response.json()
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


# Check bias data based on domain
def check_bias_data(domain: str):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT name, mbfc_url, domain, bias, factual_reporting, country, credibility
        FROM mbfc_data
        WHERE domain = REGEXP_REPLACE(%s, '^www\\.', '')
        """,
        (domain,),
    )

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    if not data:
        return {"data": []}

    return {
        "data": [
            {
                "name": row[0],
                "mbfc_url": row[1],
                "domain": row[2],
                "bias": row[3],
                "factual_reporting": row[4],
                "country": row[5],
                "credibility": row[6],
            }
            for row in data
        ]
    }
