from fastapi import FastAPI
from pydantic import BaseModel
import httpx

app = FastAPI()


class QueryRequest(BaseModel):
    title: str
    content: str


@app.post("/search")
async def search_articles(query: QueryRequest):
    # title = query.title
    # content = query.content
    # Integrate with Common Crawl or other search APIs here
    # Example of performing a search query
    print(f"Received title: {query.title}, content: {query.content}")
    results = await perform_search(query.title, query.content)
    return results


async def perform_search(title: str, content: str):
    # Implement your search logic here, e.g., query Common Crawl
    # For demonstration purposes, returning a dummy response
    return {"title": title, "content": content, "search_results": "dummy_results"}
