from __future__ import annotations

from dataclasses import dataclass
import json
import re
from typing import Any
from urllib import error, request


SKILL_TAXONOMY: dict[str, list[str]] = {
    "React": ["react", "react.js", "jsx"],
    "Next.js": ["next.js", "nextjs", "app router"],
    "TypeScript": ["typescript", "ts"],
    "JavaScript": ["javascript", "js", "es6"],
    "Python": ["python", "py"],
    "FastAPI": ["fastapi", "fast api"],
    "REST APIs": ["rest api", "restful", "api integration", "apis"],
    "Dashboards": ["dashboard", "analytics", "reporting", "charts"],
    "UI Engineering": ["frontend", "front-end", "responsive", "figma", "ui"],
    "Databases": ["postgres", "mongodb", "sqlite", "database", "sql"],
    "Testing": ["test", "testing", "pytest", "unit test", "qa"],
    "Git": ["git", "github", "version control"],
    "AI Evaluation": ["ai evaluation", "model evaluation", "llm", "prompt", "annotation"],
}

SCAM_SIGNALS: list[tuple[str, str]] = [
    ("payment_request", "mentions upfront payment, fees, deposits, or paid training"),
    ("chat_only", "uses WhatsApp or Telegram as the primary hiring channel"),
    ("urgent_pressure", "uses urgent pressure language"),
    ("vague_company", "does not include a clear company identity"),
    ("unrealistic_salary", "mentions unusually high salary with low requirements"),
]

PROJECT_LIBRARY = [
    {
        "name": "Ledgerly",
        "url": "https://github.com/heysinghaaa/ledgerly-finance-tracker",
        "skills": ["Next.js", "TypeScript", "Dashboards", "UI Engineering"],
        "proof": "Invoice and expense tracker with dashboard metrics, editable records, and print-ready invoice preview.",
    },
    {
        "name": "Piyush Portfolio",
        "url": "https://github.com/heysinghaaa/piyush-portfolio",
        "skills": ["Next.js", "React", "TypeScript", "UI Engineering"],
        "proof": "Personal portfolio with responsive sections, motion, project records, and contact flows.",
    },
    {
        "name": "NeonGlide 3D",
        "url": "https://github.com/heysinghaaa/synth-runner",
        "skills": ["Python", "Git"],
        "proof": "Panda3D endless runner prototype with game loop, collision states, and generated assets.",
    },
    {
        "name": "IronForge Website",
        "url": "https://github.com/heysinghaaa/IronForge-Website",
        "skills": ["React", "JavaScript", "UI Engineering"],
        "proof": "Responsive fitness website with brand-forward layout and polished presentation.",
    },
]


@dataclass
class AnalyzeRequest:
    job_description: str
    resume_text: str
    api_key: str | None = None
    use_ai: bool = False


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def extract_skills(text: str) -> list[str]:
    normalized = normalize(text)
    found = []
    for skill, aliases in SKILL_TAXONOMY.items():
        if any(re.search(rf"\b{re.escape(alias)}\b", normalized) for alias in aliases):
            found.append(skill)
    return found


def detect_scam_signals(text: str) -> list[dict[str, str]]:
    normalized = normalize(text)
    findings: list[dict[str, str]] = []
    if re.search(r"\b(fee|deposit|registration charge|paid training|upfront)\b", normalized):
        findings.append({"code": "payment_request", "reason": SCAM_SIGNALS[0][1]})
    if re.search(r"\b(whatsapp|telegram)\b", normalized):
        findings.append({"code": "chat_only", "reason": SCAM_SIGNALS[1][1]})
    if re.search(r"\b(urgent|immediate joining|apply now|limited seats)\b", normalized):
        findings.append({"code": "urgent_pressure", "reason": SCAM_SIGNALS[2][1]})
    if not re.search(r"\b(company|inc|pvt|private|llc|studio|technologies|labs)\b", normalized):
        findings.append({"code": "vague_company", "reason": SCAM_SIGNALS[3][1]})
    if re.search(r"(₹|rs\.?|\$)\s?\d{2,}", normalized) and re.search(
        r"\b(no experience|easy work|work from home only|daily payout)\b", normalized
    ):
        findings.append({"code": "unrealistic_salary", "reason": SCAM_SIGNALS[4][1]})
    return findings


def match_projects(required_skills: list[str]) -> list[dict[str, Any]]:
    matches = []
    for project in PROJECT_LIBRARY:
        overlap = sorted(set(required_skills).intersection(project["skills"]))
        if overlap:
            matches.append(
                {
                    **project,
                    "matched_skills": overlap,
                    "score": round(len(overlap) / max(len(required_skills), 1) * 100),
                }
            )
    return sorted(matches, key=lambda item: item["score"], reverse=True)


def generate_bullets(project_matches: list[dict[str, Any]], missing_skills: list[str]) -> list[str]:
    bullets = []
    for project in project_matches[:3]:
        bullets.append(
            f"Use {project['name']} as proof for {', '.join(project['matched_skills'])}: {project['proof']}"
        )
    if missing_skills:
        bullets.append(f"Close the gap by adding one small example that shows {', '.join(missing_skills[:3])}.")
    if not bullets:
        bullets.append("Add one project link with a clear README, screenshots, and a short problem-solution summary.")
    return bullets


def build_basic_report(payload: AnalyzeRequest) -> dict[str, Any]:
    job_skills = extract_skills(payload.job_description)
    resume_skills = extract_skills(payload.resume_text)
    matched_skills = sorted(set(job_skills).intersection(resume_skills))
    missing_skills = sorted(set(job_skills).difference(resume_skills))
    project_matches = match_projects(job_skills)
    scam_signals = detect_scam_signals(payload.job_description)

    skill_score = (len(matched_skills) / max(len(job_skills), 1)) * 45
    project_score = min(sum(match["score"] for match in project_matches[:3]) / 3, 100) * 0.35
    resume_score = min(len(resume_skills) / max(len(job_skills), 1), 1) * 15
    trust_score = max(5 - len(scam_signals) * 1.5, 0)
    total_score = round(min(skill_score + project_score + resume_score + trust_score, 100))

    return {
        "mode": "basic",
        "score": total_score,
        "summary": (
            "Strong application fit with clear proof signals."
            if total_score >= 70
            else "Promising fit, but the proof packet needs sharper evidence."
            if total_score >= 45
            else "Low current fit; build or highlight more direct project evidence first."
        ),
        "required_skills": job_skills,
        "resume_skills": resume_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "project_matches": project_matches,
        "scam_signals": scam_signals,
        "application_bullets": generate_bullets(project_matches, missing_skills),
        "score_breakdown": [
            {"label": "Skill match", "value": round(skill_score), "max": 45},
            {"label": "Project evidence", "value": round(project_score), "max": 35},
            {"label": "Resume coverage", "value": round(resume_score), "max": 15},
            {"label": "Job trust", "value": round(trust_score), "max": 5},
        ],
        "ai_note": "Basic explainable engine used. Add your own API key to request AI-enhanced narrative analysis.",
    }


def looks_like_openai_key(api_key: str | None) -> bool:
    if not api_key:
        return False
    return api_key.startswith(("sk-", "sk-proj-")) and len(api_key) >= 35


def request_ai_summary(payload: AnalyzeRequest, basic_report: dict[str, Any]) -> str | None:
    if not payload.use_ai or not looks_like_openai_key(payload.api_key):
        return None

    body = {
        "model": "gpt-4.1-mini",
        "input": [
            {
                "role": "system",
                "content": "You create concise, practical job-application proof summaries. Do not invent experience.",
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "job_description": payload.job_description[:6000],
                        "resume_text": payload.resume_text[:6000],
                        "basic_report": basic_report,
                    }
                ),
            },
        ],
        "max_output_tokens": 450,
    }

    api_request = request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {payload.api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(api_request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (error.URLError, TimeoutError, ValueError):
        return None

    text_blocks: list[str] = []
    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                text_blocks.append(content["text"])
    return "\n".join(text_blocks).strip() or None


def analyze(payload: AnalyzeRequest) -> dict[str, Any]:
    report = build_basic_report(payload)
    ai_summary = request_ai_summary(payload, report)
    if ai_summary:
        report["mode"] = "ai-enhanced"
        report["ai_summary"] = ai_summary
        report["ai_note"] = "AI-enhanced narrative generated using the user's own API key."
    return report
