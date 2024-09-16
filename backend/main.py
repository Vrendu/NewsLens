from google.cloud import bigquery
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

app = FastAPI()

# Load environment variables from .env file
load_dotenv()


class QueryRequest(BaseModel):
    title: str
    keywords: list[str]  # Expect a list of keywords


@app.post("/search")
async def search_articles(query: QueryRequest):
    # Combine keywords to create a search query
    search_query = " ".join(query.keywords)
    results = perform_search(search_query)
    print(results)
    return results


def perform_search(search_query: str):
    # Initialize the BigQuery client
    client = bigquery.Client()

    # Split search_query into individual keywords
    keywords = search_query.split()

    # Build SQL query using keywords in the V2Themes or V2Persons field
    keyword_clauses = " OR ".join(
        [f"LOWER(V2Themes) LIKE '%{keyword}%'" for keyword in keywords]
    )

    # Build the final SQL query to find relevant articles in GDELT
    query = f"""
    SELECT
      DATE,
      SourceCommonName,
      DocumentIdentifier
    FROM
      `gdelt-bq.gdeltv2.gkg`
    WHERE
      ({keyword_clauses})
      AND SourceCommonName IS NOT NULL
    ORDER BY
      DATE DESC
    LIMIT 10
    """

    # Execute the query
    query_job = client.query(query)
    results = query_job.result()

    # Return URLs, sources, and dates from the query result
    return [
        {
            "url": row.DocumentIdentifier,
            "source": row.SourceCommonName,
            "date": row.DATE,
        }
        for row in results
    ]
