# JobProof API

FastAPI backend for JobProof's explainable job-application analysis.

## Run

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

The free rule-based engine works without any AI key. If a user provides their own OpenAI-style API key, `/analyze` attempts an AI-enhanced narrative and falls back to the basic report if the call fails.
