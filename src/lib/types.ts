export type ScoreBreakdown = {
  label: string;
  value: number;
  max: number;
};

export type ProjectMatch = {
  name: string;
  url: string;
  skills: string[];
  matched_skills: string[];
  proof: string;
  score: number;
};

export type ScamSignal = {
  code: string;
  reason: string;
};

export type AnalysisReport = {
  mode: "basic" | "ai-enhanced";
  score: number;
  summary: string;
  required_skills: string[];
  resume_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  project_matches: ProjectMatch[];
  scam_signals: ScamSignal[];
  application_bullets: string[];
  score_breakdown: ScoreBreakdown[];
  ai_note: string;
  ai_summary?: string;
};

export type AnalyzePayload = {
  job_description: string;
  resume_text: string;
  api_key?: string;
  use_ai: boolean;
};
