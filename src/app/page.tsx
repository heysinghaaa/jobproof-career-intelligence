"use client";

import { useMemo, useState } from "react";
import { analyzeLocally } from "@/lib/localAnalyzer";
import type { AnalysisReport, AnalyzePayload } from "@/lib/types";

const API_URL = "http://localhost:8000";

const sampleJob = `Frontend Developer - Product Engineering
We are a product studio hiring a React and Next.js developer to build dashboards, reporting pages, and responsive customer workflows. Required: React, TypeScript, REST APIs, Git, dashboard UI, strong frontend fundamentals. Nice to have: Python or FastAPI exposure, testing mindset, and experience turning Figma designs into production interfaces.`;

const sampleResume = `Piyush Singh is a frontend developer with React, Next.js, TypeScript, JavaScript, REST API integration, dashboard UI, responsive layouts, GitHub projects, and AI evaluation experience. Built Ledgerly, a finance dashboard and invoice tracker; a Next.js portfolio; and Python/Panda3D projects.`;

export default function Home() {
  const [jobDescription, setJobDescription] = useState(sampleJob);
  const [resumeText, setResumeText] = useState(sampleResume);
  const [apiKey, setApiKey] = useState("");
  const [isKeyAccepted, setIsKeyAccepted] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<"python" | "browser" | "idle">("idle");
  const [report, setReport] = useState<AnalysisReport>(() =>
    analyzeLocally({ job_description: sampleJob, resume_text: sampleResume, use_ai: false }),
  );

  const canUseAi = useMemo(() => apiKey.startsWith("sk-") && apiKey.length >= 35 && isKeyAccepted, [apiKey, isKeyAccepted]);

  const validateKey = async () => {
    if (!apiKey.trim()) {
      setIsKeyAccepted(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/validate-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = (await response.json()) as { valid: boolean };
      setIsKeyAccepted(data.valid);
      setUseAi(data.valid);
    } catch {
      const validShape = apiKey.startsWith("sk-") && apiKey.length >= 35;
      setIsKeyAccepted(validShape);
      setUseAi(validShape);
    }
  };

  const analyze = async () => {
    const payload: AnalyzePayload = {
      job_description: jobDescription,
      resume_text: resumeText,
      api_key: canUseAi ? apiKey : undefined,
      use_ai: canUseAi && useAi,
    };

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Backend unavailable");
      }
      setReport((await response.json()) as AnalysisReport);
      setSource("python");
    } catch {
      setReport(analyzeLocally(payload));
      setSource("browser");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Explainable career intelligence</p>
          <h1>Turn job posts into proof packets.</h1>
          <p>
            JobProof helps developers avoid generic AI applications by matching a job description to real project
            evidence, resume signals, and scam-risk clues. The basic engine is free and transparent; AI mode only
            unlocks when the user provides their own key.
          </p>
        </div>
        <div className="mode-card">
          <span>Current mode</span>
          <strong>{report.mode === "ai-enhanced" ? "AI enhanced" : "Basic engine"}</strong>
          <p>{report.ai_note}</p>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="input-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inputs</p>
              <h2>Analyze a role</h2>
            </div>
            <button type="button" onClick={analyze} disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          <label>
            Job description
            <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
          </label>
          <label>
            Resume / profile text
            <textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} />
          </label>

          <div className="api-card">
            <div>
              <span>Optional user-owned AI key</span>
              <p>No key is stored. The app works without it.</p>
            </div>
            <input
              aria-label="User-owned API key"
              placeholder="sk-..."
              type="password"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setIsKeyAccepted(false);
                setUseAi(false);
              }}
            />
            <div className="api-actions">
              <button type="button" onClick={validateKey}>
                Validate key
              </button>
              <button type="button" disabled={!canUseAi} onClick={() => setUseAi((value) => !value)}>
                {useAi && canUseAi ? "AI mode on" : "Enable AI mode"}
              </button>
            </div>
          </div>
        </aside>

        <section className="report-panel">
          <div className="score-card">
            <div>
              <p className="eyebrow">{source === "python" ? "Python backend" : source === "browser" ? "Browser fallback" : "Demo report"}</p>
              <h2>{report.summary}</h2>
            </div>
            <div className="score-orb">
              <span>Fit</span>
              <strong>{report.score}</strong>
            </div>
          </div>

          {report.ai_summary && (
            <article className="insight-card ai-summary">
              <h3>AI narrative</h3>
              <p>{report.ai_summary}</p>
            </article>
          )}

          <div className="breakdown-grid">
            {report.score_breakdown.map((item) => (
              <article className="breakdown-card" key={item.label}>
                <span>{item.label}</span>
                <strong>
                  {item.value}/{item.max}
                </strong>
                <div>
                  <i style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }} />
                </div>
              </article>
            ))}
          </div>

          <div className="two-column">
            <SkillList title="Matched skills" items={report.matched_skills} tone="positive" />
            <SkillList title="Missing signals" items={report.missing_skills} tone="warning" />
          </div>

          <article className="insight-card">
            <h3>Recommended proof</h3>
            <div className="project-list">
              {report.project_matches.map((project) => (
                <a href={project.url} target="_blank" rel="noreferrer" key={project.name}>
                  <strong>{project.name}</strong>
                  <span>{project.matched_skills.join(" · ")}</span>
                  <p>{project.proof}</p>
                </a>
              ))}
            </div>
          </article>

          <div className="two-column">
            <article className="insight-card">
              <h3>Application bullets</h3>
              <ul>
                {report.application_bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
            <article className="insight-card">
              <h3>Job trust signals</h3>
              {report.scam_signals.length ? (
                <ul>
                  {report.scam_signals.map((signal) => (
                    <li key={signal.code}>{signal.reason}</li>
                  ))}
                </ul>
              ) : (
                <p>No major scam indicators found in the supplied job description.</p>
              )}
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}

function SkillList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "warning" }) {
  return (
    <article className="insight-card">
      <h3>{title}</h3>
      <div className="pill-list">
        {items.length ? (
          items.map((item) => (
            <span className={tone} key={item}>
              {item}
            </span>
          ))
        ) : (
          <p>Nothing detected yet.</p>
        )}
      </div>
    </article>
  );
}
