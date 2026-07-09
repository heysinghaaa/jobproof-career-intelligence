import type { AnalysisReport, AnalyzePayload, ProjectMatch, ScamSignal } from "./types";

const skillTaxonomy: Record<string, string[]> = {
  React: ["react", "react.js", "jsx"],
  "Next.js": ["next.js", "nextjs", "app router"],
  TypeScript: ["typescript", "ts"],
  JavaScript: ["javascript", "js", "es6"],
  Python: ["python", "py"],
  FastAPI: ["fastapi", "fast api"],
  "REST APIs": ["rest api", "restful", "api integration", "apis"],
  Dashboards: ["dashboard", "analytics", "reporting", "charts"],
  "UI Engineering": ["frontend", "front-end", "responsive", "figma", "ui"],
  Databases: ["postgres", "mongodb", "sqlite", "database", "sql"],
  Testing: ["test", "testing", "pytest", "unit test", "qa"],
  Git: ["git", "github", "version control"],
  "AI Evaluation": ["ai evaluation", "model evaluation", "llm", "prompt", "annotation"],
};

const projects = [
  {
    name: "Ledgerly",
    url: "https://github.com/heysinghaaa/ledgerly-finance-tracker",
    skills: ["Next.js", "TypeScript", "Dashboards", "UI Engineering"],
    proof: "Invoice and expense tracker with dashboard metrics, editable records, and print-ready invoice preview.",
  },
  {
    name: "Piyush Portfolio",
    url: "https://github.com/heysinghaaa/piyush-portfolio",
    skills: ["Next.js", "React", "TypeScript", "UI Engineering"],
    proof: "Personal portfolio with responsive sections, motion, project records, and contact flows.",
  },
  {
    name: "NeonGlide 3D",
    url: "https://github.com/heysinghaaa/synth-runner",
    skills: ["Python", "Git"],
    proof: "Panda3D endless runner prototype with game loop, collision states, and generated assets.",
  },
  {
    name: "IronForge Website",
    url: "https://github.com/heysinghaaa/IronForge-Website",
    skills: ["React", "JavaScript", "UI Engineering"],
    proof: "Responsive fitness website with brand-forward layout and polished presentation.",
  },
];

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

const extractSkills = (text: string) => {
  const source = normalize(text);
  return Object.entries(skillTaxonomy)
    .filter(([, aliases]) => aliases.some((alias) => source.includes(alias)))
    .map(([skill]) => skill);
};

const detectScamSignals = (text: string): ScamSignal[] => {
  const source = normalize(text);
  const findings: ScamSignal[] = [];
  if (/(fee|deposit|registration charge|paid training|upfront)/.test(source)) {
    findings.push({ code: "payment_request", reason: "mentions upfront payment, fees, deposits, or paid training" });
  }
  if (/(whatsapp|telegram)/.test(source)) {
    findings.push({ code: "chat_only", reason: "uses WhatsApp or Telegram as the primary hiring channel" });
  }
  if (/(urgent|immediate joining|apply now|limited seats)/.test(source)) {
    findings.push({ code: "urgent_pressure", reason: "uses urgent pressure language" });
  }
  if (!/(company|inc|pvt|private|llc|studio|technologies|labs)/.test(source)) {
    findings.push({ code: "vague_company", reason: "does not include a clear company identity" });
  }
  return findings;
};

export function analyzeLocally(payload: AnalyzePayload): AnalysisReport {
  const requiredSkills = extractSkills(payload.job_description);
  const resumeSkills = extractSkills(payload.resume_text);
  const matchedSkills = requiredSkills.filter((skill) => resumeSkills.includes(skill));
  const missingSkills = requiredSkills.filter((skill) => !resumeSkills.includes(skill));
  const projectMatches: ProjectMatch[] = projects
    .map((project) => {
      const overlap = requiredSkills.filter((skill) => project.skills.includes(skill));
      return {
        ...project,
        matched_skills: overlap,
        score: Math.round((overlap.length / Math.max(requiredSkills.length, 1)) * 100),
      };
    })
    .filter((project) => project.matched_skills.length > 0)
    .sort((a, b) => b.score - a.score);
  const scamSignals = detectScamSignals(payload.job_description);

  const skillScore = (matchedSkills.length / Math.max(requiredSkills.length, 1)) * 45;
  const projectScore = Math.min(projectMatches.slice(0, 3).reduce((sum, project) => sum + project.score, 0) / 3, 100) * 0.35;
  const resumeScore = Math.min(resumeSkills.length / Math.max(requiredSkills.length, 1), 1) * 15;
  const trustScore = Math.max(5 - scamSignals.length * 1.5, 0);
  const score = Math.round(Math.min(skillScore + projectScore + resumeScore + trustScore, 100));

  return {
    mode: "basic",
    score,
    summary:
      score >= 70
        ? "Strong application fit with clear proof signals."
        : score >= 45
          ? "Promising fit, but the proof packet needs sharper evidence."
          : "Low current fit; build or highlight more direct project evidence first.",
    required_skills: requiredSkills,
    resume_skills: resumeSkills,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    project_matches: projectMatches,
    scam_signals: scamSignals,
    application_bullets: [
      ...projectMatches.slice(0, 3).map((project) => `Use ${project.name} as proof for ${project.matched_skills.join(", ")}: ${project.proof}`),
      ...(missingSkills.length ? [`Close the gap by adding one small example that shows ${missingSkills.slice(0, 3).join(", ")}.`] : []),
    ],
    score_breakdown: [
      { label: "Skill match", value: Math.round(skillScore), max: 45 },
      { label: "Project evidence", value: Math.round(projectScore), max: 35 },
      { label: "Resume coverage", value: Math.round(resumeScore), max: 15 },
      { label: "Job trust", value: Math.round(trustScore), max: 5 },
    ],
    ai_note: "Local browser analyzer used because the Python backend or user-owned AI key was unavailable.",
  };
}
