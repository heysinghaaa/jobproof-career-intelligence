from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .analyzer import AnalyzeRequest, analyze, looks_like_openai_key


class AnalyzePayload(BaseModel):
    job_description: str
    resume_text: str
    api_key: str | None = None
    use_ai: bool = False


class ValidateKeyPayload(BaseModel):
    api_key: str


app = FastAPI(title="JobProof API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/validate-key")
def validate_key(payload: ValidateKeyPayload) -> dict[str, bool | str]:
    valid_shape = looks_like_openai_key(payload.api_key)
    return {
        "valid": valid_shape,
        "message": "Key shape looks valid." if valid_shape else "Enter a valid user-owned API key to enable AI mode.",
    }


@app.post("/analyze")
def analyze_job(payload: AnalyzePayload) -> dict:
    return analyze(
        AnalyzeRequest(
            job_description=payload.job_description,
            resume_text=payload.resume_text,
            api_key=payload.api_key,
            use_ai=payload.use_ai,
        )
    )
