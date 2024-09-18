import sqlite3
import re  # For matching URL patterns
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class QueryRequest(BaseModel):
    url: str  # Expect the tab URL from background.js


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
